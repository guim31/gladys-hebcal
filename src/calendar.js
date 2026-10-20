// -----------------------------------------------------------------------------
// The Jewish calendar of the house, computed locally with @hebcal/core (the
// engine of hebcal.com): no network. Pure: every function takes the instant
// it works for, the service (src/service.js) owns the clock.
//
// - The Hebrew day starts at sunset: the Hebrew date, the holiday of the day
//   and the Omer switch at sunset, as they do for the people who keep them.
// - Shabbat and the holidays where work is forbidden ("issur melakha") run
//   from candle lighting to havdalah. Consecutive days (a holiday followed by
//   Shabbat, the two days of a holiday in the diaspora) form ONE period: one
//   start, one end.
// - hebcal works on civil days; a civil day of the house is the local date in
//   the time zone of Gladys, turned into a local Date (`new Date(y, m, d)`),
//   which is what HDate reads, whatever the time zone of the process.
// -----------------------------------------------------------------------------

import { HDate, HebrewCalendar, Location, Zmanim, flags, months } from '@hebcal/core';
import { HAVDALAH_METHODS } from './config.js';

const DAY_MS = 24 * 3600 * 1000;
// The timeline covers a week before (a period under way started at most three
// days ago) and two months after (the next holiday of the widget).
const DAYS_BEFORE = 8;
const DAYS_AFTER = 62;

// The holidays the "holiday" feature shows: what hebcal.com lists as a
// holiday, minus Chanukah, whose day is computed here (hebcal names the
// candles of the evening, not the day). Yom Kippur Katan and BeHaB are minor
// fasts hebcal.com only shows on request: left out too.
const SHOWN =
  flags.CHAG |
  flags.EREV |
  flags.CHOL_HAMOED |
  flags.MINOR_FAST |
  flags.MAJOR_FAST |
  flags.ROSH_CHODESH |
  flags.SPECIAL_SHABBAT |
  flags.MODERN_HOLIDAY |
  flags.MINOR_HOLIDAY;

/** A day where work is forbidden: Yom Kippur and the "yom tov" days. */
const isYomTov = (ev) =>
  (ev.getFlags() & flags.CHAG) !== 0 && (ev.getFlags() & (flags.EREV | flags.CHOL_HAMOED)) === 0;

const pad = (n) => String(n).padStart(2, '0');

