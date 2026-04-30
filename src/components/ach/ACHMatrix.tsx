import { useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  Plus,
  Trash2,
  AlertTriangle,
  Trophy,
  X,
  Grid3X3,
  Info,
} from 'lucide-react';
import type { ACHMatrix as ACHMatrixType, ConsistencyRating, Evidence, Hypothesis, ConfidenceLevel, ProbabilityBand } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { AssumptionAuditBanner } from '../kac/AssumptionAuditBanner';
import { QoICSummary } from '../qoic/QoICSummary';
import {
  calculateAllScores,
  findPreferredHypothesis,
  getNormalizedScores,
  cycleRating,
  getRatingLabel,
} from '../../utils/achScoring';
import { ACHScoreBar } from './ACHScoreBar';
import { ProbabilityBandPicker } from './ProbabilityBandPicker';
import { PreferredBandRibbon } from './PreferredBandRibbon';
import { TechniqueSelector } from '../attack/TechniqueSelector';
import { TechniqueChips } from '../attack/TechniqueChips';

interface ACHMatrixProps {
  projectId: string;
  matrix: ACHMatrixType;
}

const RATING_STYLES: Record<ConsistencyRating, string> = {
  C: 'bg-green-500/20 text-green-400 border-green-500/30',
  I: 'bg-red-500/20 text-red-400 border-red-500/30',
  N: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  NA: 'bg-transparent border-slate-700/30',
};

const RATING_LABELS: Record<ConsistencyRating, string> = {
  C: 'C',
  I: 'I',
  N: 'N',
  NA: '—',
};

const CONFIDENCE_CYCLE: (ConfidenceLevel | undefined)[] = [undefined, 'Low', 'Moderate', 'High'];

const CONFIDENCE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Low: { 
    bg: 'bg-amber-500/20', 
    text: 'text-amber-500', 
    border: 'border-amber-500/30',
    label: 'Low'
  },
  Moderate: { 
    bg: 'bg-blue-500/20', 
    text: 'text-blue-500', 
    border: 'border-blue-500/30',
    label: 'Moderate'
  },
  High: { 
    bg: 'bg-green-500/20', 
    text: 'text-green-500', 
    border: 'border-green-500/30',
    label: 'High'
  },
  Unassessed: { 
    bg: 'bg-gray-500/20', 
    text: 'text-gray-400', 
    border: 'border-gray-500/30',
    label: 'Unassessed'
  },
};

// ICD 203 Definitions for tooltips
const CONFIDENCE_DEFINITIONS: Record<string, string> = {
  Low: '"Roughly even chance" or significant unknowns remain',
  Moderate: 'Information is credibly sourced and plausible, but insufficient for higher confidence',
  High: 'High-quality information from multiple independent sources with logical interpretation',
};

