import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadRegistryMeta, listCatalogSkillIds, catalogSkillKnown } from '../scripts/lib/catalog-registry.js';
import { skillsForProfile } from '../scripts/lib/manifest.js';
import { detectLocalSkills } from '../scripts/lib/local-skills.js';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('harness-factory catalog', () => {
  it('loads autoskills registry metadata', () => {
    const meta = loadRegistryMeta();
    assert.equal(meta.provider, 'autoskills');
    assert.ok(meta.skillCount > 0);
  });

  it('does not auto-select profile skills', () => {
    const ids = skillsForProfile({ skills: [{ id: 'x', profiles: ['core'] }] }, 'core');
    assert.deepEqual(ids, []);
  });

  it('detects local BYO skills', () => {
    const root = mkdtempSync(join(tmpdir(), 'hf-'));
    const skillDir = join(root, 'skills', 'mine');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'SKILL.md'), '---\nname: mine\n---\n');
    assert.deepEqual(detectLocalSkills(root), ['mine']);
  });

  it('knows registry ids', () => {
    const ids = listCatalogSkillIds();
    assert.ok(ids.length > 0);
    assert.ok(catalogSkillKnown(ids[0]));
  });
});