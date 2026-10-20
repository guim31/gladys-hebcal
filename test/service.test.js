// -----------------------------------------------------------------------------
// The service on its clock, against the SDK's fake Gladys: the device states
// at the moments that matter (sunset, candle lighting, havdalah), the scene
// events fired once and only once, a restart, a house without coordinates.
// Paris, diaspora, 18 minutes, 8.5° (hebcal.com: candle lighting on Friday
// 23 October 2026 at 18:27, havdalah on Saturday at 19:32).
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NO_LOCATION } from '../src/i18n.js';
import { HOUSES, createMemoryStore, createWorld } from './helpers/world.js';

const minutesOf = (events) => events.map((e) => e.data.minutes_before);

test('a weekday: the date, the next times and the portion, nothing under way', async () => {
  const world = await createWorld({ at: '2026-10-20T10:00:00Z' });
  assert.equal(world.state('hebrew_date'), "9 'Hechvan 5787");
  assert.equal(world.state('holiday'), 'Aucun(e)');
  assert.equal(world.state('holy_day'), 0);
  assert.equal(world.state('holy_day_tomorrow'), 0);
  assert.equal(world.state('next_candle_lighting'), 'ven. 23 oct., 18:27');
  assert.equal(world.state('next_havdalah'), 'sam. 24 oct., 19:32');
  assert.equal(world.state('parsha'), 'Lech-Lecha');
  assert.equal(world.state('omer'), 0);
  assert.equal(world.state('days_to_holiday'), 184); // Pesach I, Thursday 22 April 2027
  assert.deepEqual(world.gladys.fake.connectionStatus, { connected: true });
});

test('Friday: reminders before candle lighting, then Shabbat begins, once', async () => {
  const world = await createWorld({ at: '2026-10-23T12:00:00Z' });
  assert.equal(world.state('holy_day_tomorrow'), 1);
  await world.runUntil('2026-10-23T16:26:40Z');
  assert.deepEqual(minutesOf(world.events('candle_lighting')), [120, 60, 30, 15, 10]);
  assert.equal(world.state('holy_day'), 0);

  await world.runUntil('2026-10-23T16:40:00Z');
  const candles = world.events('candle_lighting');
  assert.deepEqual(minutesOf(candles), [120, 60, 30, 15, 10, 0]);
  assert.deepEqual(candles.at(-1).data, {
    minutes_before: 0,
    kind: 'shabbat',
    name: 'Chabbat',
    time: '2026-10-23T16:27:00.000Z',
    local_time: '18:27',
  });
  assert.deepEqual(world.events('holy_day_start'), [
    {
      key: 'holy_day_start',
      data: {
        kind: 'shabbat',
        name: 'Chabbat',
        includes_shabbat: true,
        end_time: '2026-10-24T17:32:00.000Z',
        end_local_time: 'sam. 24 oct., 19:32',
      },
    },
  ]);
  assert.equal(world.state('holy_day'), 1);
  // Sunset (18:45): the Hebrew day of Shabbat starts.
  await world.runUntil('2026-10-23T16:50:00Z');
  assert.equal(world.state('hebrew_date'), "13 'Hechvan 5787");
  assert.equal(world.state('next_candle_lighting'), 'ven. 30 oct., 17:15');

  // Havdalah: Shabbat ends, once.
  await world.runUntil('2026-10-24T17:40:00Z');
  assert.deepEqual(world.events('holy_day_end'), [
    { key: 'holy_day_end', data: { kind: 'shabbat', name: 'Chabbat', includes_shabbat: true } },
  ]);
  assert.equal(world.state('holy_day'), 0);
  assert.equal(world.state('parsha'), 'Vayera');
  assert.equal(world.events('holy_day_start').length, 1);
});

test('a restart neither replays an event nor loses one due a few minutes ago', async () => {
  const store = createMemoryStore();
  const first = await createWorld({ at: '2026-10-23T16:20:00Z', store });
  await first.runUntil('2026-10-23T16:28:00Z');
  first.app.stop();
  const fired = first.gladys.fake.sceneEvents.length;
  assert.ok(fired >= 3);

  const second = await createWorld({ at: '2026-10-23T16:29:00Z', store });
  await second.runUntil('2026-10-23T16:35:00Z');
  assert.deepEqual(second.gladys.fake.sceneEvents, []);

  // A container down from 16:00 to 16:35: what was due in the last 15
  // minutes is fired, the older reminders are not.
  const late = await createWorld({ at: '2026-10-23T16:35:00Z' });
  assert.deepEqual(minutesOf(late.events('candle_lighting')), [0]);
  assert.equal(late.events('holy_day_start').length, 1);
});

test('Rosh Hashana then Shabbat: one period, one start, one end, three candle lightings', async () => {
  // Erev Rosh Hashana 5787 is Friday 11 September 2026: Rosh Hashana I on
  // Shabbat, II on Sunday, havdalah on Sunday night.
  const world = await createWorld({ at: '2026-09-11T08:00:00Z' });
  await world.runUntil('2026-09-13T20:00:00Z');
  const starts = world.events('holy_day_start');
  assert.equal(starts.length, 1);
  assert.equal(starts[0].data.kind, 'holiday');
  assert.equal(starts[0].data.name, 'Roch Hachana 5787');
  assert.equal(starts[0].data.includes_shabbat, true);
  const zero = world.events('candle_lighting').filter((e) => e.data.minutes_before === 0);
  assert.equal(zero.length, 2); // Friday before sunset, Saturday after nightfall
  assert.equal(zero[1].data.kind, 'holiday');
  assert.equal(world.events('holy_day_end').length, 1);
  assert.equal(world.state('holy_day'), 0);
});

