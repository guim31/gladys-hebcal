// -----------------------------------------------------------------------------
// Registers every SDK handler on a GladysIntegration (or the SDK's fake Gladys
// in the tests) and returns the service, so index.js stays a few lines and the
// tests drive the very same wiring.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { normalizeConfig } from './config.js';
import { INIT_FAILED } from './i18n.js';
import { SCENE_ACTIONS } from './scenes.js';
import { HebcalService } from './service.js';
import { createStore } from './store.js';
import { WIDGETS } from './widgets.js';

const logger = createLogger({ name: 'hebcal-app' });

/**
 * @param {object} gladys GladysIntegration instance
 * @param {object} [options] test seams: store, now, timeZone, timers
 */
export function registerHandlers(gladys, options = {}) {
  const service = new HebcalService({
    gladys,
    store: options.store ?? createStore(),
    now: options.now,
    timeZone: options.timeZone,
    timers: options.timers ?? true,
  });

  // Resolved once the service has started; every handler waits for it.
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  let started = false;
  const whenReady =
    (fn) =>
    async (...args) => {
      await ready;
      return fn(...args);
    };

  gladys.on('connected', async () => {
    try {
      const config = normalizeConfig(await gladys.getConfig());
      if (started) {
        await service.resync(config);
        return;
      }
      started = true;
      await service.start(config);
    } catch (err) {
      logger.error('Initialization failed', err);
      await gladys.setConnectionStatus(false, INIT_FAILED).catch(() => {});
    } finally {
      resolveReady();
    }
  });

  gladys.onScanRequest(whenReady(() => service.publishDevice()));

  gladys.onDeviceCreated(whenReady(() => service.deviceCreated()));

  // Fallback only: the device is published with should_poll: false. A poll
  // forced from the device page republishes everything.
  gladys.onPoll(whenReady(() => service.deviceCreated()));

  gladys.onSetValue(async (device, feature) => {
    throw new Error(`The Hebrew calendar is read-only (${feature.external_id})`);
  });

  gladys.onConfigUpdated(whenReady((config) => service.reconfigure(normalizeConfig(config))));

  for (const [key, handler] of Object.entries(SCENE_ACTIONS)) {
    gladys.onSceneAction(
      key,
      whenReady((fields) => handler(service, { fields })),
    );
  }

  for (const [key, widget] of Object.entries(WIDGETS)) {
    gladys.onWidgetGet(
      key,
      whenReady((request) => widget.get(service, request)),
    );
  }

  return { service, ready, stop: () => service.stop() };
}
