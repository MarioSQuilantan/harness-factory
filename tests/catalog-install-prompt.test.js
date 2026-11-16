import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { newCatalogSuggestions } from '../scripts/lib/catalog-install-prompt.js';
import { addCatalogSelection } from '../scripts/lib/catalog-manifest.js';
import { writeManifest } from '../scripts/lib/manifest-file.js';

test('newCatalogSuggestions excludes already opted-in skills', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hf-catalog-prompt-'));
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { vitest: '1' } }));
  const before = newCatalogSuggestions(cwd);
  assert.ok(Array.isArray(before));
  if (!before.some((r) => r.id === 'vitest')) return;
  writeManifest(cwd, {
    targets: ['cursor'],
    skills: ['vitest'],
    catalog: { provider: 'autoskills', selected: ['vitest'], dismissed: [] },
  });
  const after = newCatalogSuggestions(cwd);
  assert.ok(!after.some((r) => r.id === 'vitest'));
});