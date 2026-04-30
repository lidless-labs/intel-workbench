> **Archived 2026-04-29:** Superseded by the SAT library reframe; ICD 203 work referenced here shipped in the current release. Active roadmap lives in ROADMAP.md.

# Phase 4 Spec: Analytical Depth

## Feature 1: ICD 203 Confidence Levels (FIRST)

### Types (src/types/index.ts)
Add to existing file:
```typescript
export type ConfidenceLevel = 'Low' | 'Moderate' | 'High';
```

Extend Hypothesis interface:
```typescript
export interface Hypothesis {
  // ...existing fields (id, name, description)
  confidence?: ConfidenceLevel;
  confidenceJustification?: string;
}
```

### Store (src/store/useProjectStore.ts)
No new actions needed. `updateHypothesis` already accepts `Partial<Pick<Hypothesis, 'name' | 'description'>>`. Widen it to include `confidence` and `confidenceJustification`.

### UI Changes
In `src/components/ach/ACHMatrix.tsx`:
- Below each hypothesis column header, add a confidence badge (pill/chip)
- Click the badge to cycle: unset → Low → Moderate → High
- Color coding: Low = amber/yellow, Moderate = blue, High = green
- Below the badge, add a small textarea (collapsed by default, expand on click) for `confidenceJustification`

In `src/components/ach/ACHScoreBar.tsx`:
- Append the confidence level badge next to the score bar for each hypothesis
- If no confidence set, show "Unassessed" in gray

In `src/pages/ExportPage.tsx`:
- Include confidence + justification in both JSON and Markdown exports
- Markdown format: "**Confidence:** Moderate — [justification text]"

### ICD 203 Reference
- Low: "roughly even chance" or significant unknowns
- Moderate: information is credibly sourced and plausible but insufficient for higher confidence  
- High: high-quality information from multiple independent sources, logical interpretation

Add a tooltip or small info icon next to the confidence selector that shows these definitions.

### Acceptance Criteria
- [ ] Confidence badge renders on each hypothesis column in ACH matrix
- [ ] Clicking cycles through unset/Low/Moderate/High
- [ ] Justification textarea appears on click
- [ ] Confidence persists in localStorage (Zustand persist handles this automatically)
- [ ] Export includes confidence data in JSON and Markdown
- [ ] Score bar shows confidence badge
- [ ] ICD 203 definitions accessible via tooltip
- [ ] All 5 theme variants render badges correctly (check color contrast)
- [ ] No TypeScript errors, existing tests still pass

## Feature 2: Timeline View (SECOND)
[see ROADMAP.md — spec TBD after Feature 1 ships]

## Feature 3: ATT&CK Mapping (THIRD)  
[see ROADMAP.md — spec TBD after Feature 2 ships]
