import type { KeyAssumption, QoICAssessment } from '../types';
import { CURRENT_SCHEMA_VERSION } from '../types';
import {
  isAdmiraltyAccuracy,
  isAdmiraltyReliability,
} from '../utils/admiralty';
import { generateId } from '../utils/id';

/**
 * Schema migrations for persisted Zustand state.
 *
 * Each persisted store calls `migrate(persistedState, version)` on rehydrate.
 * Pre-versioned blobs are treated as v1. New persisted shapes added in later
 * phases bump CURRENT_SCHEMA_VERSION and add another step here while keeping
 * earlier steps intact.
 */

const ASSUMPTION_STATUSES = new Set<KeyAssumption['status']>([
  'supported',
  'unsupported',
  'caveated',
  'unassessed',
]);

function normalizeKeyAssumption(raw: unknown, fallbackTime: string): KeyAssumption | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' && obj.id.trim() ? obj.id : generateId();
  const text = typeof obj.text === 'string' ? obj.text : '';
  if (!text.trim()) return null;
  const status = ASSUMPTION_STATUSES.has(obj.status as KeyAssumption['status'])
    ? (obj.status as KeyAssumption['status'])
    : 'unassessed';
  const rationale = typeof obj.rationale === 'string' ? obj.rationale : '';
  const linkedEvidenceIds = Array.isArray(obj.linkedEvidenceIds)
    ? obj.linkedEvidenceIds.filter((v): v is string => typeof v === 'string')
    : [];
  const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : fallbackTime;
  const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : fallbackTime;
  return { id, text, status, rationale, linkedEvidenceIds, createdAt, updatedAt };
}

function normalizeQoIC(raw: unknown): QoICAssessment | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const reliability = isAdmiraltyReliability(obj.admiraltyReliability)
    ? obj.admiraltyReliability
    : undefined;
  const accuracy = isAdmiraltyAccuracy(obj.admiraltyAccuracy)
    ? obj.admiraltyAccuracy
    : undefined;
  const corroborated = typeof obj.corroborated === 'boolean' ? obj.corroborated : false;
  const sourceProvenance =
    typeof obj.sourceProvenance === 'string' ? obj.sourceProvenance : '';
  const recencyDays =
    typeof obj.recencyDays === 'number' && Number.isFinite(obj.recencyDays)
      ? obj.recencyDays
      : undefined;
  const caveats = typeof obj.caveats === 'string' ? obj.caveats : '';
  // Drop entirely empty assessments - equivalent to "unset"
  if (
    !reliability &&
    !accuracy &&
    !corroborated &&
    !sourceProvenance &&
    recencyDays === undefined &&
    !caveats
  ) {
    return undefined;
  }
  return {
    admiraltyReliability: reliability,
    admiraltyAccuracy: accuracy,
    corroborated,
    sourceProvenance,
    recencyDays,
    caveats,
  };
}

/**
 * v1 → v2 step for project state.
 *   - Adds `assumptions: []` to each ACHMatrix that lacks the field.
 *   - Normalizes any pre-existing assumptions from forward-compatible payloads.
 *   - Decorates Evidence with optional `qoic` if present in the persisted blob.
 */
function projectV1ToV2(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const obj = raw as Record<string, unknown>;
  const projects = Array.isArray(obj.projects) ? obj.projects : [];
  const fallbackTime = new Date().toISOString();

  const migrated = projects.map((p) => {
    if (!p || typeof p !== 'object') return p;
    const project = p as Record<string, unknown>;
    const matrices = Array.isArray(project.achMatrices) ? project.achMatrices : [];
    const newMatrices = matrices.map((m) => {
      if (!m || typeof m !== 'object') return m;
      const matrix = m as Record<string, unknown>;
      const rawAssumptions = Array.isArray(matrix.assumptions) ? matrix.assumptions : [];
      const assumptions = rawAssumptions
        .map((a) => normalizeKeyAssumption(a, fallbackTime))
        .filter((a): a is KeyAssumption => a !== null);
      const evidence = Array.isArray(matrix.evidence) ? matrix.evidence : [];
      const newEvidence = evidence.map((e) => {
        if (!e || typeof e !== 'object') return e;
        const ev = e as Record<string, unknown>;
        const qoic = normalizeQoIC(ev.qoic);
        if (qoic === undefined && ev.qoic === undefined) return e;
        return { ...ev, qoic };
      });
      return { ...matrix, assumptions, evidence: newEvidence };
    });
    return { ...project, achMatrices: newMatrices };
  });

  return { ...obj, projects: migrated };
}

/**
 * Public migrator for the project store. Handles undefined → 1 → 2.
 */
export function migrateProjectState(persistedState: unknown, version: number): unknown {
  let state = persistedState;
  let v = version;
  if (v === undefined || v === null) v = 1;
  if (v < 2) {
    state = projectV1ToV2(state);
    v = 2;
  }
  return state;
}

/**
 * Diamond store has no field-level migration in v1 → v2; the version bump is
 * structural so that future additions (linkedAchMatrixIds, etc.) have a slot.
 */
export function migrateDiamondState(persistedState: unknown, _version: number): unknown {
  return persistedState;
}

/**
 * IOC store: no field-level migration in v1 → v2.
 */
export function migrateIOCState(persistedState: unknown, _version: number): unknown {
  return persistedState;
}

/**
 * Re-exported for convenience so stores can pass a single constant to persist
 * config without importing from types/index.ts directly.
 */
export const STORE_SCHEMA_VERSION = CURRENT_SCHEMA_VERSION;

/**
 * Internal helpers exposed for migrations.test.ts. Not part of the public API
 * of this module, but exported so tests can exercise normalization directly.
 */
export const __test = {
  normalizeKeyAssumption,
  normalizeQoIC,
  projectV1ToV2,
};
