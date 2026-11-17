import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SKILL_FLOOR, withDefaultSkillFloor } from '../scripts/lib/default-skill-floor.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('the essential rsc skills ship with every install', () => {
  assert.ok(DEFAULT_SKILL_FLOOR.includes('orient'));
  assert.ok(DEFAULT_SKILL_FLOOR.includes('suggest'));
  assert.ok(DEFAULT_SKILL_FLOOR.includes('ftd'));
  assert.ok(DEFAULT_SKILL_FLOOR.includes('specify'));
  assert.equal(DEFAULT_SKILL_FLOOR.includes('flutter'), false);
  assert.equal(DEFAULT_SKILL_FLOOR.includes('postgresdb'), false);
  for (const id of DEFAULT_SKILL_FLOOR) {
    assert.ok(existsSync(join(ROOT, 'packaged-skills', id, 'SKILL.md')), id);
  }
});

test('withDefaultSkillFloor keeps the essential set and appends extras once', () => {
  assert.deepEqual(
    withDefaultSkillFloor(['unslop', 'fastapi', 'orient', 'postgresdb']),
    [...DEFAULT_SKILL_FLOOR, 'fastapi', 'postgresdb'],
  );
});
