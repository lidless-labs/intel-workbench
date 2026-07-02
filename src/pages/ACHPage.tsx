import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Grid3X3, ChevronDown, Trash2 } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { ACHMatrix } from '../components/ach/ACHMatrix';

export function ACHPage() {
  const { matrixId } = useParams<{ matrixId?: string }>();
  const navigate = useNavigate();
  const store = useProjectStore();
  const project = store.getActiveProject();
  const [showCreateMatrix, setShowCreateMatrix] = useState(false);
  const [newMatrixName, setNewMatrixName] = useState('');
  const [showMatrixSelector, setShowMatrixSelector] = useState(false);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Grid3X3 size={48} className="mx-auto mb-4" style={{color: "var(--iw-text-muted)"}} />
          <h2 className="text-lg font-medium mb-2" style={{color: "var(--iw-text)"}}>No Project Selected</h2>
          <p className="text-sm mb-4" style={{color: "var(--iw-text-muted)"}}>
            Select or create a project from the home page to begin analysis.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  // Find the active matrix
  const activeMatrix = matrixId
    ? project.achMatrices.find((m) => m.id === matrixId)
    : project.achMatrices[0] ?? null;

  const handleCreateMatrix = () => {
    if (!newMatrixName.trim()) return;
    const id = store.createMatrix(project.id, newMatrixName.trim());
    setNewMatrixName('');
    setShowCreateMatrix(false);
    navigate(`/ach/${id}`);
  };

  const handleSelectMatrix = (id: string) => {
    setShowMatrixSelector(false);
    navigate(`/ach/${id}`);
  };

  const handleDeleteMatrix = (id: string) => {
    store.deleteMatrix(project.id, id);
    if (activeMatrix?.id === id) {
      const remaining = project.achMatrices.filter((m) => m.id !== id);
      if (remaining.length > 0) {
        navigate(`/ach/${remaining[0].id}`);
      } else {
        navigate('/ach');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Matrix selector + controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Grid3X3 size={20} className="" style={{color: "var(--iw-accent)"}} />
          <h2 className="text-lg font-semibold" style={{color: "var(--iw-text)"}}>Analysis of Competing Hypotheses</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Matrix selector dropdown */}
          {project.achMatrices.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowMatrixSelector(!showMatrixSelector)}
                className="btn-secondary text-xs flex items-center gap-2"
              >
                <span className="font-mono">{activeMatrix?.name ?? 'Select Matrix'}</span>
                <ChevronDown size={14} />
              </button>
              {showMatrixSelector && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMatrixSelector(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 card p-1 min-w-[250px] shadow-2xl">
                    {project.achMatrices.map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          m.id === activeMatrix?.id
                            ? 'bg-accent-500/10 text-accent-400'
                            : 'hover:bg-surface-700'
                        }`}
                      >
                        <span onClick={() => handleSelectMatrix(m.id)} className="flex-1">
                          {m.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMatrix(m.id);
                          }}
                          className="hover:text-red-400 transition-colors p-1" style={{ color: "var(--iw-text-muted)" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <button
            onClick={() => setShowCreateMatrix(true)}
            className="btn-primary text-xs"
          >
            <Plus size={14} className="inline mr-1" /> New Matrix
          </button>
        </div>
      </div>

      {/* Create matrix form */}
      {showCreateMatrix && (
        <div className="card p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" style={{color: "var(--iw-text-muted)"}}>Matrix Name</label>
              <input
                autoFocus
                className="input-field"
                placeholder="e.g., Attribution Analysis — Incident 2024-001"
                value={newMatrixName}
                onChange={(e) => setNewMatrixName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateMatrix();
                  if (e.key === 'Escape') setShowCreateMatrix(false);
                }}
              />
            </div>
            <button onClick={() => setShowCreateMatrix(false)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handleCreateMatrix} className="btn-primary" disabled={!newMatrixName.trim()}>
              Create
            </button>
          </div>
        </div>
      )}

      {/* Matrix content */}
      {activeMatrix ? (
        <ACHMatrix projectId={project.id} matrix={activeMatrix} />
      ) : (
        <div className="card p-8 text-center">
          <Grid3X3 size={48} className="mx-auto mb-4" style={{color: "var(--iw-text-muted)"}} />
          <h3 className="text-lg font-medium mb-2" style={{color: "var(--iw-text)"}}>No Matrices Yet</h3>
          <p className="text-sm mb-4" style={{color: "var(--iw-text-muted)"}}>
            Create an ACH matrix to begin structured hypothesis analysis.
          </p>
          <button onClick={() => setShowCreateMatrix(true)} className="btn-primary">
            <Plus size={16} className="inline mr-1.5" />
            Create First Matrix
          </button>
        </div>
      )}
    </div>
  );
}
