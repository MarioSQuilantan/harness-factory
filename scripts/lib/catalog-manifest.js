import { readManifest, writeManifest } from './manifest-file.js';

export function defaultCatalogBlock() {
  return {
    provider: 'autoskills',
    registryPin: 'main',
    selected: [],
    dismissed: [],
  };
}

export function readCatalogPolicy(cwd = process.cwd()) {
  const m = readManifest(cwd);
  return {
    skillsPolicy: m?.skillsPolicy || 'byo-first',
    selected: [...(m?.catalog?.selected || [])],
    dismissed: new Set(m?.catalog?.dismissed || []),
    ownSkills: [...(m?.ownSkills || [])],
  };
}

export function addCatalogSelection(cwd, ids) {
  const m = readManifest(cwd) || {
    version: 1,
    targets: [],
    skills: [],
    agents: [],
    ownSkills: [],
  };
  const catalog = { ...defaultCatalogBlock(), ...(m.catalog || {}) };
  const selected = new Set(catalog.selected || []);
  for (const id of ids) selected.add(id);
  catalog.selected = [...selected].sort();
  m.catalog = catalog;
  m.skillsPolicy = m.skillsPolicy || 'byo-first';
  const skillSet = new Set(m.skills || []);
  for (const id of ids) skillSet.add(id);
  m.skills = [...skillSet].sort();
  writeManifest(cwd, m);
  return m;
}

export function removeCatalogSelection(cwd, ids) {
  const m = readManifest(cwd);
  if (!m) return null;
  const drop = new Set(ids);
  const catalog = { ...defaultCatalogBlock(), ...(m.catalog || {}) };
  catalog.selected = (catalog.selected || []).filter((id) => !drop.has(id));
  m.catalog = catalog;
  m.skills = (m.skills || []).filter((id) => !drop.has(id));
  writeManifest(cwd, m);
  return m;
}

export function dismissCatalogSuggestions(cwd, ids) {
  const m = readManifest(cwd);
  if (!m) return null;
  const catalog = { ...defaultCatalogBlock(), ...(m.catalog || {}) };
  const dismissed = new Set(catalog.dismissed || []);
  for (const id of ids) dismissed.add(id);
  catalog.dismissed = [...dismissed].sort();
  m.catalog = catalog;
  writeManifest(cwd, m);
  return m;
}