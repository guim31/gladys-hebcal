// -----------------------------------------------------------------------------
// The texts the container produces, in the four languages of Gladys. German
// says "du", Spanish "usted". Feature names are fixed when a device is
// created, in the language of the configuration.
// -----------------------------------------------------------------------------

export const NAMES = {
  en: {
    device: 'Hebrew calendar',
    hebrew_date: 'Hebrew date',
    holiday: 'Holiday today',
    holy_day: 'Shabbat or holiday now',
    holy_day_tomorrow: 'Shabbat or holiday tomorrow',
    days_to_holiday: 'Days until the next holiday',
    next_candle_lighting: 'Next candle lighting',
    next_havdalah: 'Next havdalah',
    parsha: 'Weekly Torah portion',
    omer: 'Omer count',
  },
  fr: {
    device: 'Calendrier hébraïque',
    hebrew_date: 'Date hébraïque',
    holiday: 'Fête du jour',
    holy_day: 'Chabbat ou fête en cours',
    holy_day_tomorrow: 'Chabbat ou fête demain',
    days_to_holiday: 'Jours avant la prochaine fête',
    next_candle_lighting: 'Prochain allumage des bougies',
    next_havdalah: 'Prochaine havdala',
    parsha: 'Paracha de la semaine',
    omer: 'Compte du Omer',
  },
  de: {
    device: 'Jüdischer Kalender',
    hebrew_date: 'Hebräisches Datum',
    holiday: 'Feiertag heute',
    holy_day: 'Schabbat oder Feiertag jetzt',
    holy_day_tomorrow: 'Schabbat oder Feiertag morgen',
    days_to_holiday: 'Tage bis zum nächsten Feiertag',
    next_candle_lighting: 'Nächstes Kerzenzünden',
    next_havdalah: 'Nächste Hawdala',
    parsha: 'Wochenabschnitt',
    omer: 'Omerzählung',
  },
  es: {
    device: 'Calendario hebreo',
    hebrew_date: 'Fecha hebrea',
    holiday: 'Festividad de hoy',
    holy_day: 'Shabat o festividad en curso',
    holy_day_tomorrow: 'Shabat o festividad mañana',
    days_to_holiday: 'Días hasta la próxima festividad',
    next_candle_lighting: 'Próximo encendido de velas',
    next_havdalah: 'Próxima havdalá',
    parsha: 'Porción semanal de la Torá',
    omer: 'Cuenta del Ómer',
  },
};

// Values of the text features and of the action outputs.
export const VALUES = {
  en: { none: 'None' },
  fr: { none: 'Aucun(e)' },
  de: { none: 'Keine Angabe' },
  es: { none: 'Ninguno' },
};

