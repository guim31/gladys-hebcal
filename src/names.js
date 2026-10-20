// -----------------------------------------------------------------------------
// How the names of the Jewish calendar are written: holidays, months, weekly
// readings. hebcal gives the transliteration of hebcal.com, the Ashkenazi
// one and Hebrew script; the "local" style uses the usual name in French,
// German or Spanish when there is one ("Pessa'h", "Pessach", "Pésaj"), and
// keeps the transliteration for the others (most weekly readings).
// -----------------------------------------------------------------------------

import { Locale } from '@hebcal/core';

const HEBCAL_LOCALES = { sephardic: 'en', ashkenazi: 'ashkenazi', hebrew: 'he-x-NoNikud' };

// Applied in this order, on whole words: a longer name before the one it
// contains ("Shushan Purim" before "Purim", "Pesach Sheni" before "Pesach").
const LOCAL_NAMES = {
  fr: [
    ['Rosh Hashana LaBehemot', 'Roch Hachana des animaux'],
    ['Rosh Hashana', 'Roch Hachana'],
    ['Yom Kippur', 'Yom Kippour'],
    ["(CH''M)", "('Hol Hamoëd)"],
    ['Hoshana Raba', 'Hochaana Rabba'],
    ['Sukkot', 'Souccot'],
    ['Shmini Atzeret', 'Chemini Atseret'],
    ['Simchat Torah', "Sim'hat Torah"],
    ['Chanukah', "'Hanouka"],
    ['Tzom Gedaliah', 'Jeûne de Guedalia'],
    ["Asara B'Tevet", 'Jeûne du 10 Tevet'],
    ['Tu BiShvat', 'Tou Bichvat'],
    ["Ta'anit Esther", "Jeûne d'Esther"],
    ["Ta'anit Bechorot", 'Jeûne des premiers-nés'],
    ['Shushan Purim', 'Chouchane Pourim'],
    ['Purim', 'Pourim'],
    ['Pesach Sheni', "Pessa'h Chéni"],
    ['Pesach', "Pessa'h"],
    ['Lag BaOmer', 'Lag Baomer'],
    ['Shavuot', 'Chavouot'],
    ['Tzom Tammuz', 'Jeûne du 17 Tamouz'],
    ["Tish'a B'Av", 'Ticha Beav'],
    ["Tu B'Av", 'Tou Beav'],
    ['Rosh Chodesh', "Roch 'Hodech"],
    ['Leil Selichot', "Nuit des Seli'hot"],
    ['Yom HaShoah', 'Yom Hashoah'],
    ['Yom HaZikaron', 'Yom Hazikaron'],
    ["Yom HaAtzma'ut", 'Yom Haatsmaout'],
    ['Yom Yerushalayim', 'Yom Yeroushalaïm'],
    ['Shabbat', 'Chabbat'],
  ],
  de: [
    ['Rosh Hashana LaBehemot', 'Rosch Haschana der Tiere'],
    ['Rosh Hashana', 'Rosch Haschana'],
    ['Yom Kippur', 'Jom Kippur'],
    ["(CH''M)", '(Chol haMoed)'],
    ['Hoshana Raba', 'Hoschana Rabba'],
    ['Shmini Atzeret', 'Schemini Azeret'],
    ['Simchat Torah', 'Simchat Tora'],
    ['Chanukah', 'Chanukka'],
    ['Tzom Gedaliah', 'Gedalja-Fasten'],
    ["Asara B'Tevet", 'Fasten des 10. Tewet'],
    ['Tu BiShvat', 'Tu biSchwat'],
    ["Ta'anit Esther", 'Esther-Fasten'],
    ["Ta'anit Bechorot", 'Fasten der Erstgeborenen'],
    ['Shushan Purim', 'Schuschan Purim'],
    ['Pesach Sheni', 'Pessach Scheni'],
    ['Pesach', 'Pessach'],
    ['Lag BaOmer', 'Lag baOmer'],
    ['Shavuot', 'Schawuot'],
    ['Tzom Tammuz', 'Fasten des 17. Tammus'],
    ["Tish'a B'Av", 'Tischa beAw'],
    ["Tu B'Av", 'Tu beAw'],
    ['Rosh Chodesh', 'Rosch Chodesch'],
    ['Leil Selichot', 'Selichot-Nacht'],
    ['Yom HaShoah', "Jom haScho'a"],
    ['Yom HaZikaron', 'Jom haSikaron'],
    ["Yom HaAtzma'ut", "Jom haAtzma'ut"],
    ['Yom Yerushalayim', 'Jom Jeruschalajim'],
    ['Shabbat', 'Schabbat'],
  ],
  es: [
    ['Rosh Hashana LaBehemot', 'Rosh Hashaná de los animales'],
    ['Rosh Hashana', 'Rosh Hashaná'],
    ['Yom Kippur', 'Yom Kipur'],
    ["(CH''M)", '(Jol HaMoed)'],
    ['Hoshana Raba', 'Hoshaná Rabá'],
    ['Sukkot', 'Sucot'],
    ['Shmini Atzeret', 'Shminí Atzéret'],
    ['Simchat Torah', 'Simjat Torá'],
    ['Chanukah', 'Janucá'],
    ['Tzom Gedaliah', 'Ayuno de Guedalía'],
    ["Asara B'Tevet", 'Ayuno del 10 de Tevet'],
    ['Tu BiShvat', 'Tu Bishvat'],
    ["Ta'anit Esther", 'Ayuno de Ester'],
    ["Ta'anit Bechorot", 'Ayuno de los primogénitos'],
    ['Shushan Purim', 'Shushán Purim'],
    ['Pesach Sheni', 'Pésaj Shení'],
    ['Pesach', 'Pésaj'],
    ['Lag BaOmer', 'Lag Baómer'],
    ['Tzom Tammuz', 'Ayuno del 17 de Tamuz'],
    ["Tish'a B'Av", 'Tishá BeAv'],
    ["Tu B'Av", 'Tu BeAv'],
    ['Rosh Chodesh', 'Rosh Jódesh'],
    ['Leil Selichot', 'Noche de Selijot'],
    ['Yom HaShoah', 'Yom HaShoá'],
    ['Yom HaZikaron', 'Yom HaZikarón'],
    ["Yom HaAtzma'ut", 'Yom HaAtzmaút'],
    ['Yom Yerushalayim', 'Yom Yerushaláyim'],
    ['Shabbat', 'Shabat'],
  ],
};

