import { accessSync, constants, statSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { HF_RUN } from './public-cli.js';

// Inspect PATH, never execute a candidate just to discover it. Ignore relative PATH
// entries: a checked-out executable is not evidence of an installed CLI.
export function installedCli({ env = process.env, platform = process.platform } = {}) {
  const windows = platform === 'win32';
  const names = windows ? ['rsc.exe', 'rsc.cmd', 'rsc.bat', 'rsc'] : ['rsc'];
  for (const dir of (env.PATH || env.Path || '').split(windows ? ';' : ':')) {
    if (!dir || !isAbsolute(dir)) continue;
    // npm/npx inject these only for this process. They will not make `rsc`
    // available in the assistant's next shell after installation finishes.
    if (/(?:^|[\\/])_npx(?:[\\/]|$)|[\\/]node_modules[\\/]\.bin[\\/]?$/i.test(dir)) continue;
    for (const name of names) {
      try {
        const file = join(dir, name);
        if (!statSync(file).isFile()) continue;
        accessSync(file, windows ? constants.F_OK : constants.X_OK);
        return true;
      } catch { /* absent, unreadable or not executable */ }
    }
  }
  return false;
}

export function cliInstructions(text, local = installedCli()) {
  // Explicit versions (including @latest) are deliberate choices, never rewritten.
  if (!local) return text;
  return text
    .replaceAll(HF_RUN, 'rsc')
    .replace(/\bnpx[ \t]+(?:-y[ \t]+)?@ericrisco\/rsc(?=[ \t`\n]|$)/g, 'rsc');
}

export function materializeCliInstructions(dir, local) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) materializeCliInstructions(file, local);
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      const before = readFileSync(file, 'utf8');
      let after = cliInstructions(before, local);
      if (local && entry.name === 'SKILL.md' && /\nname: suggest\n/.test(before)) {
        after += '\n**Installed CLI.** Use `rsc` when it is on PATH. Otherwise run `npx --yes git+https://github.com/MarioSQuilantan/harness-factory.git`. Explicit package versions stay pinned. This does not grant execution permissions.\n';
      }
      if (after !== before) writeFileSync(file, after);
    }
  }
}
