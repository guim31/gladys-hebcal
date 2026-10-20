// -----------------------------------------------------------------------------
// Small JSON files in /data, the only writable place of the container: the
// school calendar read from the ministry, and the last scene-trigger hour
// fired. Best effort: a read or write failure is logged, never thrown.
//
// Locally, HEBCAL_DATA_DIR points the store at any folder (the `.gitignore`
// keeps a root `data/` folder out of the repository).
// -----------------------------------------------------------------------------

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createLogger } from '@gladysassistant/integration-sdk';
import { createFailureLog } from './failures.js';

const logger = createLogger({ name: 'store' });

export function defaultDataDir() {
  return process.env.HEBCAL_DATA_DIR || '/data';
}

export function createStore(dir = defaultDataDir()) {
  // scheduler.json is written every hour: an unwritable /data warns once.
  const failures = createFailureLog(logger);
  return {
    dir,
    load(name) {
      try {
        const value = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
        failures.succeeded(`read:${name}`, `${name} read again`);
        return value;
      } catch (err) {
        if (err.code !== 'ENOENT') {
          failures.failed(`read:${name}`, `Could not read ${name}: ${err.message}`);
        }
        return null;
      }
    },
    save(name, value) {
      try {
        mkdirSync(dir, { recursive: true });
        // Write then rename: a crash mid-write never leaves half a file.
        const file = path.join(dir, name);
        writeFileSync(`${file}.tmp`, JSON.stringify(value));
        renameSync(`${file}.tmp`, file);
        failures.succeeded(`write:${name}`, `${name} written again`);
      } catch (err) {
        failures.failed(`write:${name}`, `Could not write ${name}: ${err.message}`);
      }
    },
  };
}
