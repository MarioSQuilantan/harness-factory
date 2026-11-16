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
harness-factory sync
harness-factory doctor
```

### Catalog commands

| Command | Purpose |
|---------|---------|
| `catalog refresh` | Reload autoskills registry cache |
| `catalog suggest` | Stack-based suggestions (deferred until you add them) |
| `catalog add <id...>` | Record opt-in in `.rsc.json` and install on next sync/onboard |
| `catalog` | List registry skills |

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