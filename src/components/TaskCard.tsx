import React, { useState } from 'react';
import { Task, TaskStatus } from '@/lib/types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { formatDueTime } from '@/lib/dateUtils';
import { Clock, ExternalLink, Save, CheckCircle, Lock, Edit2, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  isReadOnly?: boolean;
  // Shown only when provided — lets the owner of a self-added task edit or delete it.
  onEdit?: () => void;
  onDelete?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  isReadOnly = false,
  onEdit,
  onDelete,
}) => {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [progress, setProgress] = useState<number>(task.progress);
  const [eodNote, setEodNote] = useState<string>(task.eodNote || '');
  const [outputLink, setOutputLink] = useState<string>(task.outputLink || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync internal state if task prop changes externally
  React.useEffect(() => {
    setStatus(task.status);
    setProgress(task.progress);
    setEodNote(task.eodNote || '');
    setOutputLink(task.outputLink || '');
  }, [task]);

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Completed') {
      setProgress(100);
    } else if (newStatus === 'Not Started') {
      setProgress(0);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      await onUpdate(task.id, {
        status,
        progress,
        eodNote,
        outputLink,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save task update.');
    } finally {
      setIsSaving(false);
    }
  };

  const isLocked = isReadOnly || task.eodSubmitted;

  return (
    <div className="task-card">
      <div className="task-header">
        <div>
          <span className="task-id">{task.id}</span>
          <h3 className="task-title" style={{ marginTop: '0.35rem' }}>
            {task.task}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={status} />
          <span className={`badge badge-${task.source === 'SELF_ADDED' ? 'self' : 'assigned'}`}>
            {task.source === 'SELF_ADDED' ? 'SELF-INITIATED' : 'ASSIGNED'}
          </span>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              title="Edit Task"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', display: 'flex' }}
            >
              <Edit2 size={15} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Delete Task"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-blocked-text)', padding: '0.2rem', display: 'flex' }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-meta">
        <div className="meta-item">
          <Clock size={14} />
          <span>Due: {formatDueTime(task.dueTime)}</span>
        </div>
        {task.client && (
          <div className="meta-item" style={{ color: 'var(--assigned)', fontWeight: 600 }}>
            <span>Client: {task.client}</span>
          </div>
        )}
        {task.outputLink && (
          <div className="meta-item">
            <ExternalLink size={14} />
            <a href={task.outputLink} target="_blank" rel="noreferrer">
              Output Deliverable Link
            </a>
          </div>
        )}
        {task.eodSubmitted && (
          <div className="meta-item" style={{ color: 'var(--status-completed-text)', fontWeight: 600 }}>
            <Lock size={13} />
            EOD Submitted
          </div>
        )}
      </div>

      <div className="task-controls">
        <div className="form-group">
          <label htmlFor={`status-${task.id}`}>Status</label>
          <select
            id={`status-${task.id}`}
            className="select-input"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            disabled={isLocked}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor={`progress-${task.id}`}>Progress ({progress}%)</label>
          <div className="progress-container">
            <input
              id={`progress-${task.id}`}
              type="range"
              min="0"
              max="100"
              step="5"
              className="progress-slider"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              disabled={isLocked}
            />
            <span className="progress-val">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label htmlFor={`eodNote-${task.id}`}>Task EOD Note</label>
        <textarea
          id={`eodNote-${task.id}`}
          className="textarea-input"
          placeholder="What happened with this task today? What was completed? Blockers?"
          value={eodNote}
          onChange={(e) => setEodNote(e.target.value)}
          disabled={isLocked}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
        <label htmlFor={`outputLink-${task.id}`}>Work / Output Link (Optional)</label>
        <input
          id={`outputLink-${task.id}`}
          type="url"
          className="text-input"
          placeholder="https://docs.google.com/..."
          value={outputLink}
          onChange={(e) => setOutputLink(e.target.value)}
          disabled={isLocked}
        />
      </div>

      {errorMsg && (
        <div style={{ color: 'var(--status-blocked-text)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          {errorMsg}
        </div>
      )}

      {!isLocked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Update'}
          </button>

          {savedSuccess && (
            <span style={{ color: 'var(--status-completed-text)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle size={15} />
              Update Saved!
            </span>
          )}
        </div>
      )}
    </div>
  );
};
