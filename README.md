# Harness Factory

Fork of [rsc-harness](https://github.com/ericrisco/rsc-harness) for a **BYO-first** agent harness:

- No embedded skill catalog in the npm package.
- **Your** skills live under `skills/<id>/SKILL.md` in the project.
- **Recommendations** come from the [autoskills](https://autoskills.sh/) registry; nothing installs until you opt in (`catalog add` or an accepted onboarding plan).
- Installed skills are materialized under `.rsc/skills/` and wired to Cursor, Claude, etc. via the same `targets/` adapters as rsc.

## Requirements

- Node.js **>= 22.6** (autoskills dependency)
- Non-commercial use if you rely on the `autoskills` npm package (**CC-BY-NC-4.0**)

## Get the CLI

The package is **`private`** until it is published on npm. Use one of these from the **project you want to wire** (not inside a cloned `harness-factory` subfolder):

```bash
# From GitHub (works for humans and coding agents — no npm publish required)
HF="npx --yes git+https://github.com/MarioSQuilantan/harness-factory.git"

# Or clone once and link globally
git clone https://github.com/MarioSQuilantan/harness-factory.git
cd harness-factory && npm ci && npm link
# then in your project: harness-factory …
```

After `npm publish`, `npx harness-factory` will work the same way without the `git+` URL.

## CLI

Run every command from the **root of your application repo**:

```bash
cd /path/to/your/project
$HF catalog refresh
$HF onboard
$HF catalog suggest
$HF catalog add vitest --install
$HF install    # wire hooks/agents + declared local/catalog skills
$HF             # interactive wizard (after onboard)
$HF sync
$HF doctor
```

### Agents and non-interactive onboard

Any tool that can run shell commands (Cursor, Claude Code, Codex, CI, etc.) can install Harness Factory the same way: **shell + Node**, not a specific LLM.

1. **`--target`** picks where files are written (`cursor`, `claude`, `codex`, `copilot`, …). That is the **coding host**, not the chat model name. Several targets: `--target cursor,claude`.
2. **Onboard is two steps** without a TTY: first generate the plan, then accept it with the printed plan id.

```bash
cd /path/to/your/project
HF="npx --yes git+https://github.com/MarioSQuilantan/harness-factory.git"

# Step A — print plan; copy the line "Plan id: …"
$HF onboard \
  --technical-level technical \
  --project-kind software \
  --software-scope small \
  --workflow main \
  --goal "One sentence: what this project is for" \
  --target cursor

# Step B — same flags and the same goal; add --accept-plan <id from step A>
$HF onboard \
  --technical-level technical \
  --project-kind software \
  --software-scope small \
  --workflow main \
  --goal "One sentence: what this project is for" \
  --target cursor \
  --accept-plan <64-char-hex-plan-id>

$HF catalog suggest
$HF install && $HF sync && $HF doctor
```

**BYO-first:** onboard may install **zero** catalog skills. Use `consult`, `catalog add`, `add`, or `skills/<id>/SKILL.md`. Reload the assistant session after `sync` / `install`.

Optional snippet for `AGENTS.md` in your repo — copy so any agent follows the same rules:

```markdown
## Harness Factory

- Node >= 22.6. CLI: `npx --yes git+https://github.com/MarioSQuilantan/harness-factory.git`
- Run from this repo root. Ask the human for `--target` (cursor, claude, codex, …).
- Onboard: (1) full flags → read `Plan id:`; (2) repeat with `--accept-plan <id>`.
- Skills: local `skills/<id>/SKILL.md` or `catalog add <id> --install`. Autoskills is CC-BY-NC.
```

### Prompt para el agente (copiar y pegar)

Pega el bloque siguiente en el chat del **agente que ejecuta terminal en este repo** (Cursor, Claude Code, Codex, Windsurf, etc.). Sustituye solo lo que va entre `<…>`; si no sabes el target, pide al usuario **una** herramienta: `cursor`, `claude`, `codex`, `copilot`, `gemini`, u otra de la lista del CLI.

```
Instala Harness Factory en ESTE repositorio (raíz del proyecto). No clones harness-factory
como subcarpeta del app ni lo agregues como dependencia en package.json salvo que yo lo pida.

Requisitos:
- Node.js >= 22.6 (comprueba con node -v).
- CLI desde GitHub:
  HF="npx --yes git+https://github.com/MarioSQuilantan/harness-factory.git"
- Ejecuta todos los comandos desde el directorio raíz de este proyecto (pwd).

Antes de onboard, confirma conmigo si hace falta:
- --target: <cursor|claude|codex|…> (host donde se cablean skills/hooks; no es el nombre del modelo).
- --goal: "<una frase con el objetivo del proyecto>"
- Si es software: --project-kind software --software-scope <small|growing|complex> --workflow <main|branches>
  (si no es software: --project-kind operations|research|content|mixed y omite software-scope)
- --technical-level <technical|non-technical|mixed>

Flujo obligatorio (sin menús interactivos si no hay TTY):

1) $HF catalog refresh

2) Paso A — generar plan (mismos flags en A y B):
   $HF onboard \
     --technical-level <…> \
     --project-kind <…> \
     [--software-scope <…> --workflow <…> si aplica] \
     --goal "<misma frase exacta>" \
     --target <…> \
     [--emoji on|off]

   Lee en la salida la línea: Plan id: <64 caracteres hex>

