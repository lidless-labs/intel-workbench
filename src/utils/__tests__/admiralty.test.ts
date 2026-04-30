import { describe, it, expect } from 'vitest';
import {
  ADMIRALTY_RELIABILITY_OPTIONS,
  ADMIRALTY_ACCURACY_OPTIONS,
  ADMIRALTY_RELIABILITY_LABELS,
  ADMIRALTY_ACCURACY_LABELS,
  isAdmiraltyReliability,
  isAdmiraltyAccuracy,
  formatAdmiraltyShort,
} from '../admiralty';

describe('Admiralty constants', () => {
  it('reliability covers A-F', () => {
    expect(ADMIRALTY_RELIABILITY_OPTIONS).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('accuracy covers 1-6', () => {
    expect(ADMIRALTY_ACCURACY_OPTIONS).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('every option has a label', () => {
    for (const r of ADMIRALTY_RELIABILITY_OPTIONS) {
      expect(ADMIRALTY_RELIABILITY_LABELS[r]).toMatch(new RegExp(`^${r} `));
    }
    for (const a of ADMIRALTY_ACCURACY_OPTIONS) {
      expect(ADMIRALTY_ACCURACY_LABELS[a]).toMatch(new RegExp(`^${a} `));
    }
  });
});

describe('Admiralty type guards', () => {
  it('isAdmiraltyReliability accepts A-F, rejects others', () => {
    expect(isAdmiraltyReliability('A')).toBe(true);
    expect(isAdmiraltyReliability('F')).toBe(true);
    expect(isAdmiraltyReliability('Z')).toBe(false);
    expect(isAdmiraltyReliability('a')).toBe(false);
    expect(isAdmiraltyReliability(undefined)).toBe(false);
    expect(isAdmiraltyReliability(1)).toBe(false);
  });

  it('isAdmiraltyAccuracy accepts 1-6 strings, rejects others', () => {
    expect(isAdmiraltyAccuracy('1')).toBe(true);
    expect(isAdmiraltyAccuracy('6')).toBe(true);
    expect(isAdmiraltyAccuracy('7')).toBe(false);
    expect(isAdmiraltyAccuracy(2)).toBe(false);
    expect(isAdmiraltyAccuracy(undefined)).toBe(false);
  });
});

describe('formatAdmiraltyShort', () => {
  it('returns "unrated" when both axes are unset', () => {
    expect(formatAdmiraltyShort()).toBe('unrated');
  });

  it('returns combined code when both axes are set', () => {
    expect(formatAdmiraltyShort('B', '2')).toBe('B-2');
  });

  it('returns the lone axis when only one is set', () => {
    expect(formatAdmiraltyShort('B')).toBe('B');
    expect(formatAdmiraltyShort(undefined, '3')).toBe('3');
  });
});
