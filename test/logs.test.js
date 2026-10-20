// -----------------------------------------------------------------------------
// The integration runs on its own clock (Gladys never polls the calendar
// device), and its logs stay quiet: nothing at info on a normal tick.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from './helpers/world.js';

/** Captures the lines of the SDK logger (console.log / console.error). */
function captureLogs(t) {
  const previous = process.env.LOG_LEVEL;
  delete process.env.LOG_LEVEL; // the default level: info
  t.after(() => {
    if (previous !== undefined) {
      process.env.LOG_LEVEL = previous;
    }
  });
  const lines = [];
  const keep = (prefix, ...args) => lines.push([prefix, ...args].map(String).join(' '));
  t.mock.method(console, 'log', keep);
  t.mock.method(console, 'error', keep);
  return { lines, at: (level) => lines.filter((line) => line.includes(`[${level}]`)) };
}

const flush = async () => {
  for (let i = 0; i < 20; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};

test('the device is never polled: its own timer switches Shabbat on', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'], now: Date.parse('2026-10-23T16:25:00Z') });
  const world = await createWorld({ timers: true });
  t.after(() => world.app.stop());
  const [device] = world.gladys.fake.discoveredDevices;
  assert.equal(device.should_poll, false);
  assert.equal(device.poll_frequency, undefined);
  assert.equal(world.state('holy_day'), 0);
  for (let i = 0; i < 9; i += 1) {
    t.mock.timers.tick(20_000);
    await flush();
  }
  assert.equal(world.state('holy_day'), 1);
  assert.ok(world.events('holy_day_start').length === 1);
});

test('a normal tick, states and scene events included, writes nothing at info', async (t) => {
  const world = await createWorld({ at: '2026-10-23T16:00:00Z' });
  const logs = captureLogs(t);
  await world.runUntil('2026-10-23T17:00:00Z');
  assert.ok(world.gladys.fake.sceneEvents.length > 0);
  assert.deepEqual(logs.at('INFO'), []);
  assert.deepEqual(logs.at('WARN'), []);
});

test('a failure repeated at every tick is logged once, then its end once', async (t) => {
  const world = await createWorld({ at: '2026-10-23T16:00:00Z' });
  const logs = captureLogs(t);
  const publish = world.gladys.publishChangedStates;
  world.gladys.publishChangedStates = async () => {
    throw new Error('connect ECONNREFUSED');
  };
  world.gladys.forgetPublishedStates();
  for (let i = 0; i < 5; i += 1) {
    await world.service.deviceCreated();
  }
  world.gladys.publishChangedStates = publish;
  await world.service.tick();
  assert.equal(logs.at('WARN').length, 1);
  assert.equal(logs.at('INFO').length, 1);
});
