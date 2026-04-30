import type { QoICAssessment } from '../../types';
import { formatAdmiraltyShort } from '../../utils/admiralty';

interface QoICSummaryProps {
  qoic: QoICAssessment | undefined;
}

/**
 * Compact QoIC chip rendered next to the credibility badge in the matrix
 * evidence column. Empty assessments render an "unrated" placeholder so the
 * absence is visible - analysts should aim to rate every row.
 */
export function QoICSummary({ qoic }: QoICSummaryProps) {
  if (!qoic) {
    return (
      <span
        className="text-xxs font-mono px-1.5 py-0.5 rounded border"
        style={{
          color: 'var(--iw-text-muted)',
          borderColor: 'var(--iw-border, rgba(255,255,255,0.12))',
        }}
        title="Quality of Information Check not yet performed (Tradecraft Primer pp. 11-13)"
      >
        QoIC: unrated
      </span>
    );
  }

  const code = formatAdmiraltyShort(qoic.admiraltyReliability, qoic.admiraltyAccuracy);
  const parts: string[] = [code];
  if (qoic.corroborated) parts.push('corroborated');
  if (qoic.recencyDays !== undefined) parts.push(`${qoic.recencyDays}d`);

  return (
    <span
      className="text-xxs font-mono px-1.5 py-0.5 rounded border bg-blue-500/10 text-blue-300 border-blue-500/30"
      title={qoic.caveats || 'Quality of Information Check (Tradecraft Primer pp. 11-13)'}
    >
      QoIC {parts.join(' · ')}
    </span>
  );
}
