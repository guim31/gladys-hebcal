// -----------------------------------------------------------------------------
// The heart of the integration: the calendar of the house and the clock that
// turns it into device states and scene events.
//
// The clock ticks every 20 seconds, in the time zone of Gladys:
// - the device states are published when they change (at sunset, at candle
//   lighting, at havdalah...), and every 12 hours anyway: Gladys flags a value
//   older than 48 hours as "no recent value";
// - the scene events due since the last tick are fired once: their ids are
//   remembered in /data, so a restart neither replays an event nor loses one
//   due less than 15 minutes ago.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { HouseCalendar } from './calendar.js';
import { isIsrael } from './config.js';
import { buildDevice, buildValues, deviceIds } from './device.js';
import { createFailureLog } from './failures.js';
import { NO_LOCATION, formatTime, formatWhen } from './i18n.js';
import { createNamer } from './names.js';
import { occasionName } from './view.js';

const logger = createLogger({ name: 'hebcal' });

export const WIDGET_KEY = 'hebrew_calendar';

// Trigger keys are forever: scenes store them.
export const TRIGGERS = {
  CANDLES: 'candle_lighting',
  START: 'holy_day_start',
  END: 'holy_day_end',
};

// "Candle lighting in N minutes": the values of the trigger's filter. One
// event per value; the filter is required, so a scene never gets them all.
export const CANDLE_OFFSETS = [0, 10, 15, 30, 60, 120];

export const TICK_MS = 20 * 1000;
export const CATCH_UP_MS = 15 * 60 * 1000;
export const HEARTBEAT_MS = 12 * 3600 * 1000;
export const LOCATION_RETRY_MS = 10 * 60 * 1000;
const FIRED_FILE = 'fired-events.json';
const FORGET_FIRED_MS = 2 * 24 * 3600 * 1000;

