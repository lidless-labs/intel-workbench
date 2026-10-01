import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Project, ACHMatrix, Evidence, Hypothesis, ConsistencyRating, BiasChecklist } from '../types';
import { CURRENT_SCHEMA_VERSION } from '../types';
import { migrateProjectState } from './migrations';
import { parseEvidenceEnvelope, hasExplicitFormat, validateEvidenceRecord, recordTechniqueIds } from '../utils/evidenceRecord';
import { generateId } from '../utils/id';
import { isProbabilityBand } from '../utils/icd203';
import { sampleProject } from '../data/sampleProject';

let projectStorageError: string | null = null;
export function getProjectStorageError(): string | null { return projectStorageError; }

// Guard the original storage bytes independently of hydration. Zustand actions can
// still run after a migration error, so rejecting migration alone cannot protect data.
const projectStorage = createJSONStorage<ProjectStore>(() => {
  const storage = localStorage;
  let locked = false;
  const inspectVersion = (raw: string | null) => {
    if (raw === null) return;
    try {
      const version: unknown = JSON.parse(raw)?.version;
      if (typeof version === 'number' && version !== 0 && version !== CURRENT_SCHEMA_VERSION) {
        locked = true;
        projectStorageError = `Stored projects use unsupported schema version ${version}. This Workbench cannot open them. Saved data is protected. Changes in this session cannot be saved. Use a compatible Workbench to open the saved data.`;
      }
    } catch { /* The persistence middleware reports malformed JSON during hydration. */ }
  };
  return {
    getItem: (key: string) => {
      const raw = storage.getItem(key);
      inspectVersion(raw);
      return raw;
    },
    setItem: (key: string, value: string) => {
      inspectVersion(storage.getItem(key));
      if (!locked) storage.setItem(key, value);
    },
    removeItem: (key: string) => {
      inspectVersion(storage.getItem(key));
      if (!locked) storage.removeItem(key);
    },
  };
});

export interface ImportResult {
  ok: boolean;
  reason?: string;
  count?: number;
  destination?: string;
}

interface ProjectStore {
  // State
  projects: Project[];
  activeProjectId: string | null;

  // Computed
  getActiveProject: () => Project | null;
  getMatrix: (matrixId: string) => ACHMatrix | null;

  // Project CRUD
  createProject: (name: string, description: string) => string;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  loadSampleProject: () => void;

  // ACH Matrix CRUD
  createMatrix: (projectId: string, name: string) => string;
  updateMatrix: (projectId: string, matrixId: string, updates: Partial<Pick<ACHMatrix, 'name'>>) => void;
  deleteMatrix: (projectId: string, matrixId: string) => void;

  // Hypothesis CRUD
  addHypothesis: (projectId: string, matrixId: string, name: string, description: string, attackTechniques?: string[]) => void;
  updateHypothesis: (projectId: string, matrixId: string, hypothesisId: string, updates: Partial<Pick<Hypothesis, 'name' | 'description' | 'confidence' | 'confidenceJustification' | 'probabilityBand' | 'attackTechniques'>>) => void;
  removeHypothesis: (projectId: string, matrixId: string, hypothesisId: string) => void;

  // Evidence CRUD
  addEvidence: (projectId: string, matrixId: string, evidence: Omit<Evidence, 'id'>) => void;
  updateEvidence: (projectId: string, matrixId: string, evidenceId: string, updates: Partial<Omit<Evidence, 'id'>>) => void;
  removeEvidence: (projectId: string, matrixId: string, evidenceId: string) => void;

  // Ratings
  setRating: (projectId: string, matrixId: string, evidenceId: string, hypothesisId: string, rating: ConsistencyRating) => void;

  // Bias Checklist CRUD
  addBiasChecklist: (projectId: string, checklist: BiasChecklist) => void;
  toggleBias: (projectId: string, checklistId: string, biasId: string) => void;
  updateBiasMitigation: (projectId: string, checklistId: string, biasId: string, notes: string) => void;

  // Import/Export
  exportProject: (id: string) => string | null;
  importProject: (json: string) => ImportResult;
  importEvidenceRecords: (json: string, projectId: string, matrixId: string | null) => ImportResult;
  importData: (json: string, projectId: string, matrixId: string | null) => ImportResult;
}

const TECHNIQUE_ID_RE = /^T\d{4}(\.\d{3})?$/;

