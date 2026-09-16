import React, { useState } from 'react';
import { Employee, Task, TaskPriority, TaskStatus, EmployeeSummary } from '@/lib/types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { SourceBadge } from './SourceBadge';
import { TaskAssignModal } from './TaskAssignModal';
import { formatDueTime } from '@/lib/dateUtils';
import { KNOWN_CLIENTS } from '@/lib/clients';
import {
  Calendar,
  Plus,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Unlock,
  Trash2,
  Edit2,
  Filter,
} from 'lucide-react';

interface ManagerDashboardProps {
  employees: Employee[];
  tasks: Task[];
  onAssignTask: (taskData: {
    employeeName: string;
    task: string;
    description: string;
    priority: TaskPriority;
    dueTime: string;
    client: string;
  }) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onReopenEOD: (employeeName: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  employees,
  tasks,
  onAssignTask,
  onUpdateTask,
  onReopenEOD,
  onDeleteTask,
}) => {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const workerEmployees = employees.filter((e) => e.role === 'Employee');

  // Compute overall team metrics
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const blockedCount = tasks.filter((t) => t.status === 'Blocked').length;
  const notStartedCount = tasks.filter((t) => t.status === 'Not Started').length;

  // Compute Employee-wise Summaries
  const employeeSummaries: EmployeeSummary[] = workerEmployees.map((emp) => {
    const empTasks = tasks.filter(
      (t) => t.employeeName.toLowerCase() === emp.name.toLowerCase()
    );
    const total = empTasks.length;
    const completed = empTasks.filter((t) => t.status === 'Completed').length;
    const inProgress = empTasks.filter((t) => t.status === 'In Progress').length;
    const blocked = empTasks.filter((t) => t.status === 'Blocked').length;
    const notStarted = empTasks.filter((t) => t.status === 'Not Started').length;

    const totalProgressSum = empTasks.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    const overallProgress = total > 0 ? Math.round(totalProgressSum / total) : 0;
    const eodSubmitted = total > 0 && empTasks.every((t) => t.eodSubmitted);

    return {
      employeeName: emp.name,
      totalTasks: total,
      completed,
      inProgress,
      blocked,
      notStarted,
      overallProgress,
      eodSubmitted,
    };
  });

  const eodSubmittedCount = employeeSummaries.filter((s) => s.eodSubmitted && s.totalTasks > 0).length;
  const eodPendingCount = employeeSummaries.filter((s) => !s.eodSubmitted && s.totalTasks > 0).length;

  // Filter tasks for task list display
  let filteredTasks = [...tasks];
  if (selectedEmployeeFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter(
      (t) => t.employeeName.toLowerCase() === selectedEmployeeFilter.toLowerCase()
    );
  }
  if (statusFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
  }
  if (sourceFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter((t) => t.source === (sourceFilter === 'ASSIGNED' ? 'ASSIGNED' : 'SELF_ADDED'));
  }

  return (
    <div>
      {/* Header Banner */}
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
            CAA Manager Portal
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.1rem' }}>
            Team Operations Dashboard
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
            <Calendar size={16} />
            <span>{todayFormatted}</span>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAssignModalOpen(true)}
          >
            <Plus size={18} />
            Assign New Task
          </button>
        </div>
      </div>

      {/* Metric Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalTasks}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Tasks</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-completed-text)' }}>{completedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Completed</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-in-progress-text)' }}>{inProgressCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>In Progress</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-blocked-text)' }}>{blockedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Blocked</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{notStartedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Not Started</div>
        </div>
        <div style={{ background: 'var(--status-completed-bg)', border: '1px solid #BFE3CC', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-completed-text)' }}>{eodSubmittedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--status-completed-text)', fontWeight: 700, textTransform: 'uppercase' }}>EOD Submitted</div>
        </div>
        <div style={{ background: 'var(--status-in-progress-bg)', border: '1px solid var(--priority-medium-border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-in-progress-text)' }}>{eodPendingCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--status-in-progress-text)', fontWeight: 700, textTransform: 'uppercase' }}>EOD Pending</div>
        </div>
      </div>

      {/* Employee Summary Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="var(--caa-blue)" />
          Team Employee EOD Status
        </h2>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th style={{ textAlign: 'center' }}>Total Tasks</th>
                <th style={{ textAlign: 'center' }}>Completed</th>
                <th style={{ textAlign: 'center' }}>In Progress</th>
                <th style={{ textAlign: 'center' }}>Blocked</th>
                <th style={{ textAlign: 'center' }}>Progress</th>
                <th style={{ textAlign: 'center' }}>EOD Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {employeeSummaries.map((summary) => (
                <tr
                  key={summary.employeeName}
                  style={{
                    backgroundColor:
                      selectedEmployeeFilter === summary.employeeName ? 'var(--caa-blue-light)' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedEmployeeFilter(summary.employeeName)}
                >
                  <td style={{ fontWeight: 700 }}>
                    {summary.employeeName}
                    {selectedEmployeeFilter === summary.employeeName && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--caa-blue)', marginLeft: '0.5rem' }}>
                        (Filtered)
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{summary.totalTasks}</td>
                  <td style={{ textAlign: 'center', color: 'var(--status-completed-text)', fontWeight: 600 }}>{summary.completed}</td>
                  <td style={{ textAlign: 'center', color: 'var(--status-in-progress-text)', fontWeight: 600 }}>{summary.inProgress}</td>
                  <td style={{ textAlign: 'center', color: 'var(--status-blocked-text)', fontWeight: 600 }}>{summary.blocked}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '60px', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${summary.overallProgress}%`, height: '100%', background: 'var(--caa-blue)' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{summary.overallProgress}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {summary.totalTasks === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Tasks</span>
                    ) : summary.eodSubmitted ? (
                      <span style={{ color: 'var(--status-completed-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={16} /> ✓ Submitted
                      </span>
                    ) : (
                      <span style={{ color: 'var(--status-in-progress-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertTriangle size={16} /> ⚠ Pending
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    {summary.eodSubmitted && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => onReopenEOD(summary.employeeName)}
                        title="Unlock EOD to allow employee edits"
                      >
                        <Unlock size={12} /> Reopen EOD
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details List with Filters */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Task Details & EOD Notes ({filteredTasks.length})
          </h2>

          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="select-input"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
            >
              <option value="ALL">All Employees</option>
              {workerEmployees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name}
                </option>
              ))}
            </select>

            <select
              className="select-input"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              className="select-input"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="ALL">All Sources</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="SELF_ADDED">Self‑Initiated</option>
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No tasks match the selected filter criteria.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="task-id">{task.id}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--caa-blue)', background: 'var(--caa-blue-light)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                      Assigned to: {task.employeeName}
                    </span>
                    {task.client && (
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--assigned)', background: 'var(--assigned-light)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                        Client: {task.client}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.35rem' }}>
                    {task.task}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  <SourceBadge source={task.source} />
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}
                    onClick={() => setEditingTask(task)}
                    title="Edit Task"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-blocked-text)', padding: '0.2rem' }}
                    onClick={() => onDeleteTask(task.id)}
                    title="Delete Task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {task.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {task.description}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} /> Due: {formatDueTime(task.dueTime)}
                </div>
                <div>Progress: <strong>{task.progress}%</strong></div>
                {task.outputLink && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ExternalLink size={14} />
                    <a href={task.outputLink} target="_blank" rel="noreferrer">View Deliverable</a>
                  </div>
                )}
              </div>

              {/* Task-Level EOD Note display box */}
              <div
                style={{
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Task EOD Note ({task.employeeName})
                </div>
                <SourceBadge source={task.source} />
                {task.eodNote ? (
                  <div style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>
                    "{task.eodNote}"
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-subtle)' }}>
                    No EOD note added yet.
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Assignment Modal */}
      <TaskAssignModal
        employees={employees}
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={onAssignTask}
      />

      {/* Task Edit Drawer/Modal */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Task: {editingTask.id}</h3>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Reassign Employee</label>
              <select
                className="select-input"
                value={editingTask.employeeName}
                onChange={(e) => setEditingTask({ ...editingTask, employeeName: e.target.value })}
              >
                {workerEmployees.map((emp) => (
                  <option key={emp.id} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Task Title</label>
              <input
                className="text-input"
                value={editingTask.task}
                onChange={(e) => setEditingTask({ ...editingTask, task: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
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
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Due Time</label>
              <input
                type="datetime-local"
                className="text-input"
                value={editingTask.dueTime}
                onChange={(e) => setEditingTask({ ...editingTask, dueTime: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  await onUpdateTask(editingTask.id, {
                    employeeName: editingTask.employeeName,
                    task: editingTask.task,
                    priority: editingTask.priority,
                    dueTime: editingTask.dueTime,
                    client: editingTask.client || '',
                  });
                  setEditingTask(null);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
