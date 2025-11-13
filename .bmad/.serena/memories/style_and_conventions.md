# Style & Conventions
- Frontend uses React function components with TypeScript + hooks; prefer component co-location inside feature folders.
- Styling via Tailwind classes and shadcn-ui primitives; motion handled with Framer Motion `PageTransition` helper.
- Configuration/utility modules live under `src/lib`, `src/utils`, `src/services`; Zustand handles shared state.
- Docs/stories written in Markdown with structured sections (story, ACs, tasks, Dev Notes, Dev Agent Record).