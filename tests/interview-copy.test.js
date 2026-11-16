import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  draftGoal, interviewCopy, recommendedLanguage, recommendedProjectKind,
} from '../scripts/lib/interview-copy.js';

test('terminal interview recommends the locale language', () => {
  assert.equal(recommendedLanguage({ LANG: 'es_MX.UTF-8' }), 'es');
  assert.equal(recommendedLanguage({ LANG: 'pt_BR.UTF-8' }), 'pt');
  assert.equal(recommendedLanguage({ LANG: 'fr_FR.UTF-8' }), 'fr');
  assert.equal(recommendedLanguage({ LANG: 'en_US.UTF-8' }), 'en');
});

test('each interview language has the same questions', () => {
  for (const lang of ['en', 'es', 'pt', 'fr']) {
    const copy = interviewCopy(lang);
    for (const key of ['language', 'tools', 'kind', 'scope', 'workflow', 'tone', 'goal']) {
      assert.equal(typeof copy[key], 'string');
      assert.ok(copy[key].length > 0);
    }
  }
});

test('an app repo recommends software and drafts a goal from the README title', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hf-interview-'));
  try {
    writeFileSync(join(cwd, 'pubspec.yaml'), 'name: finrienda\n');
    writeFileSync(join(cwd, 'README.md'), '# Finrienda\n');
    assert.equal(recommendedProjectKind(cwd), 'software');
    assert.equal(draftGoal(cwd), 'Build and maintain Finrienda.');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
