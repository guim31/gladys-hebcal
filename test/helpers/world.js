// -----------------------------------------------------------------------------
// A running integration against the SDK's fake Gladys, with a clock the test
// moves and /data kept in memory. No network: the calendar is computed.
// -----------------------------------------------------------------------------

import { createFakeGladys } from '@gladysassistant/integration-sdk/testing';
import { registerHandlers } from '../../src/app.js';

export const HOUSES = {
  paris: { name: 'Maison', selector: 'maison', latitude: 48.8566, longitude: 2.3522 },
  jerusalem: { name: 'Home', selector: 'home', latitude: 31.7683, longitude: 35.2137 },
  newYork: { name: 'Home', selector: 'home', latitude: 40.7128, longitude: -74.006 },
};

export function createMemoryStore(files = {}) {
  const content = new Map(Object.entries(files));
  return {
    files: content,
    load: (name) => (content.has(name) ? structuredClone(content.get(name)) : null),
    save: (name, value) => content.set(name, structuredClone(value)),
  };
}

/** A clock the test sets and moves. */
export function createClock(iso) {
  const clock = {
    ms: Date.parse(iso),
    now: () => clock.ms,
    set: (value) => {
      clock.ms = Date.parse(value);
    },
  };
  return clock;
}

/**
 * @param {object} [options]
 * @param {object} [options.config] the configuration saved in Gladys
 * @param {string} [options.at] the instant of the start (ISO)
 * @param {string} [options.timeZone] Gladys' time zone
 * @param {object[]} [options.houses] the houses of Gladys
 * @param {object} [options.store] createMemoryStore()
 * @param {boolean} [options.connect] false: handlers registered, not started
 * @param {boolean} [options.timers] true: the real clock runs, on Date.now and
 *   setInterval (to mock with t.mock.timers)
 */
export async function createWorld({
  config = {},
  at = '2026-10-20T10:00:00Z',
  timeZone = 'Europe/Paris',
  houses = [HOUSES.paris],
  store = createMemoryStore(),
  devices = [],
  connect = true,
  timers = false,
} = {}) {
  const clock = createClock(at);
  const gladys = createFakeGladys({ config, devices, houses });
  const app = registerHandlers(gladys, {
    store,
    now: timers ? () => Date.now() : clock.now,
    timeZone,
    timers,
  });
  if (connect) {
    await gladys.connect();
  }
  const { service } = app;
  return {
    gladys,
    app,
    service,
    clock,
    store,
    /** The last value Gladys received for a feature key of the device. */
    state(key) {
      return gladys.fake.lastState(`ext:test-integration:calendar:house:${key}`);
    },
    /** Moves the clock in steps of 20 seconds up to an instant, ticking each step. */
    async runUntil(iso) {
      const target = Date.parse(iso);
      while (clock.ms < target) {
        clock.ms = Math.min(clock.ms + 20_000, target);
        await service.tick();
      }
    },
    events(key) {
      return gladys.fake.sceneEvents.filter((event) => event.key === key);
    },
  };
}
