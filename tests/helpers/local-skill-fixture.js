import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function writeLocalSkill(cwd, id, body = 'Local skill for tests.') {
  const dir = join(cwd, 'skills', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), `---\nname: ${id}\ndescription: test fixture\n---\n\n${body}\n`);
}