export const WIDGET_TEXT = {
  en: {
    candles: 'Candle lighting',
    havdalah: 'Havdalah',
    omer: 'Omer',
    parsha: 'Torah portion',
    holiday: 'Holiday',
    next: 'Next holiday',
    inDays: (name, days) =>
      days === 0 ? `${name}, today` : days === 1 ? `${name}, tomorrow` : `${name}, in ${days} days`,
    until: (name, time) => `${name} until ${time}`,
    dawn: 'Dawn (alot hashachar)',
    sunrise: 'Sunrise',
    shema: 'Latest Shema',
    midday: 'Midday (chatzot)',
    sunset: 'Sunset',
    nightfall: 'Nightfall (tzeit)',
    waiting: 'Waiting for the coordinates of the house.',
  },
  fr: {
    candles: 'Allumage',
    havdalah: 'Havdala',
    omer: 'Omer',
    parsha: 'Paracha',
    holiday: 'Fête',
    next: 'Prochaine fête',
    inDays: (name, days) =>
      days === 0
        ? `${name}, aujourd'hui`
        : days === 1
          ? `${name}, demain`
          : `${name}, dans ${days} j`,
    until: (name, time) => `${name} jusqu'à ${time}`,
    dawn: 'Aube (alot hacha’har)',
    sunrise: 'Lever du soleil',
    shema: 'Fin du Chema',
    midday: 'Midi solaire (hatsot)',
    sunset: 'Coucher du soleil',
    nightfall: 'Tombée de la nuit (tsét)',
    waiting: 'En attente des coordonnées de la maison.',
  },
  de: {
    candles: 'Kerzenzünden',
    havdalah: 'Hawdala',
    omer: 'Omer',
    parsha: 'Wochenabschnitt',
    holiday: 'Feiertag',
    next: 'Nächster Feiertag',
    inDays: (name, days) =>
      days === 0 ? `${name}, heute` : days === 1 ? `${name}, morgen` : `${name}, in ${days} Tagen`,
    until: (name, time) => `${name} bis ${time}`,
    dawn: 'Morgengrauen (Alot haSchachar)',
    sunrise: 'Sonnenaufgang',
    shema: 'Spätestes Schma',
    midday: 'Mittag (Chazot)',
    sunset: 'Sonnenuntergang',
    nightfall: 'Nachteinbruch (Zet)',
    waiting: 'Warte auf die Koordinaten des Zuhauses.',
  },
  es: {
    candles: 'Velas',
    havdalah: 'Havdalá',
    omer: 'Ómer',
    parsha: 'Parashá',
    holiday: 'Festividad',
    next: 'Próxima festividad',
    inDays: (name, days) =>
      days === 0 ? `${name}, hoy` : days === 1 ? `${name}, mañana` : `${name}, en ${days} días`,
    until: (name, time) => `${name} hasta el ${time}`,
    dawn: 'Alba (alot hashajar)',
    sunrise: 'Salida del sol',
    shema: 'Último Shemá',
    midday: 'Mediodía (jatzot)',
    sunset: 'Puesta del sol',
    nightfall: 'Anochecer (tzet)',
    waiting: 'Esperando las coordenadas de la vivienda.',
  },
};

// Connection status shown on the integration page.
export const NO_LOCATION = {
  en: 'No house with coordinates: set them in Settings > Houses. Retrying every 10 minutes.',
  fr: 'Aucune maison avec des coordonnées : renseignez-les dans Paramètres > Maisons. Nouvel essai toutes les 10 minutes.',
  de: 'Kein Zuhause mit Koordinaten: Trage sie unter Einstellungen > Zuhause ein. Neuer Versuch alle 10 Minuten.',
  es: 'Ninguna vivienda con coordenadas: indíquelas en Configuración > Viviendas. Nuevo intento cada 10 minutos.',
};

export const INIT_FAILED = {
  en: 'The integration could not start: see its logs.',
  fr: "L'intégration n'a pas pu démarrer : consultez ses journaux.",
  de: 'Die Integration konnte nicht starten: Sieh dir ihre Protokolle an.',
  es: 'La integración no pudo iniciarse: consulte sus registros.',
};

// Building an Intl.DateTimeFormat costs more than formatting: kept per use.
const formats = new Map();
function formatter(language, timeZone, options) {
  const key = `${language}|${timeZone}|${JSON.stringify(options)}`;
  if (!formats.has(key)) {
    formats.set(key, new Intl.DateTimeFormat(language, { timeZone, ...options }));
  }
  return formats.get(key);
}

const WHEN = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
};
const WEEKDAY_TIME = { weekday: 'short', hour: '2-digit', minute: '2-digit' };
const TIME = { hour: '2-digit', minute: '2-digit' };

/** "ven. 23 oct., 18:27": a weekday, a date and a time in the house's zone. */
export function formatWhen(date, language, timeZone) {
  return formatter(language, timeZone, WHEN).format(date);
}

/** "ven. 18:27": a weekday and a time (widget tiles, 12 characters at most). */
export function formatWeekdayTime(date, language, timeZone) {
  return formatter(language, timeZone, WEEKDAY_TIME).format(date);
}

/**
 * "18:27". Zmanim carry seconds: a deadline (latest Shema) is rounded down,
 * nightfall up, the rest to the nearest minute.
 */
export function formatTime(date, language, timeZone, rounding = 'nearest') {
  const round = { nearest: Math.round, down: Math.floor, up: Math.ceil }[rounding];
  return formatter(language, timeZone, TIME).format(
    new Date(round(date.getTime() / 60000) * 60000),
  );
}
