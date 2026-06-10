import { useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { useDiamondStore, type DiamondEvent } from '../../store/useDiamondStore';

export function EventList() {
  const events = useDiamondStore((s) => s.events);
  const activeEventId = useDiamondStore((s) => s.activeEventId);
  const createEvent = useDiamondStore((s) => s.createEvent);
  const deleteEvent = useDiamondStore((s) => s.deleteEvent);
  const setActiveEvent = useDiamondStore((s) => s.setActiveEvent);
  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createEvent(name);
    setNewName('');
    setShowForm(false);
  };

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') {
      setShowForm(false);
      setNewName('');
    }
  };

  // Sort chronologically by creation date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--iw-text)' }}>
          Events ({events.length})
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="btn-ghost flex items-center gap-1"
        >
          <Plus size={14} />
          <span className="text-xs">New</span>
        </button>
      </div>

      {showForm && (
        <div className="flex gap-2">
          <input
            className="input-field text-xs flex-1"
            placeholder="Event name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button onClick={handleCreate} className="btn-primary text-xs px-3 py-1.5">
            Add
          </button>
        </div>
      )}

      {sortedEvents.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: 'var(--iw-text-muted)' }}>
          No events yet. Create one to start mapping intrusion analysis.
        </p>
      ) : (
        <div className="space-y-1 max-h-[40vh] overflow-y-auto">
          {sortedEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              isActive={event.id === activeEventId}
              onSelect={() => setActiveEvent(event.id)}
              onDelete={() => deleteEvent(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({
  event,
  isActive,
  onSelect,
  onDelete,
}: {
  event: DiamondEvent;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const formattedDate = new Date(event.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors"
      style={{
        backgroundColor: isActive
          ? 'color-mix(in srgb, var(--iw-accent) 10%, var(--iw-bg))'
          : 'transparent',
        border: isActive ? '1px solid var(--iw-accent)' : '1px solid transparent',
      }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-medium truncate"
          style={{ color: isActive ? 'var(--iw-accent)' : 'var(--iw-text)' }}
        >
          {event.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock size={10} style={{ color: 'var(--iw-text-muted)' }} />
          <span className="text-xxs font-mono" style={{ color: 'var(--iw-text-muted)' }}>
            {formattedDate}
          </span>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
        title="Delete event"
      >
        <Trash2 size={12} className="text-red-400" />
      </button>
    </div>
  );
}
