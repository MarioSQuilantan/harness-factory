import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { removeCatalogSelection } from '../scripts/lib/catalog-manifest.js';
import { writeManifest, readManifest } from '../scripts/lib/manifest-file.js';

test('removeCatalogSelection drops opt-in ids from manifest', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hf-uninstall-'));
  writeManifest(cwd, {
    targets: ['cursor'],
    skills: ['vitest', 'local-only'],
    catalog: { provider: 'autoskills', selected: ['vitest', 'next'], dismissed: [] },
  });
  removeCatalogSelection(cwd, ['vitest']);
  const m = readManifest(cwd);
  assert.deepEqual(m.catalog.selected, ['next']);
  assert.deepEqual(m.skills, ['local-only']);
});