export function processTimeZone() {
  return process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/** The first house with coordinates. */
export function pickHouse(houses) {
  const ok = (value, max) =>
    typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= max;
  return (houses ?? []).find((h) => ok(h?.latitude, 90) && ok(h?.longitude, 180)) ?? null;
}

export class HebcalService {
  /**
   * @param {object} options
   * @param {object} options.gladys the SDK client
   * @param {object} options.store JSON files in /data (src/store.js)
   * @param {Function} [options.now] the clock (tests)
   * @param {string} [options.timeZone] Gladys' time zone (default: TZ)
   * @param {boolean} [options.timers] false in the tests: they call tick()
   */
  constructor({ gladys, store, now = Date.now, timeZone, timers = true }) {
    this.gladys = gladys;
    this.store = store;
    this.now = now;
    this.timeZone = timeZone ?? processTimeZone();
    this.timers = timers;
    this.config = null;
    this.house = null;
    this.calendar = null;
    this.namer = null;
    this.lastLocate = null;
    this.widgetSignature = null;
    this.timer = null;
    this.queue = Promise.resolve();
    this.fired = null;
    this.housesFailed = false;
    this.failures = createFailureLog(logger);
  }

  // One operation at a time: a tick never interleaves with a reconfiguration.
  serial(fn) {
    const run = this.queue.then(fn);
    this.queue = run.catch(() => {});
    return run;
  }

  start(config) {
    return this.serial(async () => {
      this.applyConfig(config);
      try {
        await this.locate();
        await this.publishDevice();
        await this.step({ force: true });
      } finally {
        this.startClock();
      }
    });
  }

  /** Reconnection: the houses may have moved, the values were maybe lost. */
  resync(config) {
    return this.serial(async () => {
      this.applyConfig(config);
      // The configuration may have changed while disconnected.
      this.buildCalendar();
      await this.locate();
      await this.step({ force: true });
      this.startClock();
    });
  }

  reconfigure(config) {
    return this.serial(async () => {
      logger.info('Configuration updated');
      this.applyConfig(config);
      this.buildCalendar();
      await this.publishDevice();
      await this.step({ force: true });
    });
  }

  deviceCreated() {
    return this.serial(() => this.step({ force: true }));
  }

  tick() {
    return this.serial(() => this.step());
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  startClock() {
    if (this.timers && !this.timer) {
      this.timer = setInterval(() => {
        this.tick().catch((err) => logger.error('Tick failed', err));
      }, TICK_MS);
      this.timer.unref?.();
    }
  }

  applyConfig(config) {
    this.config = config;
    this.namer = createNamer(config);
  }

  // ---------------------------------------------------------------------------
  // Location
  // ---------------------------------------------------------------------------

  /** Reads the houses of Gladys; without coordinates, nothing can be computed. */
  async locate() {
    this.lastLocate = this.now();
    let houses;
    try {
      houses = await this.gladys.getHouses();
      this.housesFailed = false;
      this.failures.succeeded('houses', 'Houses read again');
    } catch (err) {
      // Gladys restarting: keep the house already known, and try again at
      // the next tick rather than in 10 minutes.
      this.housesFailed = true;
      this.failures.failed('houses', `Could not read the houses: ${err.message}`);
      if (this.calendar) {
        return;
      }
      houses = [];
    }
    const house = pickHouse(houses);
    const moved =
      house?.latitude !== this.house?.latitude || house?.longitude !== this.house?.longitude;
    this.house = house;
    if (!house) {
      this.calendar = null;
      this.failures.failed('location', 'No house with coordinates yet, retrying every 10 minutes');
      await this.reportStatus(false, NO_LOCATION);
      return;
    }
    this.failures.succeeded('location');
    if (moved || !this.calendar) {
      this.buildCalendar();
      logger.info(
        `House "${house.name ?? house.selector}" (${house.latitude.toFixed(2)}, ${house.longitude.toFixed(2)}), ` +
          `${this.calendar.il ? 'Israel' : 'diaspora'}, TZ=${this.timeZone}`,
      );
    }
    await this.reportStatus(true);
  }

  buildCalendar() {
    if (!this.house) {
      return;
    }
    this.calendar = new HouseCalendar({
      latitude: this.house.latitude,
      longitude: this.house.longitude,
      timeZone: this.timeZone,
      il: isIsrael(this.config, this.timeZone),
      candleMinutes: this.config.candle_minutes,
      havdalah: this.config.havdalah,
    });
  }

  async reportStatus(ok, message) {
    try {
      await this.gladys.setConnectionStatus(ok, message);
      this.failures.succeeded('status', 'Status reported again');
    } catch (err) {
      this.failures.failed('status', `Could not report the status: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Gladys side
  // ---------------------------------------------------------------------------

  async publishDevice() {
    try {
      await this.gladys.publishDiscoveredDevices([buildDevice(this.gladys, this.config)]);
      this.failures.succeeded('device', 'Device published again');
    } catch (err) {
      this.failures.failed('device', `Could not publish the device: ${err.message}`);
    }
  }

  /** The calendar at this instant, or null before the house is located. */
  snapshot() {
    return this.calendar ? this.calendar.snapshot(this.now()) : null;
  }

  async step({ force = false } = {}) {
    if (
      !this.calendar &&
      (this.housesFailed || this.now() - this.lastLocate >= LOCATION_RETRY_MS)
    ) {
      await this.locate();
    }
    if (!this.calendar) {
      return;
    }
    const snapshot = this.snapshot();
    await this.publishStates(snapshot, { force });
    this.refreshWidget(snapshot, { force });
    await this.fireDueEvents();
  }

  async publishStates(snapshot, { force }) {
    const ids = deviceIds(this.gladys);
    const values = buildValues(snapshot, {
      config: this.config,
      namer: this.namer,
      timeZone: this.timeZone,
    });
    const states = Object.entries(values).map(([key, value]) => ({
      device_feature_external_id: ids.feature(key),
      ...(typeof value === 'number' ? { state: value } : value),
    }));
    if (force) {
      this.gladys.forgetPublishedStates();
    }
    try {
      await this.gladys.publishChangedStates(states, { heartbeat: HEARTBEAT_MS });
      this.failures.succeeded('states', 'States published again');
    } catch (err) {
      this.failures.failed('states', `Could not publish the states: ${err.message}`);
    }
  }

  /** Asks the dashboards to reload the widget when what it shows changed. */
  refreshWidget(snapshot, { force }) {
    const signature = JSON.stringify([
      snapshot.hebrewDate.toString(),
      snapshot.period?.start ?? null,
      snapshot.nextCandles?.at ?? null,
      snapshot.nextHavdalah?.at ?? null,
      snapshot.civil,
    ]);
    if (!force && signature === this.widgetSignature) {
      return;
    }
    this.widgetSignature = signature;
    try {
      // Fire-and-forget, rate-limited by the core: never awaited.
      Promise.resolve(this.gladys.requestWidgetRefresh(WIDGET_KEY)).catch(() => {});
    } catch {
      // Disconnected: the widget refetches on its own TTL.
    }
  }

  // ---------------------------------------------------------------------------
  // Scene events
  // ---------------------------------------------------------------------------

  loadFired() {
    if (!this.fired) {
      const saved = this.store.load(FIRED_FILE);
      this.fired = new Map(Object.entries(saved?.ids ?? {}));
    }
    return this.fired;
  }

  saveFired() {
    const limit = this.now() - FORGET_FIRED_MS;
    for (const [id, at] of this.fired) {
      if (at < limit) {
        this.fired.delete(id);
      }
    }
    this.store.save(FIRED_FILE, { ids: Object.fromEntries(this.fired) });
  }

  async fireDueEvents() {
    const now = this.now();
    const fired = this.loadFired();
    const due = this.calendar
      .eventsBetween(now - CATCH_UP_MS, now, CANDLE_OFFSETS)
      .filter((event) => !fired.has(event.id));
    if (due.length === 0) {
      return;
    }
    for (const event of due) {
      try {
        await this.gladys.publishSceneEvent(event.key, this.eventData(event));
        logger.debug(`Scene event ${event.id}`);
      } catch (err) {
        // 400/404: refused for good (an older Gladys), never retried. Anything
        // else is retried at the next tick, within the catch-up window.
        if (err?.status !== 400 && err?.status !== 404) {
          this.failures.failed('event', `Scene event ${event.key} failed: ${err.message}`);
          continue;
        }
        this.failures.failed(`refused:${event.key}`, `Gladys refused ${event.key}: ${err.message}`);
      }
      this.failures.succeeded('event', 'Scene events sent again');
      fired.set(event.id, now);
    }
    this.saveFired();
  }

  /** The variables of a scene event, in the language of the configuration. */
  eventData(event) {
    const language = this.config.language;
    const tz = this.timeZone;
    if (event.key === TRIGGERS.CANDLES) {
      const { candle, minutes } = event.data;
      return {
        minutes_before: minutes,
        kind: candle.kind,
        name: occasionName(candle, this.namer),
        time: candle.at.toISOString(),
        local_time: formatTime(candle.at, language, tz),
      };
    }
    const { period } = event.data;
    const data = {
      kind: period.kind,
      name: occasionName(period, this.namer),
      includes_shabbat: period.shabbat,
    };
    if (event.key === TRIGGERS.START) {
      const end = new Date(period.end);
      data.end_time = end.toISOString();
      data.end_local_time = formatWhen(end, language, tz);
    }
    return data;
  }
}
