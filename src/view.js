// -----------------------------------------------------------------------------
// Snapshot of the calendar (src/calendar.js) -> the texts people read, in a
// language and a style of names (src/names.js). Shared by the device, the
// widget, the scene triggers and the scene action.
// -----------------------------------------------------------------------------

import { VALUES } from './i18n.js';

/** "Pessa'h I", "'Hanouka 3/8, Roch 'Hodech Tevet", or '' when none. */
export function holidaysText(holidays, namer) {
  return holidays
    .map((ev) =>
      ev.chanukahDay ? `${namer.text('Chanukah')} ${ev.chanukahDay}/8` : namer.event(ev),
    )
    .join(', ');
}

/** The reading of a Shabbat: "Vayakhel-Pekudei", or the holiday read instead. */
export function parshaText(parsha, namer) {
  return parsha.parsha.map((name) => namer.text(name)).join('-');
}

/** The name of a period or of a candle lighting: the holiday, or "Shabbat". */
export function occasionName(entry, namer) {
  return entry.holiday ? namer.event(entry.holiday) : namer.text('Shabbat');
}

/** A text value never empty (Gladys ignores an empty text state). */
export function orNone(text, language) {
  return text || VALUES[language].none;
}
