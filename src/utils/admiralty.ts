import type { AdmiraltyAccuracy, AdmiraltyReliability } from '../types';

/**
 * NATO AAP-6 / Admiralty source-rating system used in HUMINT and OSINT
 * tradecraft. Two orthogonal axes: source reliability (A-F) and information
 * accuracy (1-6). Cited in the CIA Tradecraft Primer (Sherman Kent School,
 * March 2009, pp. 11-13).
 */

export const ADMIRALTY_RELIABILITY_OPTIONS: AdmiraltyReliability[] = ['A', 'B', 'C', 'D', 'E', 'F'];
export const ADMIRALTY_ACCURACY_OPTIONS: AdmiraltyAccuracy[] = ['1', '2', '3', '4', '5', '6'];

export const ADMIRALTY_RELIABILITY_LABELS: Record<AdmiraltyReliability, string> = {
  A: 'A - Completely reliable',
  B: 'B - Usually reliable',
  C: 'C - Fairly reliable',
  D: 'D - Not usually reliable',
  E: 'E - Unreliable',
  F: 'F - Reliability cannot be judged',
};

export const ADMIRALTY_ACCURACY_LABELS: Record<AdmiraltyAccuracy, string> = {
  '1': '1 - Confirmed by other sources',
  '2': '2 - Probably true',
  '3': '3 - Possibly true',
  '4': '4 - Doubtful',
  '5': '5 - Improbable',
  '6': '6 - Truth cannot be judged',
};

export const ADMIRALTY_RELIABILITY_SHORT: Record<AdmiraltyReliability, string> = {
  A: 'Completely reliable',
  B: 'Usually reliable',
  C: 'Fairly reliable',
  D: 'Not usually reliable',
  E: 'Unreliable',
  F: 'Reliability unknown',
};

export const ADMIRALTY_ACCURACY_SHORT: Record<AdmiraltyAccuracy, string> = {
  '1': 'Confirmed',
  '2': 'Probably true',
  '3': 'Possibly true',
  '4': 'Doubtful',
  '5': 'Improbable',
  '6': 'Unknown',
};

export function isAdmiraltyReliability(value: unknown): value is AdmiraltyReliability {
  return typeof value === 'string' && ADMIRALTY_RELIABILITY_OPTIONS.includes(value as AdmiraltyReliability);
}

export function isAdmiraltyAccuracy(value: unknown): value is AdmiraltyAccuracy {
  return typeof value === 'string' && ADMIRALTY_ACCURACY_OPTIONS.includes(value as AdmiraltyAccuracy);
}

/**
 * Render a compact summary like `B-2 corroborated, 7d` for chip display.
 */
export function formatAdmiraltyShort(
  reliability?: AdmiraltyReliability,
  accuracy?: AdmiraltyAccuracy
): string {
  if (!reliability && !accuracy) return 'unrated';
  if (reliability && accuracy) return `${reliability}-${accuracy}`;
  return reliability ?? accuracy ?? 'unrated';
}
