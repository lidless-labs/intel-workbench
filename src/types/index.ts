export type ConsistencyRating = 'C' | 'I' | 'N' | 'NA';

export type ConfidenceLevel = 'Low' | 'Moderate' | 'High';

/**
 * ICD 203 estimative-language scale (Analytic Standards, Annex B).
 * Expresses likelihood that a hypothesis is true. Distinct from
 * ConfidenceLevel, which expresses analyst confidence in sourcing and
 * reasoning.
 */
export type ProbabilityBand =
  | 'almost-no-chance'
  | 'very-unlikely'
  | 'unlikely'
  | 'roughly-even-chance'
  | 'likely'
  | 'very-likely'
  | 'almost-certainly';

/**
 * Schema version for persisted state. Bumped whenever a persisted shape gains
 * new fields or changes meaning. Migration shims live in src/store/migrations.ts.
 */
export const CURRENT_SCHEMA_VERSION = 2 as const;
export type SchemaVersion = 1 | 2;

/**
 * Admiralty / NATO AAP-6 source reliability (A-F) and information accuracy (1-6).
 * Used by Quality of Information Check (QoIC) per the CIA Tradecraft Primer
 * (Sherman Kent School, March 2009, pp. 11-13).
 */
export type AdmiraltyReliability = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type AdmiraltyAccuracy = '1' | '2' | '3' | '4' | '5' | '6';

export interface QoICAssessment {
  admiraltyReliability?: AdmiraltyReliability;
  admiraltyAccuracy?: AdmiraltyAccuracy;
  corroborated: boolean;
  sourceProvenance: string;
  recencyDays?: number;
  caveats: string;
}

export interface Evidence {
  id: string;
  description: string;
  source: string;
  credibility: 'High' | 'Medium' | 'Low';
  relevance: 'High' | 'Medium' | 'Low';
  attackTechniques?: string[];
  /**
   * Quality of Information Check overlay. Optional; does not affect ACH scoring.
   * Coexists with credibility/relevance per the SAT library design.
   */
  qoic?: QoICAssessment;
}

export interface Hypothesis {
  id: string;
  name: string;
  description: string;
  confidence?: ConfidenceLevel;
  confidenceJustification?: string;
  /** ICD 203 estimative likelihood band. Optional; orthogonal to confidence. */
  probabilityBand?: ProbabilityBand;
  attackTechniques?: string[];
}

/**
 * Key Assumption status per the Tradecraft Primer (pp. 7-9):
 * supported = corroborated by evidence; caveated = supported with conditions;
 * unsupported = no evidence; unassessed = analyst has not yet evaluated.
 */
export type AssumptionStatus = 'supported' | 'unsupported' | 'caveated' | 'unassessed';

export interface KeyAssumption {
  id: string;
  text: string;
  status: AssumptionStatus;
  rationale: string;
  /** IDs of evidence in the same matrix that support or refute this assumption. */
  linkedEvidenceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ACHMatrix {
  id: string;
  name: string;
  hypotheses: Hypothesis[];
  evidence: Evidence[];
  ratings: Record<string, Record<string, ConsistencyRating>>; // evidence.id -> hypothesis.id -> rating
  /** Key Assumptions Check entries for this matrix. New in schema v2. */
  assumptions: KeyAssumption[];
  createdAt: string;
  updatedAt: string;
}

export interface CognitiveBias {
  id: string;
  name: string;
  description: string;
  category: string;
  checked: boolean;
  mitigationNotes: string;
}

export interface BiasChecklist {
  id: string;
  name: string;
  biases: CognitiveBias[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  achMatrices: ACHMatrix[];
  biasChecklists: BiasChecklist[];
  createdAt: string;
  updatedAt: string;
}
