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
$HF install --verbose   # más detalle en la instalación; en fallos muestra stack (o HF_VERBOSE=1)
$HF remove              # desinstalador (terminal interactiva)
```

### Agents and non-interactive onboard

Any tool that can run shell commands (Cursor, Claude Code, Codex, CI, etc.) can install Harness Factory the same way: **shell + Node**, not a specific LLM.

1. **`--target`** picks where files are written. That is the **coding host**, not the chat model name. Several now: `--target cursor,claude`. One that was left out can be added later; see [Agregar otra herramienta](#agregar-otra-herramienta). Do not install all of them up front.
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

**BYO-first:** onboard may install **zero** catalog skills. Tras aceptar el plan, en modo interactivo el instalador **detecta sugerencias autoskills**, las lista y pregunta si quieres **elegir cuáles**, **instalar todas** o **ninguna** (`--skip-catalog-skills` para saltar). Reload the assistant session after `sync` / `install`.

### Agregar otra herramienta

El arnés no detecta que cambiaste de aplicación. Si elegiste Cursor y luego abres Claude CLI, Claude no lee `.cursor/`. El plan y la memoria en `.rsc/` siguen ahí. Hay que cablear la herramienta nueva, sin repetir la entrevista:

```bash
$HF install --target claude
$HF sync --target claude
```

Sustituye `claude` por el id de la tabla. Varias a la vez: `--target claude,codex`. Lo ya instalado no se borra. Recarga esa aplicación después.

| Id | Herramienta | Dónde escribe | Subagentes en archivo |
|----|-------------|-----------------|------------------------|
| `cursor` | Cursor | `.cursor/` | sí |
| `claude` | Claude Code | `.claude/` | sí |
| `codex` | Codex CLI | `.codex/` y `AGENTS.md` | sí |
| `copilot` | GitHub Copilot | `.github/` | sí |
| `gemini` | Gemini CLI | `GEMINI.md` | sí |
| `opencode` | OpenCode | `.opencode/` | sí |
| `junie` | JetBrains Junie | `.junie/` | sí |
| `kiro` | Kiro | `.kiro/` | sí |
| `windsurf` | Windsurf | `.windsurf/` | no |
| `cline` | Cline | `.clinerules/` | no |
| `roo` | Roo Code | `.roo/` | no |
| `continue` | Continue | `.continue/` | no |
| `antigravity` | Antigravity | `.antigravity/` | no |
| `zed` | Zed | `AGENTS.md` | no |
| `amp` | Amp | `AGENTS.md` | no |
| `deepseek` | DeepSeek Harness | `.dsh/` | no |
| `pi` | Pi | `.pi/` | no |
| `jules` | Jules | `AGENTS.md` | no |
| `aider` | Aider | `CONVENTIONS.md` | no |

En todas se escriben reglas y skills. Los subagentes (developer, verificador, refutadores) solo existen como archivo en las marcadas con «sí», y solo si el plan aceptado los eligió.

Optional snippet for `AGENTS.md` in your repo — copy so any agent follows the same rules:

```markdown
## Harness Factory

- Node >= 22.6. CLI: `npx --yes git+https://github.com/MarioSQuilantan/harness-factory.git`
- Run from this repo root. Ask which host they use now (`cursor`, `claude`, `codex`, …). To add another later: `install --target <id>` then `sync --target <id>`. Do not install every host.
- Onboard: (1) full flags → read `Plan id:`; (2) repeat with `--accept-plan <id>`.
- Skills: local `skills/<id>/SKILL.md` or `catalog add <id> --install`. Autoskills is CC-BY-NC.
```

### Prompt para el agente (copiar y pegar)

Pega el bloque en el chat del **agente con terminal** (Cursor, Claude Code, Codex, etc.).

**Regla para el agente:** pregúntame en **lenguaje cotidiano**. No uses flags (`--target`, `--project-kind`, …) en las preguntas salvo que yo pida detalle técnico. Tú traduces mis respuestas a los flags al ejecutar comandos.

**Preguntas amigables (ejemplo de cómo debe sonar el agente):**

| Pregunta al usuario | Opciones sencillas | Flag interno |
|--------------------|--------------------|--------------|
| ¿Con qué herramienta programas en **este** proyecto? | Cursor, Claude Code, Codex, Copilot, otra | `--target` |
| ¿Qué estás construyendo? | App o web, operaciones/empresa, investigación, contenido, mezcla | `--project-kind` |
| Si es software: ¿qué tan grande es el trabajo **ahora**? | Pequeño (MVP), creciendo, complejo/equipos | `--software-scope` |
| Si es software: ¿cómo quieres integrar código? | Directo en main, o ramas + PR | `--workflow` |
| ¿Cómo prefieres que te hablen las instrucciones? | Técnico, con analogías, mezcla | `--technical-level` |
| En **una frase**, ¿para qué es este proyecto? | (texto libre — debe repetirse igual en el paso de aceptación) | `--goal` |

```
Instala Harness Factory en ESTE repositorio (raíz del proyecto). No clones harness-factory
como subcarpeta del app ni lo agregues como dependencia en package.json salvo que yo lo pida.

