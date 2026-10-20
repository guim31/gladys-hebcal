// -----------------------------------------------------------------------------
// The "Hebrew calendar" device: one per installation, read in the dashboard
// and in scene conditions ("only continue if it is not Shabbat"). Every
// feature is read-only and pushed by the container (should_poll: false): the
// values change at sunset, at candle lighting and at havdalah, not on a
// polling period. Every feature shares its type with another one: Gladys
// shows the generic label of a type alone on its device instead of its name.
// -----------------------------------------------------------------------------

import { NAMES, formatWhen } from './i18n.js';
import { holidaysText, orNone, parshaText } from './view.js';

const TEXT = { category: 'text', type: 'text', min: 0, max: 0 };
const BINARY = { category: 'input', type: 'binary', min: 0, max: 1 };

// Feature keys are forever (Gladys keys history and scenes on them).
export const FEATURES = [
  { key: 'hebrew_date', ...TEXT },
  { key: 'holiday', ...TEXT },
  { key: 'holy_day', ...BINARY },
  { key: 'holy_day_tomorrow', ...BINARY },
  { key: 'next_candle_lighting', ...TEXT },
  { key: 'next_havdalah', ...TEXT },
  { key: 'parsha', ...TEXT },
  { key: 'omer', category: 'counter-sensor', type: 'integer', min: 0, max: 49 },
  { key: 'days_to_holiday', category: 'duration', type: 'integer', unit: 'days', min: 0, max: 600 },
];

export function deviceIds(gladys) {
  return gladys.externalIds('calendar', 'house');
}

/** The device published on discovery. */
export function buildDevice(gladys, config) {
  const ids = deviceIds(gladys);
  const names = NAMES[config.language];
  return {
    name: names.device,
    external_id: ids.device,
    should_poll: false,
    features: FEATURES.map(({ key, category, type, unit, min, max }) => ({
      name: names[key],
      external_id: ids.feature(key),
      category,
      type,
      ...(unit ? { unit } : {}),
      min,
      max,
      read_only: true,
      has_feedback: false,
    })),
  };
}

/**
 * The value of every feature, keyed by feature key: a number, or { text }.
 * @param {object} snapshot HouseCalendar#snapshot
 * @param {{ config: object, namer: object, timeZone: string }} context
 */
export function buildValues(snapshot, { config, namer, timeZone }) {
  const language = config.language;
  const when = (entry) => orNone(entry ? formatWhen(entry.at, language, timeZone) : '', language);
  return {
    hebrew_date: { text: namer.date(snapshot.hebrewDate) },
    holiday: { text: orNone(holidaysText(snapshot.holidays, namer), language) },
    holy_day: snapshot.period ? 1 : 0,
    next_candle_lighting: { text: when(snapshot.nextCandles) },
    next_havdalah: { text: when(snapshot.nextHavdalah) },
    parsha: { text: parshaText(snapshot.parsha, namer) },
    omer: snapshot.omer,
    holy_day_tomorrow: snapshot.tomorrowHoly ? 1 : 0,
    ...(snapshot.nextHoliday ? { days_to_holiday: snapshot.nextHoliday.days } : {}),
  };
}
