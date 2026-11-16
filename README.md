# Harness Factory

Fork of [rsc-harness](https://github.com/ericrisco/rsc-harness) for a **BYO-first** agent harness:

- No embedded skill catalog in the npm package.
- **Your** skills live under `skills/<id>/SKILL.md` in the project.
- **Recommendations** come from the [autoskills](https://autoskills.sh/) registry; nothing installs until you opt in (`catalog add` or an accepted onboarding plan).
- Installed skills are materialized under `.rsc/skills/` and wired to Cursor, Claude, etc. via the same `targets/` adapters as rsc.

## Requirements

- Node.js **>= 22.6** (autoskills dependency)
- Non-commercial use if you rely on the `autoskills` npm package (**CC-BY-NC-4.0**)

## CLI

```bash
cd /path/to/your/project
npx harness-factory onboard
harness-factory catalog suggest
harness-factory catalog add vitest
harness-factory install    # wire hooks/agents + declared local/catalog skills
harness-factory            # interactive wizard (sync, declared wire-up, catalog browse)
harness-factory sync
harness-factory doctor
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