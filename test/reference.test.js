// -----------------------------------------------------------------------------
// The calendar against hebcal.com, the reference: answers of its public API
// recorded on 2026-10-20 (scratch script, month by month) for Paris (18 min,
// 8.5°), Jerusalem (Israel, 40 min, 8.5°) and New York (18 min, havdalah 50
// min after sunset), over 2025, 2026 and 2027 — daylight saving changes
// included. Every candle lighting and havdalah to the minute, every weekly
// portion, every holiday and Rosh Chodesh, every day of the Omer.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HDate } from '@hebcal/core';
import { HouseCalendar } from '../src/calendar.js';
import { createNamer } from '../src/names.js';
import { holidaysText, parshaText } from '../src/view.js';

const CITIES = {
  paris: { timeZone: 'Europe/Paris', il: false, candleMinutes: 18, havdalah: 'deg_8_5' },
  jerusalem: { timeZone: 'Asia/Jerusalem', il: true, candleMinutes: 40, havdalah: 'deg_8_5' },
  'new-york': { timeZone: 'America/New_York', il: false, candleMinutes: 18, havdalah: 'min_50' },
};
const YEARS = [2025, 2026, 2027];
const DAY = 24 * 3600 * 1000;

const namer = createNamer({ names: 'sephardic', language: 'en' });
const plain = (text) => text.replace(/[’‘]/g, "'");
const hdateOf = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new HDate(new Date(y, m - 1, d));
};
// hebcal.com lists these with the holidays; the integration does not show them
// (Chanukah is shown as a day number, computed separately and tested apart).
const NOT_SHOWN = /^(Chanukah|Fast begins|Fast ends|Finish eating chametz|Biur Chametz)/;

function load(city, year) {
  return JSON.parse(
    readFileSync(new URL(`./fixtures/hebcal-com/${city}-${year}.json`, import.meta.url), 'utf8'),
  );
}

for (const [city, options] of Object.entries(CITIES)) {
  for (const year of YEARS) {
    test(`${city} ${year}: same times, portions, holidays and Omer as hebcal.com`, () => {
      const fixture = load(city, year);
      const { latitude, longitude } = fixture.location;
      const calendar = new HouseCalendar({ latitude, longitude, ...options });
      const items = fixture.items;
      const from = Date.UTC(year, 0, 1) - DAY;
      const to = Date.UTC(year + 1, 0, 1) + DAY;

      // Candle lighting and havdalah, to the minute, over the whole year.
      const candles = new Set();
      const havdalot = new Set();
      for (let ms = from; ms < to + 60 * DAY; ms += 30 * DAY) {
        const timeline = calendar.timeline(ms);
        timeline.candles.forEach((c) => candles.add(c.at.getTime()));
        timeline.havdalot.forEach((h) => havdalot.add(h.at.getTime()));
      }
      const inYear = (set) =>
        [...set]
          .filter((ms) =>
            new Date(ms)
              .toLocaleDateString('en-CA', { timeZone: options.timeZone })
              .startsWith(`${year}-`),
          )
          .sort((a, b) => a - b);
      const expected = (category) =>
        items
          .filter((i) => i.category === category)
          .map((i) => Date.parse(i.date))
          .sort((a, b) => a - b);
      assert.deepEqual(
        inYear(candles).map((ms) => new Date(ms).toISOString()),
        expected('candles').map((ms) => new Date(ms).toISOString()),
      );
      assert.deepEqual(
        inYear(havdalot).map((ms) => new Date(ms).toISOString()),
        expected('havdalah').map((ms) => new Date(ms).toISOString()),
      );
      assert.ok(expected('candles').length >= 55);

      // The weekly portion of every Shabbat, and the Hebrew date of that day.
      const portions = new Map(
        items.filter((i) => i.category === 'parashat').map((i) => [i.date, i]),
      );
      for (let ms = Date.UTC(year, 0, 1); ms < Date.UTC(year + 1, 0, 1); ms += DAY) {
        const iso = new Date(ms).toISOString().slice(0, 10);
        const hd = hdateOf(iso);
        if (hd.getDay() !== 6) {
          continue;
        }
        const parsha = calendar.parsha(hd);
        const item = portions.get(iso);
        if (parsha.chag) {
          assert.equal(item, undefined, `${iso}: a holiday reading, no portion`);
          continue;
        }
        assert.equal(`Parashat ${parshaText(parsha, namer)}`, plain(item.title), iso);
        assert.equal(namer.date(hd), plain(item.hdate), iso);
      }

      // The holidays and Rosh Chodesh of every day.
      const byDay = new Map();
      for (const item of items) {
        if (['holiday', 'roshchodesh'].includes(item.category) && !NOT_SHOWN.test(item.title)) {
          const day = item.date.slice(0, 10);
          byDay.set(day, [...(byDay.get(day) ?? []), plain(item.title)]);
        }
      }
      for (let ms = Date.UTC(year, 0, 1); ms < Date.UTC(year + 1, 0, 1); ms += DAY) {
        const iso = new Date(ms).toISOString().slice(0, 10);
        const ours = calendar
          .holidaysOn(hdateOf(iso))
          .filter((ev) => !ev.chanukahDay)
          .map((ev) => namer.event(ev));
        assert.deepEqual(ours.sort(), (byDay.get(iso) ?? []).sort(), iso);
      }

      // The Omer: hebcal.com dates day N on the civil day it ends.
      for (const item of items.filter((i) => i.category === 'omer')) {
        assert.equal(calendar.omer(hdateOf(item.date)), Number(item.title_orig.split(' ')[1]));
      }
    });
  }
}

test('the holidays shown in the device read like hebcal.com', () => {
  const calendar = new HouseCalendar({
    latitude: 48.8566,
    longitude: 2.3522,
    ...CITIES.paris,
  });
  assert.equal(holidaysText(calendar.holidaysOn(hdateOf('2026-04-02')), namer), 'Pesach I');
});
