import { readManifest } from './manifest-file.js';
import { detectLocalSkills } from './local-skills.js';
import { catalogSkillKnown } from './catalog-registry.js';
import { withDefaultSkillFloor } from './default-skill-floor.js';

function skillMayInstall(id, { local, catalogSelected, own }) {
  return local.includes(id) || catalogSelected.has(id) || own.has(id);
}

/** Skill ids this project may materialize (local BYO + catalog opt-in + ownSkills). */
export function declaredInstallSkillIds(cwd = process.cwd()) {
  const m = readManifest(cwd);
  const local = detectLocalSkills(cwd);
  const catalogSelected = new Set(m?.catalog?.selected || []);
  const own = new Set(m?.ownSkills || []);
  const ids = new Set(local);
  for (const id of m?.skills || []) {
    if (skillMayInstall(id, { local, catalogSelected, own })) ids.add(id);
  }
  for (const id of catalogSelected) ids.add(id);
  for (const id of m?.onboarding?.plan?.policy?.skills || []) {
    if (skillMayInstall(id, { local, catalogSelected, own })) ids.add(id);
  }
  return withDefaultSkillFloor([...ids].sort());
}

export function localOnlyInstallSkillIds(cwd = process.cwd()) {
  return withDefaultSkillFloor(detectLocalSkills(cwd));
}

/** Hooks, agents and guards from the accepted onboarding plan, or safe defaults. */
export function policyForProjectInstall(cwd = process.cwd()) {
  const m = readManifest(cwd);
  const fromReceipt = m?.onboarding?.plan?.policy;
  const skills = declaredInstallSkillIds(cwd);
  if (fromReceipt) return { ...fromReceipt, skills };
  return {
    skills,
    targets: m?.targets || [],
    baseAgents: false,
    agents: [...(m?.agents || [])],
    alwaysOn: true,
    codeHooks: false,
    gitmojiGuard: false,
    dangerGuard: true,
    laneGate: false,
    memory: m?.memory !== false,
    context7: false,
  };
}

/** Domains whose ids exist in the autoskills registry (Harness Factory manual picker). */
export function catalogPickerDomains(domains) {
  return domains
    .map((d) => ({ title: d.title, ids: d.ids.filter((id) => catalogSkillKnown(id)) }))
    .filter((d) => d.ids.length > 0);
}