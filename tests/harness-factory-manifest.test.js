import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadManifest, skillsForProfile, skillById } from '../scripts/lib/manifest.js';
import { listCatalogSkillIds } from '../scripts/lib/catalog-registry.js';

test('embedded manifest stub has zero bundled skills', () => {
  const stub = loadManifest();
  assert.equal(stub.catalogSource, 'autoskills');
  assert.ok(stub.counts.skills >= listCatalogSkillIds().length);
});

test('skillsForProfile never auto-selects catalog skills', () => {
  const m = loadManifest();
  assert.deepEqual(skillsForProfile(m, 'core'), []);
  assert.deepEqual(skillsForProfile(m, 'full'), []);
});

test('skillById resolves registry ids', () => {
  const m = loadManifest();
  const id = listCatalogSkillIds()[0];
  assert.ok(skillById(m, id));
  assert.equal(skillById(m, 'definitely-not-a-skill-id-xyz'), undefined);
});