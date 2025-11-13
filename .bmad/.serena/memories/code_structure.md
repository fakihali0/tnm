# Code Structure
- `tnm_concept/src`: Vite React entry (`main.tsx`, `App.tsx`) plus feature folders (`components`, `pages`, `hooks`, `services`, `store`, `integrations`, `utils`, `styles`).
- `tnm_concept/public`: static assets for Vite build; `package.json` defines scripts, dependencies, and lint/test tooling.
- `docs/`: PRD/architecture references (e.g., `PRD-MT5-Integration-Service.md`, `epics.md`, `technical/`), sprint tracker (`sprint-status.yaml`), and `stories/` for drafted stories.
- Root-level helper folders: `.bmad/` automation configs, `.bmad-ephemeral/` temp output, `scripts/` for ops tooling.