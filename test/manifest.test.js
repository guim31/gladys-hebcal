// -----------------------------------------------------------------------------
// Consistency checks between `gladys-assistant-integration.json` and the code.
// The manifest is validated by the store indexer, but nothing there can know
// which handlers the code actually registers — these tests keep both in sync.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DEFAULT_CONFIG,
  HAVDALAH_METHODS,
  LANGUAGES,
  NAME_STYLES,
  REGIONS,
  CANDLE_MINUTES,
} from '../src/config.js';
import { SCENE_ACTIONS } from '../src/scenes.js';
import { CANDLE_OFFSETS, TRIGGERS, WIDGET_KEY } from '../src/service.js';
import { WIDGETS } from '../src/widgets.js';
import { createWorld } from './helpers/world.js';

const manifest = JSON.parse(
  await readFile(new URL('../gladys-assistant-integration.json', import.meta.url), 'utf8'),
);
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

// Every list of form fields the manifest can declare (same field grammar).
const allFields = [
  ...(manifest.config_schema ?? []),
  ...[
    ...(manifest.actions ?? []),
    ...(manifest.scene_triggers ?? []),
    ...(manifest.scene_actions ?? []),
  ].flatMap((item) => item.fields ?? []),
  ...(manifest.widgets ?? []).flatMap((widget) => widget.settings ?? []),
];

// The handlers the integration actually registers on the SDK.
const registered = await createWorld({ connect: false });
const handlerKeys = (prefix) =>
  Object.keys(registered.gladys.handlers)
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length));

const keysOf = (list) => (list ?? []).map((entry) => entry.key);

function minGladysVersion() {
  const match = manifest.gladys_version.match(/>=\s*(\d+)\.(\d+)\.(\d+)/);
  assert.ok(match, 'gladys_version must declare a minimum version');
  return match.slice(1).map(Number);
}

function isAtLeast(version, required) {
  for (let i = 0; i < required.length; i += 1) {
    if (version[i] !== required[i]) {
      return version[i] > required[i];
    }
  }
  return true;
}

test('identity: name, image, cover, transports, category, location', () => {
  assert.equal(manifest.name, 'Hebrew Calendar');
  assert.equal(manifest.type, 'device');
  assert.match(manifest.docker_image, /^ghcr\.io\/guim31\/gladys-hebcal:/);
  assert.equal(
    manifest.cover_image,
    'https://raw.githubusercontent.com/guim31/gladys-hebcal/main/cover.png',
  );
  // Computed in the container: no network at all.
  assert.deepEqual(manifest.transports, ['local']);
  assert.deepEqual(manifest.categories, ['services']);
  // getHouses() needs it.
  assert.equal(manifest.location, true);
});

test('no configuration action: nothing to check or to fire by hand', () => {
  assert.equal(manifest.actions, undefined);
  assert.deepEqual(handlerKeys('action:'), []);
});

test('every scene action has a handler, and returns the declared outputs', async (t) => {
  assert.deepEqual(keysOf(manifest.scene_actions), Object.keys(SCENE_ACTIONS));
  assert.deepEqual(handlerKeys('sceneAction:'), Object.keys(SCENE_ACTIONS));
  const world = await createWorld({ at: '2026-10-23T10:00:00Z' });
  t.after(() => world.app.stop());
  for (const action of manifest.scene_actions) {
    for (const fields of [{}, { day: 'today' }, { day: 'tomorrow' }]) {
      const ack = await world.gladys.fake.sceneAction(action.key, fields);
      assert.equal(ack.success, true);
      assert.deepEqual(Object.keys(ack.data.outputs).sort(), keysOf(action.outputs).sort());
      for (const output of action.outputs) {
        assert.equal(typeof ack.data.outputs[output.key], output.type, output.key);
      }
    }
  }
});

