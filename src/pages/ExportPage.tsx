import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Upload,
  Copy,
  Check,
  FileJson,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { calculateAllScores, findPreferredHypothesis } from '../utils/achScoring';
import { formatBandWithRange } from '../utils/icd203';
import { useBasePath } from '../utils/useBasePath';

export function ExportPage() {
  const store = useProjectStore();
  const navigate = useNavigate();
  const basePath = useBasePath();
  const project = store.getActiveProject();
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown'>('json');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Download size={48} className="mx-auto mb-4" style={{ color: 'var(--iw-text-muted)' }} />
          <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--iw-text)' }}>No Project Selected</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--iw-text-muted)' }}>
            Select a project to export its data.
          </p>
          <button onClick={() => navigate(`${basePath}/`)} className="btn-primary">
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  const generateJSON = (): string => {
    return store.exportProject(project.id) ?? '{}';
  };

  const escapeCell = (value: string): string =>
    value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();

  const generateMarkdown = (): string => {
    const lines: string[] = [];
    lines.push(`# ${project.name}`);
    lines.push('');
    if (project.description) {
      lines.push(`> ${project.description}`);
      lines.push('');
    }
    lines.push(`**Created:** ${new Date(project.createdAt).toLocaleString()}`);
    lines.push(`**Updated:** ${new Date(project.updatedAt).toLocaleString()}`);
    lines.push('');

    for (const matrix of project.achMatrices) {
      lines.push(`## ACH Matrix: ${escapeCell(matrix.name)}`);
      lines.push('');

      const scores = calculateAllScores(matrix);
      const preferredId = findPreferredHypothesis(matrix);

      const hNames = matrix.hypotheses.map((h) => escapeCell(h.name));
      lines.push(`| Evidence | Source | Cred. | ${hNames.join(' | ')} |`);
      lines.push(`| --- | --- | --- | ${hNames.map(() => '---').join(' | ')} |`);

      for (const e of matrix.evidence) {
        const ratings = matrix.hypotheses.map((h) => {
          const r = matrix.ratings[e.id]?.[h.id] ?? 'NA';
          return r;
        });
        const desc = escapeCell(e.description).substring(0, 80);
        const source = escapeCell(e.source);
        const cred = escapeCell(e.credibility);
        lines.push(`| ${desc} | ${source} | ${cred} | ${ratings.join(' | ')} |`);
      }
      lines.push('');

      // Quality of Information Check (QoIC) sourcing detail per evidence row
      const evidenceWithQoIC = matrix.evidence.filter((e) => e.qoic);
      if (evidenceWithQoIC.length > 0) {
        lines.push('### Sourcing (Quality of Information Check)');
        lines.push('');
        lines.push('*Tradecraft Primer pp. 11-13; Admiralty NATO AAP-6 reliability/accuracy.*');
        lines.push('');
        for (const e of evidenceWithQoIC) {
          const desc = escapeCell(e.description).substring(0, 60);
          const q = e.qoic!;
          const code = [q.admiraltyReliability, q.admiraltyAccuracy].filter(Boolean).join('-') || 'unrated';
          const bits: string[] = [`**${code}**`];
          if (q.corroborated) bits.push('corroborated');
          if (q.recencyDays !== undefined) bits.push(`${q.recencyDays}d old`);
          if (q.sourceProvenance) bits.push(`provenance: ${escapeCell(q.sourceProvenance)}`);
          lines.push(`- *${desc}* — ${bits.join(' · ')}`);
          if (q.caveats) {
            lines.push(`  - *Caveats:* ${escapeCell(q.caveats)}`);
          }
        }
        lines.push('');
      }

      // Key Assumptions Check per matrix
      if (matrix.assumptions.length > 0) {
        lines.push('### Key Assumptions');
        lines.push('');
        lines.push('*Tradecraft Primer pp. 7-9; assumptions underpinning the analytic line.*');
        lines.push('');
        lines.push('| Assumption | Status | Linked Evidence | Rationale |');
        lines.push('| --- | --- | --- | --- |');
        const evidenceLookup = new Map(matrix.evidence.map((e) => [e.id, e]));
        for (const a of matrix.assumptions) {
          const text = escapeCell(a.text).substring(0, 80);
          const status = escapeCell(a.status);
          const linked = a.linkedEvidenceIds
            .map((id) => evidenceLookup.get(id)?.description?.substring(0, 30) ?? id)
            .join('; ');
          const rationale = escapeCell(a.rationale).substring(0, 100);
          lines.push(`| ${text} | ${status} | ${escapeCell(linked) || '—'} | ${rationale || '—'} |`);
        }
        lines.push('');
      }

      lines.push('### Inconsistency Scores & Confidence');
      lines.push('');
      for (const h of matrix.hypotheses) {
        const score = scores[h.id] ?? 0;
        const isPreferred = h.id === preferredId;
        const marker = isPreferred ? ' ⭐ **PREFERRED**' : '';
        const confidenceStr = h.confidence ? `**Confidence:** ${h.confidence}` : '**Confidence:** Unassessed';
        const justificationStr = h.confidenceJustification ? `, ${h.confidenceJustification}` : '';
        lines.push(`- **${escapeCell(h.name)}:** ${score}${marker}`);
        lines.push(`  - ${confidenceStr}${justificationStr}`);
        if (h.probabilityBand) {
          const ribbon = isPreferred ? ' (preferred-hypothesis ribbon)' : '';
          lines.push(`  - **ICD 203 likelihood:** ${formatBandWithRange(h.probabilityBand)}${ribbon}`);
        }
        if (h.attackTechniques && h.attackTechniques.length > 0) {
          lines.push(`  - **ATT&CK:** ${h.attackTechniques.join(', ')}`);
        }
      }
      lines.push('');

      const evidenceWithTechniques = matrix.evidence.filter(
        (e) => e.attackTechniques && e.attackTechniques.length > 0,
      );
      if (evidenceWithTechniques.length > 0) {
        lines.push('### Evidence ATT&CK Mapping');
        lines.push('');
        for (const e of evidenceWithTechniques) {
          const desc = escapeCell(e.description).substring(0, 60);
          lines.push(`- *${desc}* — ${e.attackTechniques!.join(', ')}`);
        }
        lines.push('');
      }

      lines.push('*Legend: C = Consistent, I = Inconsistent, N = Neutral, NA = Not Applicable*');
      lines.push('*Scoring: I = +2, N = 0, C = -1 (weighted by credibility × relevance)*');
      lines.push('');
    }

    for (const checklist of project.biasChecklists) {
      lines.push(`## Bias Checklist: ${escapeCell(checklist.name)}`);
      lines.push('');
      const checked = checklist.biases.filter((b) => b.checked).length;
      lines.push(`**Progress:** ${checked}/${checklist.biases.length} reviewed`);
      lines.push('');
      lines.push('| Bias | Category | Reviewed | Mitigation Notes |');
      lines.push('| --- | --- | --- | --- |');
      for (const bias of checklist.biases) {
        const status = bias.checked ? '✅' : '⬜';
        const name = escapeCell(bias.name);
        const category = escapeCell(bias.category);
        const notes = escapeCell(bias.mitigationNotes).substring(0, 100);
        lines.push(`| ${name} | ${category} | ${status} | ${notes} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  };

  const getExportContent = (): string => {
    return exportFormat === 'json' ? generateJSON() : generateMarkdown();
  };

  const [copyError, setCopyError] = useState('');

  const handleCopy = async () => {
    const content = getExportContent();
    setCopyError('');
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError('Failed to copy. Try selecting the text above and copying manually.');
      setTimeout(() => setCopyError(''), 5000);
    }
  };

  const handleDownload = () => {
    const content = getExportContent();
    const ext = exportFormat === 'json' ? 'json' : 'md';
    const mime = exportFormat === 'json' ? 'application/json' : 'text/markdown';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setImportError('');
    setImportSuccess(false);

    if (!importText.trim()) {
      setImportError('Please paste a JSON project export.');
      return;
    }

    const result = store.importProject(importText);
    if (result.ok) {
      setImportSuccess(true);
      setImportText('');
      setTimeout(() => setImportSuccess(false), 3000);
      return;
    }

    setImportError(result.reason ?? 'Import failed.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--iw-text)' }}>Export & Import</h2>
        <p className="text-sm" style={{ color: 'var(--iw-text-muted)' }}>
          Export your analysis as JSON (for backup/sharing) or Markdown (for reports).
        </p>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--iw-text)' }}>Export Project</h3>

        <div className="flex gap-2">
          <button
            onClick={() => setExportFormat('json')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              exportFormat === 'json'
                ? 'bg-accent-500/10 text-accent-400 border border-accent-500/30'
                : 'bg-surface-700 border border-slate-700/50 hover:text-slate-200'
            }`}
            style={{ color: exportFormat === 'json' ? 'var(--iw-accent)' : 'var(--iw-text-muted)' }}
          >
            <FileJson size={16} />
            JSON
          </button>
          <button
            onClick={() => setExportFormat('markdown')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              exportFormat === 'markdown'
                ? 'bg-accent-500/10 text-accent-400 border border-accent-500/30'
                : 'bg-surface-700 border border-slate-700/50 hover:text-slate-200'
            }`}
            style={{ color: exportFormat === 'markdown' ? 'var(--iw-accent)' : 'var(--iw-text-muted)' }}
          >
            <FileText size={16} />
            Markdown
          </button>
        </div>

        <div className="relative">
          <pre className="border border-slate-700/50 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap" style={{ color: 'var(--iw-text)', backgroundColor: 'var(--iw-bg)' }}>
            {getExportContent()}
          </pre>
        </div>

        <div className="flex gap-2">
          <button onClick={handleCopy} className="btn-secondary text-xs">
            {copied ? (
              <>
                <Check size={14} className="inline mr-1 text-intel-green" /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} className="inline mr-1" /> Copy to Clipboard
              </>
            )}
          </button>
          <button onClick={handleDownload} className="btn-primary text-xs">
            <Download size={14} className="inline mr-1" /> Download File
          </button>
        </div>
        {copyError && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle size={14} />
            {copyError}
          </div>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--iw-text)' }}>Import Project</h3>
        <p className="text-xs" style={{ color: 'var(--iw-text-muted)' }}>
          Paste a previously exported JSON project to import it. If a project with the same ID
          exists, it will be replaced.
        </p>
        <textarea
          className="input-field font-mono text-xs resize-none"
          rows={6}
          placeholder="Paste JSON here..."
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        {importError && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle size={14} />
            {importError}
          </div>
        )}
        {importSuccess && (
          <div className="flex items-center gap-2 text-xs text-intel-green">
            <Check size={14} />
            Project imported successfully!
          </div>
        )}
        <button onClick={handleImport} className="btn-secondary text-xs">
          <Upload size={14} className="inline mr-1" /> Import
        </button>
      </div>
    </div>
  );
}
