// -----------------------------------------------------------------------------
// Configuration: DEFAULT_CONFIG mirrors the manifest defaults (tied by
// test/manifest.test.js), and normalizeConfig() turns whatever Gladys sends (a
// field never saved is absent, a number may arrive as a string) into a
// complete, valid object. Nothing here throws: a wrong value falls back to its
// default.
// -----------------------------------------------------------------------------

export const LANGUAGES = ['en', 'fr', 'de', 'es'];

// How holiday, month and parsha names are written.
//   local     in the language of the texts (transliteration when no usual name)
//   sephardic the transliteration of hebcal.com ("Pesach", "Shavuot")
//   ashkenazi the Ashkenazi transliteration ("Pesach", "Shavuos")
//   hebrew    Hebrew script, without vowel points
export const NAME_STYLES = ['local', 'sephardic', 'ashkenazi', 'hebrew'];

// auto: Israel when the time zone of Gladys is Israel's, diaspora otherwise.
export const REGIONS = ['auto', 'diaspora', 'israel'];

// End of Shabbat and holidays: the sun 8.5° below the horizon (hebcal.com's
// default, three small stars), or a fixed number of minutes after sunset.
export const HAVDALAH_METHODS = {
  deg_8_5: { havdalahDeg: 8.5 },
  min_42: { havdalahMins: 42 },
  min_50: { havdalahMins: 50 },
  min_72: { havdalahMins: 72 },
};

export const CANDLE_MINUTES = { min: 0, max: 90 };

const ISRAEL_TIME_ZONES = ['Asia/Jerusalem', 'Asia/Tel_Aviv'];

export const DEFAULT_CONFIG = {
  language: 'fr',
  names: 'local',
  region: 'auto',
  candle_minutes: 18,
  havdalah: 'deg_8_5',
};

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

/**
 * @param {object} [raw] the configuration sent by Gladys
 * @returns {object} DEFAULT_CONFIG's keys with valid values
 */
export function normalizeConfig(raw = {}) {
  const source = raw ?? {};
  const minutes = Number(String(source.candle_minutes ?? '').replace(',', '.'));
  return {
    language: pick(source.language, LANGUAGES, DEFAULT_CONFIG.language),
    names: pick(source.names, NAME_STYLES, DEFAULT_CONFIG.names),
    region: pick(source.region, REGIONS, DEFAULT_CONFIG.region),
    candle_minutes:
      source.candle_minutes !== undefined &&
      source.candle_minutes !== null &&
      source.candle_minutes !== '' &&
      Number.isFinite(minutes)
        ? Math.min(Math.max(Math.round(minutes), CANDLE_MINUTES.min), CANDLE_MINUTES.max)
        : DEFAULT_CONFIG.candle_minutes,
    havdalah: pick(source.havdalah, Object.keys(HAVDALAH_METHODS), DEFAULT_CONFIG.havdalah),
  };
}

/** Israel or the diaspora: the holidays and the weekly readings differ. */
export function isIsrael(config, timeZone) {
  if (config.region === 'israel') {
    return true;
  }
  if (config.region === 'diaspora') {
    return false;
  }
  return ISRAEL_TIME_ZONES.includes(timeZone);
}
