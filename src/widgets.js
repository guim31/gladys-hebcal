// -----------------------------------------------------------------------------
// Dashboard widget "Hebrew calendar": the Hebrew date, Shabbat or the holiday
// under way, the next candle lighting and havdalah, the Omer, the weekly
// reading and, optionally, the zmanim of the day. Produced from the calendar,
// not from the device: it works before the device is added. Localized from
// the language of the person looking at it.
// -----------------------------------------------------------------------------

import { LANGUAGES } from './config.js';
import { WIDGET_TEXT, formatTime, formatWeekdayTime } from './i18n.js';
import { createNamer } from './names.js';
import { WIDGET_KEY } from './service.js';
import { holidaysText, occasionName, parshaText } from './view.js';

const ZMANIM = ['dawn', 'sunrise', 'shema', 'midday', 'sunset', 'nightfall'];
const ROUNDING = { shema: 'down', nightfall: 'up' };
const cut = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/**
 * @param {object} service the HebcalService
 * @param {{ settings?: object, language?: string }} request
 */
export function buildContent(service, { settings = {}, language } = {}) {
  const lang = LANGUAGES.includes(language) ? language : service.config.language;
  const text = WIDGET_TEXT[lang];
  const snapshot = service.snapshot();
  if (!snapshot) {
    return {
      ttl_seconds: 600,
      components: [{ type: 'text', variant: 'body', text: text.waiting }],
    };
  }
  const tz = service.timeZone;
  const namer = createNamer({ names: service.config.names, language: lang });
  const holiday = holidaysText(snapshot.holidays, namer);

  const components = [
    { type: 'text', variant: 'heading', text: cut(namer.date(snapshot.hebrewDate), 40) },
  ];
  if (snapshot.period) {
    const until = text.until(
      occasionName(snapshot.period, namer),
      formatWeekdayTime(new Date(snapshot.period.end), lang, tz),
    );
    components.push({ type: 'text', variant: 'caption', text: cut(until, 80) });
  }
  const tile = (label, entry, icon) =>
    entry && { type: 'value', label, value: formatWeekdayTime(entry.at, lang, tz), icon };
  components.push(
    ...[
      tile(text.candles, snapshot.nextCandles, 'sunset'),
      tile(text.havdalah, snapshot.nextHavdalah, 'moon'),
      snapshot.omer > 0 && { type: 'value', label: text.omer, value: snapshot.omer, icon: 'hash' },
    ].filter(Boolean),
  );

  const items = [
    { label: text.parsha, value: cut(parshaText(snapshot.parsha, namer), 40), icon: 'book-open' },
  ];
  if (holiday) {
    items.push({ label: text.holiday, value: cut(holiday, 40), icon: 'star' });
  }
  if (snapshot.nextHoliday) {
    const { holiday: next, days } = snapshot.nextHoliday;
    items.push({
      label: text.next,
      value: cut(text.inDays(namer.event(next), days), 40),
      icon: 'calendar',
    });
  }
  if (settings.show_zmanim !== false) {
    for (const key of ZMANIM) {
      const at = snapshot.zmanim[key];
      if (at) {
        items.push({
          label: text[key],
          value: formatTime(at, lang, tz, ROUNDING[key]),
          icon: 'clock',
        });
      }
    }
  }
  components.push({ type: 'status', items });
  // The clock asks for a refresh when the content moves; the TTL is a safety net.
  return { ttl_seconds: 900, components };
}

export const WIDGETS = {
  [WIDGET_KEY]: {
    get: (service, request) => buildContent(service, request),
  },
};
