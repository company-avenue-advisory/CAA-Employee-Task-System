import React, { useState } from 'react';
import { Employee, TaskPriority } from '@/lib/types';
import { defaultDueDateTime } from '@/lib/dateUtils';
import { KNOWN_CLIENTS } from '@/lib/clients';
import { X, PlusCircle } from 'lucide-react';

interface TaskAssignModalProps {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onAssign: (taskData: {
    employeeName: string;
    task: string;
    description: string;
    priority: TaskPriority;
    dueTime: string;
    client: string;
  }) => Promise<void>;
}

export const TaskAssignModal: React.FC<TaskAssignModalProps> = ({
  employees,
  isOpen,
  onClose,
  onAssign,
}) => {
  const [employeeName, setEmployeeName] = useState(
    employees.find((e) => e.role === 'Employee')?.name || ''
  );
  const [task, setTask] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueTime, setDueTime] = useState(defaultDueDateTime());
  const [client, setClient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) {
      setErrorMsg('Task title is required.');
      return;
    }
    if (!employeeName) {
      setErrorMsg('Please select an employee.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onAssign({
        employeeName,
        task,
        description,
        priority,
        dueTime,
        client,
      });
      // Reset form
      setTask('');
      setDescription('');
      setDueTime(defaultDueDateTime());
      setClient('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={20} color="var(--caa-blue)" />
            <h3 className="modal-title">Assign New Daily Task</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="assign-employee">Assign To Employee</label>
            <select
              id="assign-employee"
              className="select-input"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              required
            >
              {employees
                .filter((e) => e.role === 'Employee')
                .map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="assign-title">Task Title</label>
            <input
              id="assign-title"
              type="text"
              className="text-input"
              placeholder="e.g. Research 20 fleet companies"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="assign-desc">Description (Optional)</label>
            <textarea
              id="assign-desc"
              className="textarea-input"
              placeholder="Detailed instructions or scope details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="assign-client">Client (Optional)</label>
            <select
              id="assign-client"
              className="select-input"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            >
              <option value="">No client</option>
              {KNOWN_CLIENTS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="assign-priority">Priority</label>
              <select
                id="assign-priority"
                className="select-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="assign-duetime">Due Time</label>
              <input
                id="assign-duetime"
                type="datetime-local"
                className="text-input"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: 'var(--status-blocked-text)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
