import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const LOCAL_ROOTS = ['skills', '.rsc/skills'];

function hasSkillMd(dir) {
  return existsSync(join(dir, 'SKILL.md'));
}

/** Detect project-local skill ids (BYO). */
export function detectLocalSkills(cwd = process.cwd()) {
  const ids = new Set();
  for (const root of LOCAL_ROOTS) {
    const abs = join(cwd, root);
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillDir = join(abs, entry.name);
      if (hasSkillMd(skillDir)) ids.add(entry.name);
    }
  }
  return [...ids].sort();
}

export function localSkillSourceDir(id, cwd = process.cwd()) {
  const projectSkill = join(cwd, 'skills', id);
  if (hasSkillMd(projectSkill)) return projectSkill;
  const rscSkill = join(cwd, '.rsc', 'skills', id);
  if (hasSkillMd(rscSkill)) return rscSkill;
  return null;
}

export function isOwnSkillId(id, cwd = process.cwd(), ownSkills = []) {
  if (ownSkills.includes(id)) return true;
  return localSkillSourceDir(id, cwd) !== null;
}