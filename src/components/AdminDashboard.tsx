import React, { useState } from 'react';
import { Employee, Task, TaskSource } from '@/lib/types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { SourceBadge } from './SourceBadge';
import { EOMReport } from './EOMReport';
import { Users, ListChecks, LayoutDashboard, Server, Unlock, Trash2, Filter, Database, BarChart3 } from 'lucide-react';

type AdminSection = 'overview' | 'employees' | 'tasks' | 'system' | 'eom';

interface AdminDashboardProps {
  employees: Employee[];
  tasks: Task[];
  isDemoMode: boolean;
  onReopenEOD: (employeeName: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '1rem',
  textAlign: 'center',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 700,
  color: 'var(--text-main)',
  marginBottom: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

function getTodayDateString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  employees,
  tasks,
  isDemoMode,
  onReopenEOD,
  onDeleteTask,
}) => {
  const [section, setSection] = useState<AdminSection>('overview');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');

  const today = getTodayDateString();
  const workerEmployees = employees.filter((e) => e.role === 'Employee');

  // Overview metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.active).length;
  const tasksToday = tasks.filter((t) => t.date === today).length;

  const employeesWithTasks = new Set(tasks.filter((t) => t.date === today).map((t) => t.employeeName.toLowerCase()));
  let eodSubmittedCount = 0;
  let eodPendingCount = 0;
  employeesWithTasks.forEach((empName) => {
    const empTasksToday = tasks.filter((t) => t.date === today && t.employeeName.toLowerCase() === empName);
    const allSubmitted = empTasksToday.length > 0 && empTasksToday.every((t) => t.eodSubmitted);
    if (allSubmitted) eodSubmittedCount++;
    else eodPendingCount++;
  });

  const uniqueDates = Array.from(new Set(tasks.map((t) => t.date))).sort().reverse();

  // Task Administration filtering
  let filteredTasks = [...tasks];
  if (employeeFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter((t) => t.employeeName.toLowerCase() === employeeFilter.toLowerCase());
  }
  if (statusFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
  }
  if (sourceFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter((t) => t.source === (sourceFilter === 'ASSIGNED' ? TaskSource.ASSIGNED : TaskSource.SELF_ADDED));
  }
  if (dateFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter((t) => t.date === dateFilter);
  }

  const SECTIONS: { key: AdminSection; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
    { key: 'employees', label: 'Employees', icon: <Users size={15} /> },
    { key: 'tasks', label: 'Task Administration', icon: <ListChecks size={15} /> },
    { key: 'system', label: 'System', icon: <Server size={15} /> },
    { key: 'eom', label: 'EOM Report', icon: <BarChart3 size={15} /> },
  ];

  return (
    <div>
      {/* Admin section switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={section === s.key ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
            onClick={() => setSection(s.key)}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {section === 'overview' && (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={sectionTitleStyle}>
          <LayoutDashboard size={20} color="var(--caa-blue)" />
          Overview
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalEmployees}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Employees</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-completed-text)' }}>{activeEmployees}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Employees</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{tasksToday}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Tasks Today</div>
          </div>
          <div style={{ ...cardStyle, background: 'var(--status-completed-bg)', border: '1px solid #BFE3CC' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-completed-text)' }}>{eodSubmittedCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--status-completed-text)', fontWeight: 700, textTransform: 'uppercase' }}>EOD Submitted</div>
          </div>
          <div style={{ ...cardStyle, background: 'var(--status-in-progress-bg)', border: '1px solid var(--priority-medium-border)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-in-progress-text)' }}>{eodPendingCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--status-in-progress-text)', fontWeight: 700, textTransform: 'uppercase' }}>EOD Pending</div>
          </div>
        </div>
      </div>
      )}

      {/* EMPLOYEES */}
      {section === 'employees' && (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={sectionTitleStyle}>
          <Users size={20} color="var(--caa-blue)" />
          Employees
        </h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th style={{ textAlign: 'center' }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="task-id">{emp.id}</td>
                  <td style={{ fontWeight: 600 }}>{emp.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{emp.email}</td>
                  <td>{emp.role}</td>
                  <td style={{ textAlign: 'center' }}>{emp.active ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* TASK ADMINISTRATION */}
      {section === 'tasks' && (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>
            <ListChecks size={20} color="var(--caa-blue)" />
            Task Administration ({filteredTasks.length})
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select className="select-input" style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
              <option value="ALL">All Employees</option>
              {workerEmployees.map((emp) => (
                <option key={emp.id} value={emp.name}>{emp.name}</option>
              ))}
            </select>
            <select className="select-input" style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
            </select>
            <select className="select-input" style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="ALL">All Sources</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="SELF_ADDED">Self‑Initiated</option>
            </select>
            <select className="select-input" style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="ALL">All Dates</option>
              {uniqueDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ ...cardStyle, padding: '2rem', color: 'var(--text-muted)' }}>No tasks match the selected filter criteria.</div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '0.75rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="task-id">{task.id}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--caa-blue)', background: 'var(--caa-blue-light)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                      {task.employeeName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.date}</span>
                  </div>
                  <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>{task.task}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  <SourceBadge source={task.source} />
                  {task.eodSubmitted && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => onReopenEOD(task.employeeName)}
                      title="Unlock EOD to allow employee edits"
                    >
                      <Unlock size={12} /> Reopen EOD
                    </button>
                  )}
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
            </div>
          ))
        )}
      </div>
      )}

      {/* SYSTEM */}
      {section === 'system' && (
      <div>
        <h2 style={sectionTitleStyle}>
          <Server size={20} color="var(--caa-blue)" />
          System
        </h2>
        <div style={{ ...cardStyle, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={16} color={isDemoMode ? 'var(--status-in-progress-text)' : 'var(--caa-blue)'} />
          <span style={{ fontWeight: 600 }}>{isDemoMode ? 'DEMO MODE • Simulated data layer' : 'LIVE • Google Sheets'}</span>
        </div>
      </div>
      )}

      {/* EOM REPORT */}
      {section === 'eom' && <EOMReport employees={employees} tasks={tasks} />}
    </div>
  );
};
