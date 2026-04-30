import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  ACHMatrix,
  Evidence,
  Hypothesis,
  ConsistencyRating,
  BiasChecklist,
  KeyAssumption,
} from '../types';
import { CURRENT_SCHEMA_VERSION } from '../types';
import { generateId } from '../utils/id';
import { isProbabilityBand } from '../utils/icd203';
import { isAdmiraltyAccuracy, isAdmiraltyReliability } from '../utils/admiralty';
import { sampleProject } from '../data/sampleProject';
import { migrateProjectState } from './migrations';

export interface ImportResult {
  ok: boolean;
  reason?: string;
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

  // Key Assumptions Check (KAC)
  addAssumption: (projectId: string, matrixId: string, text: string, rationale?: string) => string;
  updateAssumption: (projectId: string, matrixId: string, assumptionId: string, updates: Partial<Pick<KeyAssumption, 'text' | 'status' | 'rationale' | 'linkedEvidenceIds'>>) => void;
  removeAssumption: (projectId: string, matrixId: string, assumptionId: string) => void;
  linkAssumptionEvidence: (projectId: string, matrixId: string, assumptionId: string, evidenceIds: string[]) => void;

  // Bias Checklist CRUD
  addBiasChecklist: (projectId: string, checklist: BiasChecklist) => void;
  toggleBias: (projectId: string, checklistId: string, biasId: string) => void;
  updateBiasMitigation: (projectId: string, checklistId: string, biasId: string, notes: string) => void;

  // Import/Export
  exportProject: (id: string) => string | null;
  importProject: (json: string) => ImportResult;
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
      const qoic = normalizeQoIC(e.qoic);
      evidence.push({
        id: e.id as string,
        description: typeof e.description === 'string' ? e.description : '',
        source: typeof e.source === 'string' ? e.source : '',
        credibility: validCredRel.has(e.credibility as string) ? (e.credibility as Evidence['credibility']) : 'Medium',
        relevance: validCredRel.has(e.relevance as string) ? (e.relevance as Evidence['relevance']) : 'Medium',
        attackTechniques: sanitizeTechniqueIds(e.attackTechniques),
        ...(qoic ? { qoic } : {}),
      });
    }
  }

  // Normalize assumptions (KAC)
  const rawAssumptions = Array.isArray(obj.assumptions) ? obj.assumptions : [];
  const assumptions: KeyAssumption[] = [];
  const assumptionStatuses = new Set(['supported', 'unsupported', 'caveated', 'unassessed']);
  for (const ra of rawAssumptions) {
    if (!ra || typeof ra !== 'object') continue;
    const a = ra as Record<string, unknown>;
    const text = typeof a.text === 'string' ? a.text : '';
    if (!text.trim()) continue;
    const id = typeof a.id === 'string' && a.id.trim() ? (a.id as string) : generateId();
    const status = assumptionStatuses.has(a.status as string)
      ? (a.status as KeyAssumption['status'])
      : 'unassessed';
    const rationale = typeof a.rationale === 'string' ? a.rationale : '';
    const linkedRaw = Array.isArray(a.linkedEvidenceIds) ? a.linkedEvidenceIds : [];
    const linkedEvidenceIds = linkedRaw.filter((v): v is string => typeof v === 'string');
    const aCreated = typeof a.createdAt === 'string' ? a.createdAt : fallbackTime;
    const aUpdated = typeof a.updatedAt === 'string' ? a.updatedAt : fallbackTime;
    assumptions.push({ id, text, status, rationale, linkedEvidenceIds, createdAt: aCreated, updatedAt: aUpdated });
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
    assumptions,
    createdAt,
    updatedAt,
  };
}

function normalizeQoIC(raw: unknown): Evidence['qoic'] {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const reliability = isAdmiraltyReliability(obj.admiraltyReliability)
    ? obj.admiraltyReliability
    : undefined;
  const accuracy = isAdmiraltyAccuracy(obj.admiraltyAccuracy)
    ? obj.admiraltyAccuracy
    : undefined;
  const corroborated = typeof obj.corroborated === 'boolean' ? obj.corroborated : false;
  const sourceProvenance = typeof obj.sourceProvenance === 'string' ? obj.sourceProvenance : '';
  const recencyDays =
    typeof obj.recencyDays === 'number' && Number.isFinite(obj.recencyDays)
      ? obj.recencyDays
      : undefined;
  const caveats = typeof obj.caveats === 'string' ? obj.caveats : '';
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
  return { admiraltyReliability: reliability, admiraltyAccuracy: accuracy, corroborated, sourceProvenance, recencyDays, caveats };
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

export const useProjectStore = create<ProjectStore>()(
  persist(
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
          assumptions: [],
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

      // Key Assumptions Check operations
      addAssumption: (projectId, matrixId, text, rationale) => {
        const id = generateId();
        const now = new Date().toISOString();
        const assumption: KeyAssumption = {
          id,
          text,
          status: 'unassessed',
          rationale: rationale ?? '',
          linkedEvidenceIds: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) =>
                    m.id === matrixId
                      ? updateMatrixTimestamp({ ...m, assumptions: [...m.assumptions, assumption] })
                      : m
                  ),
                })
              : p
          ),
        }));
        return id;
      },

      updateAssumption: (projectId, matrixId, assumptionId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) =>
                    m.id === matrixId
                      ? updateMatrixTimestamp({
                          ...m,
                          assumptions: m.assumptions.map((a) =>
                            a.id === assumptionId
                              ? { ...a, ...updates, updatedAt: new Date().toISOString() }
                              : a
                          ),
                        })
                      : m
                  ),
                })
              : p
          ),
        }));
      },

      removeAssumption: (projectId, matrixId, assumptionId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) =>
                    m.id === matrixId
                      ? updateMatrixTimestamp({
                          ...m,
                          assumptions: m.assumptions.filter((a) => a.id !== assumptionId),
                        })
                      : m
                  ),
                })
              : p
          ),
        }));
      },

      linkAssumptionEvidence: (projectId, matrixId, assumptionId, evidenceIds) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? updateProjectTimestamp({
                  ...p,
                  achMatrices: p.achMatrices.map((m) =>
                    m.id === matrixId
                      ? updateMatrixTimestamp({
                          ...m,
                          assumptions: m.assumptions.map((a) =>
                            a.id === assumptionId
                              ? { ...a, linkedEvidenceIds: evidenceIds, updatedAt: new Date().toISOString() }
                              : a
                          ),
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

      importProject: (json) => {
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
        const matrixCount = Array.isArray(obj.achMatrices) ? obj.achMatrices.length : 0;
        const checklistCount = Array.isArray(obj.biasChecklists) ? obj.biasChecklists.length : 0;
        if (matrixCount + checklistCount === 0) {
          return { ok: false, reason: 'Empty data: project has no ACH matrices or bias checklists.' };
        }

        const project = normalizeImportedProject(raw);
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
      migrate: (persistedState, version) => migrateProjectState(persistedState, version) as ProjectStore,
    }
  )
);
