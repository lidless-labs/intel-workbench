import { useNavigate } from 'react-router-dom';
import { Brain, Plus } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { BiasChecklist } from '../components/bias/BiasChecklist';
import { createDefaultBiases } from '../data/biasData';
import { generateId } from '../utils/id';
import { useBasePath } from '../utils/useBasePath';

export function BiasPage() {
  const store = useProjectStore();
  const navigate = useNavigate();
  const basePath = useBasePath();
  const project = store.getActiveProject();

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Brain size={48} className="mx-auto mb-4" style={{color: "var(--iw-text-muted)"}} />
          <h2 className="text-lg font-medium mb-2" style={{color: "var(--iw-text)"}}>No Project Selected</h2>
          <p className="text-sm mb-4" style={{color: "var(--iw-text-muted)"}}>
            Select or create a project to begin bias review.
          </p>
          <button onClick={() => navigate(`${basePath}/`)} className="btn-primary">
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  // Use the first checklist if it exists
  const checklist = project.biasChecklists[0] ?? null;

  const handleCreateChecklist = () => {
    const now = new Date().toISOString();
    const newChecklist = {
      id: generateId(),
      name: 'Default Bias Checklist',
      biases: createDefaultBiases(),
      createdAt: now,
      updatedAt: now,
    };
    store.addBiasChecklist(project.id, newChecklist);
  };

  const handleToggleBias = (biasId: string) => {
    if (!checklist) return;
    store.toggleBias(project.id, checklist.id, biasId);
  };

  const handleUpdateMitigation = (biasId: string, notes: string) => {
    if (!checklist) return;
    store.updateBiasMitigation(project.id, checklist.id, biasId, notes);
  };

  if (!checklist) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Brain size={20} className="" style={{color: "var(--iw-accent)"}} />
          <h2 className="text-lg font-semibold" style={{color: "var(--iw-text)"}}>Cognitive Bias Checklist</h2>
        </div>
        <div className="card p-8 text-center">
          <Brain size={48} className="mx-auto mb-4" style={{color: "var(--iw-text-muted)"}} />
          <h3 className="text-lg font-medium mb-2" style={{color: "var(--iw-text)"}}>No Bias Checklist Yet</h3>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{color: "var(--iw-text-muted)"}}>
            Create a cognitive bias checklist based on Heuer &amp; Pherson&apos;s taxonomy to ensure
            analytical rigor and mitigate common thinking traps.
          </p>
          <button onClick={handleCreateChecklist} className="btn-primary">
            <Plus size={16} className="inline mr-1.5" />
            Create Bias Checklist
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain size={20} className="" style={{color: "var(--iw-accent)"}} />
          <h2 className="text-lg font-semibold" style={{color: "var(--iw-text)"}}>Cognitive Bias Checklist</h2>
        </div>
        <span className="text-xxs font-mono" style={{color: "var(--iw-text-muted)"}}>
          Heuer &amp; Pherson Taxonomy
        </span>
      </div>
      <p className="text-sm" style={{color: "var(--iw-text-muted)"}}>
        Review each bias below. Check it off once you&apos;ve considered whether it applies to your
        current analysis. Expand any item to view or edit mitigation notes.
      </p>
      <BiasChecklist
        biases={checklist.biases}
        onToggleBias={handleToggleBias}
        onUpdateMitigation={handleUpdateMitigation}
      />
    </div>
  );
}
