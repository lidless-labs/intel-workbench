<p align="center">
  <a href="https://intel-workbench.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-intel--workbench.vercel.app-22c55e?style=flat-square&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <img src="https://github.com/solomonneas/intel-workbench/actions/workflows/ci.yml/badge.svg" alt="CI" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Zustand-4-FFD43B?style=flat-square" alt="Zustand" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

# 🛡️ Solomon's Intel Workbench

**A library of Structured Analytic Techniques (SATs) for cyber threat intelligence.** ACH, Key Assumptions Check, Quality of Information Check, Indicators of Change, Devil's Advocacy, Premortem, and Red Team - all sharing one evidence/hypothesis substrate. Anchored in CIA's *A Tradecraft Primer for Intelligence Analysis* (Sherman Kent School, March 2009) and Heuer & Pherson, *Structured Analytic Techniques for Intelligence Analysis*, 3rd ed. (CQ Press, 2020).

> **Try it now → [intel-workbench.vercel.app](https://intel-workbench.vercel.app)**

![Intel Workbench dashboard](docs/screenshots/dashboard.png)

---

## SAT Library

Intel Workbench ships seven Structured Analytic Techniques sharing a common evidence and hypothesis substrate. Each technique is grounded in a citable source (CIA's *Tradecraft Primer* and/or the Heuer & Pherson textbook) and surfaces that citation in-app via a shared methodology panel.

| Tier | Technique | Citation | Status |
|------|-----------|----------|--------|
| Diagnostic | Key Assumptions Check | Tradecraft Primer pp. 7-9; Heuer & Pherson 3e ch. 8 | Phase 1 |
| Diagnostic | Quality of Information Check | Tradecraft Primer pp. 11-13; Heuer & Pherson 3e ch. 9 | Phase 1 |
| Diagnostic / Forward-looking | Indicators / Signposts of Change | Tradecraft Primer pp. 15-18; Heuer & Pherson 3e ch. 10 | Phase 2 |
| Contrarian | Devil's Advocacy | Tradecraft Primer pp. 21-23; Heuer & Pherson 3e ch. 11 | Phase 3 |
| Contrarian | Premortem Analysis | Tradecraft Primer pp. 25-27; Heuer & Pherson 3e ch. 11 | Phase 3 |
| Contrarian | Analysis of Competing Hypotheses (ACH) | Tradecraft Primer pp. 29-32; Heuer & Pherson 3e ch. 7 | Shipped |
| Imagination | Red Team Analysis | Tradecraft Primer pp. 35-38; Heuer & Pherson 3e ch. 12 | Phase 4 |

All techniques persist in the same browser-local store and surface in the same evidence/hypothesis matrix, so an analyst can pivot from Key Assumptions Check into ACH into Devil's Advocacy without leaving the workspace or copying data between tools. ICD 203 estimative-language bands sit on top of every SAT as the universal write-up overlay.

See [ROADMAP.md](ROADMAP.md) for the four-phase delivery plan.

---

## ✨ Features

- **ACH Matrix** : Interactive evidence-vs-hypothesis grid with consistency ratings (C/I/N/NA), weighted scoring, and automatic preferred-hypothesis identification
- **MITRE ATT&CK Tagging** : Tag evidence and hypotheses with techniques from the Enterprise ATT&CK matrix (691 techniques, 14 tactics). Searchable by ID, name, or tactic. Vendored locally so the workbench stays offline-first
- **Cognitive Bias Checklist** : Heuer & Pherson taxonomy with 12 biases across Cognitive, Analytical, and Social categories; track mitigation notes per bias
- **Score Visualization** : Real-time normalized score bars showing hypothesis support levels with color-coded confidence indicators
- **ICD 203 Estimative Language** : Pick a likelihood band ("almost no chance" through "almost certainly") with the canonical 1-5%/5-20%/.../95-99% ranges per ODNI Analytic Standards; the preferred hypothesis displays a probability ribbon on the matrix and in Markdown exports
- **Evidence Weighting** : Credibility and relevance ratings (High/Medium/Low) that feed into weighted inconsistency scores
- **Export & Import** : Full JSON export/import for backup and sharing; Markdown export for report generation (includes ATT&CK technique IDs)
- **5 Visual Themes** : Langley (classified intel), Terminal (hacker/OSINT), Analyst's Desk (clean professional), Stratcom (military command), Cyber Noir (cyberpunk)
- **In-App Guided Tour** : First-visit walkthrough powered by driver.js highlighting every major feature
- **Built-In Documentation** : Comprehensive help page covering ACH methodology, scoring, bias awareness, and keyboard shortcuts
- **Offline-First** : All data persisted in localStorage; works without any server
- **Keyboard Accessible** : Full keyboard navigation across the matrix grid

---

## 🏗️ Architecture

Intel Workbench is a **single-page React application** with no backend dependencies:

```
Browser
  └─ React 18 (SPA, React Router v6)
       ├─ Zustand Store ← persist middleware → localStorage
       ├─ ThemeContext (per-variant color tokens)
       ├─ Pages: Home / ACH / Bias / Export / Docs
       └─ 5 Variant Layouts (lazy-loaded)
```

- **State Management:** Zustand with `persist` middleware writes to `localStorage` under the key `intel-workbench-projects`
- **Routing:** React Router v6 with nested variant routes (`/v1/*`, `/v2/*`, …, `/default/*`) and a variant picker at `/`
- **Theming:** `ThemeContext` provides color tokens per variant; components read them via `useTheme()`
- **Code Splitting:** Variant layouts are `React.lazy()` loaded to keep the initial bundle small

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Install & Run

```bash
git clone https://github.com/solomonneas/intel-workbench.git
cd intel-workbench
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Run Tests

```bash
npm test         # vitest, single run
npm run test:watch
npm run typecheck
```

CI runs typecheck + tests + production build on every push (`.github/workflows/ci.yml`).

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18 | Component UI |
| **Language** | TypeScript 5 | Type safety |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **State** | Zustand 4 | Global state + persistence |
| **Routing** | React Router 6 | Client-side navigation |
| **Icons** | Lucide React | Consistent icon set |
| **Bundler** | Vite 7 | Dev server + build |
| **Tour** | driver.js 1.3 (CDN) | Guided onboarding |

---

## 📁 Project Structure

```text
intel-workbench/
├── index.html                 # Entry point + CDN links
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── public/
│   └── vite.svg
└── src/
    ├── main.tsx               # React root
    ├── App.tsx                # Router + variant routes
    ├── index.css              # Tailwind layers + component classes
    ├── components/
    │   ├── ach/
    │   │   ├── ACHMatrix.tsx  # Interactive hypothesis matrix
    │   │   └── ACHScoreBar.tsx
    │   ├── bias/
    │   │   └── BiasChecklist.tsx
    │   ├── layout/
    │   │   └── AppShell.tsx   # Default sidebar layout
    │   └── GuidedTour.tsx     # driver.js onboarding tour
    ├── contexts/
    │   └── ThemeContext.tsx    # Theme color provider
    ├── data/
    │   ├── biasData.ts        # Cognitive bias catalog
    │   └── sampleProject.ts   # Sandworm sample data
    ├── pages/
    │   ├── HomePage.tsx       # Project list & creation
    │   ├── ACHPage.tsx        # Matrix workspace
    │   ├── BiasPage.tsx       # Bias review
    │   ├── ExportPage.tsx     # JSON/Markdown export
    │   ├── DocsPage.tsx       # In-app help & documentation
    │   └── VariantPicker.tsx  # Theme selector landing
    ├── store/
    │   └── useProjectStore.ts # Zustand store (persisted)
    ├── types/
    │   └── index.ts           # TypeScript interfaces
    ├── utils/
    │   ├── achScoring.ts      # Scoring algorithms
    │   ├── id.ts              # ID generator
    │   └── useBasePath.ts     # Variant-aware navigation
    └── variants/
        ├── v1/Layout.tsx      # Langley (intel agency)
        ├── v2/Layout.tsx      # Terminal (hacker)
        ├── v3/Layout.tsx      # Analyst's Desk (clean)
        ├── v4/Layout.tsx      # Stratcom (military)
        └── v5/Layout.tsx      # Cyber Noir (cyberpunk)
```

---

## 🎨 5 Variants

Each variant wraps the same core pages in a unique visual identity:

| Variant | Theme | Aesthetic |
|---------|-------|-----------|
| **v1 : Langley** | Intelligence Agency | Dark navy, gold accents, serif type, classified stamps |
| **v2 : Terminal** | Hacker / OSINT | Pure black, matrix green, scanline overlay, monospace |
| **v3 : Analyst's Desk** | Clean Professional | Light backgrounds, blue accents, content-first layout |
| **v4 : Stratcom** | Military Command | OD green, amber accents, grid patterns, military time |
| **v5 : Cyber Noir** | Cyberpunk | Neon cyan + magenta, glow effects, glass-morphism |

<p align="center">
  <img src="docs/screenshots/variant-v1-langley.png" width="49%" alt="Langley variant" />
  <img src="docs/screenshots/variant-v2-terminal.png" width="49%" alt="Terminal variant" />
</p>
<p align="center">
  <img src="docs/screenshots/variant-v3-analysts-desk.png" width="49%" alt="Analyst's Desk variant" />
  <img src="docs/screenshots/variant-v4-stratcom.png" width="49%" alt="Stratcom variant" />
</p>
<p align="center">
  <img src="docs/screenshots/variant-v5-cyber-noir.png" width="60%" alt="Cyber Noir variant" />
</p>

All variants share the same Zustand store and page components. Switching themes is instant : just navigate back to the variant picker at `/`.

---

## 🎯 MITRE ATT&CK Integration

Tag evidence and hypotheses with techniques from the **MITRE ATT&CK Enterprise** matrix. Search by technique ID (`T1059`), name (`Phishing`), or filter by tactic (Initial Access, Execution, Lateral Movement, …). Tags persist in JSON exports and are rendered as clickable references in Markdown reports.

![ATT&CK technique tagger](docs/screenshots/attack-tagger.png)

The full ATT&CK Enterprise dataset (691 techniques, 14 tactics) is vendored at `src/data/attack-enterprise.json` and lazy-loaded so the initial bundle stays small. To refresh after a new ATT&CK release:

```bash
curl -sL https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json \
  | jq -f scripts/slim-attack.jq > src/data/attack-enterprise.json
```

---

## 📊 Methodology

Intel Workbench is organized as a library of Structured Analytic Techniques. The seven SATs are grouped by tier per CIA's *A Tradecraft Primer for Intelligence Analysis* (Sherman Kent School, March 2009):

- **Diagnostic** techniques surface unstated premises and stress-test the inputs to an assessment. Key Assumptions Check and Quality of Information Check are the canonical pair.
- **Forward-looking diagnostics** translate hypotheses into observable signals an analyst can watch for. Indicators / Signposts of Change is the workbench's bridge between IOC extraction and live hypothesis tracking.
- **Contrarian** techniques challenge a preferred line of analysis. Devil's Advocacy, Premortem Analysis, and Analysis of Competing Hypotheses sit in this tier.
- **Imagination** techniques model the adversary's perspective. Red Team Analysis is the lone imagination-tier SAT shipped here, anchored in the existing Diamond Model store.

Every SAT page renders a shared citation panel pointing to the relevant *Tradecraft Primer* page range and Heuer & Pherson chapter. ICD 203 estimative-language bands ("almost no chance" through "almost certainly", per ODNI Analytic Standards) sit on top of every technique as the universal write-up overlay.

### ACH Scoring Formula

The Analysis of Competing Hypotheses module continues to use Richards J. Heuer Jr.'s weighted-inconsistency scoring:

```text
Score = Σ (weight × rating_value)

where:
  rating_value: I = +2, N = 0, C = −1
  weight:       credibility_multiplier × relevance_multiplier
  multipliers:  High = 1.5, Medium = 1.0, Low = 0.5
```

Lower (more negative) scores indicate stronger support. The hypothesis with the lowest score is flagged as **preferred**. The key insight: **disprove rather than prove.** A single strong inconsistency can eliminate a hypothesis, while consistent evidence alone cannot confirm one.

---

## 📄 License

MIT : see [LICENSE](LICENSE) for details.
