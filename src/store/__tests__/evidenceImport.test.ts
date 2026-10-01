import { beforeEach, describe, it, expect, vi } from 'vitest';
import manual from '../../utils/__tests__/fixtures/evidence-record/hotwash-manual-export.json';
import vervet from '../../utils/__tests__/fixtures/evidence-record/vervet-export.json';
import wazuh from '../../utils/__tests__/fixtures/evidence-record/hotwash-wazuh-export.json';

const values = new Map<string, string>();
let rejectWrites = false;
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    if (rejectWrites) throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    values.set(key, value);
  },
  removeItem: (key: string) => { values.delete(key); },
};
vi.stubGlobal('localStorage', storage);
const { useProjectStore } = await import('../useProjectStore');
const json = JSON.stringify(manual);

beforeEach(() => { rejectWrites = false; values.clear(); useProjectStore.setState({ projects: [], activeProjectId: null }); });
const setup = () => {
  const store = useProjectStore.getState();
  const projectId = store.createProject('Investigation', 'Analyst project');
  const matrixId = store.createMatrix(projectId, 'Existing');
  store.addHypothesis(projectId, matrixId, 'H1', 'Existing hypothesis');
  store.addEvidence(projectId, matrixId, { source: 'manual', description: 'old', credibility: 'High', relevance: 'Low' });
  const matrix = useProjectStore.getState().projects[0].achMatrices[0];
  store.setRating(projectId, matrixId, matrix.evidence[0].id, matrix.hypotheses[0].id, 'I');
  return { store: useProjectStore.getState(), projectId, matrixId };
};

