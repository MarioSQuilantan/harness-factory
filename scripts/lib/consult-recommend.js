import { rank } from '../consult.js';
import { detectRepo } from '../detect-repo.js';
import { loadManifest } from './manifest.js';
import { suggestCatalogSkills } from './catalog-registry.js';
import { expandRecommends, hasOutcome } from './recommend.js';
import { applyRegistryBoosts } from './consult-aliases.js';

export async function recommendForProject(query, cwd = process.cwd(), { labeledOnly = false } = {}) {
  const m = loadManifest();
  const q = String(query || '').trim();
  const ranked = q ? applyRegistryBoosts(await rank(m, q), q) : [];
  const rankedIds = ranked.map((row) => row.id);
  const stackIds = suggestCatalogSkills(cwd).map((row) => row.id);
  const repo = detectRepo();
  let base = [...new Set(q ? [...rankedIds, ...stackIds, ...repo] : [...stackIds, ...repo])].filter((id) => id !== 'suggest');
  if (labeledOnly) base = base.filter(hasOutcome);
  base = base.slice(0, 8);
  let out = expandRecommends(m, base).filter((id) => id !== 'suggest');
  if (labeledOnly) out = out.filter(hasOutcome);
  return out.slice(0, 6);
}