export function ACHMatrix({ projectId, matrix }: ACHMatrixProps) {
  const store = useProjectStore();
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'hypothesis' | 'evidence';
    id: string;
  } | null>(null);
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [showAddHypothesis, setShowAddHypothesis] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    type: 'hypothesis' | 'evidence';
    id: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [expandedJustification, setExpandedJustification] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // New evidence form
  const [newEvidence, setNewEvidence] = useState<Omit<Evidence, 'id'>>({
    description: '',
    source: '',
    credibility: 'Medium',
    relevance: 'Medium',
    attackTechniques: [],
  });

  // New hypothesis form
  const [newHypName, setNewHypName] = useState('');
  const [newHypDesc, setNewHypDesc] = useState('');
  const [newHypTechniques, setNewHypTechniques] = useState<string[]>([]);

  const scores = useMemo(
    () => calculateAllScores(matrix),
    [matrix.ratings, matrix.evidence, matrix.hypotheses]
  );
  const normalizedScores = useMemo(
    () => getNormalizedScores(matrix),
    [matrix.ratings, matrix.evidence, matrix.hypotheses]
  );
  const preferredId = useMemo(
    () => findPreferredHypothesis(matrix),
    [matrix.ratings, matrix.evidence, matrix.hypotheses]
  );

  const handleCycleRating = useCallback(
    (evidenceId: string, hypothesisId: string) => {
      const current = matrix.ratings[evidenceId]?.[hypothesisId];
      const next = cycleRating(current);
      store.setRating(projectId, matrix.id, evidenceId, hypothesisId, next);
    },
    [projectId, matrix.id, matrix.ratings, store]
  );

  const handleCycleConfidence = useCallback(
    (hypothesisId: string) => {
      const hypothesis = matrix.hypotheses.find((h) => h.id === hypothesisId);
      const current = hypothesis?.confidence;
      const currentIndex = CONFIDENCE_CYCLE.indexOf(current);
      const nextIndex = (currentIndex + 1) % CONFIDENCE_CYCLE.length;
      const next = CONFIDENCE_CYCLE[nextIndex];
      store.updateHypothesis(projectId, matrix.id, hypothesisId, { confidence: next });
    },
    [projectId, matrix.id, matrix.hypotheses, store]
  );

  const handleUpdateJustification = useCallback(
    (hypothesisId: string, justification: string) => {
      store.updateHypothesis(projectId, matrix.id, hypothesisId, { confidenceJustification: justification });
    },
    [projectId, matrix.id, store]
  );

  const handleSetProbabilityBand = useCallback(
    (hypothesisId: string, band: ProbabilityBand | undefined) => {
      store.updateHypothesis(projectId, matrix.id, hypothesisId, { probabilityBand: band });
    },
    [projectId, matrix.id, store]
  );

  const handleAddEvidence = () => {
    if (!newEvidence.description.trim()) return;
    const payload = {
      ...newEvidence,
      attackTechniques: (newEvidence.attackTechniques?.length ?? 0) > 0 ? newEvidence.attackTechniques : undefined,
    };
    store.addEvidence(projectId, matrix.id, payload);
    setNewEvidence({ description: '', source: '', credibility: 'Medium', relevance: 'Medium', attackTechniques: [] });
    setShowAddEvidence(false);
  };

  const handleAddHypothesis = () => {
    if (!newHypName.trim()) return;
    store.addHypothesis(projectId, matrix.id, newHypName, newHypDesc, newHypTechniques);
    setNewHypName('');
    setNewHypDesc('');
    setNewHypTechniques([]);
    setShowAddHypothesis(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'hypothesis') {
      store.removeHypothesis(projectId, matrix.id, confirmDelete.id);
    } else {
      store.removeEvidence(projectId, matrix.id, confirmDelete.id);
    }
    setConfirmDelete(null);
  };

  const startEditing = (type: 'hypothesis' | 'evidence', id: string, field: string, value: string) => {
    setEditingCell({ type, id, field });
    setEditValue(value);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    if (editingCell.type === 'hypothesis') {
      store.updateHypothesis(projectId, matrix.id, editingCell.id, {
        [editingCell.field]: editValue,
      } as Partial<Pick<Hypothesis, 'name' | 'description' | 'confidence' | 'confidenceJustification'>>);
    } else {
      store.updateEvidence(projectId, matrix.id, editingCell.id, {
        [editingCell.field]: editValue,
      });
    }
    setEditingCell(null);
    setEditValue('');
  };

  const credBadgeClass = (level: 'High' | 'Medium' | 'Low') => {
    switch (level) {
      case 'High':
        return 'badge-high';
      case 'Medium':
        return 'badge-medium';
      case 'Low':
        return 'badge-low';
      default:
        return 'badge-low';
    }
  };

  const getConfidenceStyle = (confidence: ConfidenceLevel | undefined) => {
    return confidence ? CONFIDENCE_STYLES[confidence] : CONFIDENCE_STYLES.Unassessed;
  };

  if (matrix.hypotheses.length === 0 && matrix.evidence.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Grid3X3 size={48} className="mx-auto mb-4" style={{color: "var(--iw-text-muted)"}} />
        <h3 className="text-lg font-medium mb-2" style={{color: "var(--iw-text)"}}>Empty Matrix</h3>
        <p className="text-sm mb-6 max-w-md mx-auto" style={{color: "var(--iw-text-muted)"}}>
          Start by adding hypotheses (columns) and evidence (rows) to build your Analysis of Competing Hypotheses matrix.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setShowAddHypothesis(true)} className="btn-primary">
            <Plus size={16} className="inline mr-1" /> Add Hypothesis
          </button>
          <button onClick={() => setShowAddEvidence(true)} className="btn-secondary">
            <Plus size={16} className="inline mr-1" /> Add Evidence
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key Assumptions audit banner */}
      <AssumptionAuditBanner matrix={matrix} />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <button onClick={() => setShowAddHypothesis(true)} className="btn-secondary text-xs">
          <Plus size={14} className="inline mr-1" /> Hypothesis
        </button>
        <button onClick={() => setShowAddEvidence(true)} className="btn-secondary text-xs">
          <Plus size={14} className="inline mr-1" /> Evidence
        </button>
        {preferredId && (
          <div className="ml-auto flex items-center gap-2 text-xs text-intel-green">
            <Trophy size={14} />
            <span className="font-mono">
              Preferred: {matrix.hypotheses.find((h) => h.id === preferredId)?.name}
            </span>
          </div>
        )}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-800">
              {/* Evidence header */}
              <th className="sticky left-0 z-10 bg-surface-800 p-3 text-left text-xs font-mono font-semibold uppercase tracking-wider border-b border-r border-slate-700/50 min-w-[300px]" style={{color: "var(--iw-text-muted)"}}>
                Evidence / Indicators
              </th>
              <th className="p-3 text-center text-xs font-mono font-semibold uppercase tracking-wider border-b border-r border-slate-700/50 w-16" style={{color: "var(--iw-text-muted)"}}>
                Cred.
              </th>
              <th className="p-3 text-center text-xs font-mono font-semibold uppercase tracking-wider border-b border-r border-slate-700/50 w-16" style={{color: "var(--iw-text-muted)"}}>
                Rel.
              </th>
              {/* Hypothesis columns */}
              {matrix.hypotheses.map((h, hIdx) => {
                const confidenceStyle = getConfidenceStyle(h.confidence);
                const isJustificationExpanded = expandedJustification === h.id;
                return (
                  <th
                    key={h.id}
                    className={`p-3 text-center border-b border-r border-slate-700/50 min-w-[180px] ${
                      h.id === preferredId ? 'bg-intel-green/5' : ''
                    }`}
                    {...(hIdx === 0 ? { 'data-tour': 'hypothesis-columns' } : {})}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {h.id === preferredId && h.probabilityBand && (
                        <PreferredBandRibbon band={h.probabilityBand} />
                      )}
                      <div className="flex items-center gap-1">
                        {h.id === preferredId && (
                          <Trophy size={12} className="text-intel-green" />
                        )}
                        {editingCell?.type === 'hypothesis' &&
                        editingCell.id === h.id &&
                        editingCell.field === 'name' ? (
                          <input
                            autoFocus
                            className="input-field text-xs text-center w-full"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit();
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                          />
                        ) : (
                          <span
                            className="text-xs font-semibold cursor-pointer hover:text-accent-400 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none rounded"
                            style={{ color: "var(--iw-text)" }}
                            onClick={() => startEditing('hypothesis', h.id, 'name', h.name)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                startEditing('hypothesis', h.id, 'name', h.name);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            title="Click to edit"
                            aria-label={`Edit hypothesis: ${h.name}`}
                          >
                            {h.name}
                          </span>
                        )}
                      </div>
                      
                      {/* Confidence Badge */}
                      <div className="relative">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCycleConfidence(h.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xxs font-medium border transition-all hover:opacity-80 ${confidenceStyle.bg} ${confidenceStyle.text} ${confidenceStyle.border}`}
                            title="Click to cycle confidence level"
                          >
                            {confidenceStyle.label}
                          </button>
                          <div className="relative">
                            <button
                              onMouseEnter={() => setShowTooltip(h.id)}
                              onMouseLeave={() => setShowTooltip(null)}
                              className="p-0.5 hover:opacity-80 transition-opacity"
                              style={{ color: "var(--iw-text-muted)" }}
                              aria-label="ICD 203 Confidence Level Definitions"
                            >
                              <Info size={12} />
                            </button>
                            {showTooltip === h.id && (
                              <div className="absolute left-full ml-2 top-0 z-50 w-64 p-3 rounded-lg shadow-xl border text-xs"
                                style={{ 
                                  backgroundColor: "var(--iw-surface)", 
                                  borderColor: "var(--iw-border)",
                                  color: "var(--iw-text)"
                                }}
                              >
                                <div className="font-semibold mb-2">ICD 203 Confidence Levels</div>
                                <div className="space-y-1.5">
                                  <div>
                                    <span className="font-medium text-amber-500">Low:</span>{' '}
                                    <span style={{ color: "var(--iw-text-muted)" }}>{CONFIDENCE_DEFINITIONS.Low}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-500">Moderate:</span>{' '}
                                    <span style={{ color: "var(--iw-text-muted)" }}>{CONFIDENCE_DEFINITIONS.Moderate}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-green-500">High:</span>{' '}
                                    <span style={{ color: "var(--iw-text-muted)" }}>{CONFIDENCE_DEFINITIONS.High}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Confidence Justification */}
                      <div className="w-full">
                        <button
                          onClick={() => setExpandedJustification(isJustificationExpanded ? null : h.id)}
                          className="text-xxs font-mono hover:underline"
                          style={{ color: "var(--iw-text-muted)" }}
                        >
                          {isJustificationExpanded ? 'Hide justification' : (h.confidenceJustification ? 'Edit justification' : 'Add justification')}
                        </button>
                        {isJustificationExpanded && (
                          <textarea
                            className="input-field text-xs w-full mt-1 resize-none"
                            rows={2}
                            placeholder="Explain your confidence assessment..."
                            value={h.confidenceJustification || ''}
                            onChange={(e) => handleUpdateJustification(h.id, e.target.value)}
                            onBlur={() => setExpandedJustification(null)}
                            autoFocus
                          />
                        )}
                      </div>

                      {/* ICD 203 estimative likelihood picker */}
                      <ProbabilityBandPicker
                        value={h.probabilityBand}
                        onChange={(band) => handleSetProbabilityBand(h.id, band)}
                        contextLabel={h.name}
                      />

                      <span className="text-xxs font-mono" style={{color: "var(--iw-text-muted)"}}>
                        Score: {scores[h.id] ?? 0}
                      </span>
                      {h.attackTechniques && h.attackTechniques.length > 0 && (
                        <div className="w-full flex justify-center">
                          <TechniqueChips
                            ids={h.attackTechniques}
                            onRemove={(id) =>
                              store.updateHypothesis(projectId, matrix.id, h.id, {
                                attackTechniques: h.attackTechniques?.filter((t) => t !== id),
                              })
                            }
                          />
                        </div>
                      )}
                      <button
                        onClick={() => setConfirmDelete({ type: 'hypothesis', id: h.id })}
                        className="hover:text-red-400 transition-colors p-0.5" style={{ color: "var(--iw-text-muted)" }}
                        title="Delete hypothesis"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {matrix.evidence.map((e, idx) => (
              <tr
                key={e.id}
                className={`${
                  idx % 2 === 0 ? 'bg-surface-900/50' : 'bg-surface-800/30'
                } hover:bg-surface-700/30 transition-colors`}
              >
                {/* Evidence description */}
                <td
                  className="sticky left-0 z-10 p-3 border-r border-slate-700/50 bg-inherit"
                  {...(idx === 0 ? { 'data-tour': 'evidence-rows' } : {})}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {editingCell?.type === 'evidence' &&
                      editingCell.id === e.id &&
                      editingCell.field === 'description' ? (
                        <textarea
                          autoFocus
                          className="input-field text-xs w-full resize-none"
                          rows={2}
                          value={editValue}
                          onChange={(ev) => setEditValue(ev.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' && !ev.shiftKey) {
                              ev.preventDefault();
                              commitEdit();
                            }
                            if (ev.key === 'Escape') setEditingCell(null);
                          }}
                        />
                      ) : (
                        <p
                          className="text-xs leading-relaxed cursor-pointer hover:text-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none rounded"
                          style={{ color: "var(--iw-text)" }}
                          onClick={() =>
                            startEditing('evidence', e.id, 'description', e.description)
                          }
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault();
                              startEditing('evidence', e.id, 'description', e.description);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          title="Click to edit"
                          aria-label={`Edit evidence: ${e.description.substring(0, 60)}`}
                        >
                          {e.description}
                        </p>
                      )}
                      <p className="text-xxs font-mono mt-1" style={{color: "var(--iw-text-muted)"}}>{e.source}</p>
                      <div className="mt-1">
                        <QoICSummary qoic={e.qoic} />
                      </div>
                      {e.attackTechniques && e.attackTechniques.length > 0 && (
                        <div className="mt-1.5">
                          <TechniqueChips
                            ids={e.attackTechniques}
                            onRemove={(id) =>
                              store.updateEvidence(projectId, matrix.id, e.id, {
                                attackTechniques: e.attackTechniques?.filter((t) => t !== id),
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setConfirmDelete({ type: 'evidence', id: e.id })}
                      className="flex-shrink-0 hover:text-red-400 transition-colors p-0.5 mt-0.5" style={{ color: "var(--iw-text-muted)" }}
                      title="Delete evidence"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
                {/* Credibility badge */}
                <td className="p-2 text-center border-r border-slate-700/50">
                  <span className={credBadgeClass(e.credibility)}>{e.credibility[0]}</span>
                </td>
                {/* Relevance badge */}
                <td className="p-2 text-center border-r border-slate-700/50">
                  <span className={credBadgeClass(e.relevance)}>{e.relevance[0]}</span>
                </td>
                {/* Rating cells */}
                {matrix.hypotheses.map((h, hIdx) => {
                  const rating = matrix.ratings[e.id]?.[h.id];
                  const displayRating = rating ?? 'NA';
                  const ratingLabel = getRatingLabel(displayRating);
                  return (
                    <td
                      key={`${e.id}-${h.id}`}
                      className={`p-2 text-center border-r border-slate-700/50 cursor-pointer select-none transition-all duration-100 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                        h.id === preferredId ? 'bg-intel-green/5' : ''
                      }`}
                      {...(idx === 0 && hIdx === 0 ? { 'data-tour': 'scoring-cells' } : {})}
                      onClick={() => handleCycleRating(e.id, h.id)}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault();
                          handleCycleRating(e.id, h.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Rate evidence "${e.description.substring(0, 40)}" against hypothesis "${h.name}", currently ${ratingLabel}`}
                      title={`${ratingLabel} — Click to cycle`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-mono font-bold transition-all ${RATING_STYLES[displayRating]}`}
                      >
                        {RATING_LABELS[displayRating]}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {/* Score bar footer */}
          {matrix.hypotheses.length > 0 && (
            <tfoot data-tour="score-bar">
              <tr className="bg-surface-800 border-t border-slate-700/50">
                <td className="sticky left-0 z-10 bg-surface-800 p-3 border-r border-slate-700/50">
                  <span className="text-xs font-mono font-semibold uppercase" style={{color: "var(--iw-text-muted)"}}>
                    Inconsistency Score
                  </span>
                </td>
                <td className="border-r border-slate-700/50" />
                <td className="border-r border-slate-700/50" />
                {matrix.hypotheses.map((h) => (
                  <td key={h.id} className="p-3 border-r border-slate-700/50">
                    <ACHScoreBar
                      score={normalizedScores[h.id] ?? 50}
                      rawScore={scores[h.id] ?? 0}
                      isPreferred={h.id === preferredId}
                      confidence={h.confidence}
                    />
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xxs font-mono" style={{color: "var(--iw-text-muted)"}}>
        <span>Legend:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-5 h-5 rounded border bg-green-500/20 border-green-500/30 text-center leading-5 text-green-400">
            C
          </span>
          Consistent
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-5 h-5 rounded border bg-red-500/20 border-red-500/30 text-center leading-5 text-red-400">
            I
          </span>
          Inconsistent
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-5 h-5 rounded border bg-gray-500/20 border-gray-500/30 text-center leading-5 text-gray-400">
            N
          </span>
          Neutral
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-5 h-5 rounded border bg-transparent border-slate-700/30 text-center leading-5" style={{color: "var(--iw-text-muted)"}}>
            —
          </span>
          N/A
        </span>
      </div>

      {/* Add Hypothesis Modal */}
      {showAddHypothesis && (
        <Modal title="Add Hypothesis" onClose={() => setShowAddHypothesis(false)} wide>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{color: "var(--iw-text-muted)"}}>Name</label>
              <input
                autoFocus
                className="input-field"
                placeholder="e.g., State-sponsored APT group"
                value={newHypName}
                onChange={(e) => setNewHypName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddHypothesis();
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{color: "var(--iw-text-muted)"}}>
                Description (optional)
              </label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="Describe this hypothesis..."
                value={newHypDesc}
                onChange={(e) => setNewHypDesc(e.target.value)}
              />
            </div>
            <TechniqueSelector
              value={newHypTechniques}
              onChange={setNewHypTechniques}
              helper="Tag techniques the threat actor in this hypothesis is expected to use."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddHypothesis(false)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={handleAddHypothesis} className="btn-primary" disabled={!newHypName.trim()}>
                Add Hypothesis
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Evidence Modal */}
      {showAddEvidence && (
        <Modal title="Add Evidence" onClose={() => setShowAddEvidence(false)} wide>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{color: "var(--iw-text-muted)"}}>Description</label>
              <textarea
                autoFocus
                className="input-field resize-none"
                rows={3}
                placeholder="Describe the evidence or indicator..."
                value={newEvidence.description}
                onChange={(e) =>
                  setNewEvidence((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{color: "var(--iw-text-muted)"}}>Source</label>
              <input
                className="input-field"
                placeholder="e.g., OSINT, vendor report, government advisory"
                value={newEvidence.source}
                onChange={(e) =>
                  setNewEvidence((prev) => ({ ...prev, source: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{color: "var(--iw-text-muted)"}}>Credibility</label>
                <select
                  className="input-field"
                  value={newEvidence.credibility}
                  onChange={(e) =>
                    setNewEvidence((prev) => ({
                      ...prev,
                      credibility: e.target.value as Evidence['credibility'],
                    }))
                  }
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{color: "var(--iw-text-muted)"}}>Relevance</label>
                <select
                  className="input-field"
                  value={newEvidence.relevance}
                  onChange={(e) =>
                    setNewEvidence((prev) => ({
                      ...prev,
                      relevance: e.target.value as Evidence['relevance'],
                    }))
                  }
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <TechniqueSelector
              value={newEvidence.attackTechniques ?? []}
              onChange={(next) =>
                setNewEvidence((prev) => ({ ...prev, attackTechniques: next }))
              }
              helper="Tag the ATT&CK techniques this evidence reflects (T-IDs preserved on export)."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddEvidence(false)} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleAddEvidence}
                className="btn-primary"
                disabled={!newEvidence.description.trim()}
              >
                Add Evidence
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <Modal
          title={`Delete ${confirmDelete.type === 'hypothesis' ? 'Hypothesis' : 'Evidence'}?`}
          onClose={() => setConfirmDelete(null)}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm" style={{color: "var(--iw-text)"}}>
                This will permanently remove this {confirmDelete.type} and all associated ratings.
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* Simple modal wrapper */
function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative card p-6 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} mx-4 shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{color: "var(--iw-text)"}}>{title}</h3>
          <button onClick={onClose} className="hover:text-slate-300 transition-colors" style={{color: "var(--iw-text-muted)"}}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
