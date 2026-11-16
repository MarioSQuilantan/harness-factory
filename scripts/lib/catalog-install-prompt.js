import { suggestCatalogSkills, getCatalogSkillMeta } from './catalog-registry.js';
import { readManifest } from './manifest-file.js';
import { detectLocalSkills } from './local-skills.js';
import { addCatalogSelection } from './catalog-manifest.js';
import { installProgress } from './install-log.js';

function shortReason(text, max = 72) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Autoskills stack suggestions not yet opted in or present locally. */
export function newCatalogSuggestions(cwd = process.cwd()) {
  const rows = suggestCatalogSkills(cwd);
  const manifest = readManifest(cwd);
  const already = new Set([
    ...detectLocalSkills(cwd),
    ...(manifest?.catalog?.selected || []),
    ...(manifest?.skills || []),
  ]);
  return rows.filter((row) => !already.has(row.id));
}

/**
 * Interactive step: detect autoskills suggestions, let user pick all or subset, then call installIds.
 * Returns installed ids (maybe []).
 */
export async function offerCatalogSkillInstall(cwd, {
  targets = [],
  installIds,
  say,
  select,
  pickFrom,
  confirm,
  isInteractive,
}) {
  const pending = newCatalogSuggestions(cwd);
  if (!pending.length) {
    installProgress('autoskills: no nuevas sugerencias para este repo');
    return [];
  }

  say('');
  say(`Encontré ${pending.length} skill(s) en autoskills para el stack de este proyecto:`);
  for (const row of pending) {
    const flagged = row.review?.status === 'flagged' ? ' [revisión registry]' : '';
    say(`  · ${row.id}${flagged} — ${shortReason(row.reason)}`);
  }

  if (!isInteractive()) {
    say('Sin terminal interactiva: instala después con `catalog add <id> --install` o `add <id>`.');
    return [];
  }

  const choice = await select('¿Quieres instalar skills del catálogo autoskills ahora?', [
    { key: 'pick', label: 'Elegir cuáles instalar' },
    { key: 'all', label: `Instalar las ${pending.length} sugeridas` },
    { key: 'skip', label: 'Ninguna ahora (más tarde: catalog add)' },
  ]);
  if (choice === 'skip' || choice === null) {
    say('OK — no se instaló ninguna skill del catálogo.');
    return [];
  }

  let ids;
  if (choice === 'all') {
    ids = pending.map((row) => row.id);
  } else {
    const items = pending.map((row) => ({
      id: row.id,
      label: `${row.id}${row.review?.status === 'flagged' ? ' ⚠' : ''} — ${shortReason(row.reason, 56)}`,
    }));
    const picked = await pickFrom('Marca las skills (espacio, o "all" en modo texto):', items);
    if (picked === null) return [];
    ids = picked;
  }

  if (!ids.length) {
    say('Nada seleccionado.');
    return [];
  }

  const flagged = ids.filter((id) => getCatalogSkillMeta(id)?.review?.status === 'flagged');
  if (flagged.length && !(await confirm(`Estas skills están flagged en el registry: ${flagged.join(', ')}. ¿Instalar igual?`))) {
    say('Cancelado.');
    return [];
  }

  addCatalogSelection(cwd, ids);
  installProgress(`autoskills: opt-in ${ids.join(', ')}`);
  if (typeof installIds === 'function') await installIds(ids);
  say(`✅ Skills del catálogo: ${ids.join(', ')}`);
  return ids;
}