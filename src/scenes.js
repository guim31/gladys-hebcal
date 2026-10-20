// -----------------------------------------------------------------------------
// Scene action "Day information": today or tomorrow, as a whole civil day.
// The following steps of the scene read its outputs ({{<column>.<row>.<key>}})
// and test them with a "Condition on variables" — "skip the alarm clock if
// tomorrow is Shabbat or a holiday". The yes/no output is a number (1 = yes,
// 0 = no): that condition compares strictly, and nothing typed there can
// equal a boolean. Times are local ("18:27"), '' when the day has none.
// -----------------------------------------------------------------------------

import { addCivilDays, civilKey } from './calendar.js';
import { formatTime } from './i18n.js';
import { holidaysText, parshaText } from './view.js';

export const SCENE_ACTIONS = {
  day_info: async (service, { fields = {} }) => {
    const calendar = service.calendar;
    if (!calendar) {
      throw new Error('No house with coordinates in Gladys yet');
    }
    const { language } = service.config;
    const tz = service.timeZone;
    const today = calendar.civil(service.now());
    const civil = fields.day === 'tomorrow' ? addCivilDays(today, 1) : today;
    const day = calendar.day(civil);
    const namer = service.namer;
    const time = (date, rounding) => (date ? formatTime(date, language, tz, rounding) : '');
    return {
      date: civilKey(civil),
      hebrew_date: namer.date(day.hebrewDate),
      holiday: holidaysText(day.holidays, namer),
      is_holy_day: day.holyDay ? 1 : 0,
      candle_lighting: time(day.candles?.at),
      havdalah: time(day.havdalah?.at),
      parsha: parshaText(day.parsha, namer),
      omer: day.omer,
      sunrise: time(day.zmanim.sunrise),
      latest_shema: time(day.zmanim.shema, 'down'),
      sunset: time(day.zmanim.sunset),
      nightfall: time(day.zmanim.nightfall, 'up'),
    };
  },
};