/** The local civil date of an instant in a time zone. */
const civilFormats = new Map();
export function civilDate(ms, timeZone) {
  if (!civilFormats.has(timeZone)) {
    civilFormats.set(
      timeZone,
      new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    );
  }
  const parts = civilFormats.get(timeZone).formatToParts(new Date(ms));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

export const civilKey = ({ y, m, d }) => `${y}-${pad(m)}-${pad(d)}`;
const toHDate = ({ y, m, d }) => new HDate(new Date(y, m - 1, d));
const addCivilDays = (civil, days) => {
  const date = new Date(Date.UTC(civil.y, civil.m - 1, civil.d + days));
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
};
const valid = (date) => date instanceof Date && Number.isFinite(date.getTime());

export class HouseCalendar {
  /**
   * @param {object} options
   * @param {number} options.latitude
   * @param {number} options.longitude
   * @param {string} options.timeZone the time zone of Gladys (IANA)
   * @param {boolean} options.il Israel (true) or the diaspora
   * @param {number} options.candleMinutes candle lighting, minutes before sunset
   * @param {string} options.havdalah a key of HAVDALAH_METHODS
   */
  constructor({ latitude, longitude, timeZone, il, candleMinutes, havdalah }) {
    this.timeZone = timeZone;
    this.il = il;
    this.location = new Location(latitude, longitude, il, timeZone);
    this.options = {
      location: this.location,
      il,
      candlelighting: true,
      candleLightingMins: candleMinutes,
      ...HAVDALAH_METHODS[havdalah],
    };
    // A few civil days at once: today's ticks and tomorrow's checks.
    this.timelines = new Map();
    this.nextHolidays = new Map();
    this.memos = new Map();
  }

  civil(ms) {
    return civilDate(ms, this.timeZone);
  }

  /** The zmanim of a civil day. */
  zmanim(civil) {
    return new Zmanim(this.location, toHDate(civil), false);
  }

  /** The Hebrew date at an instant: the next one from sunset. */
  hebrewDate(ms) {
    const civil = this.civil(ms);
    const hd = toHDate(civil);
    const sunset = this.memo(`sunset:${civilKey(civil)}`, () => this.zmanim(civil).sunset());
    return valid(sunset) && ms >= sunset.getTime() ? hd.next() : hd;
  }

  /** A value computed once per key (a civil or Hebrew day): ticks are frequent. */
  memo(key, compute) {
    if (!this.memos.has(key)) {
      if (this.memos.size >= 64) {
        this.memos.clear();
      }
      this.memos.set(key, compute());
    }
    return this.memos.get(key);
  }

  /** The holidays of a Hebrew date, Chanukah included: hebcal events or { chanukahDay }. */
  holidaysOn(hd) {
    const list = (HebrewCalendar.getHolidaysOnDate(hd, this.il) ?? []).filter(
      (ev) =>
        (ev.getFlags() & SHOWN) !== 0 &&
        (ev.getFlags() & (flags.CHANUKAH_CANDLES | flags.YOM_KIPPUR_KATAN | flags.BEHAB)) === 0,
    );
    const day = chanukahDay(hd);
    if (day) {
      list.push({ chanukahDay: day });
    }
    return list;
  }

  /**
   * Candle lightings, havdalot and the periods they bound, from a week before
   * the civil day of `ms` to two months after. Cached per civil day.
   */
  timeline(ms) {
    const today = this.civil(ms);
    const key = civilKey(today);
    if (this.timelines.has(key)) {
      return this.timelines.get(key);
    }
    const events = HebrewCalendar.calendar({
      ...this.options,
      start: toHDate(addCivilDays(today, -DAYS_BEFORE)),
      end: toHDate(addCivilDays(today, DAYS_AFTER)),
    });
    const candles = [];
    const havdalot = [];
    for (const ev of events) {
      const name = ev.constructor.name;
      if (name === 'CandleLightingEvent' && valid(ev.eventTime)) {
        candles.push({ at: ev.eventTime, ...this.entering(ev.getDate()) });
      } else if (name === 'HavdalahEvent' && valid(ev.eventTime)) {
        havdalot.push({ at: ev.eventTime });
      }
    }
    const periods = buildPeriods(candles, havdalot);
    const timeline = { candles, havdalot, periods };
    if (this.timelines.size >= 4) {
      this.timelines.delete(this.timelines.keys().next().value);
    }
    this.timelines.set(key, timeline);
    return timeline;
  }

  /**
   * What a candle lighting of the civil day `hd` opens: the Hebrew day that
   * starts that evening, a holiday or Shabbat.
   */
  entering(hd) {
    const next = hd.next();
    const yomTov = (HebrewCalendar.getHolidaysOnDate(next, this.il) ?? []).find(isYomTov);
    return {
      kind: yomTov ? 'holiday' : 'shabbat',
      holiday: yomTov ?? null,
      shabbat: next.getDay() === 6,
    };
  }

  /** The period of Shabbat or holiday under way at `ms`, or null. */
  periodAt(ms) {
    return this.timeline(ms).periods.find((p) => p.start <= ms && ms < p.end) ?? null;
  }

  /** The weekly reading of the coming Shabbat (or of today, Shabbat). */
  parsha(hd) {
    const saturday = hd.onOrAfter(6);
    return HebrewCalendar.getSedra(saturday.getFullYear(), this.il).lookup(saturday);
  }

  /** The day of the Omer (1-49), 0 outside the counting. */
  omer(hd) {
    const days = hd.deltaDays(new HDate(16, months.NISAN, hd.getFullYear())) + 1;
    return days >= 1 && days <= 49 ? days : 0;
  }

  /**
   * The next day of holiday where work is forbidden, from a civil day (0
   * days: that day is one), within a Hebrew year and a half.
   * @returns {{ holiday: object, days: number } | null}
   */
  nextHoliday(civil) {
    const key = civilKey(civil);
    if (!this.nextHolidays.has(key)) {
      const hd = toHDate(civil);
      let found = null;
      for (const year of [hd.getFullYear(), hd.getFullYear() + 1]) {
        const next = HebrewCalendar.getHolidaysForYearArray(year, this.il)
          .filter((ev) => isYomTov(ev) && ev.getDate().deltaDays(hd) >= 0)
          .sort((a, b) => a.getDate().deltaDays(b.getDate()))[0];
        if (next) {
          found = { holiday: next, days: next.getDate().deltaDays(hd) };
          break;
        }
      }
      this.nextHolidays.clear();
      this.nextHolidays.set(key, found);
    }
    return this.nextHolidays.get(key);
  }

  /**
   * Everything the device, the widget and the actions show, at an instant.
   */
  snapshot(ms) {
    const { candles, havdalot } = this.timeline(ms);
    const hd = this.hebrewDate(ms);
    const civil = this.civil(ms);
    const ofCivil = this.memo(`civil:${civilKey(civil)}`, () => ({
      zmanim: this.zmanimOf(civil),
      tomorrowHoly: this.day(addCivilDays(civil, 1)).holyDay,
      nextHoliday: this.nextHoliday(civil),
    }));
    const ofHebrew = this.memo(`hebrew:${hd.toString()}`, () => ({
      holidays: this.holidaysOn(hd),
      parsha: this.parsha(hd),
      omer: this.omer(hd),
    }));
    return {
      at: ms,
      civil,
      hebrewDate: hd,
      period: this.periodAt(ms),
      nextCandles: candles.find((c) => c.at.getTime() > ms) ?? null,
      nextHavdalah: havdalot.find((h) => h.at.getTime() > ms) ?? null,
      ...ofHebrew,
      ...ofCivil,
    };
  }

  /**
   * A civil day as a whole (scene action "Day information"): the Hebrew date
   * of its daytime, its holidays, whether work is forbidden in its daytime,
   * its candle lighting and havdalah.
   */
  day(civil) {
    const hd = toHDate(civil);
    const noon = this.zmanim(civil).chatzot();
    const midday = valid(noon) ? noon.getTime() : Date.UTC(civil.y, civil.m - 1, civil.d, 12);
    const { candles, havdalot } = this.timeline(midday);
    const sameDay = (entry) => civilKey(this.civil(entry.at.getTime())) === civilKey(civil);
    return {
      civil,
      hebrewDate: hd,
      holidays: this.holidaysOn(hd),
      holyDay: this.periodAt(midday) !== null,
      candles: candles.find(sameDay) ?? null,
      havdalah: havdalot.find(sameDay) ?? null,
      parsha: this.parsha(hd),
      omer: this.omer(hd),
      zmanim: this.zmanimOf(civil),
    };
  }

  zmanimOf(civil) {
    const z = this.zmanim(civil);
    const at = (fn) => {
      const date = fn();
      return valid(date) ? date : null;
    };
    return {
      dawn: at(() => z.alotHaShachar()),
      sunrise: at(() => z.sunrise()),
      shema: at(() => z.sofZmanShma()),
      midday: at(() => z.chatzot()),
      sunset: at(() => z.sunset()),
      nightfall: at(() => z.tzeit(8.5)),
    };
  }

  /**
   * The scene events due in [from, to]: candle lightings (one per offset),
   * starts and ends of periods. Ids are stable: an event is fired once.
   * @returns {Array<{ key: string, id: string, at: number, data: object }>}
   */
  eventsBetween(from, to, offsets) {
    const { candles, periods } = this.timeline(to);
    const events = [];
    const add = (key, id, at, data) => {
      if (at >= from && at <= to) {
        events.push({ key, id: `${key}:${id}`, at, data });
      }
    };
    for (const candle of candles) {
      const at = candle.at.getTime();
      for (const minutes of offsets) {
        add('candle_lighting', `${candle.at.toISOString()}:${minutes}`, at - minutes * 60000, {
          candle,
          minutes,
        });
      }
    }
    for (const period of periods) {
      add('holy_day_start', new Date(period.start).toISOString(), period.start, { period });
      add('holy_day_end', new Date(period.end).toISOString(), period.end, { period });
    }
    return events.sort((a, b) => a.at - b.at);
  }
}

/**
 * Join candle lightings and havdalot into periods: a period opens at the
 * first candle lighting, the later ones (second evening of a holiday,
 * holiday then Shabbat) belong to it, and the next havdalah closes it.
 */
export function buildPeriods(candles, havdalot) {
  const marks = [
    ...candles.map((c) => ({ at: c.at.getTime(), candle: c })),
    ...havdalot.map((h) => ({ at: h.at.getTime() })),
  ].sort((a, b) => a.at - b.at);
  const periods = [];
  let open = null;
  for (const mark of marks) {
    if (mark.candle) {
      if (!open) {
        open = { start: mark.at, entries: [] };
      }
      open.entries.push(mark.candle);
    } else if (open) {
      // A gap of more than four days means a missing havdalah (polar day):
      // better no period than a week of "work forbidden".
      if (mark.at - open.start <= 4 * DAY_MS) {
        periods.push(closePeriod(open, mark.at));
      }
      open = null;
    }
  }
  return periods;
}

function closePeriod(open, end) {
  const holiday = open.entries.find((e) => e.holiday)?.holiday ?? null;
  return {
    start: open.start,
    end,
    kind: holiday ? 'holiday' : 'shabbat',
    holiday,
    shabbat: open.entries.some((e) => e.shabbat),
  };
}

/** The day of Chanukah (1-8) of a Hebrew date, 0 outside. */
export function chanukahDay(hd) {
  if (hd.getMonth() !== months.KISLEV && hd.getMonth() !== months.TEVET) {
    return 0;
  }
  // Kislev and Tevet belong to the same Hebrew year (it starts in Tishrei).
  const first = new HDate(25, months.KISLEV, hd.getFullYear());
  const day = hd.deltaDays(first) + 1;
  return day >= 1 && day <= 8 ? day : 0;
}

export { addCivilDays };
