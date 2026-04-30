import type { Evidence, QoICAssessment } from '../../types';
import {
  ADMIRALTY_ACCURACY_LABELS,
  ADMIRALTY_ACCURACY_OPTIONS,
  ADMIRALTY_RELIABILITY_LABELS,
  ADMIRALTY_RELIABILITY_OPTIONS,
} from '../../utils/admiralty';

interface QoICEditorProps {
  value: QoICAssessment | undefined;
  onChange: (next: QoICAssessment | undefined) => void;
}

/**
 * Per-evidence Quality of Information Check editor. Sets Admiralty NATO AAP-6
 * source reliability (A-F) and information accuracy (1-6), corroboration flag,
 * recency (days), and analyst caveats. Does NOT alter ACH scoring - the QoIC
 * overlay informs how analysts interpret credibility/relevance, per the
 * Tradecraft Primer (pp. 11-13) and the SAT-library design.
 */
export function QoICEditor({ value, onChange }: QoICEditorProps) {
  const current: QoICAssessment = value ?? {
    corroborated: false,
    sourceProvenance: '',
    caveats: '',
  };

  const update = (patch: Partial<QoICAssessment>) => {
    const next = { ...current, ...patch };
    // Drop entirely-empty assessments back to undefined so persisted state stays clean.
    if (
      !next.admiraltyReliability &&
      !next.admiraltyAccuracy &&
      !next.corroborated &&
      !next.sourceProvenance &&
      next.recencyDays === undefined &&
      !next.caveats
    ) {
      onChange(undefined);
      return;
    }
    onChange(next);
  };

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            className="text-xxs font-mono uppercase block mb-1"
            style={{ color: 'var(--iw-text-muted)' }}
          >
            Admiralty source reliability
          </label>
          <select
            value={current.admiraltyReliability ?? ''}
            onChange={(e) =>
              update({
                admiraltyReliability: e.target.value
                  ? (e.target.value as QoICAssessment['admiraltyReliability'])
                  : undefined,
              })
            }
            className="w-full px-2 py-1 rounded border bg-transparent"
            style={{ color: 'var(--iw-text)', borderColor: 'var(--iw-border, rgba(255,255,255,0.12))' }}
          >
            <option value="">- unrated -</option>
            {ADMIRALTY_RELIABILITY_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ADMIRALTY_RELIABILITY_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="text-xxs font-mono uppercase block mb-1"
            style={{ color: 'var(--iw-text-muted)' }}
          >
            Information accuracy
          </label>
          <select
            value={current.admiraltyAccuracy ?? ''}
            onChange={(e) =>
              update({
                admiraltyAccuracy: e.target.value
                  ? (e.target.value as QoICAssessment['admiraltyAccuracy'])
                  : undefined,
              })
            }
            className="w-full px-2 py-1 rounded border bg-transparent"
            style={{ color: 'var(--iw-text)', borderColor: 'var(--iw-border, rgba(255,255,255,0.12))' }}
          >
            <option value="">- unrated -</option>
            {ADMIRALTY_ACCURACY_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {ADMIRALTY_ACCURACY_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--iw-text)' }}>
          <input
            type="checkbox"
            checked={current.corroborated}
            onChange={(e) => update({ corroborated: e.target.checked })}
          />
          Corroborated by independent source
        </label>

        <div>
          <label
            className="text-xxs font-mono uppercase block mb-1"
            style={{ color: 'var(--iw-text-muted)' }}
          >
            Recency (days)
          </label>
          <input
            type="number"
            min={0}
            value={current.recencyDays ?? ''}
            onChange={(e) =>
              update({ recencyDays: e.target.value === '' ? undefined : Number(e.target.value) })
            }
            placeholder="age of information"
            className="w-full px-2 py-1 rounded border bg-transparent"
            style={{ color: 'var(--iw-text)', borderColor: 'var(--iw-border, rgba(255,255,255,0.12))' }}
          />
        </div>
      </div>

      <div>
        <label
          className="text-xxs font-mono uppercase block mb-1"
          style={{ color: 'var(--iw-text-muted)' }}
        >
          Source provenance
        </label>
        <input
          type="text"
          value={current.sourceProvenance}
          onChange={(e) => update({ sourceProvenance: e.target.value })}
          placeholder="chain of custody, collection method, original publisher"
          className="w-full px-2 py-1 rounded border bg-transparent"
          style={{ color: 'var(--iw-text)', borderColor: 'var(--iw-border, rgba(255,255,255,0.12))' }}
        />
      </div>

      <div>
        <label
          className="text-xxs font-mono uppercase block mb-1"
          style={{ color: 'var(--iw-text-muted)' }}
        >
          Caveats
        </label>
        <textarea
          value={current.caveats}
          onChange={(e) => update({ caveats: e.target.value })}
          rows={2}
          placeholder="known biases, gaps, or sourcing concerns the reader should weigh"
          className="w-full px-2 py-1 rounded border bg-transparent"
          style={{ color: 'var(--iw-text)', borderColor: 'var(--iw-border, rgba(255,255,255,0.12))' }}
        />
      </div>
    </div>
  );
}

export type { Evidence };
