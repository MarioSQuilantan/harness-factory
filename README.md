# Harness Factory

A harness for the repository you code in. Every install ships the essential skills. A skill you place at `skills/<id>/SKILL.md` wins over the shipped skill with the same id. Skills from the [autoskills](https://autoskills.sh/) registry install only after you accept them. Autoskills is **CC-BY-NC-4.0**.

Requires **Node.js >= 22.6**. From your project root:

```bash
HF="npx --yes git+https://github.com/MarioSQuilantan/harness-factory.git"
```

`--target` is the app (Cursor, Claude Code, Codex…), not the chat model. You can select several: `--target cursor,claude`.

## Install prompt

Paste this into the chat of the agent that has a terminal:

```
Install this repository https://github.com/MarioSQuilantan/harness-factory in this project.
```

## Install interview

When that prompt is used, read this section before any install command. Show **one question per screen**. Do not group questions in one form. After the person answers, wait until they press Next, then show the next question. Every question must include one option marked **Recommended**. A recommendation is not an answer: do not run onboard until they pick or confirm each one.

1. First question, single choice: "Which language do you speak?" English, Spanish, Portuguese, French, or another they type. **Recommended:** the language of this chat. Ask every later question, and write every reply, in the language they choose.
2. Multi-select, not one letter: "Which tools do you use to code here? Select every one you use." Cursor, Claude Code, Codex, Copilot, Gemini, OpenCode, Junie, Kiro, Windsurf, Cline, Roo Code, Continue, Antigravity, Zed, Amp, DeepSeek, Pi, Jules, Aider. **Recommended:** the app this chat is running in, pre-checked; they may add others. Map the chosen ones to `--target` separated by commas (`cursor,claude`).
3. What are you building? App or web | operations | research | content | mixed. → `software` | `operations` | `research` | `content` | `mixed`. **Recommended:** `software` when the repo is an app; otherwise the closest match, still shown as a choice.
4. If it is software: small, growing, or complex? → `small` | `growing` | `complex`. **Recommended:** `small` for a new or single-purpose app.
5. If it is software: straight to main, or branches and PRs? → `main` | `branches`. **Recommended:** `main`.
6. How should instructions be written: technical, with analogies, or a mix? → `technical` | `non-technical` | `mixed`. **Recommended:** `mixed`.
7. In one sentence, what is this project for? **Recommended:** one sentence drafted from the project, shown for them to accept or replace. Copy the sentence they confirm exactly. Both onboard steps use that same sentence.

Summarize the answers in 3 lines and wait for a yes. Then, from the project root, with Node >= 22.6:

```bash
HF="npx --yes git+https://github.com/MarioSQuilantan/harness-factory.git"
$HF catalog refresh
$HF onboard --technical-level <…> --project-kind <…> --goal "<same sentence>" --target <id,id> [--software-scope <…> --workflow <…>]
# copy "Plan id:", then repeat the same command with --accept-plan <id>
$HF catalog suggest
# Ask which skills to install and wait for the answer before the next command.
# Accepted ids: $HF catalog add <id> --install
# None: $HF catalog add --skip
$HF install && $HF sync && $HF doctor
```

Install a catalog skill only after the person accepts it. Do not install a flagged skill. Say that autoskills is CC-BY-NC. Do not run `install` before that answer. `install` opens the status page once, after the skills are in place. `healthy` with `Onboarding readiness: pending` means the install is done. Do not say "done" if health is unhealthy or readiness is incomplete.

If a failure is unclear, rerun the command with `--verbose` (or `HF_VERBOSE=1`).

## Status

From the project root:

```bash
$HF status
$HF status --open
$HF status --json
```

Writes `.rsc/status.html`: health, skills, flagged catalog ids, context size, memory sessions, and the model shared by each tool's subagents. The page stays on this machine. It opens by itself at the end of the first `install`, after the skill question has been answered.

## Add another tool

The harness does not notice that you switched apps. What is already installed stays. To add one:

```bash
$HF install --target claude
$HF sync --target claude
```

These commands write the harness into that app: skills, hooks, and subagents. Editor plugins stay on their own install. The Flutter plugin is [Flutter Clean Architecture](https://github.com/MarioSQuilantan/agent-plugins); follow its Installation section, then reload the app.

Several at once: `--target claude,codex`. Reload that app afterward.

| Id | Tool | Where it writes | Subagents |
|----|------|-----------------|-----------|
| `cursor` | Cursor | `.cursor/` | yes |
| `claude` | Claude Code | `.claude/` | yes |
| `codex` | Codex CLI | `.codex/` and `AGENTS.md` | yes |
| `copilot` | GitHub Copilot | `.github/` | yes |
| `gemini` | Gemini CLI | `GEMINI.md` | yes |
| `opencode` | OpenCode | `.opencode/` | yes |
| `junie` | JetBrains Junie | `.junie/` | yes |
| `kiro` | Kiro | `.kiro/` | yes |
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

Subagents (`developer`, `finding-verifier`, `refuter-correctness`, `refuter-security`, `refuter-tests`) are created only when the accepted plan selects them and the tool is marked yes. On that tool they share one model. Check or change it with `$HF agent-model cursor status` and `$HF agent-model cursor <model|inherit>`.

## Skills

```bash
$HF catalog suggest
$HF consult "what this project needs"
$HF catalog add <id> --install
$HF add <id>
```

The essential skills are already installed. A local skill in `skills/<id>/SKILL.md` wins over the shipped skill and over the registry skill with the same id. A flagged skill is not installed until you accept it.

## Uninstall

In a real terminal, `$HF remove` (alias `desinstalar`) asks what to remove: skills, one assistant, the catalog opt-in, or the whole harness. Without a terminal:

```bash
$HF uninstall <id>
$HF uninstall <id> --dry-run
$HF purge --dry-run
$HF purge
$HF purge --with-docs
```

`purge` keeps `02-DOCS/wiki` unless you pass `--with-docs`. Do not commit the deletions if you only wanted the harness gone on this machine.

## License

Harness Factory is **MIT** (includes the rsc-harness copyright notice). Autoskills content is **CC-BY-NC-4.0**. Based on Eric Risco’s rsc-harness. The skill registry is midudev/autoskills.
