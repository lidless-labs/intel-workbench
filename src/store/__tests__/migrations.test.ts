import { describe, it, expect } from 'vitest';
import {
  migrateProjectState,
  migrateDiamondState,
  migrateIOCState,
  __test,
} from '../migrations';

describe('migrateProjectState', () => {
  it('treats undefined version as v1 and migrates to v2', () => {
    const v1Blob = {
      projects: [
        {
          id: 'p1',
          name: 'Test',
          description: '',
          achMatrices: [
            {
              id: 'm1',
              name: 'M1',
              hypotheses: [],
              evidence: [
                { id: 'e1', description: 'evidence row', source: '', credibility: 'High', relevance: 'High' },
              ],
              ratings: {},
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
          biasChecklists: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      activeProjectId: 'p1',
    };

    const migrated = migrateProjectState(v1Blob, 1) as typeof v1Blob;
    const matrix = migrated.projects[0].achMatrices[0] as unknown as {
      assumptions: unknown[];
      evidence: { qoic?: unknown }[];
    };
    expect(matrix.assumptions).toEqual([]);
    expect(matrix.evidence[0].qoic).toBeUndefined();
  });

  it('preserves already-v2 shape unchanged', () => {
    const v2Blob = {
      projects: [
        {
          id: 'p1',
          name: 'Test',
          description: '',
          achMatrices: [
            {
              id: 'm1',
              name: 'M1',
              hypotheses: [],
              evidence: [],
              ratings: {},
              assumptions: [
                {
                  id: 'a1',
                  text: 'something',
                  status: 'supported',
                  rationale: '',
                  linkedEvidenceIds: [],
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-01T00:00:00Z',
                },
              ],
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
          biasChecklists: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      activeProjectId: 'p1',
    };
    const migrated = migrateProjectState(v2Blob, 2) as typeof v2Blob;
    expect(migrated).toEqual(v2Blob);
  });

  it('treats undefined version literally as v1', () => {
    const blob = { projects: [] };
    const migrated = migrateProjectState(
      blob,
      undefined as unknown as number
    ) as typeof blob;
    expect(migrated).toEqual({ projects: [] });
  });
});

describe('normalizeKeyAssumption', () => {
  it('drops assumptions with empty text', () => {
    expect(__test.normalizeKeyAssumption({ text: '' }, '2024-01-01T00:00:00Z')).toBeNull();
    expect(__test.normalizeKeyAssumption({ text: '   ' }, '2024-01-01T00:00:00Z')).toBeNull();
  });

  it('defaults status to unassessed when invalid', () => {
    const a = __test.normalizeKeyAssumption(
      { text: 'something', status: 'bogus' },
      '2024-01-01T00:00:00Z'
    );
    expect(a?.status).toBe('unassessed');
  });

  it('preserves valid statuses', () => {
    for (const s of ['supported', 'unsupported', 'caveated', 'unassessed']) {
      const a = __test.normalizeKeyAssumption(
        { text: 'something', status: s },
        '2024-01-01T00:00:00Z'
      );
      expect(a?.status).toBe(s);
    }
  });
});

describe('normalizeQoIC', () => {
  it('drops fully-empty assessments', () => {
    expect(__test.normalizeQoIC({ corroborated: false, sourceProvenance: '', caveats: '' })).toBeUndefined();
  });

  it('preserves a valid Admiralty rating', () => {
    const q = __test.normalizeQoIC({
      admiraltyReliability: 'B',
      admiraltyAccuracy: '2',
      corroborated: true,
      sourceProvenance: 'CISA advisory',
      recencyDays: 7,
      caveats: 'limited sample',
    });
    expect(q?.admiraltyReliability).toBe('B');
    expect(q?.admiraltyAccuracy).toBe('2');
    expect(q?.corroborated).toBe(true);
    expect(q?.recencyDays).toBe(7);
  });

  it('drops invalid Admiralty values', () => {
    const q = __test.normalizeQoIC({
      admiraltyReliability: 'Z',
      admiraltyAccuracy: '9',
      corroborated: true,
      sourceProvenance: 'x',
      caveats: '',
    });
    expect(q?.admiraltyReliability).toBeUndefined();
    expect(q?.admiraltyAccuracy).toBeUndefined();
    expect(q?.corroborated).toBe(true);
  });
});

describe('migrateDiamondState / migrateIOCState', () => {
  it('passes through unchanged in v1 → v2', () => {
    const blob = { events: [], activeEventId: null };
    expect(migrateDiamondState(blob, 1)).toEqual(blob);
    const ioc = { rawInput: 'x', iocs: [], defanged: false, duplicatesRemoved: 0 };
    expect(migrateIOCState(ioc, 1)).toEqual(ioc);
  });
});
