import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  Trash2,
  Download,
  Grid3X3,
  Shield,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

export function HomePage() {
  const store = useProjectStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = store.createProject(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
    store.setActiveProject(id);
    navigate('/ach');
  };

  const handleLoadSample = () => {
    store.loadSampleProject();
    navigate('/ach');
  };

  const handleOpenProject = (id: string) => {
    store.setActiveProject(id);
    navigate('/ach');
  };

  const handleDelete = (id: string) => {
    store.deleteProject(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield size={28} style={{ color: "var(--iw-accent)" }} />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--iw-text)" }}>
            Intelligence Analysis Workbench
          </h1>
        </div>
        <p className="text-sm max-w-2xl" style={{ color: "var(--iw-text-muted)" }}>
          Structured analytic techniques for cyber threat intelligence. Apply rigorous methodology
          to attribution, hypothesis testing, and cognitive bias mitigation.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} className="inline mr-1.5" />
          New Project
        </button>
        <button onClick={handleLoadSample} className="btn-secondary">
          <Download size={16} className="inline mr-1.5" />
          Load Sample (Sandworm)
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--iw-text)" }}>Create New Project</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{color: "var(--iw-text-muted)"}}>Project Name</label>
              <input
                autoFocus
                className="input-field"
                placeholder="e.g., APT Attribution — Incident 2024-001"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') setShowCreate(false);
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
                placeholder="Describe the analysis objective..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={handleCreate} className="btn-primary" disabled={!newName.trim()}>
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project List */}
      {store.projects.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider" style={{color: "var(--iw-text-muted)"}}>
            Projects ({store.projects.length})
          </h2>
          <div className="grid gap-3">
            {store.projects.map((project) => (
              <div
                key={project.id}
                className={`card p-4 hover:border-accent-500/30 transition-all cursor-pointer group ${
                  project.id === store.activeProjectId ? 'border-accent-500/50 bg-accent-500/5' : ''
                }`}
                onClick={() => handleOpenProject(project.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderOpen size={16} className="flex-shrink-0" style={{color: "var(--iw-accent)"}} />
                      <h3 className="text-sm font-semibold truncate" style={{color: "var(--iw-text)"}}>
                        {project.name}
                      </h3>
                    </div>
                    {project.description && (
                      <p className="text-xs line-clamp-2 ml-6" style={{color: "var(--iw-text-muted)"}}>
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 ml-6">
                      <span className="flex items-center gap-1 text-xxs font-mono" style={{color: "var(--iw-text-muted)"}}>
                        <Grid3X3 size={12} />
                        {project.achMatrices.length} matrices
                      </span>
                      <span className="flex items-center gap-1 text-xxs font-mono" style={{color: "var(--iw-text-muted)"}}>
                        <Clock size={12} />
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-1" style={{ color: "var(--iw-text-muted)" }}
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <FolderOpen size={40} className="mx-auto mb-3" style={{color: "var(--iw-text-muted)"}} />
          <h3 className="text-sm font-medium mb-1" style={{color: "var(--iw-text-muted)"}}>No Projects Yet</h3>
          <p className="text-xs" style={{color: "var(--iw-text-muted)"}}>
            Create a new project or load the sample Sandworm analysis to get started.
          </p>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
          />
          <div className="relative card p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-sm font-semibold mb-4" style={{color: "var(--iw-text)"}}>Delete Project?</h3>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm" style={{color: "var(--iw-text)"}}>
                This will permanently delete this project and all its matrices. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
