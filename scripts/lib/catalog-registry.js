import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  clearAutoskillsCache,
  getRegistryDir,
  installSkill,
  loadRegistry,
  verifyRegistryEntry,
} from 'autoskills/dist/installer.js';
import {
  collectSkills,
  detectTechnologies,
  parseSkillPath,
} from 'autoskills/dist/lib.js';
import { readManifest } from './manifest-file.js';

function skillNameFromPath(skillPath) {
  const { skillName } = parseSkillPath(skillPath);
  return skillName || skillPath;
}

export function loadRegistryMeta() {
  const registry = loadRegistry();
  const skills = registry?.skills ? Object.keys(registry.skills).length : 0;
  return {
    provider: 'autoskills',
    available: Boolean(registry),
    skillCount: skills,
    generatedAt: registry?.generatedAt ?? null,
  };
}

export function listCatalogSkillIds() {
  const registry = loadRegistry();
  if (!registry?.skills) return [];
  return Object.keys(registry.skills).sort();
}

export function getCatalogSkillMeta(id) {
  const registry = loadRegistry();
  const entry = registry?.skills?.[id];
  if (!entry) return null;
  return {
    id,
    review: entry.review,
    securityCheck: entry.securityCheck,
    bundleHash: entry.bundleHash,
    source: entry.source,
  };
}

export function refreshCatalogCache() {
  clearAutoskillsCache();
  return loadRegistryMeta();
}

/** @returns {Array<{ id: string, reason: string, review?: object, securityCheck?: object, sources?: string[] }>} */
export function suggestCatalogSkills(cwd, { dismissed = new Set() } = {}) {
  const registry = loadRegistry();
  if (!registry?.skills) return [];
  const { detected, isFrontend, combos } = detectTechnologies(cwd);
  const manifest = readManifest(cwd);
  const dismissedSet = new Set([
    ...(manifest?.catalog?.dismissed || []),
    ...dismissed,
  ]);
  const collected = collectSkills({
    detected,
    isFrontend,
    combos,
    installedNames: null,
  });
  const out = [];
  for (const row of collected) {
    const id = skillNameFromPath(row.skill);
    if (!registry.skills[id]) continue;
    if (dismissedSet.has(id)) continue;
    const meta = getCatalogSkillMeta(id);
    out.push({
      id,
      reason: `Suggested for your stack (${row.sources.join(', ')}) via autoskills registry.`,
      review: meta?.review,
      securityCheck: meta?.securityCheck,
      sources: row.sources,
    });
  }
  return out;
}

function updateSkillsLock(cwd, skillName, entry) {
  const lockPath = join(cwd, 'skills-lock.json');
  let lock;
  try {
    lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    if (!lock?.skills) lock = { version: 1, skills: {} };
  } catch {
    lock = { version: 1, skills: {} };
  }
  lock.skills[skillName] = {
    source: entry.source,
    sourceType: 'autoskills-registry',
    computedHash: entry.bundleHash,
  };
  const sorted = {};
  for (const k of Object.keys(lock.skills).sort()) sorted[k] = lock.skills[k];
  lock.skills = sorted;
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

/** Materialize audited registry skill into destDir (e.g. .rsc/skills/id). */
export async function materializeSkillToDir(id, destDir, { cwd = process.cwd() } = {}) {
  const registry = loadRegistry();
  if (!registry?.skills?.[id]) {
    throw new Error(`skill '${id}' not in autoskills registry (opt in with: harness-factory catalog add ${id})`);
  }
  const entry = registry.skills[id];
  const regDir = getRegistryDir();
  const bundledDir = join(regDir, id);
  mkdirSync(dirname(destDir), { recursive: true });
  if (existsSync(destDir)) rmSync(destDir, { recursive: true, force: true });

  if (existsSync(bundledDir) && verifyRegistryEntry(id, entry, regDir).ok) {
    cpSync(bundledDir, destDir, { recursive: true });
    updateSkillsLock(cwd, id, entry);
    return { id, bundleHash: entry.bundleHash, source: 'bundled-registry' };
  }

  const result = await installSkill(id, [], { projectDir: cwd });
  if (!result.success) {
    throw new Error(result.stderr || result.output || `failed to download ${id}`);
  }
  const staged = join(cwd, '.agents', 'skills', id);
  if (!existsSync(staged)) {
    throw new Error(`autoskills installed ${id} but ${staged} is missing`);
  }
  cpSync(staged, destDir, { recursive: true });
  updateSkillsLock(cwd, id, entry);
  return { id, bundleHash: entry.bundleHash, source: 'remote-registry' };
}

export function catalogSkillKnown(id) {
  const registry = loadRegistry();
  return Boolean(registry?.skills?.[id]);
}