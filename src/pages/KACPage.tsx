import { useState } from 'react';
import { Brain } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { CitationPanel } from '../components/shared/CitationPanel';
import { AssumptionList } from '../components/kac/AssumptionList';
import { AssumptionAuditBanner } from '../components/kac/AssumptionAuditBanner';

export function KACPage() {
  const project = useProjectStore((s) => s.getActiveProject());
  const matrices = project?.achMatrices ?? [];
  const [activeMatrixId, setActiveMatrixId] = useState<string | null>(matrices[0]?.id ?? null);

  const matrix = matrices.find((m) => m.id === activeMatrixId) ?? matrices[0] ?? null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain size={20} style={{ color: 'var(--iw-accent)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--iw-text)' }}>
            Key Assumptions Check
          </h2>
        </div>
        <span className="text-xxs font-mono" style={{ color: 'var(--iw-text-muted)' }}>
          Diagnostic SAT · Tradecraft Primer pp. 7-9
        </span>
      </div>

      <CitationPanel kind="kac" />

      {!project ? (
        <div className="card p-6 text-center text-sm" style={{ color: 'var(--iw-text-muted)' }}>
          No active project. Select or create a project from the Projects page to begin a Key
          Assumptions Check.
        </div>
      ) : matrices.length === 0 ? (
        <div className="card p-6 text-center text-sm" style={{ color: 'var(--iw-text-muted)' }}>
          This project has no ACH matrices yet. Create a matrix on the ACH page first; assumptions
          attach to a specific matrix.
        </div>
      ) : (
        <>
          {matrices.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {matrices.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMatrixId(m.id)}
                  className={`text-xs px-3 py-1 rounded border ${m.id === matrix?.id ? 'border-blue-400/60 text-blue-300 bg-blue-500/10' : ''}`}
                  style={{
                    color: m.id === matrix?.id ? undefined : 'var(--iw-text-muted)',
                    borderColor: m.id === matrix?.id ? undefined : 'var(--iw-border, rgba(255,255,255,0.12))',
                  }}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}

          {matrix && (
            <div className="space-y-4">
              <AssumptionAuditBanner matrix={matrix} />
              <div className="card p-5">
                <AssumptionList projectId={project.id} matrix={matrix} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
