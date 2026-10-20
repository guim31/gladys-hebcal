// -----------------------------------------------------------------------------
// The widget fits the vocabulary and the budget of the core
// (validateWidgetContent), in every language, at the moments where it shows
// the most: Shabbat, a holiday with the Omer, Chanukah with Rosh Chodesh.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWidgetContent } from '@gladysassistant/integration-sdk';
import { HOUSES, createWorld } from './helpers/world.js';

const MOMENTS = [
  { label: 'Shabbat in Paris', at: '2026-10-24T10:00:00Z' },
  {
    label: 'Pesach and the Omer in New York, Ashkenazi',
    at: '2027-04-24T14:00:00Z',
    houses: [HOUSES.newYork],
    timeZone: 'America/New_York',
    config: { names: 'ashkenazi' },
  },
  { label: 'Chanukah and Rosh Chodesh in Paris', at: '2026-12-10T10:00:00Z' },
  {
    label: 'Jerusalem, Hebrew script',
    at: '2026-12-10T10:00:00Z',
    houses: [HOUSES.jerusalem],
    timeZone: 'Asia/Jerusalem',
    config: { names: 'hebrew' },
  },
];

for (const moment of MOMENTS) {
  test(`the widget fits the core's vocabulary (${moment.label})`, async () => {
    const world = await createWorld(moment);
    for (const language of ['en', 'fr', 'de', 'es']) {
      for (const settings of [{}, { show_zmanim: false }]) {
        const ack = await world.gladys.fake.widgetGet('hebrew_calendar', { settings, language });
        const content = ack.data.content;
        assert.deepEqual(validateWidgetContent(content), [], `${language}`);
        for (const tile of content.components.filter((c) => c.type === 'value')) {
          assert.ok(String(tile.value).length <= 12, `${language}: "${tile.value}"`);
        }
        const status = content.components.find((c) => c.type === 'status');
        assert.ok(status.items.length <= 10);
      }
    }
  });
}

test('the widget in French on Shabbat', async () => {
  const world = await createWorld({ at: '2026-10-24T10:00:00Z' });
  const ack = await world.gladys.fake.widgetGet('hebrew_calendar', {
    settings: { show_zmanim: false },
    language: 'fr',
  });
  assert.deepEqual(ack.data.content.components, [
    { type: 'text', variant: 'heading', text: "13 'Hechvan 5787" },
    { type: 'text', variant: 'caption', text: "Chabbat jusqu'à sam. 19:32" },
    { type: 'value', label: 'Allumage', value: 'ven. 17:15', icon: 'sunset' },
    { type: 'value', label: 'Havdala', value: 'sam. 19:32', icon: 'moon' },
    {
      type: 'status',
      items: [
        { label: 'Paracha', value: 'Lech-Lecha', icon: 'book-open' },
        { label: 'Prochaine fête', value: "Pessa'h I, dans 180 j", icon: 'calendar' },
      ],
    },
  ]);
});

test('the day information action answers for tomorrow, Shabbat', async () => {
  const world = await createWorld({ at: '2026-10-23T08:00:00Z' });
  const ack = await world.gladys.fake.sceneAction('day_info', { day: 'tomorrow' });
  assert.deepEqual(ack.data.outputs, {
    date: '2026-10-24',
    hebrew_date: "13 'Hechvan 5787",
    holiday: '',
    is_holy_day: 1,
    candle_lighting: '',
    havdalah: '19:32',
    parsha: 'Lech-Lecha',
    omer: 0,
    sunrise: '08:25',
    latest_shema: '10:59',
    sunset: '18:44',
    nightfall: '19:32',
  });
  const today = await world.gladys.fake.sceneAction('day_info', {});
  assert.equal(today.data.outputs.is_holy_day, 0, 'Friday daytime is not Shabbat');
  assert.equal(today.data.outputs.candle_lighting, '18:27');
});
