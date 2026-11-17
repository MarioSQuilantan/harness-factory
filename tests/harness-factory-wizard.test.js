import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeManifest } from '../scripts/lib/manifest-file.js';
import {
  declaredInstallSkillIds,
  localOnlyInstallSkillIds,
  policyForProjectInstall,
  catalogPickerDomains,
} from '../scripts/lib/install-profiles.js';
import { DOMAINS } from '../scripts/lib/domains.js';
import { writeLocalSkill } from './helpers/local-skill-fixture.js';
import { listCatalogSkillIds } from '../scripts/lib/catalog-registry.js';
import { DEFAULT_SKILL_FLOOR } from '../scripts/lib/default-skill-floor.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

const root = () => mkdtempSync(join(tmpdir(), 'hf-wizard-'));

test('declared install ids union local skills and catalog opt-in only', () => {
  const cwd = root();
  writeLocalSkill(cwd, 'my-skill');
  writeManifest(cwd, {
    targets: ['cursor'],
    skills: ['my-skill', 'vitest', 'phantom'],
    ownSkills: [],
    catalog: { provider: 'autoskills', selected: ['vitest'], dismissed: [] },
    skillsPolicy: 'byo-first',
  });
  assert.deepEqual(declaredInstallSkillIds(cwd), [...DEFAULT_SKILL_FLOOR, 'my-skill', 'vitest']);
});

test('local-only profile ignores catalog selections', () => {
  const cwd = root();
  writeLocalSkill(cwd, 'alpha');
  writeManifest(cwd, {
    targets: ['cursor'],
    skills: ['alpha', 'vitest'],
    catalog: { provider: 'autoskills', selected: ['vitest'], dismissed: [] },
  });
  assert.deepEqual(localOnlyInstallSkillIds(cwd), [...DEFAULT_SKILL_FLOOR, 'alpha']);
});

test('policyForProjectInstall preserves onboarding receipt policy', () => {
  const cwd = root();
  writeManifest(cwd, {
    targets: ['codex'],
    skills: [],
    onboarding: {
      schemaVersion: 1,
      acceptedPlanId: 'x',
      plan: {
        policy: {
          skills: [],
          targets: ['codex'],
          baseAgents: true,
          agents: ['developer'],
          alwaysOn: true,
          codeHooks: true,
          gitmojiGuard: false,
          dangerGuard: true,
          laneGate: true,
          memory: true,
          context7: false,
        },
      },
    },
  });
  const p = policyForProjectInstall(cwd);
  assert.equal(p.baseAgents, true);
  assert.deepEqual(p.agents, ['developer']);
  assert.equal(p.codeHooks, true);
});

test('catalog picker domains only list registry ids', () => {
  const picked = catalogPickerDomains(DOMAINS);
  const all = new Set(listCatalogSkillIds());
  for (const d of picked) {
    for (const id of d.ids) assert.ok(all.has(id), `${id} in ${d.title}`);
  }
  assert.ok(picked.length > 0);
});

test('wizard no longer offers legacy minimal/core profile installs', () => {
  const src = readFileSync(join(REPO, 'scripts', 'harness-factory.js'), 'utf8');
  assert.doesNotMatch(src, /skillsForProfile\(m, 'minimal'\)/);
  assert.doesNotMatch(src, /skillsForProfile\(m, 'core'\)/);
  assert.match(src, /declaredInstallSkillIds/);
  assert.match(src, /catalogPickerDomains/);
});