import { describe, it, expect } from 'vitest';
import type { ACHMatrix, ConsistencyRating, Evidence, Hypothesis } from '../../types';
import {
  calculateInconsistencyScore,
  calculateAllScores,
  findPreferredHypothesis,
  getNormalizedScores,
  getRatingLabel,
  cycleRating,
} from '../achScoring';

function ev(
  id: string,
  credibility: Evidence['credibility'] = 'Medium',
  relevance: Evidence['relevance'] = 'Medium',
): Evidence {
  return { id, description: id, source: 's', credibility, relevance };
}

function hy(id: string): Hypothesis {
  return { id, name: id, description: '' };
}

function matrix(
  hypotheses: Hypothesis[],
  evidence: Evidence[],
  ratings: Record<string, Record<string, ConsistencyRating>> = {},
): ACHMatrix {
  return {
    id: 'm1',
    name: 'm1',
    hypotheses,
    evidence,
    ratings,
    assumptions: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('calculateInconsistencyScore', () => {
  it('returns 0 for an empty matrix', () => {
    expect(calculateInconsistencyScore(matrix([hy('h1')], []), 'h1')).toBe(0);
  });

  it('returns 0 when no ratings exist for the hypothesis', () => {
    const m = matrix([hy('h1')], [ev('e1')]);
    expect(calculateInconsistencyScore(m, 'h1')).toBe(0);
  });

  it('treats N and NA as zero contribution', () => {
    const m = matrix(
      [hy('h1')],
      [ev('e1'), ev('e2')],
      { e1: { h1: 'N' }, e2: { h1: 'NA' } },
    );
    expect(calculateInconsistencyScore(m, 'h1')).toBe(0);
  });

  it('applies rating weights: I = +2, C = -1', () => {
    const m = matrix([hy('h1')], [ev('e1'), ev('e2')], {
      e1: { h1: 'I' },
      e2: { h1: 'C' },
    });
    // (2 * 1 * 1) + (-1 * 1 * 1) = 1
    expect(calculateInconsistencyScore(m, 'h1')).toBe(1);
  });

  it('applies credibility and relevance multipliers', () => {
    const m = matrix(
      [hy('h1')],
      [ev('e1', 'High', 'High'), ev('e2', 'Low', 'Low')],
      { e1: { h1: 'I' }, e2: { h1: 'I' } },
    );
    // High*High = 1.5*1.5 = 2.25 → 2 * 2.25 = 4.5
    // Low*Low   = 0.5*0.5 = 0.25 → 2 * 0.25 = 0.5
    expect(calculateInconsistencyScore(m, 'h1')).toBeCloseTo(5);
  });

  it('a single high-weight inconsistency outweighs many low-weight consistencies', () => {
    const m = matrix(
      [hy('h1')],
      [
        ev('e1', 'High', 'High'),
        ev('e2', 'Low', 'Low'),
        ev('e3', 'Low', 'Low'),
        ev('e4', 'Low', 'Low'),
      ],
      {
        e1: { h1: 'I' },
        e2: { h1: 'C' },
        e3: { h1: 'C' },
        e4: { h1: 'C' },
      },
    );
    // 2*2.25 + 3*(-1*0.25) = 4.5 - 0.75 = 3.75
    expect(calculateInconsistencyScore(m, 'h1')).toBeCloseTo(3.75);
  });

  it('isolates scores per hypothesis', () => {
    const m = matrix(
      [hy('h1'), hy('h2')],
      [ev('e1')],
      { e1: { h1: 'I', h2: 'C' } },
    );
    expect(calculateInconsistencyScore(m, 'h1')).toBe(2);
    expect(calculateInconsistencyScore(m, 'h2')).toBe(-1);
  });
});

describe('calculateAllScores', () => {
  it('returns one score per hypothesis', () => {
    const m = matrix(
      [hy('h1'), hy('h2'), hy('h3')],
      [ev('e1')],
      { e1: { h1: 'I', h2: 'N', h3: 'C' } },
    );
    const scores = calculateAllScores(m);
    expect(scores).toEqual({ h1: 2, h2: 0, h3: -1 });
  });

  it('returns empty object when no hypotheses exist', () => {
    expect(calculateAllScores(matrix([], [ev('e1')]))).toEqual({});
  });
});

describe('findPreferredHypothesis', () => {
  it('returns null on empty matrix', () => {
    expect(findPreferredHypothesis(matrix([], []))).toBeNull();
  });

  it('selects the hypothesis with the lowest (most negative) score', () => {
    const m = matrix(
      [hy('h1'), hy('h2'), hy('h3')],
      [ev('e1'), ev('e2')],
      {
        e1: { h1: 'I', h2: 'C', h3: 'C' },
        e2: { h1: 'N', h2: 'C', h3: 'I' },
      },
    );
    // h1 = 2, h2 = -2, h3 = 1  → h2 wins
    expect(findPreferredHypothesis(m)).toBe('h2');
  });

  it('on a tie, returns the first encountered (insertion order)', () => {
    const m = matrix([hy('h1'), hy('h2')], [ev('e1')], {
      e1: { h1: 'C', h2: 'C' },
    });
    expect(findPreferredHypothesis(m)).toBe('h1');
  });

  it('hypotheses with no ratings score 0 and can become preferred over contradicted ones', () => {
    const m = matrix(
      [hy('h1'), hy('h2')],
      [ev('e1')],
      { e1: { h1: 'I' } },
    );
    expect(findPreferredHypothesis(m)).toBe('h2');
  });
});

describe('getNormalizedScores', () => {
  it('returns empty object when no hypotheses exist', () => {
    expect(getNormalizedScores(matrix([], []))).toEqual({});
  });

  it('maps min score to 0 and max score to 100', () => {
    const m = matrix(
      [hy('h1'), hy('h2')],
      [ev('e1')],
      { e1: { h1: 'I', h2: 'C' } },
    );
    const norm = getNormalizedScores(m);
    expect(norm.h1).toBe(100);
    expect(norm.h2).toBe(0);
  });

  it('returns 50 for everyone when all scores are equal', () => {
    const m = matrix(
      [hy('h1'), hy('h2'), hy('h3')],
      [ev('e1')],
      { e1: { h1: 'C', h2: 'C', h3: 'C' } },
    );
    expect(getNormalizedScores(m)).toEqual({ h1: 50, h2: 50, h3: 50 });
  });
});

describe('getRatingLabel', () => {
  it.each([
    ['C', 'Consistent'],
    ['I', 'Inconsistent'],
    ['N', 'Neutral'],
    ['NA', 'N/A'],
  ] as Array<[ConsistencyRating, string]>)('labels %s as %s', (rating, label) => {
    expect(getRatingLabel(rating)).toBe(label);
  });
});

describe('cycleRating', () => {
  it('cycles undefined → C → I → N → NA → C', () => {
    expect(cycleRating(undefined)).toBe('C');
    expect(cycleRating('C')).toBe('I');
    expect(cycleRating('I')).toBe('N');
    expect(cycleRating('N')).toBe('NA');
    expect(cycleRating('NA')).toBe('C');
  });
});
