import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templateAssets } from '../scripts/lib/tools-skeleton.js';
import { planInstall } from '../scripts/install-plan.js';

test('shipped tool template is readable without the old skills/ tree', () => {
  const assets = templateAssets();
  assert.ok(assets.includes('README.md'));
  assert.ok(assets.includes('gitignore'));
  assert.ok(assets.includes('env.example'));
});

test('install plan wires the always-on hook without a suggest skill', () => {
  const plan = planInstall({ skillIds: ['dart-best-practices'], target: 'cursor', cwd: process.cwd(), hooks: true });
  assert.ok(plan.some((step) => step.kind === 'hook'));
});
