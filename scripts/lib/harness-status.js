import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { doctor } from '../doctor.js';
import { readManifest } from './manifest-file.js';
import { getCatalogSkillMeta } from './catalog-registry.js';
import { constitutionIsDraft, CONSTITUTION_PATH } from './constitution-draft.js';
import { effectiveAgentModel } from '../../targets/agents.js';

const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const kb = (n) => (Number.isFinite(n) ? `${(n / 1024).toFixed(1)} KB` : '—');

function targetReport(cwd, id) {
  try {
    const report = doctor({ target: id, cwd });
    const budget = report.contextBudget || {};
    const metrics = report.memory?.metrics;
    return {
      id,
      healthy: Boolean(report.healthy),
      hookWired: Boolean(report.hookWired),
      installed: report.installed || [],
      missing: (report.missing || []).length,
      model: effectiveAgentModel(id, cwd) || 'inherit',
      sessionStart: kb(budget.sessionStartBytes),
      perTurn: kb(budget.perTurnBytes),
      descriptions: kb(budget.descriptionsBytes),
      sessions: metrics?.sessions?.length ?? 0,
      toolCalls: metrics?.knownTotal?.toolCalls ?? null,
      error: null,
    };
  } catch (error) {
    return {
      id, healthy: false, hookWired: false, installed: [], missing: 0,
      model: '—', sessionStart: '—', perTurn: '—', descriptions: '—',
      sessions: 0, toolCalls: null, error: String(error?.message || error),
    };
  }
}

export function collectHarnessStatus(cwd = process.cwd(), { targets } = {}) {
  const manifest = readManifest(cwd);
  const ids = targets?.length ? targets : (manifest?.targets || []);
  const reports = ids.map((id) => targetReport(cwd, id));
  const selected = manifest?.catalog?.selected || [];
  const flagged = selected.filter((id) => getCatalogSkillMeta(id)?.review?.status === 'flagged');
  const skills = [...new Set([...(manifest?.skills || []), ...selected])].sort();
  let draft = false;
  try { draft = constitutionIsDraft(cwd); } catch { draft = false; }
  const readiness = reports.length ? 'see targets' : 'not installed';
  const onboarding = manifest?.onboarding;
  const drift = onboarding?.maintenanceDrift || null;
  const healthy = reports.length > 0 && reports.every((row) => row.healthy);
  const next = !manifest
    ? 'Run onboard before expecting a harness.'
    : drift?.requiresReassessment
      ? `Reassess after ${drift.action}.`
      : draft
        ? `Finish ${CONSTITUTION_PATH} before the first SDD task.`
        : healthy
          ? 'Reload the assistants and start in your own words.'
          : 'Run doctor for the missing files.';
  return {
    generatedAt: new Date().toISOString(),
    installed: Boolean(manifest),
    health: !manifest ? 'not installed' : healthy ? 'healthy' : 'unhealthy',
    readiness,
    skills,
    flagged,
    draft,
    drift: drift ? { action: drift.action, recordedAt: drift.recordedAt } : null,
    targets: reports,
    sessions: reports.reduce((sum, row) => sum + row.sessions, 0),
    toolCalls: reports.reduce((sum, row) => sum + (row.toolCalls || 0), 0),
    next,
  };
}

function rows(items, cells) {
  return items.map((item) => `<tr>${cells(item).map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('');
}

export function renderStatusHtml(status) {
  const tone = status.health === 'healthy' ? 'ok' : status.health === 'not installed' ? 'muted' : 'bad';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Harness status</title>
<style>
  body { font: 15px/1.45 system-ui, sans-serif; margin: 2rem auto; max-width: 880px; color: #1c1c1c; background: #fafafa; }
  h1 { font-size: 1.4rem; margin-bottom: 0.2rem; }
  .badge { display: inline-block; padding: 0.1rem 0.45rem; border: 1px solid #ccc; }
  .ok { background: #e7f6ec; } .bad { background: #fdeCEC; } .muted { background: #eee; }
  .metrics { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0; }
  .metrics div { min-width: 7rem; padding: 0.6rem 0.8rem; background: white; border: 1px solid #ddd; }
  .metrics strong { display: block; font-size: 1.2rem; }
  table { width: 100%; border-collapse: collapse; background: white; margin: 0.5rem 0 1.2rem; }
  th, td { text-align: left; padding: 0.35rem 0.5rem; border-bottom: 1px solid #e4e4e4; }
  p.note { color: #444; }
</style>
</head>
<body>
<h1>Harness status <span class="badge ${tone}">${esc(status.health)}</span></h1>
<p class="note">${esc(status.generatedAt)}</p>
<div class="metrics">
  <div><strong>${status.skills.length}</strong>skills</div>
  <div><strong>${status.flagged.length}</strong>flagged</div>
  <div><strong>${status.targets.length}</strong>tools</div>
  <div><strong>${status.sessions}</strong>memory sessions</div>
  <div><strong>${status.toolCalls}</strong>known tool calls</div>
</div>
<p class="note">${esc(status.next)}${status.draft ? ' Constitution is still a draft.' : ''}${status.drift ? ` Drift: ${esc(status.drift.action)}.` : ''}</p>
<h2>Tools</h2>
<table>
<thead><tr><th>Tool</th><th>Health</th><th>Hook</th><th>Model</th><th>Session start</th><th>Per turn</th><th>Skills in context</th></tr></thead>
<tbody>${rows(status.targets, (row) => [row.id, row.healthy ? 'healthy' : 'unhealthy', row.hookWired ? 'wired' : 'not wired', row.model, row.sessionStart, row.perTurn, row.descriptions]) || '<tr><td colspan="7">No tool installed.</td></tr>'}</tbody>
</table>
<h2>Skills</h2>
<table>
<thead><tr><th>Id</th><th>Catalog</th></tr></thead>
<tbody>${status.skills.map((id) => `<tr><td>${esc(id)}</td><td>${status.flagged.includes(id) ? 'flagged' : ''}</td></tr>`).join('') || '<tr><td colspan="2">No skills declared.</td></tr>'}</tbody>
</table>
</body>
</html>
`;
}

export function writeStatusPage(cwd, html) {
  const file = join(cwd, '.rsc', 'status.html');
  mkdirSync(join(cwd, '.rsc'), { recursive: true });
  writeFileSync(file, html);
  return file;
}

const shownMark = (cwd) => join(cwd, '.rsc', '.status-shown');
const skillsMark = (cwd) => join(cwd, '.rsc', '.skills-answered');

export function skillsAnswered(cwd = process.cwd()) {
  return existsSync(skillsMark(cwd));
}

export function markSkillsAnswered(cwd = process.cwd()) {
  mkdirSync(join(cwd, '.rsc'), { recursive: true });
  if (!existsSync(skillsMark(cwd))) writeFileSync(skillsMark(cwd), `${new Date().toISOString()}\n`);
}

export function openStatusPage(file) {
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', file] : [file];
  execFile(opener, args, () => {});
}

/** Write the panel and open it once, the first time an install finishes. */
export function revealStatusOnce(cwd = process.cwd(), { targets, open = true } = {}) {
  if (existsSync(shownMark(cwd))) return { opened: false };
  const snap = collectHarnessStatus(cwd, { targets });
  const file = writeStatusPage(cwd, renderStatusHtml(snap));
  writeFileSync(shownMark(cwd), `${snap.generatedAt}\n`);
  if (open) openStatusPage(file);
  return { opened: true, file, snap };
}
