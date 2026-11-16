import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SKILL_FLOOR, withDefaultSkillFloor } from '../scripts/lib/default-skill-floor.js';

test('Harness Factory has no vendor skill floor', () => {
  assert.deepEqual(DEFAULT_SKILL_FLOOR, []);
});

test('withDefaultSkillFloor only deduplicates caller ids', () => {
  assert.deepEqual(
    withDefaultSkillFloor(['unslop', 'fastapi', 'orient', 'postgresdb']),
    ['unslop', 'fastapi', 'orient', 'postgresdb'],
  );
});