// "Erev Pesach": the eve of a holiday.
const EVE = { fr: 'Veille de ', de: 'Erew ', es: 'Víspera de ' };

// hebcal's month names (HDate#getMonthName) in the local style.
const LOCAL_MONTHS = {
  fr: {
    Nisan: 'Nissan',
    Iyyar: 'Iyar',
    Tamuz: 'Tamouz',
    Elul: 'Eloul',
    Tishrei: 'Tichri',
    Cheshvan: "'Hechvan",
    "Sh'vat": 'Chevat',
  },
  de: {
    Iyyar: 'Ijar',
    Sivan: 'Siwan',
    Tamuz: 'Tammus',
    Av: 'Aw',
    Tishrei: 'Tischri',
    Cheshvan: 'Cheschwan',
    Kislev: 'Kislew',
    Tevet: 'Tewet',
    "Sh'vat": 'Schwat',
  },
  es: {
    Nisan: 'Nisán',
    Iyyar: 'Iyar',
    Sivan: 'Siván',
    Cheshvan: 'Jeshván',
    "Sh'vat": 'Shvat',
  },
};

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRule = ([from, to]) => [
  new RegExp(`(?<![\\p{L}'])${escape(from)}(?![\\p{L}])`, 'gu'),
  to,
];
const LOCAL_RULES = Object.fromEntries(
  Object.entries(LOCAL_NAMES).map(([language, rules]) => [language, rules.map(wordRule)]),
);
const MONTH_RULES = Object.fromEntries(
  Object.entries(LOCAL_MONTHS).map(([language, months]) => [
    language,
    Object.entries(months).map(wordRule),
  ]),
);

// hebcal writes some apostrophes typographic ("Tish’a B’Av").
const plain = (text) => text.replace(/[’‘]/g, "'");

/**
 * Translate an English (hebcal.com) name into the local style of a language.
 * Unknown words stay as they are.
 */
export function localize(english, language) {
  let text = plain(english);
  if (language === 'en' || !LOCAL_RULES[language]) {
    return text;
  }
  const eve = /^Erev /.test(text);
  if (eve) {
    text = text.slice(5);
  }
  for (const [pattern, to] of LOCAL_RULES[language]) {
    text = text.replace(pattern, to);
  }
  for (const [pattern, to] of MONTH_RULES[language]) {
    text = text.replace(pattern, to);
  }
  return eve ? `${EVE[language]}${text}` : text;
}

/**
 * The renderer of a configuration: names of events, of plain strings (a
 * parsha, "Shabbat") and of months, in the chosen style.
 * @param {{ names: string, language: string }} config
 */
export function createNamer({ names, language }) {
  const locale = HEBCAL_LOCALES[names];
  return {
    /** A hebcal event (HolidayEvent, RoshChodeshEvent...). */
    event(ev) {
      return locale ? plain(ev.render(locale)) : localize(ev.render('en'), language);
    },
    /** A hebcal string: a parsha ("Lech-Lecha"), a holiday ("Pesach I"). */
    text(english) {
      return locale ? plain(Locale.gettext(english, locale)) : localize(english, language);
    },
    /** A Hebrew date: "9 Tichri 5787", or in Hebrew letters. */
    date(hdate) {
      if (names === 'hebrew') {
        return hdate.renderGematriya(true);
      }
      return `${hdate.getDate()} ${this.text(hdate.getMonthName())} ${hdate.getFullYear()}`;
    },
  };
}
