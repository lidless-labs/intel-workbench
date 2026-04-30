import { describe, it, expect } from 'vitest';
import type { ACHMatrix, KeyAssumption, Evidence } from '../../types';
import {
  computeAssumptionRiskScore,
  findUnexaminedAssumptions,
  shouldShowAssumptionAuditBanner,
  nextAssumptionStatus,
  ASSUMPTION_STATUS_LABELS,
} from '../kac';

function assumption(over: Partial<KeyAssumption> = {}): KeyAssumption {
  return {
    id: 'a',
    text: 't',
    status: 'unassessed',
    rationale: '',
    linkedEvidenceIds: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...over,
  };
}

function evidence(id: string): Evidence {
  return {
    id,
    description: id,
    source: '',
    credibility: 'Medium',
    relevance: 'Medium',
  };
}

function matrix(over: Partial<ACHMatrix> = {}): ACHMatrix {
  return {
    id: 'm',
    name: 'm',
    hypotheses: [],
    evidence: [],
    ratings: {},
    assumptions: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...over,
  };
}

describe('computeAssumptionRiskScore', () => {
  it('returns 0 for an empty matrix', () => {
    expect(computeAssumptionRiskScore(matrix())).toBe(0);
  });

  it('weights statuses correctly: unsupported=1, caveated=0.5, unassessed=0.25, supported=0', () => {
    const m = matrix({
      assumptions: [
        assumption({ id: '1', status: 'unsupported' }),
        assumption({ id: '2', status: 'caveated' }),
        assumption({ id: '3', status: 'unassessed' }),
        assumption({ id: '4', status: 'supported' }),
      ],
    });
    expect(computeAssumptionRiskScore(m)).toBeCloseTo(1.75);
  });
});

describe('findUnexaminedAssumptions', () => {
  it('returns empty when matrix has no evidence', () => {
    const m = matrix({ assumptions: [assumption()] });
    expect(findUnexaminedAssumptions(m)).toEqual([]);
  });

  it('returns assumptions with no linked evidence when matrix has evidence', () => {
    const m = matrix({
      evidence: [evidence('e1')],
      assumptions: [
        assumption({ id: 'a1', linkedEvidenceIds: [] }),
        assumption({ id: 'a2', linkedEvidenceIds: ['e1'] }),
      ],
    });
    const unexamined = findUnexaminedAssumptions(m);
    expect(unexamined.map((a) => a.id)).toEqual(['a1']);
  });
});

describe('shouldShowAssumptionAuditBanner', () => {
  it('false when no assumptions and no evidence', () => {
    expect(shouldShowAssumptionAuditBanner(matrix())).toBe(false);
  });

  it('true when at least one assumption is unsupported', () => {
    const m = matrix({ assumptions: [assumption({ status: 'unsupported' })] });
    expect(shouldShowAssumptionAuditBanner(m)).toBe(true);
  });

  it('true when matrix has evidence and at least one assumption is unlinked', () => {
    const m = matrix({
      evidence: [evidence('e1')],
      assumptions: [assumption()],
    });
    expect(shouldShowAssumptionAuditBanner(m)).toBe(true);
  });

  it('false when all assumptions are supported and linked', () => {
    const m = matrix({
      evidence: [evidence('e1')],
      assumptions: [assumption({ status: 'supported', linkedEvidenceIds: ['e1'] })],
    });
    expect(shouldShowAssumptionAuditBanner(m)).toBe(false);
  });
});

describe('nextAssumptionStatus', () => {
  it('cycles unassessed → supported → caveated → unsupported → unassessed', () => {
    expect(nextAssumptionStatus('unassessed')).toBe('supported');
    expect(nextAssumptionStatus('supported')).toBe('caveated');
    expect(nextAssumptionStatus('caveated')).toBe('unsupported');
    expect(nextAssumptionStatus('unsupported')).toBe('unassessed');
  });
});

describe('ASSUMPTION_STATUS_LABELS', () => {
  it('covers all 4 statuses with non-empty labels', () => {
    for (const s of ['supported', 'caveated', 'unsupported', 'unassessed'] as const) {
      expect(ASSUMPTION_STATUS_LABELS[s]).toBeTruthy();
    }
  });
});
