import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeManifest, readManifest } from '../scripts/lib/manifest-file.js';
import {
  classifyRequestedSkillIds,
  catalogOptInRequired,
} from '../scripts/lib/skill-resolution.js';
import { recommendForProject } from '../scripts/lib/consult-recommend.js';
import { addCatalogSelection } from '../scripts/lib/catalog-manifest.js';
import { catalogSkillKnown } from '../scripts/lib/catalog-registry.js';
import { writeLocalSkill } from './helpers/local-skill-fixture.js';

const root = () => mkdtempSync(join(tmpdir(), 'hf-add-consult-'));

test('classify accepts registry and local skills', () => {
  const cwd = root();
  writeLocalSkill(cwd, 'mine');
  const sample = catalogSkillKnown('vitest') ? 'vitest' : 'frontend-design';
  const out = classifyRequestedSkillIds([sample, 'mine', 'not-a-real-skill-zzz'], cwd);
  assert.ok(out.skills.includes(sample));
  assert.ok(out.skills.includes('mine'));
  assert.deepEqual(out.unknown, ['not-a-real-skill-zzz']);
});

test('catalogOptInRequired lists registry ids not yet selected', () => {
  const cwd = root();
  if (!catalogSkillKnown('vitest')) return;
  writeManifest(cwd, {
    targets: ['cursor'],
    skills: [],
    catalog: { provider: 'autoskills', selected: [], dismissed: [] },
  });
  assert.deepEqual(catalogOptInRequired(['vitest'], cwd), ['vitest']);
  addCatalogSelection(cwd, ['vitest']);
  assert.deepEqual(catalogOptInRequired(['vitest'], cwd), []);
  assert.ok((readManifest(cwd).catalog.selected || []).includes('vitest'));
});

test('consult ranks postgres intent toward prisma registry skills', async () => {
  const cwd = root();
  writeFileSync(join(cwd, 'package.json'), '{"name":"x"}');
  const ids = await recommendForProject('guardar datos en postgres', cwd);
  assert.ok(
    ids.some((id) => /prisma|postgres/.test(id)),
    `expected database-related registry id, got ${ids.join(', ')}`,
  );
});

test('consult blends stack suggestions from repo', async () => {
  const cwd = root();
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { vitest: '1' } }));
  const ids = await recommendForProject('', cwd);
  assert.ok(ids.length > 0);
});