test('Israel is chosen from the time zone of Gladys: one day of holiday', async () => {
  const world = await createWorld({
    at: '2027-04-22T08:00:00Z',
    houses: [HOUSES.jerusalem],
    timeZone: 'Asia/Jerusalem',
    config: { language: 'en', names: 'sephardic', candle_minutes: 40 },
  });
  // 15 Nisan 5787 is Thursday 22 April 2027; in Israel the 16th is Chol HaMoed.
  assert.equal(world.state('holiday'), 'Pesach I');
  assert.equal(world.state('holy_day'), 1);
  assert.equal(world.state('holy_day_tomorrow'), 0);
  await world.runUntil('2027-04-22T18:00:00Z');
  assert.equal(world.state('holiday'), "Pesach II (CH''M)");
  assert.equal(world.state('omer'), 1);
});

test('without a located house: a clear status, then the calendar once it is set', async () => {
  const world = await createWorld({
    houses: [{ name: 'Maison', latitude: null, longitude: null }],
  });
  assert.deepEqual(world.gladys.fake.connectionStatus, { connected: false, message: NO_LOCATION });
  assert.equal(world.state('hebrew_date'), undefined);
  assert.equal(world.gladys.fake.discoveredDevices.length, 1, 'the device can be added already');
  const widget = await world.gladys.fake.widgetGet('hebrew_calendar', { language: 'en' });
  assert.equal(widget.data.content.components[0].text, 'Waiting for the coordinates of the house.');

  world.gladys.fake.houses = [HOUSES.paris];
  await world.runUntil('2026-10-20T10:09:00Z');
  assert.equal(world.state('hebrew_date'), undefined, 'retried every 10 minutes');
  await world.runUntil('2026-10-20T10:10:20Z');
  assert.equal(world.state('hebrew_date'), "9 'Hechvan 5787");
  assert.deepEqual(world.gladys.fake.connectionStatus, { connected: true });
});

test('a device just created gets every value again, and the widget is refreshed', async () => {
  const world = await createWorld();
  const before = world.gladys.fake.states.length;
  const refreshes = world.gladys.fake.widgetRefreshes.length;
  await world.gladys.fake.deviceCreated(world.gladys.fake.discoveredDevices[0]);
  assert.equal(world.gladys.fake.states.length - before, 9);
  assert.ok(world.gladys.fake.widgetRefreshes.length > refreshes);
  // A normal tick publishes nothing new.
  const after = world.gladys.fake.states.length;
  await world.service.tick();
  assert.equal(world.gladys.fake.states.length, after);
});

test('a new configuration renames the device and changes the texts', async () => {
  const world = await createWorld();
  await world.gladys.fake.configUpdated({ language: 'de', names: 'hebrew' });
  const [device] = world.gladys.fake.discoveredDevices;
  assert.equal(device.name, 'Jüdischer Kalender');
  assert.equal(world.state('hebrew_date'), 'ט׳ חשון תשפ״ז');
  assert.equal(world.state('next_candle_lighting'), 'Fr., 23. Okt., 18:27');
});

test('values are read-only', async () => {
  const world = await createWorld();
  const [device] = world.gladys.fake.discoveredDevices;
  const ack = await world.gladys.fake.setValue(device, device.features[2], 1);
  assert.equal(ack.success, false);
});

test('a failed read of the houses keeps the calendar, and is retried at the next tick', async () => {
  const world = await createWorld({ at: '2026-10-23T12:00:00Z' });
  const getHouses = world.gladys.getHouses;
  world.gladys.getHouses = async () => {
    throw new Error('connect ECONNREFUSED');
  };
  await world.gladys.disconnect();
  await world.gladys.connect();
  assert.ok(world.service.calendar, 'the known house is kept');
  assert.deepEqual(world.gladys.fake.connectionStatus, { connected: true });

  // Without any house known yet: retried at the next tick, not in 10 minutes.
  const fresh = await createWorld({ connect: false });
  fresh.gladys.getHouses = async () => {
    throw new Error('connect ECONNREFUSED');
  };
  await fresh.gladys.connect();
  assert.equal(fresh.service.calendar, null);
  fresh.gladys.getHouses = getHouses;
  await fresh.runUntil('2026-10-20T10:00:20Z');
  assert.ok(fresh.service.calendar);
});

test('a new candle lighting time does not fire the same reminders again', async () => {
  const world = await createWorld({ at: '2026-10-23T16:00:00Z' });
  await world.runUntil('2026-10-23T16:20:00Z');
  const before = world.events('candle_lighting').length;
  await world.gladys.fake.configUpdated({ candle_minutes: 15 });
  await world.runUntil('2026-10-23T16:25:00Z');
  assert.equal(world.events('candle_lighting').length, before);
});