3) Paso B — aceptar plan (misma frase --goal y mismos flags que en A):
   $HF onboard … --accept-plan <plan-id del paso A>

4) Skills (BYO-first; el onboard puede dejar 0 skills de catálogo):
   - $HF catalog suggest
   - $HF consult "<lo que necesite el proyecto>" si hace falta
   - $HF catalog add <id> --install  (autoskills CC-BY-NC; avísame si hay flagged)
   - o skills/<id>/SKILL.md locales y $HF add <id>

5) $HF install && $HF sync && $HF doctor

Al terminar:
- Resume qué se escribió (.rsc.json, .rsc/, carpetas del target).
- Pídeme recargar/reiniciar la sesión del asistente (Cursor, Claude, etc.).
- Si doctor muestra pending/incomplete, lista qué falta y cómo resolverlo.
- No afirmes que el harness está listo si doctor no está healthy/ready según su salida.
```

### Install wizard (no embedded vendor profiles)

Legacy rsc **`--profile minimal|core|full`** is gone. Harness Factory uses:

| Mode | What it does |
|------|----------------|
| **Declared harness** | Hooks, agents and guards from your accepted onboard plan, plus skills under `skills/` and ids in `catalog.selected` |
| **Local only** | Only project `skills/<id>/SKILL.md` |
| **Catalog browse** | Pick from autoskills registry → records opt-in → installs on sync |

Run `harness-factory` with no args (after onboard) for the menu, or `harness-factory install` non-interactively.

### Catalog commands

| Command | Purpose |
|---------|---------|
| `catalog refresh` | Reload autoskills registry cache |
| `catalog suggest` | Stack-based suggestions (deferred until you add them) |
| `catalog add <id...>` | Record opt-in in `.rsc.json` (`catalog.selected`) |
| `catalog add <id...> --install` | Opt in and materialize into `.rsc/skills/` for declared targets |
| `catalog` | List registry skills |
| `consult "<text>"` | Rank autoskills + stack suggestions (use `add` or `catalog add` to opt in) |
| `add <id...>` | Opt-in registry skills when needed, then install and wire assistants |

### Local skills

Place skills in `skills/my-skill/SKILL.md`. They take precedence over the remote catalog for the same id.

## `.rsc.json` catalog block

```json
{
  "skillsPolicy": "byo-first",
  "catalog": {
    "provider": "autoskills",
    "selected": [],
    "dismissed": []
  }
}
```

## Licenses

- Harness Factory: **MIT** (includes rsc-harness copyright notice in LICENSE)
- Skill content from autoskills: **CC-BY-NC-4.0** (midudev)

## Attribution

Based on Eric Risco’s **rsc-harness**. Skill registry by **midudev/autoskills**.