Requisitos técnicos (no los preguntes así al usuario):
- Node.js >= 22.6 (comprueba con node -v).
- CLI: HF="npx --yes git+https://github.com/MarioSQuilantan/harness-factory.git"
- Todos los comandos desde la raíz de este proyecto.

Entrevista breve ANTES de onboard. Pregunta en español, con opciones numeradas. No muestres flags:
1. ¿Con qué herramienta programas aquí ahora? Cursor, Claude Code, Codex, Copilot, u otra de la tabla del README (cursor, claude, codex, copilot, gemini, opencode, junie, kiro, windsurf, cline, roo, continue, antigravity, zed, amp, deepseek, pi, jules, aider). → --target
   Si ya estás en Cursor, sugiere cursor. No instales las 19. Otra herramienta se agrega después con install --target <id> y sync --target <id>.
2. ¿Qué estás construyendo? App o web, operaciones, investigación, contenido, mezcla. → --project-kind
3. Si es software: ¿qué tan grande es ahora? Pequeño (MVP), creciendo, complejo. → --software-scope
4. Si es software: ¿cambios directo en main, o ramas y PR? → --workflow
5. ¿Cómo prefieres las instrucciones? Técnico, con analogías, mezcla. → --technical-level
6. En una frase, ¿para qué es este proyecto? Cópiala tal cual; hace falta igual en el paso A y en el B. → --goal
Resume en 3 líneas lo que vas a configurar y pide un "sí, adelante" antes de ejecutar.

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
   - Enséñame la lista. Instala solo las que yo acepte, y ninguna marcada flagged.
   - $HF catalog add <id> --install   (autoskills es CC-BY-NC; dímelo antes)
   - o skills/<id>/SKILL.md locales y $HF add <id>

5) $HF install && $HF sync && $HF doctor

Desinstalar solo si el usuario lo pide:
- Terminal interactiva: `$HF remove` (alias `desinstalar`). Menú: skills, un asistente, opt-in del catálogo, o todo el harness.
- Sin TTY no borres nada con el menú. Usa `$HF uninstall <id>`, `$HF purge --dry-run` y, si confirma, `$HF purge` (`--with-docs` solo si pide borrar la wiki).
- No hagas commit de esos borrados salvo que lo pida: en un repo compartido desinstala el harness para todo el equipo.

Al terminar (en lenguaje claro, no en jerga):
- Qué se guardó en el proyecto y qué carpeta usa mi herramienta (sin listar solo rutas crípticas).
- Pídeme recargar la herramienta que elegí.
- Dime que el arnés quedó solo en esa herramienta. Si después uso otra, el comando es `$HF install --target <id>` y `$HF sync --target <id>` (claude, codex, cursor, …). No hace falta repetir el onboard.
- doctor puede salir con código 0, "Harness health: healthy" y "Onboarding readiness: pending" si constitution.md sigue en draft. Eso es una instalación terminada: dilo, y que la constitución se completa antes del primer trabajo SDD.
- No digas "listo" si health es unhealthy o readiness es incomplete. Explica el fallo en una frase y el siguiente comando.
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

### Desinstalar

Desde la raíz del proyecto. El menú pide respuestas, así que hace falta una terminal real. Un agente sin TTY no debe inventar el menú: usa los comandos directos.

```bash
$HF remove          # alias: desinstalar
$HF uninstall       # el mismo menú si hay TTY
```

| Opción del menú | Qué quita |
|-----------------|-----------|
| Skills cableadas | Las que marques (reglas del asistente y copia en `.rsc/skills/`) |
| Un asistente | Cableado de Cursor, Claude, etc., y esa entrada en `.rsc.json` |
| Opt-in del catálogo | Skills aceptadas de autoskills: disco y `catalog.selected` |
| Todo el harness | Vista previa, confirmación, y pregunta aparte para borrar `02-DOCS/wiki` |

Sin menú:

```bash
$HF uninstall dart-best-practices flutter-expert
$HF uninstall dart-best-practices --dry-run
$HF purge --dry-run          # solo lista
$HF purge                    # borra el harness; conserva 02-DOCS/wiki
$HF uninstall --all          # igual que purge
$HF purge --with-docs        # también la wiki del harness
```

Después de un purge, recarga el asistente. Si el proyecto tiene git y esos archivos ya estaban en el historial, no hagas commit de los borrados si solo querías quitar el harness en esta máquina.

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