test('the scene triggers fired are the declared ones, with their filters and variables', async (t) => {
  assert.deepEqual(keysOf(manifest.scene_triggers).sort(), Object.values(TRIGGERS).sort());
  const world = await createWorld({ at: '2026-10-23T14:00:00Z' });
  t.after(() => world.app.stop());
  await world.runUntil('2026-10-23T16:30:00Z');
  world.clock.set('2026-10-24T17:30:00Z');
  await world.runUntil('2026-10-24T17:34:00Z');
  const fired = new Map(world.gladys.fake.sceneEvents.map((event) => [event.key, event.data]));
  assert.deepEqual([...fired.keys()].sort(), Object.values(TRIGGERS).sort());
  for (const trigger of manifest.scene_triggers) {
    const data = fired.get(trigger.key);
    // Filters match keys of `data`, variables read keys of `data`.
    for (const key of [...keysOf(trigger.fields), ...keysOf(trigger.variables)]) {
      assert.ok(key in data, `${trigger.key}: "${key}" is in the event data`);
    }
    for (const variable of trigger.variables) {
      assert.equal(typeof data[variable.key], variable.type, `${trigger.key}.${variable.key}`);
    }
    const kind = trigger.fields.find((f) => f.key === 'kind');
    assert.deepEqual(
      kind.options.map((o) => o.value),
      ['shabbat', 'holiday'],
    );
  }
  // "Minutes before": one event per option, so the filter is required.
  const minutes = manifest.scene_triggers[0].fields[0];
  assert.equal(minutes.key, 'minutes_before');
  assert.equal(minutes.required, true);
  assert.deepEqual(
    minutes.options.map((o) => Number(o.value)),
    CANDLE_OFFSETS,
  );
});

test('every widget has a handler, and its settings match the code', () => {
  assert.deepEqual(keysOf(manifest.widgets), [WIDGET_KEY]);
  assert.deepEqual(Object.keys(WIDGETS), [WIDGET_KEY]);
  assert.deepEqual(handlerKeys('widget:'), [WIDGET_KEY]);
  assert.deepEqual(keysOf(manifest.widgets[0].settings), ['show_zmanim']);
});

test('config_schema defaults and options stay consistent with the code', () => {
  const field = (key) => manifest.config_schema.find((entry) => entry.key === key);
  const optionValues = (key) => field(key).options.map((option) => option.value);
  for (const entry of manifest.config_schema) {
    if (entry.default !== undefined) {
      assert.deepEqual(DEFAULT_CONFIG[entry.key], entry.default, `DEFAULT_CONFIG.${entry.key}`);
    }
  }
  assert.deepEqual(
    Object.keys(DEFAULT_CONFIG).sort(),
    manifest.config_schema
      .filter((entry) => entry.type !== 'section')
      .map((entry) => entry.key)
      .sort(),
  );
  assert.deepEqual(optionValues('language').sort(), [...LANGUAGES].sort());
  assert.deepEqual(optionValues('names'), NAME_STYLES);
  assert.deepEqual(optionValues('region'), REGIONS);
  assert.deepEqual(optionValues('havdalah'), Object.keys(HAVDALAH_METHODS));
  assert.equal(field('candle_minutes').min, CANDLE_MINUTES.min);
  assert.equal(field('candle_minutes').max, CANDLE_MINUTES.max);
});

test('scene triggers, scene actions and widgets require Gladys >= 5.1.0', () => {
  assert.ok(isAtLeast(minGladysVersion(), [5, 1, 0]), manifest.gladys_version);
});

test('the manifest stays well under the 100 KB the store indexer reads', async () => {
  const bytes = (await readFile(new URL('../gladys-assistant-integration.json', import.meta.url)))
    .length;
  assert.ok(bytes < 80 * 1024, `${bytes} bytes`);
});

test('section fields are purely presentational', () => {
  const sections = manifest.config_schema.filter((entry) => entry.type === 'section');
  assert.ok(sections.length > 0);
  for (const section of sections) {
    assert.equal(section.required, undefined);
    assert.equal(section.default, undefined);
    assert.ok(!(section.key in DEFAULT_CONFIG));
    for (const link of section.links ?? []) {
      assert.match(link.url, /^https:\/\//);
    }
  }
});

test('number fields have integer bounds and defaults (the form has no step)', () => {
  for (const entry of allFields.filter((f) => f.type === 'number')) {
    for (const key of ['min', 'max', 'default']) {
      if (entry[key] !== undefined) {
        assert.ok(Number.isInteger(entry[key]), `field "${entry.key}".${key}`);
      }
    }
  }
});

test('no secret field anywhere: nothing here is secret', () => {
  assert.ok(allFields.every((entry) => entry.type !== 'secret'));
});

test('the manifest version is the package version, and the image is tagged with it', () => {
  assert.equal(manifest.version, pkg.version);
  assert.ok(manifest.docker_image.endsWith(`:${manifest.version}`));
});

test('the catalog description holds 10 to 100 characters per language', () => {
  for (const [lang, text] of Object.entries(manifest.description)) {
    assert.ok(text.length >= 10 && text.length <= 100, `description.${lang}: ${text.length}`);
  }
});
