import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogSkillKnown, getCatalogSkillMeta, listCatalogSkillIds, loadRegistryMeta } from './catalog-registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Embedded stub + autoskills registry for Harness Factory. */
export function loadManifest() {
  const stub = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
  const reg = loadRegistryMeta();
  return {
    ...stub,
    version: stub.version,
    counts: {
      skills: reg.skillCount,
      agents: stub.counts?.agents ?? 0,
      commands: stub.counts?.commands ?? 0,
    },
    skills: listCatalogSkillIds().map((id) => {
      const meta = getCatalogSkillMeta(id);
      const description = meta?.source ? `${id} — ${meta.source}` : id;
      const tags = id.split(/[-_]/).filter((part) => part.length > 1);
      return {
        id,
        description,
        tags,
        profiles: [],
      };
    }),
    catalogSource: 'autoskills',
  };
}

export function skillById(manifest, id) {
  return manifest.skills.find((s) => s.id === id) ?? (catalogSkillKnown(id) ? { id, profiles: [] } : undefined);
}

/** Harness Factory: no profile auto-install; use catalog opt-in. */
export function skillsForProfile(_manifest, _profile) {
  return [];
}