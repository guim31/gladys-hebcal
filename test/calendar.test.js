// -----------------------------------------------------------------------------
// The pieces of the calendar hebcal.com does not show the same way: the
// Hebrew day starting at sunset, Chanukah as a day number, the periods of
// consecutive days, the configuration.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HDate, months } from '@hebcal/core';
import { HouseCalendar, chanukahDay } from '../src/calendar.js';
import { DEFAULT_CONFIG, isIsrael, normalizeConfig } from '../src/config.js';

const paris = new HouseCalendar({
  latitude: 48.8566,
  longitude: 2.3522,
  timeZone: 'Europe/Paris',
  il: false,
  candleMinutes: 18,
  havdalah: 'deg_8_5',
});

test('the Hebrew date changes at sunset, not at midnight', () => {
  // Sunset in Paris on Tuesday 20 October 2026: 18:51 (16:51 UTC).
  assert.equal(paris.hebrewDate(Date.parse('2026-10-20T16:50:00Z')).getDate(), 9);
  assert.equal(paris.hebrewDate(Date.parse('2026-10-20T16:52:00Z')).getDate(), 10);
  assert.equal(paris.hebrewDate(Date.parse('2026-10-20T23:30:00Z')).getDate(), 10);
});

test('Chanukah is shown as the day of the festival (1 to 8), across Tevet', () => {
  assert.equal(chanukahDay(new HDate(24, months.KISLEV, 5787)), 0);
  assert.equal(chanukahDay(new HDate(25, months.KISLEV, 5787)), 1);
  // 5787: Kislev has 30 days, the 8th day is 2 Tevet.
  assert.equal(chanukahDay(new HDate(2, months.TEVET, 5787)), 8);
  assert.equal(chanukahDay(new HDate(3, months.TEVET, 5787)), 0);
});

test('two days of holiday in the diaspora, then Shabbat, form one period', () => {
  // Shavuot 5787: Friday 11 and Saturday 12 June 2027 in the diaspora.
  const period = paris.periodAt(Date.parse('2027-06-11T12:00:00Z'));
  assert.equal(period.kind, 'holiday');
  assert.equal(period.shabbat, true);
  assert.equal(new Date(period.start).toISOString(), '2027-06-10T19:34:00.000Z');
  assert.equal(new Date(period.end).toISOString(), '2027-06-12T21:00:00.000Z');
});

test('the configuration is completed and bounded, Israel guessed from the time zone', () => {
  assert.deepEqual(normalizeConfig(undefined), DEFAULT_CONFIG);
  assert.deepEqual(normalizeConfig(null), DEFAULT_CONFIG);
  const config = normalizeConfig({ candle_minutes: '40', language: 'xx', havdalah: 'min_72' });
  assert.equal(config.candle_minutes, 40);
  assert.equal(config.language, 'fr');
  assert.equal(config.havdalah, 'min_72');
  assert.equal(normalizeConfig({ candle_minutes: 500 }).candle_minutes, 90);
  assert.equal(normalizeConfig({ candle_minutes: '' }).candle_minutes, 18);
  assert.equal(isIsrael(DEFAULT_CONFIG, 'Asia/Jerusalem'), true);
  assert.equal(isIsrael(DEFAULT_CONFIG, 'Europe/Paris'), false);
  assert.equal(isIsrael({ region: 'israel' }, 'Europe/Paris'), true);
  assert.equal(isIsrael({ region: 'diaspora' }, 'Asia/Jerusalem'), false);
});
