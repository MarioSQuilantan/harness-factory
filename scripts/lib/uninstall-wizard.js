import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readManifest, writeManifest } from './manifest-file.js';
import { removeCatalogSelection } from './catalog-manifest.js';
import { installProgress } from './install-log.js';
import { TARGETS } from '../../targets/index.js';

/**
 * Interactive desinstalador BYO-first: skills, un asistente, opt-in de catálogo, o purge completo.
 */
export async function runUninstallWizard({
  cwd = process.cwd(),
  targets = [],
  say,
  select,
  pickFrom,
  confirm,
  isInteractive,
  uninstallSkill,
  removeAssistant,
  previewPurge,
  runPurge,
  listSkillIds,
}) {
  const hasHarness = existsSync(join(cwd, '.rsc')) || readManifest(cwd);
  if (!hasHarness) {
    say('No hay harness instalado en este proyecto.');
    return;
  }
  if (!isInteractive()) {
    say('Desinstalador interactivo: ejecuta `remove` en una terminal, o usa:');
    say('  uninstall <skill>   ·   uninstall --all   ·   purge [--dry-run]');
    return;
  }

  const choice = await select('¿Qué quieres desinstalar?', [
    { key: 'skills', label: 'Skills cableadas (elige cuáles)' },
    { key: 'assistant', label: 'Un asistente completo (Cursor, Claude, …)' },
    { key: 'catalog', label: 'Opt-in del catálogo autoskills (y quitar del disco)' },
    { key: 'full', label: 'Todo el harness (vista previa y confirmación)' },
    { key: 'cancel', label: 'Cancelar' },
  ]);
  if (!choice || choice === 'cancel') return void say('Cancelado.');

  const wireTargets = targets.length ? targets : (readManifest(cwd)?.targets || []);

  if (choice === 'skills') {
    const ids = listSkillIds();
    if (!ids.length) return void say('No hay skills instaladas según el manifiesto.');
    const picked = await pickFrom('Marca las skills a quitar:', ids.map((id) => ({ id, label: id })));
    if (!picked?.length) return void say('Nada seleccionado.');
    if (!(await confirm(`Quitar ${picked.join(', ')} de ${wireTargets.join(', ') || 'los targets declarados'}?`))) return;
    for (const t of wireTargets) {
      installProgress(`uninstall: skills ${picked.join(', ')} → ${t}`);
      await uninstallSkill({ target: t, skillIds: picked });
    }
    say(`✅ Skills quitadas: ${picked.join(', ')}`);
    return;
  }

  if (choice === 'assistant') {
    const items = (readManifest(cwd)?.targets?.length ? readManifest(cwd).targets : wireTargets)
      .map((id) => ({ id, label: TARGETS.find((t) => t.id === id)?.label || id }));
    if (!items.length) return void say('No hay asistentes declarados en .rsc.json.');
    const picked = await pickFrom('¿Qué asistente quitar por completo?', items);
    const id = picked?.[0];
    if (!id) return void say('Cancelado.');
    if (!(await confirm(`Quitar todo el cableado de ${id} en este proyecto?`))) return;
    removeAssistant({ target: id });
    const m = readManifest(cwd);
    if (m) writeManifest(cwd, { ...m, targets: (m.targets || []).filter((t) => t !== id) });
    say(`✅ Asistente ${id} desinstalado.`);
    return;
  }

  if (choice === 'catalog') {
    const selected = readManifest(cwd)?.catalog?.selected || [];
    if (!selected.length) return void say('No hay skills con opt-in en catalog.selected.');
    const picked = await pickFrom('Quita el opt-in y el cableado de:', selected.map((id) => ({ id, label: id })));
    if (!picked?.length) return;
    removeCatalogSelection(cwd, picked);
    for (const t of wireTargets) {
      await uninstallSkill({ target: t, skillIds: picked });
    }
    say(`✅ Opt-in retirado: ${picked.join(', ')}`);
    return;
  }

  if (choice === 'full') {
    say('\nVista previa (no borra aún):');
    await previewPurge(true, false);
    if (!(await confirm('¿Desinstalar todo lo listado arriba?'))) return void say('Cancelado.');
    const withDocs = await confirm('¿También eliminar 02-DOCS/wiki del harness? (por defecto se conserva)');
    installProgress('purge: removing harness');
    await runPurge(false, withDocs);
    say('✅ Harness desinstalado. Recarga tus asistentes.');
  }
}