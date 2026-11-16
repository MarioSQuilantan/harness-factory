import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configureInstallLog, isInstallVerbose, reportInstallFailure } from '../scripts/lib/install-log.js';

test('verbose mode follows configureInstallLog', () => {
  configureInstallLog({ verbose: true });
  assert.equal(isInstallVerbose(), true);
  configureInstallLog({ verbose: false });
  assert.equal(isInstallVerbose(), false);
});

test('reportInstallFailure does not throw', () => {
  const err = new Error('skill missing');
  err.cause = new Error('registry timeout');
  assert.doesNotThrow(() => reportInstallFailure('test phase', err));
});