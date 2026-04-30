import { AlertTriangle } from 'lucide-react';
import type { ACHMatrix } from '../../types';
import { findUnexaminedAssumptions, shouldShowAssumptionAuditBanner } from '../../utils/kac';

interface AssumptionAuditBannerProps {
  matrix: ACHMatrix;
  /** Optional: clicking the banner can scroll to the assumptions section. */
  onAudit?: () => void;
}

/**
 * Surfaces unsupported or unexamined assumptions on the matrix. Per the
 * Tradecraft Primer (pp. 7-9), unstated or unsupported premises are the most
 * common silent failure mode in analytic work.
 */
export function AssumptionAuditBanner({ matrix, onAudit }: AssumptionAuditBannerProps) {
  if (!shouldShowAssumptionAuditBanner(matrix)) return null;

  const unsupported = matrix.assumptions.filter((a) => a.status === 'unsupported').length;
  const unexamined = findUnexaminedAssumptions(matrix).length;

  const messages: string[] = [];
  if (unsupported > 0) {
    messages.push(`${unsupported} unsupported assumption${unsupported === 1 ? '' : 's'}`);
  }
  if (unexamined > 0) {
    messages.push(`${unexamined} not linked to evidence`);
  }

  return (
    <div
      className="rounded border px-3 py-2 flex items-start gap-2"
      style={{
        borderColor: 'rgba(245, 158, 11, 0.4)',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
      }}
    >
      <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-amber-200">Key Assumptions Check needed</p>
        <p className="text-amber-100/80 text-xs mt-0.5">
          {messages.join(' · ')}. Per the CIA Tradecraft Primer (pp. 7-9), test each before drawing
          an analytic line.
        </p>
      </div>
      {onAudit && (
        <button
          type="button"
          onClick={onAudit}
          className="text-xxs font-mono uppercase px-2 py-1 rounded border border-amber-400/40 text-amber-200 hover:bg-amber-500/10"
        >
          Audit
        </button>
      )}
    </div>
  );
}
