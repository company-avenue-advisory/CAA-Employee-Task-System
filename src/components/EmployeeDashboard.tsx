import React, { useState } from 'react';
import { Employee, Task, TaskPriority } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { EODSubmitFooter } from './EODSubmitFooter';
import { Calendar, CheckCircle2, ListTodo } from 'lucide-react';

interface EmployeeDashboardProps {
  currentEmployee: Employee;
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onSubmitEOD: () => Promise<void>;
  // Callback to refresh tasks after self‑added work
  onRefreshTasks: () => Promise<void>;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentEmployee,
  tasks,
  onUpdateTask,
  onSubmitEOD,
  onRefreshTasks,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSelfAdd, setShowSelfAdd] = useState(false);
  // New prop for refreshing tasks after self‑add

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
  const [newDueTime, setNewDueTime] = useState('');

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const employeeTasks = tasks.filter(
    (t) => t.employeeName.toLowerCase() === currentEmployee.name.toLowerCase()
  );

  const handleSubmitEOD = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSubmitEOD();
      setSubmitSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit EOD. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header Info Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--caa-blue)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CAA Employee Dashboard
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.1rem' }}>
            Today's Assigned Tasks
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
            <Calendar size={16} />
            <span>{todayFormatted}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-page)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assigned to:</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{currentEmployee.name}</strong>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListTodo size={20} color="var(--caa-blue)" />
            Your Daily Tasks ({employeeTasks.length})
          </h2>
        </div>

        {employeeTasks.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px border-dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <CheckCircle2 size={40} color="var(--caa-blue)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              No Tasks Assigned For Today
            </h3>
            <p style={{ fontSize: '0.9rem' }}>
              Your manager has not assigned any tasks for today yet.
            </p>
          </div>
        ) : (
          employeeTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={onUpdateTask}
            />
          ))
        )}

        {/* Add Work Button — always visible for Employee, regardless of task count */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setShowSelfAdd(true)}>
            + Add Work I Took Up
          </button>
        </div>

        {/* Self Add Task Modal */}
        {showSelfAdd && (
          <div className="modal-overlay" onClick={() => setShowSelfAdd(false)}>
            <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="selfAddTitle" onClick={e => e.stopPropagation()}>
              <button className="modal-close-button" aria-label="Close" onClick={() => setShowSelfAdd(false)}>&times;</button>
              <h2 id="selfAddTitle">Self‑Add Task</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  setErrorMessage(null);
                  try {
                    const response = await fetch('/api/tasks', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        employeeName: currentEmployee.name,
                        task: newTaskTitle,
                        description: newDescription,
                        priority: newPriority,
                        dueTime: newDueTime,
                        date: new Date().toISOString().split('T')[0],
                      }),
                    });
                    if (!response.ok) throw new Error('Failed to create task');
                    setShowSelfAdd(false);
                    // Refresh task list after successful creation
                    await onRefreshTasks();
                  } catch (err: any) {
                    setErrorMessage(err.message);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                <div className="form-group">
                  <label>Task Title</label>
                  <input className="text-input" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="textarea-input" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="select-input" value={newPriority} onChange={e => setNewPriority(e.target.value as TaskPriority)} required>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Time</label>
                  <input className="text-input" value={newDueTime} onChange={e => setNewDueTime(e.target.value)} required />
                </div>
                {errorMessage && <div style={{ color: 'var(--status-blocked-text)' }}>{errorMessage}</div>}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Create Task'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSelfAdd(false)} disabled={isSubmitting}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* EOD Footer */}
      {employeeTasks.length > 0 && (
        <EODSubmitFooter
          tasks={employeeTasks}
          onSubmitEOD={handleSubmitEOD}
          isSubmitting={isSubmitting}
          submitSuccess={submitSuccess}
          errorMessage={errorMessage}
        />
      )}
    </div>
  );
};
