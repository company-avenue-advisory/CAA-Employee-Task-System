import React, { useState, useEffect } from 'react';
import { Employee, Task, TaskPriority } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { EODSubmitFooter } from './EODSubmitFooter';
import { defaultDueDateTime, formatDueTime, getTodayStr } from '@/lib/dateUtils';
import { KNOWN_CLIENTS } from '@/lib/clients';
import { Calendar, CheckCircle2, ListTodo, Clock, X } from 'lucide-react';

interface EmployeeDashboardProps {
  currentEmployee: Employee;
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onSubmitEOD: () => Promise<void>;
  // Callback to refresh tasks after self‑added work
  onRefreshTasks: () => Promise<void>;
}

function buildCalendarGrid(year: number, month: number): { dateStr: string; day: number; inMonth: boolean }[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid
  const gridStart = new Date(year, month, 1 - startOffset);
  const pad = (n: number) => String(n).padStart(2, '0');
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      dateStr: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

const navBtnStyle: React.CSSProperties = {
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  borderRadius: '6px',
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: '0.75rem',
};

const HistoryCalendar: React.FC<{
  tasks: Task[];
  todayStr: string;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}> = ({ tasks, todayStr, selectedDate, onSelectDate }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const datesWithTasks = new Set(tasks.map((t) => t.date));
  const cells = buildCalendarGrid(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goPrev = () => {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };
  const goNext = () => {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{monthLabel}</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button type="button" onClick={goPrev} style={navBtnStyle} aria-label="Previous month">‹</button>
          <button type="button" onClick={goNext} style={navBtnStyle} aria-label="Next month">›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>{d}</span>
        ))}
        {cells.map((c) => {
          const hasTasks = datesWithTasks.has(c.dateStr);
          const isToday = c.dateStr === todayStr;
          const isSelected = c.dateStr === selectedDate;
          // Today is reached via the dedicated "Today" button above, kept editable there;
          // clicking it here would otherwise open the same date in read-only history mode.
          const clickable = c.inMonth && hasTasks && !isToday;
          return (
            <button
              type="button"
              key={c.dateStr}
              onClick={() => clickable && onSelectDate(c.dateStr)}
              disabled={!clickable}
              title={hasTasks ? `${c.day} — has task activity` : undefined}
              style={{
                position: 'relative',
                fontSize: '0.76rem',
                padding: '0.32rem 0',
                borderRadius: '6px',
                border: 'none',
                background: isSelected ? 'var(--caa-blue)' : 'transparent',
                color: isSelected ? '#fff' : !c.inMonth ? 'var(--text-subtle)' : isToday ? 'var(--caa-blue)' : 'var(--text-main)',
                fontWeight: isSelected || isToday ? 800 : 400,
                opacity: c.inMonth ? 1 : 0.4,
                cursor: clickable ? 'pointer' : 'default',
              }}
            >
              {c.day}
              {hasTasks && !isSelected && (
                <span style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--caa-blue)' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentEmployee,
  tasks,
  onUpdateTask,
  onDeleteTask,
  onSubmitEOD,
  onRefreshTasks,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSelfAdd, setShowSelfAdd] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
  const [newDueTime, setNewDueTime] = useState(defaultDueDateTime());
  const [newClient, setNewClient] = useState('');

  // null = viewing "Today"; a 'YYYY-MM-DD' string = browsing a past day's history (read-only)
  const [viewDate, setViewDate] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dismissedDueSoon, setDismissedDueSoon] = useState<Set<string>>(new Set());
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = getTodayStr();
  const isViewingHistory = viewDate !== null;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const employeeTasks = tasks.filter(
    (t) => t.employeeName.toLowerCase() === currentEmployee.name.toLowerCase()
  );
  const todayTasks = employeeTasks.filter((t) => t.date === todayStr);
  // Any not-yet-completed work from before today carries forward into "Today" so it isn't lost
  // once the day passes. Its eodSubmitted flag is stale (it only reflects whether you reported
  // it on its ORIGINAL day) — clear it here so the card is actionable again today instead of
  // staying frozen forever. The task keeps its real original date (shown as a label); History
  // for that original day is unaffected, this only changes what's actionable today.
  const carriedOverTasks = employeeTasks
    .filter((t) => t.date < todayStr && t.status !== 'Completed')
    .map((t) => ({ ...t, eodSubmitted: false }));
  const activeTasks = [...todayTasks, ...carriedOverTasks];
  const historyTasks = isViewingHistory ? employeeTasks.filter((t) => t.date === viewDate) : [];
  const visibleTasks = isViewingHistory ? historyTasks : activeTasks;

  const dueSoonTasks = activeTasks.filter((t) => {
    if (isViewingHistory) return false;
    if (dismissedDueSoon.has(t.id)) return false;
    if (t.status === 'Completed' || t.eodSubmitted) return false;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(t.dueTime)) return false; // legacy free-text due times can't be timed
    const diffMin = (new Date(t.dueTime).getTime() - nowTick) / 60000;
    return diffMin > 0 && diffMin <= 60;
  });

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

  const handleDeleteOwnTask = async (taskId: string) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await onDeleteTask(taskId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete task.');
    }
  };

  const viewDateFormatted = viewDate
    ? new Date(viewDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
      {/* Sidebar: Today link + history calendar */}
      <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => setViewDate(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.55rem 0.8rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: !isViewingHistory ? 'var(--caa-blue-light)' : 'var(--bg-card)',
            color: !isViewingHistory ? 'var(--caa-blue)' : 'var(--text-muted)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          Today
          <span>{activeTasks.length}</span>
        </button>

        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '0.2rem' }}>
            History
          </div>
          <HistoryCalendar tasks={employeeTasks} todayStr={todayStr} selectedDate={viewDate} onSelectDate={setViewDate} />
        </div>
      </div>

      {/* Main column */}
      <div style={{ flex: '1 1 480px', minWidth: 0 }}>
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
              {isViewingHistory ? 'History' : "Today's Assigned Tasks"}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
              <Calendar size={16} />
              <span>{isViewingHistory ? viewDateFormatted : todayFormatted}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-page)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assigned to:</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{currentEmployee.name}</strong>
            </div>
          </div>
        </div>

        {/* Due-soon banners (today view only) */}
        {dueSoonTasks.map((t) => {
          const minutesLeft = Math.max(1, Math.round((new Date(t.dueTime).getTime() - nowTick) / 60000));
          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'var(--status-in-progress-bg)',
                border: '1px solid var(--priority-medium-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: 'var(--status-in-progress-text)',
              }}
            >
              <Clock size={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                <strong>{t.task}</strong> is due {formatDueTime(t.dueTime)} — in {minutesLeft} minute{minutesLeft === 1 ? '' : 's'}.
              </span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setDismissedDueSoon((prev) => new Set(prev).add(t.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-in-progress-text)', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}

        {/* Task List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ListTodo size={20} color="var(--caa-blue)" />
              {isViewingHistory ? `Tasks (${visibleTasks.length})` : `Your Daily Tasks (${visibleTasks.length})`}
            </h2>
          </div>

          {isViewingHistory && (
            <div style={{ background: 'var(--status-not-started-bg)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.9rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
              You're viewing a past day, read-only. Go back to <strong>Today</strong> in the sidebar to make changes.
            </div>
          )}

          {visibleTasks.length === 0 ? (
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
                {isViewingHistory ? 'No Tasks Recorded For This Day' : 'No Tasks Assigned For Today'}
              </h3>
              {!isViewingHistory && (
                <p style={{ fontSize: '0.9rem' }}>
                  Your manager has not assigned any tasks for today yet.
                </p>
              )}
            </div>
          ) : (
            visibleTasks.map((task) => {
              const isCarriedOver = !isViewingHistory && task.date !== todayStr;
              const canManage = !isViewingHistory && !task.eodSubmitted && task.source === 'SELF_ADDED';
              return (
                <div key={task.id}>
                  {isCarriedOver && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-in-progress-text)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> Carried forward from {task.date} — still pending
                    </div>
                  )}
                  <TaskCard
                    task={task}
                    onUpdate={onUpdateTask}
                    isReadOnly={isViewingHistory}
                    onEdit={canManage ? () => setEditingTask(task) : undefined}
                    onDelete={canManage ? () => handleDeleteOwnTask(task.id) : undefined}
                  />
                </div>
              );
            })
          )}

          {/* Add Work Button — only relevant to today, not a past-day history view */}
          {!isViewingHistory && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setShowSelfAdd(true)}>
                + Add Work I Took Up
              </button>
            </div>
          )}

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
                          client: newClient,
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
                    <input type="datetime-local" className="text-input" value={newDueTime} onChange={e => setNewDueTime(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Client (Optional)</label>
                    <select className="select-input" value={newClient} onChange={e => setNewClient(e.target.value)}>
                      <option value="">No client</option>
                      {KNOWN_CLIENTS.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
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

          {/* Edit Self-Added Task Modal */}
          {editingTask && (
            <div className="modal-overlay" onClick={() => setEditingTask(null)}>
              <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="editTaskTitle" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" aria-label="Close" onClick={() => setEditingTask(null)}>&times;</button>
                <h2 id="editTaskTitle">Edit Task: {editingTask.id}</h2>
                <div className="form-group">
                  <label>Task Title</label>
                  <input
                    className="text-input"
                    value={editingTask.task}
                    onChange={(e) => setEditingTask({ ...editingTask, task: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="textarea-input"
                    value={editingTask.description || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="select-input"
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Time</label>
                  <input
                    type="datetime-local"
                    className="text-input"
                    value={editingTask.dueTime}
                    onChange={(e) => setEditingTask({ ...editingTask, dueTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Client (Optional)</label>
                  <select
                    className="select-input"
                    value={editingTask.client || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, client: e.target.value })}
                  >
                    <option value="">No client</option>
                    {KNOWN_CLIENTS.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                {errorMessage && <div style={{ color: 'var(--status-blocked-text)', marginTop: '0.5rem' }}>{errorMessage}</div>}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={async () => {
                      await onUpdateTask(editingTask.id, {
                        task: editingTask.task,
                        description: editingTask.description,
                        priority: editingTask.priority,
                        dueTime: editingTask.dueTime,
                        client: editingTask.client || '',
                      });
                      setEditingTask(null);
                    }}
                  >
                    Save Changes
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingTask(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* EOD Footer — today's tasks plus anything carried forward from a pending prior day */}
        {!isViewingHistory && activeTasks.length > 0 && (
          <EODSubmitFooter
            tasks={activeTasks}
            onSubmitEOD={handleSubmitEOD}
            isSubmitting={isSubmitting}
            submitSuccess={submitSuccess}
            errorMessage={errorMessage}
          />
        )}
      </div>
    </div>
  );
};