function sanitizeTechniqueIds(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const cleaned: string[] = [];
  const seen = new Set<string>();
  for (const v of raw) {
    if (typeof v !== 'string') continue;
    const id = v.trim().toUpperCase();
    if (!TECHNIQUE_ID_RE.test(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    cleaned.push(id);
  }
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Validate and normalize an imported project, ensuring all fields have proper types
 * and data integrity is maintained (orphaned ratings removed, missing entries filled).
 * Returns a normalized Project or null if fundamentally invalid.
 */
function normalizeImportedProject(raw: unknown): Project | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  // Require id and name as non-empty strings
  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;
  if (typeof obj.name !== 'string' || !obj.name.trim()) return null;

  const now = new Date().toISOString();

  // Normalize timestamps
  const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : now;
  const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : now;
  const description = typeof obj.description === 'string' ? obj.description : '';

  // Normalize achMatrices
  const rawMatrices = Array.isArray(obj.achMatrices) ? obj.achMatrices : [];
  const achMatrices: ACHMatrix[] = [];
  for (const rm of rawMatrices) {
    const m = normalizeMatrix(rm, now);
    if (m) achMatrices.push(m);
  }

  // Normalize biasChecklists
  const rawChecklists = Array.isArray(obj.biasChecklists) ? obj.biasChecklists : [];
  const biasChecklists: BiasChecklist[] = [];
  for (const rc of rawChecklists) {
    const c = normalizeChecklist(rc, now);
    if (c) biasChecklists.push(c);
  }

  return {
    id: obj.id as string,
    name: obj.name as string,
    description,
    achMatrices,
    biasChecklists,
    createdAt,
    updatedAt,
  };
}

function normalizeMatrix(raw: unknown, fallbackTime: string): ACHMatrix | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;
  if (typeof obj.name !== 'string' || !obj.name.trim()) return null;

  const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : fallbackTime;
  const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : fallbackTime;

  // Normalize hypotheses
  const rawHyps = Array.isArray(obj.hypotheses) ? obj.hypotheses : [];
  const hypotheses: Hypothesis[] = [];
  for (const rh of rawHyps) {
    if (rh && typeof rh === 'object' && typeof (rh as Record<string, unknown>).id === 'string' && typeof (rh as Record<string, unknown>).name === 'string') {
      const rawBand = (rh as Record<string, unknown>).probabilityBand;
      hypotheses.push({
        id: (rh as Hypothesis).id,
        name: (rh as Hypothesis).name,
        description: typeof (rh as Hypothesis).description === 'string' ? (rh as Hypothesis).description : '',
        confidence: ['Low', 'Moderate', 'High'].includes((rh as Hypothesis).confidence as string) ? (rh as Hypothesis).confidence : undefined,
        confidenceJustification: typeof (rh as Hypothesis).confidenceJustification === 'string' ? (rh as Hypothesis).confidenceJustification : undefined,
        probabilityBand: isProbabilityBand(rawBand) ? rawBand : undefined,
        attackTechniques: sanitizeTechniqueIds((rh as Record<string, unknown>).attackTechniques),
      });
    }
  }

  // Normalize evidence
  const rawEvs = Array.isArray(obj.evidence) ? obj.evidence : [];
  const validCredRel = new Set(['High', 'Medium', 'Low']);
  const evidence: Evidence[] = [];
  for (const re of rawEvs) {
    if (re && typeof re === 'object' && typeof (re as Record<string, unknown>).id === 'string') {
      const e = re as Record<string, unknown>;
      evidence.push({
        id: e.id as string,
        description: typeof e.description === 'string' ? e.description : '',
        source: typeof e.source === 'string' ? e.source : '',
        credibility: validCredRel.has(e.credibility as string) ? (e.credibility as Evidence['credibility']) : 'Medium',
        relevance: validCredRel.has(e.relevance as string) ? (e.relevance as Evidence['relevance']) : 'Medium',
        attackTechniques: sanitizeTechniqueIds(e.attackTechniques),
        ...(Object.prototype.hasOwnProperty.call(e, 'originalRecord')
          ? { originalRecord: validateEvidenceRecord(e.originalRecord) } : {}),
      });
    }
  }

  // Build valid ID sets
  const hypothesisIds = new Set(hypotheses.map((h) => h.id));
  const evidenceIds = new Set(evidence.map((e) => e.id));
  const validRatings = new Set(['C', 'I', 'N', 'NA']);

  // Rebuild ratings: only keep keys matching existing evidence/hypothesis IDs,
  // and ensure every evidence row has a ratings entry
  const rawRatings = obj.ratings && typeof obj.ratings === 'object' ? (obj.ratings as Record<string, unknown>) : {};
  const ratings: Record<string, Record<string, ConsistencyRating>> = {};

  for (const eId of evidenceIds) {
    const rawEvidenceRatings = rawRatings[eId];
    const cleaned: Record<string, ConsistencyRating> = {};
    if (rawEvidenceRatings && typeof rawEvidenceRatings === 'object') {
      for (const [hId, val] of Object.entries(rawEvidenceRatings as Record<string, unknown>)) {
        if (hypothesisIds.has(hId) && validRatings.has(val as string)) {
          cleaned[hId] = val as ConsistencyRating;
        }
      }
    }
    ratings[eId] = cleaned;
  }

  return {
    id: obj.id as string,
    name: obj.name as string,
    hypotheses,
    evidence,
    ratings,
    createdAt,
    updatedAt,
  };
}

function normalizeChecklist(raw: unknown, fallbackTime: string): BiasChecklist | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;
  if (typeof obj.name !== 'string' || !obj.name.trim()) return null;

  const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : fallbackTime;
  const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : fallbackTime;

  const rawBiases = Array.isArray(obj.biases) ? obj.biases : [];
  const biases: BiasChecklist['biases'] = [];
  for (const rb of rawBiases) {
    if (rb && typeof rb === 'object' && typeof (rb as Record<string, unknown>).id === 'string') {
      const b = rb as Record<string, unknown>;
      biases.push({
        id: b.id as string,
        name: typeof b.name === 'string' ? b.name : '',
        description: typeof b.description === 'string' ? b.description : '',
        category: typeof b.category === 'string' ? b.category : '',
        checked: typeof b.checked === 'boolean' ? b.checked : false,
        mitigationNotes: typeof b.mitigationNotes === 'string' ? b.mitigationNotes : '',
      });
    }
  }

  return {
    id: obj.id as string,
    name: obj.name as string,
    biases,
    createdAt,
    updatedAt,
  };
}

