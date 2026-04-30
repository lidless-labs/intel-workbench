import { useState } from 'react';
import { Plus, Trash2, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import type { ACHMatrix, KeyAssumption } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { ASSUMPTION_STATUS_LABELS, nextAssumptionStatus } from '../../utils/kac';

interface AssumptionListProps {
  projectId: string;
  matrix: ACHMatrix;
}

const STATUS_CLASSES: Record<KeyAssumption['status'], string> = {
  supported: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  caveated: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  unsupported: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  unassessed: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

export function AssumptionList({ projectId, matrix }: AssumptionListProps) {
  const addAssumption = useProjectStore((s) => s.addAssumption);
  const updateAssumption = useProjectStore((s) => s.updateAssumption);
  const removeAssumption = useProjectStore((s) => s.removeAssumption);
  const linkAssumptionEvidence = useProjectStore((s) => s.linkAssumptionEvidence);

  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) return;
    addAssumption(projectId, matrix.id, text);
    setDraft('');
  };

  const handleStatusCycle = (a: KeyAssumption) => {
    updateAssumption(projectId, matrix.id, a.id, { status: nextAssumptionStatus(a.status) });
  };

  const handleToggleEvidenceLink = (a: KeyAssumption, evidenceId: string) => {
    const next = a.linkedEvidenceIds.includes(evidenceId)
      ? a.linkedEvidenceIds.filter((id) => id !== evidenceId)
      : [...a.linkedEvidenceIds, evidenceId];
    linkAssumptionEvidence(projectId, matrix.id, a.id, next);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="State an assumption underpinning your analysis…"
          className="flex-1 px-3 py-2 text-sm rounded border bg-transparent"
          style={{ color: 'var(--iw-text)', borderColor: 'var(--iw-border, rgba(255,255,255,0.12))' }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="px-3 py-2 text-sm rounded border flex items-center gap-1 disabled:opacity-40"
          style={{ color: 'var(--iw-accent)', borderColor: 'var(--iw-accent)' }}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {matrix.assumptions.length === 0 ? (
        <p className="text-sm italic" style={{ color: 'var(--iw-text-muted)' }}>
          No assumptions recorded yet. List the things your analysis is taking for granted before
          drafting hypotheses.
        </p>
      ) : (
        <ul className="space-y-2">
          {matrix.assumptions.map((a) => {
            const isOpen = expanded.has(a.id);
            return (
              <li
                key={a.id}
                className="card p-3 space-y-2"
                style={{ borderColor: 'var(--iw-border, rgba(255,255,255,0.08))' }}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusCycle(a)}
                    title={`Click to cycle status (currently ${ASSUMPTION_STATUS_LABELS[a.status]})`}
                    className={`text-xxs font-mono uppercase px-2 py-0.5 rounded border whitespace-nowrap ${STATUS_CLASSES[a.status]}`}
                  >
                    {ASSUMPTION_STATUS_LABELS[a.status]}
                  </button>
                  <p className="flex-1 text-sm" style={{ color: 'var(--iw-text)' }}>
                    {a.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(a.id)}
                    className="p-1 rounded"
                    style={{ color: 'var(--iw-text-muted)' }}
                    aria-label={isOpen ? 'Collapse details' : 'Expand details'}
                  >
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAssumption(projectId, matrix.id, a.id)}
                    className="p-1 rounded hover:bg-rose-500/10"
                    style={{ color: 'var(--iw-text-muted)' }}
                    aria-label="Remove assumption"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {isOpen && (
                  <div className="pl-2 space-y-2">
                    <div>
                      <label
                        className="text-xxs font-mono uppercase block mb-1"
                        style={{ color: 'var(--iw-text-muted)' }}
                      >
                        Rationale
                      </label>
                      <textarea
                        value={a.rationale}
                        onChange={(e) =>
                          updateAssumption(projectId, matrix.id, a.id, { rationale: e.target.value })
                        }
                        rows={2}
                        placeholder="Why is this assumption supported, caveated, or unsupported?"
                        className="w-full px-2 py-1 text-sm rounded border bg-transparent"
                        style={{
                          color: 'var(--iw-text)',
                          borderColor: 'var(--iw-border, rgba(255,255,255,0.12))',
                        }}
                      />
                    </div>

                    {matrix.evidence.length > 0 && (
                      <div>
                        <label
                          className="text-xxs font-mono uppercase block mb-1 flex items-center gap-1"
                          style={{ color: 'var(--iw-text-muted)' }}
                        >
                          <Link2 size={11} />
                          Linked evidence ({a.linkedEvidenceIds.length}/{matrix.evidence.length})
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {matrix.evidence.map((e) => {
                            const linked = a.linkedEvidenceIds.includes(e.id);
                            return (
                              <button
                                key={e.id}
                                type="button"
                                onClick={() => handleToggleEvidenceLink(a, e.id)}
                                className={`text-xxs px-2 py-0.5 rounded border ${linked ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'border-slate-500/30'}`}
                                style={{ color: linked ? undefined : 'var(--iw-text-muted)' }}
                                title={e.description}
                              >
                                {e.description.length > 40
                                  ? `${e.description.slice(0, 40)}…`
                                  : e.description || e.id}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
