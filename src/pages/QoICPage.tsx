import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { CitationPanel } from '../components/shared/CitationPanel';
import { QoICEditor } from '../components/qoic/QoICEditor';
import { QoICSummary } from '../components/qoic/QoICSummary';
import { ADMIRALTY_RELIABILITY_OPTIONS } from '../utils/admiralty';
import type { AdmiraltyReliability } from '../types';

type SortKey = 'reliability' | 'accuracy' | 'matrix';

export function QoICPage() {
  const project = useProjectStore((s) => s.getActiveProject());
  const updateEvidence = useProjectStore((s) => s.updateEvidence);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('matrix');

  const rows = project
    ? project.achMatrices.flatMap((m) =>
        m.evidence.map((e) => ({ matrix: m, evidence: e }))
      )
    : [];

  const reliabilityOrder: Record<AdmiraltyReliability | '', number> = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    '': 7,
  };

  const sorted = [...rows].sort((a, b) => {
    if (sortKey === 'matrix') return a.matrix.name.localeCompare(b.matrix.name);
    if (sortKey === 'reliability') {
      return (
        reliabilityOrder[a.evidence.qoic?.admiraltyReliability ?? ''] -
        reliabilityOrder[b.evidence.qoic?.admiraltyReliability ?? '']
      );
    }
    return (a.evidence.qoic?.admiraltyAccuracy ?? '9').localeCompare(
      b.evidence.qoic?.admiraltyAccuracy ?? '9'
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} style={{ color: 'var(--iw-accent)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--iw-text)' }}>
            Quality of Information Check
          </h2>
        </div>
        <span className="text-xxs font-mono" style={{ color: 'var(--iw-text-muted)' }}>
          Diagnostic SAT · Admiralty AAP-6 · Tradecraft Primer pp. 11-13
        </span>
      </div>

      <CitationPanel kind="qoic" />

      {!project ? (
        <div className="card p-6 text-center text-sm" style={{ color: 'var(--iw-text-muted)' }}>
          No active project.
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-6 text-center text-sm" style={{ color: 'var(--iw-text-muted)' }}>
          No evidence rows recorded yet across this project&apos;s matrices.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 text-xs">
            <span style={{ color: 'var(--iw-text-muted)' }}>Sort by:</span>
            {(['matrix', 'reliability', 'accuracy'] as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSortKey(k)}
                className={`px-2 py-1 rounded border ${sortKey === k ? 'border-blue-400/60 text-blue-300 bg-blue-500/10' : ''}`}
                style={{
                  color: sortKey === k ? undefined : 'var(--iw-text-muted)',
                  borderColor: sortKey === k ? undefined : 'var(--iw-border, rgba(255,255,255,0.12))',
                }}
              >
                {k}
              </button>
            ))}
            <span className="ml-auto" style={{ color: 'var(--iw-text-muted)' }}>
              {rows.filter((r) => !r.evidence.qoic).length} of {rows.length} unrated
            </span>
          </div>

          <div className="space-y-2">
            {sorted.map(({ matrix, evidence }) => (
              <div key={`${matrix.id}-${evidence.id}`} className="card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xxs font-mono uppercase mb-1"
                      style={{ color: 'var(--iw-text-muted)' }}
                    >
                      {matrix.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--iw-text)' }}>
                      {evidence.description || <em>(no description)</em>}
                    </p>
                    {evidence.source && (
                      <p className="text-xs mt-1" style={{ color: 'var(--iw-text-muted)' }}>
                        Source: {evidence.source}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <QoICSummary qoic={evidence.qoic} />
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === evidence.id ? null : evidence.id)}
                      className="text-xxs font-mono uppercase px-2 py-1 rounded border"
                      style={{
                        color: 'var(--iw-accent)',
                        borderColor: 'var(--iw-accent)',
                      }}
                    >
                      {editingId === evidence.id ? 'close' : 'edit'}
                    </button>
                  </div>
                </div>

                {editingId === evidence.id && (
                  <div
                    className="mt-3 pt-3 border-t"
                    style={{ borderColor: 'var(--iw-border, rgba(255,255,255,0.08))' }}
                  >
                    <QoICEditor
                      value={evidence.qoic}
                      onChange={(next) =>
                        updateEvidence(project.id, matrix.id, evidence.id, { qoic: next })
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {/* Hide unused import warning while exposing options for downstream consumers */}
      <span hidden>{ADMIRALTY_RELIABILITY_OPTIONS.length}</span>
    </div>
  );
}