function updateProjectTimestamp(project: Project): Project {
  return { ...project, updatedAt: new Date().toISOString() };
}

function updateMatrixTimestamp(matrix: ACHMatrix): ACHMatrix {
  return { ...matrix, updatedAt: new Date().toISOString() };
}

export const useProjectStore = create<ProjectStore>()<[['zustand/persist', ProjectStore]]>((restoreState, baseGet, api) =>
  persist<ProjectStore>(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      getActiveProject: () => {
        const state = get();
        return state.projects.find((p) => p.id === state.activeProjectId) ?? null;
      },

      getMatrix: (matrixId: string) => {
        const project = get().getActiveProject();
        if (!project) return null;
        return project.achMatrices.find((m) => m.id === matrixId) ?? null;
      },

      createProject: (name, description) => {
        const id = generateId();
        const now = new Date().toISOString();
        const project: Project = {
          id,
          name,
          description,
          achMatrices: [],
          biasChecklists: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          projects: [...state.projects, project],
          activeProjectId: id,
        }));
        return id;
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? updateProjectTimestamp({ ...p, ...updates }) : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
      },

      setActiveProject: (id) => {
        set({ activeProjectId: id });
      },

      loadSampleProject: () => {
        const state = get();
        // Don't duplicate if already loaded
        if (state.projects.some((p) => p.id === sampleProject.id)) {
          set({ activeProjectId: sampleProject.id });
          return;
        }
        set((state) => ({
          projects: [...state.projects, { ...sampleProject }],
          activeProjectId: sampleProject.id,
        }));
      },

      createMatrix: (projectId, name) => {
        const id = generateId();
        const now = new Date().toISOString();
        const matrix: ACHMatrix = {
          id,
          name,
          hypotheses: [],
          evidence: [],
          ratings: {},
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({ ...p, achMatrices: [...p.achMatrices, matrix] })
              : p
          ),
        }));
        return id;
      },

      updateMatrix: (projectId, matrixId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) =>
                    m.id === matrixId ? updateMatrixTimestamp({ ...m, ...updates }) : m
                  ),
                })
              : p
          ),
        }));
      },

      deleteMatrix: (projectId, matrixId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.filter((m) => m.id !== matrixId),
                })
              : p
          ),
        }));
      },

      addHypothesis: (projectId, matrixId, name, description, attackTechniques) => {
        const hypothesis: Hypothesis = {
          id: generateId(),
          name,
          description,
          ...(attackTechniques && attackTechniques.length > 0 ? { attackTechniques } : {}),
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) =>
                    m.id === matrixId
                      ? updateMatrixTimestamp({
                          ...m,
                          hypotheses: [...m.hypotheses, hypothesis],
                        })
                      : m
                  ),
                })
              : p
          ),
        }));
      },

      updateHypothesis: (projectId, matrixId, hypothesisId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) =>
                    m.id === matrixId
                      ? updateMatrixTimestamp({
                          ...m,
                          hypotheses: m.hypotheses.map((h) =>
                            h.id === hypothesisId ? { ...h, ...updates } : h
                          ),
                        })
                      : m
                  ),
                })
              : p
          ),
        }));
      },

      removeHypothesis: (projectId, matrixId, hypothesisId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) => {
                    if (m.id !== matrixId) return m;
                    // Remove hypothesis and clean up ratings
                    const newRatings = { ...m.ratings };
                    for (const eid of Object.keys(newRatings)) {
                      const { [hypothesisId]: _removed, ...rest } = newRatings[eid];
                      void _removed;
                      newRatings[eid] = rest;
                    }
                    return updateMatrixTimestamp({
                      ...m,
                      hypotheses: m.hypotheses.filter((h) => h.id !== hypothesisId),
                      ratings: newRatings,
                    });
                  }),
                })
              : p
          ),
        }));
      },

      addEvidence: (projectId, matrixId, evidenceData) => {
        const evidence: Evidence = { id: generateId(), ...evidenceData };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) =>
                    m.id === matrixId
                      ? updateMatrixTimestamp({
                          ...m,
                          evidence: [...m.evidence, evidence],
                          ratings: { ...m.ratings, [evidence.id]: {} },
                        })
                      : m
                  ),
                })
              : p
          ),
        }));
      },

      updateEvidence: (projectId, matrixId, evidenceId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) =>
                    m.id === matrixId
                      ? updateMatrixTimestamp({
                          ...m,
                          evidence: m.evidence.map((e) =>
                            e.id === evidenceId ? { ...e, ...updates } : e
                          ),
                        })
                      : m
                  ),
                })
              : p
          ),
        }));
      },

      removeEvidence: (projectId, matrixId, evidenceId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) => {
                    if (m.id !== matrixId) return m;
                    const { [evidenceId]: _removed, ...newRatings } = m.ratings;
                    void _removed;
                    return updateMatrixTimestamp({
                      ...m,
                      evidence: m.evidence.filter((e) => e.id !== evidenceId),
                      ratings: newRatings,
                    });
                  }),
                })
              : p
          ),
        }));
      },

      setRating: (projectId, matrixId, evidenceId, hypothesisId, rating) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) =>
                    m.id === matrixId
                      ? updateMatrixTimestamp({
                          ...m,
                          ratings: {
                            ...m.ratings,
                            [evidenceId]: {
                              ...m.ratings[evidenceId],
                              [hypothesisId]: rating,
                            },
                          },
                        })
                      : m
                  ),
                })
              : p
          ),
        }));
      },

      // Bias Checklist operations
      addBiasChecklist: (projectId, checklist) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  biasChecklists: [...p.biasChecklists, checklist],
                })
              : p
          ),
        }));
      },

      toggleBias: (projectId, checklistId, biasId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  biasChecklists: p.biasChecklists.map((cl) =>
                    cl.id === checklistId
                      ? {
                          ...cl,
                          updatedAt: new Date().toISOString(),
                          biases: cl.biases.map((b) =>
                            b.id === biasId ? { ...b, checked: !b.checked } : b
                          ),
                        }
                      : cl
                  ),
                })
              : p
          ),
        }));
      },

      updateBiasMitigation: (projectId, checklistId, biasId, notes) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  biasChecklists: p.biasChecklists.map((cl) =>
                    cl.id === checklistId
                      ? {
                          ...cl,
                          updatedAt: new Date().toISOString(),
                          biases: cl.biases.map((b) =>
                            b.id === biasId ? { ...b, mitigationNotes: notes } : b
                          ),
                        }
                      : cl
                  ),
                })
              : p
          ),
        }));
      },

      exportProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return null;
        return JSON.stringify(project, null, 2);
      },

      importData: (json, projectId, matrixId) => {
        try {
          if (hasExplicitFormat(json)) {
            return get().importEvidenceRecords(json, projectId, matrixId);
          }
          return get().importProject(json);
        } catch (error) {
          return { ok: false, reason: error instanceof Error ? error.message : 'Import failed.' };
        }
      },

      importEvidenceRecords: (json, projectId, matrixId) => {
        if (projectStorageError) return { ok: false, reason: projectStorageError };
        try {
          const envelope = parseEvidenceEnvelope(json);
          const state = get();
          const project = state.projects.find(p => p.id === projectId);
          if (!project || state.activeProjectId !== projectId) {
            return { ok: false, reason: 'Destination project is missing or no longer selected.' };
          }
          const existing = matrixId === null ? undefined : project.achMatrices.find(m => m.id === matrixId);
          if (matrixId !== null && !existing) {
            return { ok: false, reason: 'Destination matrix no longer exists in the selected project.' };
          }
          const now = new Date().toISOString();
          // Fresh IDs cannot collide with existing entities or upstream record identities.
          const used = new Set(envelope.records.map(r => r.id));
          for (const p of state.projects) {
            used.add(p.id);
            for (const m of p.achMatrices) {
              used.add(m.id);
              for (const h of m.hypotheses) used.add(h.id);
              for (const e of m.evidence) used.add(e.id);
            }
          }
          const freshId = () => {
            let id = generateId();
            while (used.has(id)) id = generateId();
            used.add(id);
            return id;
          };
          const matrix: ACHMatrix = existing ?? {
            id: freshId(), name: envelope.subject.title, hypotheses: [], evidence: [], ratings: {}, createdAt: now, updatedAt: now,
          };
          const evidence: Evidence[] = envelope.records.map(record => ({
            id: freshId(),
            source: `${record.source.tool}: ${record.source.ref ?? '(no reference recorded)'}`,
            description: record.decision
              ? `Verdict: ${record.decision.verdict}\nRationale: ${record.decision.rationale ?? '(not recorded)'}`
              : 'No decision recorded.',
            // Workbench neutral defaults, not upstream credibility/relevance judgments.
            credibility: 'Medium', relevance: 'Medium',
            attackTechniques: recordTechniqueIds(record), originalRecord: record,
          }));
          const updated: ACHMatrix = {
            ...matrix, updatedAt: now, evidence: [...matrix.evidence, ...evidence],
            ratings: { ...matrix.ratings, ...Object.fromEntries(evidence.map(e => [e.id, {}])) },
          };
          // Validation and construction complete before the single atomic append.
          try {
            set({ projects: state.projects.map(p => p.id === projectId ? {
              ...p, updatedAt: now,
              achMatrices: existing ? p.achMatrices.map(m => m.id === matrixId ? updated : m) : [...p.achMatrices, updated],
            } : p) });
          } catch (error) {
            // persist writes after updating memory. Restore without another storage
            // write if localStorage rejected the atomic write (for example, quota).
            restoreState(state, true);
            throw error;
          }
          return { ok: true, count: evidence.length, destination: matrix.name };
        } catch (error) {
          return { ok: false, reason: error instanceof Error ? error.message : 'Evidence import failed.' };
        }
      },

      importProject: (json) => {
        if (projectStorageError) return { ok: false, reason: projectStorageError };
        let raw: unknown;

        try {
          raw = JSON.parse(json);
        } catch {
          return { ok: false, reason: 'JSON parse failure: invalid JSON.' };
        }

        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          return { ok: false, reason: 'Schema validation failure: expected a single project object.' };
        }

        const obj = raw as Record<string, unknown>;
        if (Object.prototype.hasOwnProperty.call(obj, 'format')) {
          return { ok: false, reason: 'Explicit format requires evidence envelope validation and a destination.' };
        }
        const matrixCount = Array.isArray(obj.achMatrices) ? obj.achMatrices.length : 0;
        const checklistCount = Array.isArray(obj.biasChecklists) ? obj.biasChecklists.length : 0;
        if (matrixCount + checklistCount === 0) {
          return { ok: false, reason: 'Empty data: project has no ACH matrices or bias checklists.' };
        }

        let project: Project | null;
        try {
          // Reject invalid optional source copies even on rows native normalization would drop.
          for (const matrix of Array.isArray(obj.achMatrices) ? obj.achMatrices : []) {
            for (const e of Array.isArray(matrix?.evidence) ? matrix.evidence : []) {
              if (e && typeof e === 'object' && Object.prototype.hasOwnProperty.call(e, 'originalRecord')) {
                validateEvidenceRecord(e.originalRecord);
              }
            }
          }
          project = normalizeImportedProject(raw);
        } catch (error) {
          return { ok: false, reason: error instanceof Error ? error.message : 'Invalid originalRecord.' };
        }
        if (!project) {
          return { ok: false, reason: 'Schema validation failure: missing required project fields.' };
        }

        set((state) => {
          // Replace if exists, otherwise add
          const exists = state.projects.some((p) => p.id === project.id);
          return {
            projects: exists
              ? state.projects.map((p) => (p.id === project.id ? project : p))
              : [...state.projects, project],
            activeProjectId: project.id,
          };
        });

        return { ok: true };
      },
    }),
    {
      name: 'intel-workbench-projects',
      version: CURRENT_SCHEMA_VERSION,
      storage: projectStorage,
      migrate: (state, version) => migrateProjectState(state, version) as ProjectStore,
    }
  )(restoreState, baseGet, api)
);
