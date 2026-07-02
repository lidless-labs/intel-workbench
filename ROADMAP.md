# Intel Workbench Roadmap

Intel Workbench is delivered as a library of Structured Analytic Techniques (SATs), grounded in CIA's *A Tradecraft Primer for Intelligence Analysis* (Sherman Kent School, March 2009) and Heuer & Pherson, *Structured Analytic Techniques for Intelligence Analysis*, 3rd ed. (CQ Press, 2020). The roadmap below ships the remaining six SATs across four phases. ACH is already in production.

## Phase 1 (current): Diagnostic foundation

- **Key Assumptions Check (KAC)**: Surface the unstated assumptions underpinning an analytic line before drafting hypotheses, mark each Supported / Unsupported / Caveated, link assumptions to evidence, and re-audit when the matrix changes. Citation: Tradecraft Primer pp. 7-9; Heuer & Pherson 3e ch. 8.
- **Quality of Information Check (QoIC)**: Decorate every evidence row with Admiralty A-F reliability and 1-6 accuracy, corroboration status, source provenance, recency, and caveats. Overlay only; the existing ACH credibility/relevance scoring math is untouched. Citation: Tradecraft Primer pp. 11-13; Heuer & Pherson 3e ch. 9.
- **Cross-cutting groundwork**: Schema versioning across all three Zustand stores (`useProjectStore`, `useDiamondStore`, `useIOCStore`) with a single `CURRENT_SCHEMA_VERSION` constant, per-store migrate callbacks in `src/store/migrations.ts`, and migration tests. ESLint + Prettier configured ahead of the codebase doubling. jsdom test scaffolding via `@testing-library/react` so each new SAT page can carry a smoke test.

## Phase 2: Indicators / Signposts of Change

- **Indicators / Signposts of Change**: Per-hypothesis lists of observable signals whose appearance would confirm or refute the hypothesis going forward. Promote extracted IOCs into indicators tied to a specific hypothesis and direction, toggle observation status with timestamps, and surface a per-hypothesis "X observed of Y signposts" chip on the matrix. Citation: Tradecraft Primer pp. 15-18; Heuer & Pherson 3e ch. 10.
- **IOC page completion**: Finish the JSON/CSV file import that the existing IOC UI lacks (the bridge from manual paste to file-based ingestion).

## Phase 3: Contrarian techniques

- **Devil's Advocacy**: Structured counter-argument and alternative-mechanism notes attached to a chosen hypothesis (typically the preferred one). Prompts include "Why might the preferred hypothesis be wrong?", "What disconfirming evidence are we discounting?", "What alternative mechanism would produce identical evidence?". Citation: Tradecraft Primer pp. 21-23; Heuer & Pherson 3e ch. 11.
- **Premortem Analysis**: Matrix-scoped failure scenario, root causes, and missing-evidence callouts. Framing prompt: "Imagine it is six months from now and our assessment was wrong. How did we get here?". Citation: Tradecraft Primer pp. 25-27; Heuer & Pherson 3e ch. 11.

## Phase 4: Imagination tier + Diamond completion

- **Red Team Analysis**: Given a Diamond Model event, surface the adversary vertex's data alongside ATT&CK techniques tagged on linked hypotheses, and prompt the analyst for the adversary's likely next move. Includes an ATT&CK adversary heatmap overlay keyed off the existing `attack-enterprise.json` dataset. Citation: Tradecraft Primer pp. 35-38; Heuer & Pherson 3e ch. 12.
- **Diamond page completion**: Empty-state CTA so the "+ Create Event" affordance is reachable when no events exist (currently gated behind populated state).

## Cross-cutting (every phase)

- Each new SAT page renders the shared `<CitationPanel>` component sourced from `src/data/citations.ts`.
- Each phase that adds persisted fields bumps `CURRENT_SCHEMA_VERSION` and adds a forward migration; previous migrations remain.
- ICD 203 estimative-language bands generalize beyond ACH: Devil's Advocacy gets "likelihood of alternative", Premortem gets "likelihood of failure scenario", Red Team gets "likelihood of next action", Indicators get a per-indicator "expected band shift on observation".

---

## Beyond the SAT library

These items remain on the longer-horizon backlog and are not gated by SAT delivery.

- **STIX 2.1 Export**: Convert IOCs and Diamond Model entities into STIX 2.1 bundles for integration with threat intelligence platforms.
- **PDF/CSV Report Generation**: Structured intelligence assessment output (executive summary, key findings, confidence levels, methodology notes), templated after IC report formats.
- **Threat Feed Import**: Ingest OTX pulses, STIX bundles, or CSV IOC lists to auto-populate evidence and IOC entries.
- **Entity Relationship Graph**: Force-directed graph (d3-force) connecting adversaries, infrastructure, capabilities, and victims across projects. Extends Diamond Model into full link analysis.
- **Cross-Project Correlation**: Flag shared IOCs and entities across multiple analyses. Surface patterns and overlaps between investigations.
- ~~**Default Theme with Settings Toggle**: Launch directly into the primary theme; move variant selection to a settings panel.~~ **Done** — the app consolidated to a single UI (`AppShell`) with a light/dark toggle; the five theme variants and the picker were removed.
- **Shareable Read-Only Snapshots**: Export a project as a self-contained static HTML file for review without the full app.
- **Pre-Loaded Case Studies**: Ship 2-3 real-world scenarios (SolarWinds, NotPetya, Log4Shell) so reviewers can explore the tool immediately.
- **Optional Persistence Layer**: Supabase or SQLite backend for team collaboration alongside the existing localStorage mode.
- **Auth and RBAC**: Analyst vs. reviewer roles with scoped permissions.
- **Audit Trail**: Change tracking with timestamps and attribution for analytical accountability.
