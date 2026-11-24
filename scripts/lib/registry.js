import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { targetPaths } from '../../targets/index.js';
import { DEFAULT_SKILL_FLOOR } from './default-skill-floor.js';
import { detectLocalSkills } from './local-skills.js';
import { loadManifest } from './manifest.js';
import { readState } from './state.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function refreshRegistry({
  cwd = process.cwd(),
  target = 'codex',
  home = homedir(),
  manifest = loadManifest(),
  catalogRoot = ROOT,
} = {}) {
  const dir = join(cwd, '.rsc');
  mkdirSync(dir, { recursive: true });
  const registry = buildRegistry({ cwd, target, home, manifest, catalogRoot });
  writeFileSync(join(dir, 'skill-registry.json'), JSON.stringify(registry, null, 2) + '\n');
  writeFileSync(join(dir, 'skill-registry.md'), renderRegistryMarkdown(registry));
  return registry;
}

export function registryStatus({ cwd = process.cwd() } = {}) {
  const path = join(cwd, '.rsc', 'skill-registry.json');
  if (!existsSync(path)) return { exists: false, path };
  const data = JSON.parse(readFileSync(path, 'utf8'));
  return {
    exists: true,
    path,
    version: data.version,
    counts: data.counts || { skills: data.skills?.length || 0 },
  };
}

export function buildRegistry({
  cwd = process.cwd(),
  target = 'codex',
  home = homedir(),
  manifest = loadManifest(),
  catalogRoot = ROOT,
} = {}) {
  const installed = installedIds({ target, home, cwd });
  const byId = new Map((manifest.skills || []).map((skill) => [skill.id, skill]));
  for (const id of [...DEFAULT_SKILL_FLOOR, ...detectLocalSkills(cwd), ...installed]) {
    if (!byId.has(id)) byId.set(id, { id, description: '', tags: [] });
  }
  const skills = [...byId.values()].map((skill) => {
    const skillPath = resolveSkillFile(skill.id, cwd, catalogRoot);
    const available = Boolean(skillPath);
    const meta = skillPath ? skillMetaFromFile(skillPath) : {};
    const trigger = meta.description || skill.description || skill.id;
    const tags = meta.tags?.length ? meta.tags : (skill.tags || []);
    return {
      id: skill.id,
      trigger,
      tags,
      source: skillSource(skillPath, cwd, catalogRoot),
      path: skillPath,
      installed: installed.has(skill.id),
      available,
      hash: hashSkill({ id: skill.id, description: trigger, tags, path: skillPath, available }),
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
  return {
    version: 1,
    target,
    root: resolve(cwd),
    counts: {
      skills: skills.length,
      installed: skills.filter((s) => s.installed).length,
      available: skills.filter((s) => s.available).length,
    },
    skills,
  };
}

export function renderRegistryMarkdown(registry) {
  const rows = [
    '# RSC Skill Registry',
    '',
    `Target: ${registry.target}`,
    `Skills: ${registry.counts.skills} (${registry.counts.installed} installed, ${registry.counts.available} available)`,
    '',
    '| id | installed | available | tags | path |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const skill of registry.skills) {
    rows.push(`| ${skill.id} | ${yesNo(skill.installed)} | ${yesNo(skill.available)} | ${(skill.tags || []).join(', ')} | ${skill.path || ''} |`);
  }
  return rows.join('\n') + '\n';
}

// A project override wins, then the copy install wrote, then the skills this package ships.
// A catalog id with none of those has no file the agent can open.
function resolveSkillFile(id, cwd, catalogRoot) {
  const candidates = [
    join(cwd, 'skills', id, 'SKILL.md'),
    join(cwd, '.rsc', 'skills', id, 'SKILL.md'),
    join(catalogRoot, 'packaged-skills', id, 'SKILL.md'),
    join(catalogRoot, 'skills', id, 'SKILL.md'),
  ];
  return candidates.find((file) => existsSync(file)) || null;
}

function skillSource(file, cwd, catalogRoot) {
  if (!file) return 'catalog';
  const project = join(cwd, 'skills') + sep;
  const installed = join(cwd, '.rsc', 'skills') + sep;
  const packaged = join(catalogRoot, 'packaged-skills') + sep;
  if (file.startsWith(project)) return 'project';
  if (file.startsWith(installed)) return 'installed';
  if (file.startsWith(packaged)) return 'packaged';
  return 'catalog';
}

function skillMetaFromFile(file) {
  let text = '';
  try { text = readFileSync(file, 'utf8'); } catch { return {}; }
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] || '';
  const raw = block.match(/^description:\s*(.*)$/m)?.[1]?.trim() || '';
  const description = raw.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  const tags = (block.match(/^tags:\s*\[([^\]]*)\]/m)?.[1] || '')
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
  return { description, tags };
}

function installedIds({ target, home, cwd }) {
  const paths = targetPaths(target, home, cwd);
  return new Set(Object.keys(readState(paths.stateFile).skills || {}));
}

function hashSkill(skill) {
  return createHash('sha256')
    .update(JSON.stringify({
      id: skill.id,
      trigger: skill.description,
      tags: skill.tags || [],
      path: skill.path,
      available: skill.available,
    }))
    .digest('hex')
    .slice(0, 12);
}

function yesNo(value) {
  return value ? 'yes' : 'no';
}
