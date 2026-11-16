# Harness Factory

Arnés para el repositorio en el que programas. No trae un catálogo de skills: las tuyas viven en `skills/<id>/SKILL.md`. Las del registro [autoskills](https://autoskills.sh/) solo se instalan si las aceptas. Autoskills es **CC-BY-NC-4.0**.

Hace falta **Node.js >= 22.6**. Desde la raíz de tu proyecto:

```bash
HF="npx --yes git+https://github.com/MarioSQuilantan/harness-factory.git"
```

`--target` es la aplicación (Cursor, Claude Code, Codex…), no el modelo del chat. Puedes marcar varias: `--target cursor,claude`.

## Prompt para el agente

Pega este bloque en el chat del agente que tenga terminal. Pregunta en español llano y no muestres flags; tú los traduces.

```
Instala Harness Factory en la raíz de ESTE repo. No lo clones dentro del proyecto ni lo agregues a package.json.
Comprueba Node >= 22.6. CLI: HF="npx --yes git+https://github.com/MarioSQuilantan/harness-factory.git"
Todos los comandos desde esta raíz.

Pregunta en español, sin mostrar flags. La primera es de varias casillas, no una sola letra.
1. "¿Con qué herramientas programas aquí? Marca todas las que uses."
   Casillas (marca Cursor si ya estás en Cursor): Cursor, Claude Code, Codex, Copilot, Gemini, OpenCode, Junie, Kiro, Windsurf, Cline, Roo Code, Continue, Antigravity, Zed, Amp, DeepSeek, Pi, Jules, Aider.
   --target con las elegidas separadas por coma (cursor,claude). No instales las que no marcó.
2. ¿Qué construyes? App o web | operaciones | investigación | contenido | mezcla. → software | operations | research | content | mixed
3. Si es software: ¿pequeño, creciendo o complejo? → small | growing | complex
4. Si es software: ¿directo en main, o ramas y PR? → main | branches
5. ¿Instrucciones técnicas, con analogías, o mezcla? → technical | non-technical | mixed
6. En una frase, ¿para qué es el proyecto? Cópiala tal cual. Se usa igual en los dos pasos.
Resume en 3 líneas y espera un "sí".

Luego, sin menús:
1. $HF catalog refresh
2. $HF onboard con --technical-level --project-kind --goal --target y, si aplica, --software-scope --workflow. Anota la línea "Plan id:".
3. El mismo comando, mismos valores y la misma frase --goal, más --accept-plan <ese id>.
4. $HF catalog suggest. Muéstrame la lista. Instala con $HF catalog add <id> --install solo las que yo acepte. Si dice flagged, no la instales. Avisa que autoskills es CC-BY-NC. Una skill local va en skills/<id>/SKILL.md y luego $HF add <id>.
5. $HF install && $HF sync && $HF doctor

Al cerrar, en lenguaje claro: qué quedó instalado, pídeme recargar esas herramientas, y di que otra se agrega después con $HF install --target <id> && $HF sync --target <id>.
"healthy" con "Onboarding readiness: pending" es instalación terminada; la constitución en draft se completa antes del primer trabajo SDD.
No digas "listo" si health es unhealthy o readiness es incomplete: di el fallo y el siguiente comando.
Desinstala solo si lo pido: $HF remove en terminal, o $HF uninstall <id> / $HF purge --dry-run. No hagas commit de esos borrados.
```

Si el fallo no se entiende, repite el comando con `--verbose` (o `HF_VERBOSE=1`).

## Agregar otra herramienta

El arnés no detecta que cambiaste de aplicación. Lo ya instalado no se borra. Para sumar una:

```bash
$HF install --target claude
$HF sync --target claude
```

Varias a la vez: `--target claude,codex`. Recarga esa aplicación después.

| Id | Herramienta | Dónde escribe | Subagentes |
|----|-------------|---------------|------------|
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

Los subagentes (`developer`, `finding-verifier`, `refuter-correctness`, `refuter-security`, `refuter-tests`) solo se crean si el plan los eligió y la herramienta está marcada con «sí». En esa herramienta comparten un modelo. Para verlo o cambiarlo: `$HF agent-model cursor status` y `$HF agent-model cursor <modelo|inherit>`.

## Skills

```bash
$HF catalog suggest
$HF consult "lo que necesita el proyecto"
$HF catalog add <id> --install
$HF add <id>
```

Una skill local en `skills/<id>/SKILL.md` gana a la del registro con el mismo id. Una skill `flagged` no se instala hasta que la aceptes.

## Desinstalar

En una terminal real, `$HF remove` (o `desinstalar`) pregunta qué quitar: skills, un asistente, el opt-in del catálogo, o todo el arnés. Sin terminal:

```bash
$HF uninstall <id>
$HF uninstall <id> --dry-run
$HF purge --dry-run
$HF purge
$HF purge --with-docs
```

`purge` conserva `02-DOCS/wiki` salvo que pases `--with-docs`. No hagas commit de los borrados si solo querías quitar el arnés en esta máquina.

## Licencia

Harness Factory es **MIT** (incluye el aviso de copyright de rsc-harness). El contenido de autoskills es **CC-BY-NC-4.0**. Basado en el rsc-harness de Eric Risco. El registro de skills es de midudev/autoskills.
