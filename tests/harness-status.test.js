import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { collectHarnessStatus, renderStatusHtml, writeStatusPage, revealStatusOnce } from '../scripts/lib/harness-status.js';

test('status page reports an empty project without throwing', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hf-status-'));
  try {
    const snap = collectHarnessStatus(cwd, { targets: [] });
    assert.equal(snap.installed, false);
    assert.equal(snap.health, 'not installed');
    const file = writeStatusPage(cwd, renderStatusHtml(snap));
    const html = readFileSync(file, 'utf8');
    assert.match(html, /Harness status/);
    assert.match(html, /not installed/);
    assert.match(html, /flagged/);
    const first = revealStatusOnce(cwd, { targets: [], open: false });
    const second = revealStatusOnce(cwd, { targets: [], open: false });
    assert.equal(first.opened, true);
    assert.equal(second.opened, false);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
