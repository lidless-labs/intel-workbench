import type { ACHMatrix, KeyAssumption } from '../types';

/**
 * Key Assumptions Check helpers per the CIA Tradecraft Primer
 * (Sherman Kent School, March 2009, pp. 7-9). KAC is a diagnostic SAT that
 * surfaces unstated premises so each can be tested against evidence before
 * an analytic line is drawn.
 */

/**
 * Composite risk score for the assumptions in a matrix.
 * Higher = more analytic risk from unexamined or unsupported assumptions.
 *   unsupported    counts 1.00
 *   caveated       counts 0.50
 *   unassessed     counts 0.25
 *   supported      counts 0.00
 */
export function computeAssumptionRiskScore(matrix: Pick<ACHMatrix, 'assumptions'>): number {
  let score = 0;
  for (const a of matrix.assumptions) {
    if (a.status === 'unsupported') score += 1;
    else if (a.status === 'caveated') score += 0.5;
    else if (a.status === 'unassessed') score += 0.25;
  }
  return score;
}

/**
 * Assumptions that have not been linked to any evidence in a matrix that
 * already has at least one evidence row. These are the items the audit banner
 * surfaces as "have you checked this?"
 */
export function findUnexaminedAssumptions(
  matrix: Pick<ACHMatrix, 'assumptions' | 'evidence'>
): KeyAssumption[] {
  if (matrix.evidence.length === 0) return [];
  return matrix.assumptions.filter((a) => a.linkedEvidenceIds.length === 0);
}

/**
 * True when the matrix has any assumption needing analyst attention - either
 * unsupported (analyst has flagged it as risky) or unexamined (no evidence
 * link in a matrix that has evidence to link against).
 */
export function shouldShowAssumptionAuditBanner(
  matrix: Pick<ACHMatrix, 'assumptions' | 'evidence'>
): boolean {
  if (findUnexaminedAssumptions(matrix).length > 0) return true;
  return matrix.assumptions.some((a) => a.status === 'unsupported');
}

export const ASSUMPTION_STATUS_LABELS: Record<KeyAssumption['status'], string> = {
  supported: 'Supported',
  caveated: 'Supported with caveats',
  unsupported: 'Unsupported',
  unassessed: 'Unassessed',
};

/**
 * Cycle order for the inline status pill: unassessed → supported → caveated → unsupported → unassessed.
 */
export function nextAssumptionStatus(current: KeyAssumption['status']): KeyAssumption['status'] {
  switch (current) {
    case 'unassessed':
      return 'supported';
    case 'supported':
      return 'caveated';
    case 'caveated':
      return 'unsupported';
    case 'unsupported':
      return 'unassessed';
  }
}