describe('atomic evidence import', () => {
  it('appends actual exporter output once, retaining existing analysis and unique local IDs', () => {
    const { store, projectId, matrixId } = setup();
    const old = store.projects[0].achMatrices[0];
    const changes = vi.fn(); const unsub = useProjectStore.subscribe(changes);
    const result = store.importEvidenceRecords(json, projectId, matrixId);
    unsub();
    expect(result).toMatchObject({ ok: true, count: 3, destination: 'Existing' });
    expect(changes).toHaveBeenCalledTimes(1);
    const matrix = useProjectStore.getState().projects[0].achMatrices[0];
    expect(matrix.hypotheses).toEqual(old.hypotheses);
    expect(matrix.evidence[0]).toEqual(old.evidence[0]);
    expect(matrix.ratings[old.evidence[0].id]).toEqual(old.ratings[old.evidence[0].id]);
    for (const [i, e] of matrix.evidence.slice(1).entries()) {
      expect(e.id).not.toBe(manual.records[i].id);
      expect(e.originalRecord).toEqual(manual.records[i]);
      expect(e.credibility).toBe('Medium'); expect(e.relevance).toBe('Medium');
      expect(matrix.ratings[e.id]).toEqual({});
    }
    expect(matrix.evidence[2].source).toBe('hotwash: (no reference recorded)');
    expect(matrix.evidence[2].description).toContain('unknown');
    expect(matrix.evidence[2].description).toContain('Yes');
    expect(store.importEvidenceRecords(json, projectId, matrixId).ok).toBe(true);
    const ids = useProjectStore.getState().projects[0].achMatrices[0].evidence.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('imports actual Vervet API output with stored verdicts and provider ATT&CK enrichment', () => {
    const { store, projectId, matrixId } = setup();
    expect(store.importData(JSON.stringify(vervet), projectId, matrixId)).toMatchObject({ ok: true, count: 3, destination: 'Existing' });
    const evidence = useProjectStore.getState().projects[0].achMatrices[0].evidence.slice(1);
    expect(evidence[0].source).toBe('connection: C-example-flow');
    expect(evidence[0].description).toContain(vervet.records[0].decision!.rationale);
    expect(evidence[0].attackTechniques).toEqual(['T1071.001']);
    expect(evidence[2].attackTechniques).toEqual(['T1071.001', 'T1059.001']);
    expect(evidence[2].description).toContain('Rationale: (not recorded)');
    evidence.forEach((e, i) => expect(e.originalRecord).toEqual(vervet.records[i]));
  });
  it('creates only the requested new matrix from the actual subject title', () => {
    const { store, projectId } = setup();
    expect(store.importEvidenceRecords(JSON.stringify(wazuh), projectId, null)).toMatchObject({ ok: true, count: 1, destination: wazuh.subject.title });
    expect(useProjectStore.getState().projects[0].achMatrices).toHaveLength(2);
    const p = store.createProject('No matrices', '');
    expect(store.importEvidenceRecords(json, p, null).ok).toBe(true);
    expect(useProjectStore.getState().projects[1].achMatrices[0].name).toBe(manual.subject.title);
  });
  it('extracts only actual attack enrichment technique IDs and retains additive provenance', () => {
    const { store, projectId, matrixId } = setup();
    const f: any = structuredClone(manual);
    f.records[0].extra = { nested: ['unchanged'] };
    f.records[0].enrichment = [
      { kind: 'attack', provider: 'annotation', value: { technique_ids: ['T1059', 'T1059.001'] }, at: null },
      { kind: 'ti', provider: 'annotation', value: { technique_ids: ['T1110'] }, at: null },
    ];
    expect(store.importEvidenceRecords(JSON.stringify(f), projectId, matrixId).ok).toBe(true);
    const e = useProjectStore.getState().projects[0].achMatrices[0].evidence[1];
    expect(e.attackTechniques).toEqual(['T1059', 'T1059.001']);
    expect(e.originalRecord).toEqual(f.records[0]);
  });
  it('fails with no mutation for malformed late records and invalid/stale destinations', () => {
    const { store, projectId, matrixId } = setup();
    const before = useProjectStore.getState(); const changes = vi.fn();
    const unsub = useProjectStore.subscribe(changes);
    const f: any = structuredClone(manual); f.records[2].decision.verdict = 'invented';
    for (const [text, p, m] of [[JSON.stringify(f), projectId, null], [json, 'missing', null], [json, projectId, 'missing']] as const) {
      expect(store.importEvidenceRecords(text, p, m).ok).toBe(false);
      expect(useProjectStore.getState()).toBe(before);
    }
    expect(changes).not.toHaveBeenCalled(); unsub();
    store.deleteMatrix(projectId, matrixId);
    const after = useProjectStore.getState();
    expect(store.importEvidenceRecords(json, projectId, matrixId).ok).toBe(false);
    expect(useProjectStore.getState()).toBe(after);
    store.setActiveProject(null);
    expect(store.importEvidenceRecords(json, projectId, null).ok).toBe(false);
  });
  it('restores the exact state and preserves saved bytes if persistence rejects an append', () => {
    const { store, projectId, matrixId } = setup();
    const before = useProjectStore.getState();
    const saved = values.get('intel-workbench-projects');
    rejectWrites = true;
    expect(store.importEvidenceRecords(json, projectId, matrixId)).toMatchObject({ ok: false, reason: expect.stringMatching(/quota/i) });
    expect(useProjectStore.getState()).toBe(before);
    expect(values.get('intel-workbench-projects')).toBe(saved);
    expect(store.importEvidenceRecords(json, projectId, null).ok).toBe(false);
    expect(useProjectStore.getState()).toBe(before);
    expect(values.get('intel-workbench-projects')).toBe(saved);
    rejectWrites = false;
    expect(store.importEvidenceRecords(json, projectId, matrixId)).toMatchObject({ ok: true, count: 3 });
    expect(useProjectStore.getState().projects[0].achMatrices[0].evidence).toHaveLength(4);
  });
  it('routes explicit formats to envelope validation and ordinary native project JSON to replacement', () => {
    const { store, projectId, matrixId } = setup();
    expect(store.importData(JSON.stringify({ ...manual, format: 'other' }), projectId, matrixId)).toMatchObject({ ok: false });
    expect(store.importData(JSON.stringify({ ...manual, format_version: '2' }), projectId, matrixId)).toMatchObject({ ok: false });
    expect(store.importData(json, projectId, matrixId)).toMatchObject({ ok: true, count: 3 });
    const exported = store.exportProject(projectId)!;
    expect(store.importData(exported, projectId, matrixId)).toEqual({ ok: true });
    expect(useProjectStore.getState().projects).toHaveLength(1);
    expect(JSON.parse(exported).format).toBeUndefined();
  });
  it('roundtrips an accumulated native export larger than the evidence-envelope byte cap', () => {
    const { store, projectId, matrixId } = setup();
    const fixture = { ...structuredClone(manual), records: Array.from({ length: 140 }, (_, i) => ({
      ...structuredClone(manual.records[1]), id: `decision:${i}`,
      decision: { ...structuredClone(manual.records[1].decision!), rationale: 'x'.repeat(8192) },
    })) };
    const incoming = JSON.stringify(fixture);
    expect(new TextEncoder().encode(incoming).byteLength).toBeLessThan(4 * 1024 * 1024);
    expect(store.importEvidenceRecords(incoming, projectId, matrixId).ok).toBe(true);
    expect(store.importEvidenceRecords(incoming, projectId, matrixId).ok).toBe(true);
    const exported = store.exportProject(projectId)!;
    expect(new TextEncoder().encode(exported).byteLength).toBeGreaterThan(4 * 1024 * 1024);
    const records = JSON.parse(exported).achMatrices[0].evidence;
    expect(store.importData(exported, projectId, matrixId)).toEqual({ ok: true });
    expect(useProjectStore.getState().projects[0].achMatrices[0].evidence).toEqual(records);
    expect(store.importProject(exported)).toEqual({ ok: true });
  });
  it('roundtrips provenance through native export/reimport and rejects invalid optional provenance atomically', () => {
    const { store, projectId, matrixId } = setup();
    const f: any = structuredClone(manual); f.records[0].extra = { nested: { values: [null, 'kept'] } };
    store.importEvidenceRecords(JSON.stringify(f), projectId, matrixId);
    const exported = store.exportProject(projectId)!;
    expect(store.importProject(exported).ok).toBe(true);
    expect(useProjectStore.getState().projects[0].achMatrices[0].evidence[1].originalRecord).toEqual(f.records[0]);
    const raw = JSON.parse(exported); raw.achMatrices[0].evidence[1].originalRecord.source.ref = 42;
    const before = useProjectStore.getState();
    expect(store.importProject(JSON.stringify(raw))).toMatchObject({ ok: false, reason: expect.stringMatching(/originalRecord/) });
    expect(useProjectStore.getState()).toBe(before);
  });
});
