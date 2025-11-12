# Suggested Commands
- Install deps: `npm install` (project ships with `package-lock.json`; Bun `bun install` is also possible but npm is the default).
- Local dev server: `npm run dev` (Vite with hot reload) and optionally `npm run build:dev` for a faster non-minified bundle snapshot.
- Production build & preview: `npm run build` followed by `npm run preview` to serve the `dist/` output locally.
- Quality gates: `npm run lint` (ESLint via flat config) and `npm run test` (Vitest). Run both before opening a PR/turning in work.
- Bundle analysis utilities: `node scripts/analyze-bundle.js` or `node scripts/check-bundle-size.js` after building to keep an eye on regressions.
- Common macOS CLI helpers: `git status` (check worktree), `ls`/`find` (inspect files), `rg "pattern" -n` (fast searches), `npm run <script> -- --watch` (when Vitest watch mode is needed).