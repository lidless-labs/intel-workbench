# Repository Guidance

## Definition of Done
```
./scripts/verify
```
This runs typecheck, lint, tests, and build in CI order (same as `.github/workflows/ci.yml`).

A change is done only when the verify script passes locally. Run it and report the actual results. If any command fails, report the failure output verbatim and do not claim success. Never describe a change as complete, green, or working without having run these in this session.

## Project Shape (verified facts)
- Single-page React 18 + TypeScript app: a library of Structured Analytic Techniques (ACH, Key Assumptions Check, Quality of Information Check, plus planned SATs) for cyber threat intelligence. No backend. All user state lives in localStorage, on the user's machine only.
- Public repo at github.com/solomonneas/intel-workbench, deployed to intel-workbench.vercel.app via Vercel (`vercel.json`, SPA rewrite to `index.html`).
- Entry: `src/main.tsx` -> `src/App.tsx` -> `src/routes.tsx`. Pages in `src/pages/`, feature components in `src/components/<feature>/` (ach, kac, qoic, attack, bias, diamond, ioc, layout, shared).
- State: Zustand with `persist` middleware in `src/store/useProjectStore.ts`, `useDiamondStore.ts`, `useIOCStore.ts`. `CURRENT_SCHEMA_VERSION` is defined in `src/store/types.ts`; per-store migrations live in `src/store/migrations.ts`; migration tests in `src/store/__tests__/migrations.test.ts`.
- Five visual theme variants under `src/variants/v1..v5`, lazy-loaded, routed at `/v1/*` through `/v5/*`, picker at `/`.
- Static datasets in `src/data/`: vendored ATT&CK Enterprise (`attack-enterprise.json`), bias taxonomy, SAT citations. SAT pages render the shared `CitationPanel` sourced from `src/data/citations.ts`.
- Tests run via vitest (jsdom, setup in `src/test/setup.ts`) and live in `__tests__/` folders under `src/utils/` and `src/store/`. `npm run test:watch` for watch mode, `npm run format` for prettier.

## Hard Prohibitions
- Never change the shape of persisted store state without a schema migration AND a migration test. Users' localStorage is the only copy of their data; there is no backend to recover from. Bump `CURRENT_SCHEMA_VERSION` in `src/store/types.ts`, add a forward migration step in `src/store/migrations.ts`, keep all old migration steps, and add a case to `src/store/__tests__/migrations.test.ts` proving old data migrates.
- Never weaken, skip, delete, or `.skip` a failing test to get green. Fix the code or report the failure.
- Never push with `--no-verify`. `core.hooksPath` is `hooks/`, and `hooks/pre-push` scans the working tree with content-guard (`~/repos/content-guard`, policy `policies/public-repo.json`). If it blocks, fix the leak or add an inline `<!-- content-guard: allow <rule-id> -->` tag for a confirmed false positive.
- Never invent commands. The only npm scripts are: dev, build, preview, test, test:watch, typecheck, lint, format. If a command you need does not exist, say so.
- Never work around a blocker silently. If you hit a missing dependency, failing install, permission error, or ambiguous requirement, stop and report the exact blocker and error text.
- Never force-add gitignored local files: `ROADMAP.md`, `PHASE4_SPEC.md`, `memory/`, `.brigade/`.

## Working Rules (trigger -> rule)
- Touching any type, interface, or exported API -> run `npm run typecheck` before claiming the change compiles.
- Touching store files, persisted fields, or `migrations.ts` -> run `npm test` and confirm `migrations.test.ts` passes; add a test for any new migration step.
- Touching routes, lazy imports, or variants -> run `npm run build`; typecheck alone does not catch broken dynamic imports.
- Adding a new SAT or variant -> update the README's SAT table, feature list, and screenshots in the same change; the README is the public face of the project.
- Updating the ATT&CK dataset -> use the curl + `jq -f scripts/slim-attack.jq` recipe in that script's header comment. Never hand-edit `attack-enterprise.json`.
- Citing or documenting config -> read the config file itself, not the docs (see Gotchas).
- About to commit -> stage only the files you changed for this task; do not sweep in unrelated working-tree changes.

## Gotchas
- Docs drift: `docs/CONFIGURATION.md` claims port 5182 and `VITE_*` env vars, but `vite.config.ts` sets port 5173 and no env vars are read anywhere. Trust the config files.
- `PHASE4_SPEC.md` is archived and superseded; the active plan is `ROADMAP.md` (both local-only, gitignored).
- This is a public repo. Anything you commit ships to GitHub and Vercel. Treat every string, comment, and fixture as public.

## Memory Handoff
At the end of any substantial task, write a handoff note to `.claude/memory-handoffs/` using that directory's `TEMPLATE.md`. Record durable discoveries, gotchas, and decisions made during the task. Do not wait to be reminded.
