import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { CITATIONS, type SATKind } from '../../data/citations';

interface CitationPanelProps {
  kind: SATKind;
  defaultOpen?: boolean;
}

/**
 * Reusable citation block surfaced at the top of every SAT page. Collapsed by
 * default. Backs the academic-defensibility goal of the SAT library reframe:
 * each technique cites its source in the CIA Tradecraft Primer and Heuer & Pherson.
 */
export function CitationPanel({ kind, defaultOpen = false }: CitationPanelProps) {
  const citation = CITATIONS[kind];
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={16} style={{ color: 'var(--iw-accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--iw-text)' }}>
            Methodology - {citation.title}
          </span>
          <span
            className="text-xxs font-mono px-2 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--iw-accent-soft, rgba(255,255,255,0.06))',
              color: 'var(--iw-text-muted)',
            }}
          >
            {citation.tier}
          </span>
        </div>
        {open ? (
          <ChevronUp size={16} style={{ color: 'var(--iw-text-muted)' }} />
        ) : (
          <ChevronDown size={16} style={{ color: 'var(--iw-text-muted)' }} />
        )}
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-sm" style={{ color: 'var(--iw-text-muted)' }}>
          <p style={{ color: 'var(--iw-text)' }}>{citation.summary}</p>
          <p>
            <span className="font-semibold" style={{ color: 'var(--iw-text)' }}>
              When to use:
            </span>{' '}
            {citation.methodologyNote}
          </p>
          <div className="border-t pt-3" style={{ borderColor: 'var(--iw-border, rgba(255,255,255,0.08))' }}>
            <p className="text-xs">
              <span className="font-semibold" style={{ color: 'var(--iw-text)' }}>
                Primary source:
              </span>{' '}
              {citation.primarySource} <em>{citation.pageRange}</em>
            </p>
            <p className="text-xs mt-1">
              <span className="font-semibold" style={{ color: 'var(--iw-text)' }}>
                See also:
              </span>{' '}
              {citation.secondarySource}
            </p>
            {citation.tertiarySource && (
              <p className="text-xs mt-1">
                <span className="font-semibold" style={{ color: 'var(--iw-text)' }}>
                  Standards:
                </span>{' '}
                {citation.tertiarySource}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
