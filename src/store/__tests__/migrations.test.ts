import { describe, it, expect, vi } from 'vitest';
import { migrateProjectState } from '../migrations';
import { sampleProject } from '../../data/sampleProject';
import { CURRENT_SCHEMA_VERSION } from '../../types';

const prior = () => ({
  projects: [{ ...structuredClone(sampleProject), custom: { kept: true },
    biasChecklists: [{ id: 'checklist', name: 'Review', createdAt: '2024-01-01', updatedAt: '2024-01-02',
      biases: [{ id: 'bias', name: 'Bias', description: 'Original', category: 'Analysis', checked: true, mitigationNotes: 'Retained' }] }],
  }],
  activeProjectId: sampleProject.id,
  additiveState: { retained: ['exactly'] },
});

describe('project persistence version 0 to 1', () => {
  it('retains the exact prior object, including analysis, checklists, ratings, timestamps and active selection', () => {
    const state = prior();
    const first = state.projects[0].achMatrices[0].hypotheses[0];
    first.confidence = 'High'; first.confidenceJustification = 'Original reasoning'; first.probabilityBand = 'likely'; first.attackTechniques = ['T1059'];
    const frozen = JSON.stringify(state);
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
    expect(migrateProjectState(state, 0)).toBe(state);
    expect(JSON.stringify(state)).toBe(frozen);
    expect(migrateProjectState(state, 1)).toBe(state);
    expect(() => migrateProjectState(state, 2)).toThrow(/unsupported.*version/i);
  });
  it.each([undefined, 0])('hydrates unversioned or version 0 state without native normalization (%s)', async (version) => {
    vi.resetModules();
    const state = prior(); const raw = JSON.stringify({ state, ...(version === undefined ? {} : { version }) });
    const values = new Map([['intel-workbench-projects', raw]]);
    const writes: string[] = [];
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); writes.push(value); },
      removeItem: (key: string) => { values.delete(key); },
    });
    const { useProjectStore } = await import('../useProjectStore');
    expect(useProjectStore.getState().projects).toEqual(state.projects);
    expect(useProjectStore.getState().activeProjectId).toBe(state.activeProjectId);
    expect((useProjectStore.getState() as any).additiveState).toEqual(state.additiveState);
    expect(useProjectStore.persist.hasHydrated()).toBe(true);
    expect(writes.every(value => JSON.parse(value).version === 1)).toBe(true);
    expect(useProjectStore.persist.getOptions().name).toBe('intel-workbench-projects');
  });
  it('rejects future state without hydrating it or overwriting saved data', async () => {
    vi.resetModules();
    const raw = JSON.stringify({ state: prior(), version: 2 });
    let saved: string | null = raw;
    const remove = vi.fn(() => { saved = null; });
    const write = vi.fn((_key: string, value: string) => { saved = value; });
    vi.stubGlobal('localStorage', { getItem: () => saved, setItem: write, removeItem: remove });
    const { useProjectStore, getProjectStorageError } = await import('../useProjectStore');
    expect(getProjectStorageError()).toMatch(/unsupported schema version 2.*cannot.*saved/i);
    expect(useProjectStore.persist.hasHydrated()).toBe(false);
    expect(useProjectStore.getState().projects).toEqual([]);
    expect(write).not.toHaveBeenCalled();
    const id = useProjectStore.getState().createProject('Later action', 'Cannot overwrite newer data');
    useProjectStore.getState().updateProject(id, { name: 'Later update' });
    await useProjectStore.persist.clearStorage();
    expect(saved).toBe(raw);
    expect(remove).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });
});
