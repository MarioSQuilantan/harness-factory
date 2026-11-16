import { stackAgentNames } from '../../targets/agents.js';
import { loadManifest } from './manifest.js';
import { catalogSkillKnown } from './catalog-registry.js';
import { detectLocalSkills } from './local-skills.js';
import { readManifest } from './manifest-file.js';

/** Classify CLI ids as catalog/local skills, agents, or unknown. */
export function classifyRequestedSkillIds(ids, cwd = process.cwd()) {
  const catalog = new Set(loadManifest().skills.map((skill) => skill.id));
  const local = new Set(detectLocalSkills(cwd));
  const agents = new Set(stackAgentNames());
  const out = { skills: [], agents: [], unknown: [] };
  for (const id of ids) {
    if (agents.has(id)) out.agents.push(id);
    else if (catalog.has(id) || local.has(id) || catalogSkillKnown(id)) out.skills.push(id);
    else out.unknown.push(id);
  }
  return out;
}

/** Registry skills the user named but has not opt-in recorded yet. */
export function catalogOptInRequired(ids, cwd = process.cwd()) {
  const m = readManifest(cwd);
  const selected = new Set(m?.catalog?.selected || []);
  return ids.filter((id) => catalogSkillKnown(id) && !selected.has(id));
}

export function suggestionCandidates(cwd = process.cwd()) {
  return [
    ...loadManifest().skills.map((skill) => skill.id),
    ...detectLocalSkills(cwd),
    ...stackAgentNames(),
  ];
}