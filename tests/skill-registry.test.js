import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildRegistry } from '../scripts/lib/registry.js';
import { removeTargetInstall } from '../scripts/install-apply.js';
import { writeState } from '../scripts/lib/state.js';
import { targetPaths } from '../targets/index.js';
import { DEFAULT_SKILL_FLOOR } from '../scripts/lib/default-skill-floor.js';

const emptyManifest = { skills: [{ id: 'bun', description: 'bun — midudev/autoskills', tags: ['bun'] }] };

test('the skill registry points at packaged skills and not a missing skills/ tree', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hf-registry-'));
  const registry = buildRegistry({ cwd, target: 'claude', manifest: emptyManifest });
  const orient = registry.skills.find((skill) => skill.id === 'orient');
  assert.ok(orient);
  assert.equal(orient.available, true);
  assert.equal(orient.source, 'packaged');
  assert.match(orient.path, /packaged-skills\/orient\/SKILL\.md$/);
  assert.ok(orient.trigger.length > 40);
  assert.notEqual(orient.trigger, 'orient');
  const bun = registry.skills.find((skill) => skill.id === 'bun');
  assert.equal(bun.available, false);
  assert.equal(bun.path, null);
  assert.equal(bun.source, 'catalog');
  for (const id of DEFAULT_SKILL_FLOOR) {
    const row = registry.skills.find((skill) => skill.id === id);
    assert.equal(row?.available, true, id);
    assert.match(row.path, new RegExp(`/packaged-skills/${id}/SKILL\\.md$`));
  }
});

test('a project skill wins over the packaged copy', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hf-registry-local-'));
  const file = join(cwd, 'skills', 'orient', 'SKILL.md');
  mkdirSync(join(cwd, 'skills', 'orient'), { recursive: true });
  writeFileSync(file, '---\nname: orient\ndescription: "local orient"\ntags: [local]\n---\n');
  const registry = buildRegistry({ cwd, target: 'claude', manifest: { skills: [] } });
  const orient = registry.skills.find((skill) => skill.id === 'orient');
  assert.equal(orient.source, 'project');
  assert.equal(orient.path, file);
  assert.equal(orient.trigger, 'local orient');
});

test('removing an assistant accepts skills that ship from packaged-skills', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hf-remove-'));
  const paths = targetPaths('claude', undefined, cwd);
  writeState(paths.stateFile, {
    skills: { orient: { files: [paths.skillDir('orient')] } },
    agents: [],
    commands: [],
    ignoreEntriesAdded: [],
  });
  removeTargetInstall({ target: 'claude', cwd });
  assert.equal(existsSync(paths.stateFile), false);
});

test('removing an assistant refuses an id this package does not know', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hf-remove-unknown-'));
  const paths = targetPaths('claude', undefined, cwd);
  writeState(paths.stateFile, {
    skills: { 'not-a-real-skill': { files: [paths.skillDir('not-a-real-skill')] } },
    agents: [],
    commands: [],
  });
  assert.throws(() => removeTargetInstall({ target: 'claude', cwd }), /RSC_PREVIOUS_INSTALL_INCOMPATIBLE/);
});
