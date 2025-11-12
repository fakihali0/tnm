# Task Completion Checklist
- Run the relevant npm scripts before handing work back: at minimum `npm run lint` and `npm run test`, plus `npm run build` if the change touches bundling, routing, or PWA/service-worker behavior.
- Verify UX-critical flows that rely on Supabase auth, i18n namespaces, and route animations—e.g., confirm protected TNM Pro routes still gate properly and that translation bundles load without console errors.
- Re-run any bundle/perf scripts (`node scripts/check-bundle-size.js`) when adding large dependencies or assets; update the docs in `/docs` if a fix/feature relates to security, audits, or completion reports.
- Ensure environment variables referenced in the change (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.) are documented or validated so other developers can reproduce the behavior locally.
- For deployment, verify Lovable/Vercel settings (CSP headers, Supabase keys) still match README guidance before asking for publish/share.