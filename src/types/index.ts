import type { EvidenceRecord } from '../utils/evidenceRecord';

export const CURRENT_SCHEMA_VERSION = 1;

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

export interface Evidence {
  id: string;
  description: string;
  source: string;
  credibility: 'High' | 'Medium' | 'Low';
  relevance: 'High' | 'Medium' | 'Low';
  attackTechniques?: string[];
  /** Validated upstream record, including additive v1 fields and original IDs. */
  originalRecord?: EvidenceRecord;
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

export interface ACHMatrix {
  id: string;
  name: string;
  hypotheses: Hypothesis[];
  evidence: Evidence[];
  ratings: Record<string, Record<string, ConsistencyRating>>; // evidence.id -> hypothesis.id -> rating
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
