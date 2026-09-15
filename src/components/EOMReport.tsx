import React, { useMemo, useState } from 'react';
import { Employee, Task, TaskSource, TaskStatus } from '@/lib/types';
import { Calendar, Filter, Award, AlertTriangle, TrendingUp, Users } from 'lucide-react';

interface EOMReportProps {
  employees: Employee[];
  tasks: Task[];
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  'Completed': '#059669',
  'In Progress': '#D97706',
  'Blocked': '#DC2626',
  'Not Started': '#64748B',
};

const SOURCE_COLORS = {
  ASSIGNED: '#2563EB',
  SELF_ADDED: '#D97706',
};

// --- Deterministic, pure helpers (no AI, no side effects) ---

function resolveSource(t: Task): TaskSource {
  // Spec: existing records with blank Task Source are treated as ASSIGNED.
  return t.source || TaskSource.ASSIGNED;
}

function getMonthKey(dateStr: string): string {
  // Task.date is stored as 'YYYY-MM-DD'; month key is the first 7 chars.
  return (dateStr || '').slice(0, 7);
}

function getPreviousMonthKey(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getMonthRange(monthKey: string): { start: string; end: string; daysInMonth: number } {
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const fmt = (day: number) => `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { start: fmt(1), end: fmt(daysInMonth), daysInMonth };
}

function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

interface EmployeeStats {
  employeeName: string;
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  notStarted: number;
  avgProgress: number;
  eodPct: number;
  selfInitiated: number;
  assigned: number;
}

function computeEmployeeStats(tasksForMonth: Task[]): EmployeeStats[] {
  const byEmployee = new Map<string, Task[]>();
  tasksForMonth.forEach((t) => {
    const key = t.employeeName || 'Unknown';
    if (!byEmployee.has(key)) byEmployee.set(key, []);
    byEmployee.get(key)!.push(t);
  });

  const stats: EmployeeStats[] = [];
  byEmployee.forEach((empTasks, employeeName) => {
    const total = empTasks.length;
    const completed = empTasks.filter((t) => t.status === 'Completed').length;
    const inProgress = empTasks.filter((t) => t.status === 'In Progress').length;
    const blocked = empTasks.filter((t) => t.status === 'Blocked').length;
    const notStarted = empTasks.filter((t) => t.status === 'Not Started').length;
    const progressSum = empTasks.reduce((acc, t) => acc + (t.progress || 0), 0);
    const eodSubmittedCount = empTasks.filter((t) => t.eodSubmitted).length;
    const selfInitiated = empTasks.filter((t) => resolveSource(t) === TaskSource.SELF_ADDED).length;
    const assigned = total - selfInitiated;

    stats.push({
      employeeName,
      total,
      completed,
      inProgress,
      blocked,
      notStarted,
      avgProgress: total > 0 ? Math.round(progressSum / total) : 0,
      eodPct: pct(eodSubmittedCount, total),
      selfInitiated,
      assigned,
    });
  });

  // Rank: highest Completed count first, ties broken by highest average progress.
  return stats.sort((a, b) => b.completed - a.completed || b.avgProgress - a.avgProgress);
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '1.25rem',
  boxShadow: 'var(--shadow-sm)',
};

const chartTitleStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 700,
  color: 'var(--text-main)',
  marginBottom: '1rem',
};

const kpiCardStyle: React.CSSProperties = {
  ...cardStyle,
  padding: '1rem',
};

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={kpiCardStyle}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: color || 'var(--text-main)' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.15rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const r = 52;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle cx={65} cy={65} r={r} fill="none" stroke="var(--border-color)" strokeWidth={16} />
        {total > 0 &&
          segments.map((s) => {
            if (s.value === 0) return null;
            const len = (s.value / total) * circumference;
            const dasharray = `${len} ${circumference - len}`;
            const circle = (
              <circle
                key={s.label}
                cx={65}
                cy={65}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={16}
                strokeDasharray={dasharray}
                strokeDashoffset={-offset}
                transform="rotate(-90 65 65)"
              />
            );
            offset += len;
            return circle;
          })}
        <text x={65} y={61} textAnchor="middle" style={{ fontSize: '1.1rem', fontWeight: 800, fill: 'var(--text-main)' }}>{total}</text>
        <text x={65} y={78} textAnchor="middle" style={{ fontSize: '0.6rem', fill: 'var(--text-muted)' }}>tasks</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            <span style={{ fontWeight: 700 }}>{s.value}</span>
            <span style={{ color: 'var(--text-subtle)' }}>({pct(s.value, total)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarComparison({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {items.map((i) => (
        <div key={i.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i.label}</span>
            <span style={{ fontWeight: 700 }}>{i.value}</span>
          </div>
          <div style={{ background: 'var(--bg-page)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
            <div style={{ width: `${(i.value / max) * 100}%`, background: i.color, height: '100%', borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LineTrend({ series, days }: { series: { label: string; color: string; values: number[] }[]; days: number }) {
  const width = 600;
  const height = 160;
  const padding = 20;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const xStep = days > 1 ? (width - padding * 2) / (days - 1) : 0;

  const toPoints = (values: number[]) =>
    values
      .map((v, idx) => {
        const x = padding + idx * xStep;
        const y = height - padding - (v / max) * (height - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="none">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-color)" strokeWidth={1} />
        {series.map((s) => (
          <polyline key={s.label} points={toPoints(s.values)} fill="none" stroke={s.color} strokeWidth={2} />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        {series.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 10, height: 3, background: s.color, display: 'inline-block' }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function StackedWeeklyBars({ weeks }: { weeks: { label: string; submitted: number; pending: number }[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.submitted + w.pending));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', height: 140 }}>
        {weeks.map((w) => {
          const total = w.submitted + w.pending;
          const totalHeight = (total / max) * 120;
          const submittedHeight = total > 0 ? (w.submitted / total) * totalHeight : 0;
          const pendingHeight = totalHeight - submittedHeight;
          return (
            <div key={w.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 120, width: '100%' }}>
                <div style={{ height: pendingHeight, background: '#FCD34D', width: '100%', borderRadius: pendingHeight > 0 ? '4px 4px 0 0' : 0 }} />
                <div style={{ height: submittedHeight, background: '#059669', width: '100%', borderRadius: pendingHeight > 0 ? 0 : '4px 4px 0 0' }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{w.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ width: 10, height: 10, background: '#059669', display: 'inline-block', borderRadius: 2 }} /> Submitted
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ width: 10, height: 10, background: '#FCD34D', display: 'inline-block', borderRadius: 2 }} /> Pending
        </div>
      </div>
    </div>
  );
}

export const EOMReport: React.FC<EOMReportProps> = ({ employees, tasks }) => {
  const availableMonths = useMemo(() => {
    const set = new Set(tasks.map((t) => getMonthKey(t.date)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [tasks]);

  const defaultMonth = useMemo(() => {
    const prev = getPreviousMonthKey();
    if (availableMonths.includes(prev)) return prev;
    return availableMonths[0] || prev;
  }, [availableMonths]);

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  if (availableMonths.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
        No task data available yet to generate an EOM report.
      </div>
    );
  }

  const { start, end, daysInMonth } = getMonthRange(selectedMonth);

  const monthTasks = tasks.filter((t) => getMonthKey(t.date) === selectedMonth);

  let filteredTasks = monthTasks;
  if (employeeFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter((t) => t.employeeName.toLowerCase() === employeeFilter.toLowerCase());
  }
  if (sourceFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter((t) => resolveSource(t) === (sourceFilter === 'ASSIGNED' ? TaskSource.ASSIGNED : TaskSource.SELF_ADDED));
  }
  if (statusFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
  }

  // --- KPIs ---
  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.status === 'Completed').length;
  const inProgress = filteredTasks.filter((t) => t.status === 'In Progress').length;
  const blocked = filteredTasks.filter((t) => t.status === 'Blocked').length;
  const notStarted = filteredTasks.filter((t) => t.status === 'Not Started').length;
  const eodSubmittedCount = filteredTasks.filter((t) => t.eodSubmitted).length;
  const eodPct = pct(eodSubmittedCount, total);
  const selfInitiatedCount = filteredTasks.filter((t) => resolveSource(t) === TaskSource.SELF_ADDED).length;
  const assignedCount = total - selfInitiatedCount;

  // --- Employee performance ---
  const employeeStats = computeEmployeeStats(filteredTasks);

  // --- Monthly task trend (daily) ---
  const createdPerDay = new Array(daysInMonth).fill(0);
  const completedPerDay = new Array(daysInMonth).fill(0);
  filteredTasks.forEach((t) => {
    const createdDay = new Date(t.createdAt).getDate();
    if (createdDay >= 1 && createdDay <= daysInMonth) createdPerDay[createdDay - 1]++;
    if (t.status === 'Completed') {
      const updatedDay = new Date(t.updatedAt).getDate();
      if (updatedDay >= 1 && updatedDay <= daysInMonth) completedPerDay[updatedDay - 1]++;
    }
  });

  // --- EOD submission trend (weekly, bucketed by task date) ---
  const weekCount = Math.ceil(daysInMonth / 7);
  const weeks = Array.from({ length: weekCount }, (_, i) => {
    const weekStartDay = i * 7 + 1;
    const weekEndDay = Math.min(weekStartDay + 6, daysInMonth);
    const weekTasks = filteredTasks.filter((t) => {
      const day = Number(t.date.slice(8, 10));
      return day >= weekStartDay && day <= weekEndDay;
    });
    return {
      label: `${weekStartDay}-${weekEndDay}`,
      submitted: weekTasks.filter((t) => t.eodSubmitted).length,
      pending: weekTasks.filter((t) => !t.eodSubmitted).length,
    };
  });

  // --- Workload distribution ---
  const workload = [...employeeStats].sort((a, b) => b.total - a.total).map((e) => ({ label: e.employeeName, value: e.total, color: 'var(--caa-blue)' }));

  // --- Blocked / pending work ---
  const statusRank: Record<string, number> = { 'Blocked': 0, 'In Progress': 1, 'Not Started': 2, 'Completed': 3 };
  const pendingWork = filteredTasks
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => statusRank[a.status] - statusRank[b.status]);

  // --- Management insights (deterministic, no AI) ---
  const withTasks = employeeStats.filter((e) => e.total > 0);
  const highestCompletion = withTasks.length ? [...withTasks].sort((a, b) => b.completed - a.completed)[0] : null;
  const highestAvgProgress = withTasks.length ? [...withTasks].sort((a, b) => b.avgProgress - a.avgProgress)[0] : null;
  const highestSelfInitiated = withTasks.filter((e) => e.selfInitiated > 0).sort((a, b) => b.selfInitiated - a.selfInitiated)[0] || null;
  const mostBlocked = withTasks.filter((e) => e.blocked > 0).sort((a, b) => b.blocked - a.blocked)[0] || null;
  const lowestEodRate = withTasks.length ? [...withTasks].sort((a, b) => a.eodPct - b.eodPct)[0] : null;
  const totalPending = filteredTasks.filter((t) => t.status !== 'Completed').length;

  const workerEmployees = employees.filter((e) => e.role === 'Employee' || e.role === 'Manager');

  return (
    <div>
      {/* Header + filters */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{formatMonthLabel(selectedMonth)}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
              <Calendar size={14} /> {formatDateLabel(start)} &ndash; {formatDateLabel(end)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select className="select-input" style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
          <select className="select-input" style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
            <option value="ALL">All Employees</option>
            {workerEmployees.map((emp) => (
              <option key={emp.id} value={emp.name}>{emp.name}</option>
            ))}
          </select>
          <select className="select-input" style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="ALL">All Sources</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="SELF_ADDED">Self‑Initiated</option>
          </select>
          <select className="select-input" style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard label="Total Tasks" value={total} />
        <KpiCard label="Completed" value={completed} sub={`${pct(completed, total)}%`} color={STATUS_COLORS['Completed']} />
        <KpiCard label="In Progress" value={inProgress} sub={`${pct(inProgress, total)}%`} color={STATUS_COLORS['In Progress']} />
        <KpiCard label="Blocked" value={blocked} sub={`${pct(blocked, total)}%`} color={STATUS_COLORS['Blocked']} />
        <KpiCard label="Not Started" value={notStarted} sub={`${pct(notStarted, total)}%`} color={STATUS_COLORS['Not Started']} />
        <KpiCard label="EOD Submission" value={`${eodPct}%`} sub={`${eodSubmittedCount}/${total} tasks`} color="#059669" />
        <KpiCard label="Self‑Initiated" value={selfInitiatedCount} sub={`${pct(selfInitiatedCount, total)}%`} color={SOURCE_COLORS.SELF_ADDED} />
        <KpiCard label="Assigned" value={assignedCount} sub={`${pct(assignedCount, total)}%`} color={SOURCE_COLORS.ASSIGNED} />
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={cardStyle}>
          <div style={chartTitleStyle}>Task Status Distribution</div>
          <DonutChart
            segments={[
              { label: 'Completed', value: completed, color: STATUS_COLORS['Completed'] },
              { label: 'In Progress', value: inProgress, color: STATUS_COLORS['In Progress'] },
              { label: 'Blocked', value: blocked, color: STATUS_COLORS['Blocked'] },
              { label: 'Not Started', value: notStarted, color: STATUS_COLORS['Not Started'] },
            ]}
          />
        </div>

        <div style={cardStyle}>
          <div style={chartTitleStyle}>Assigned vs Self‑Initiated</div>
          <BarComparison
            items={[
              { label: 'Assigned', value: assignedCount, color: SOURCE_COLORS.ASSIGNED },
              { label: 'Self‑Initiated', value: selfInitiatedCount, color: SOURCE_COLORS.SELF_ADDED },
            ]}
          />
        </div>

        <div style={cardStyle}>
          <div style={chartTitleStyle}>Workload Distribution</div>
          {workload.length > 0 ? <BarComparison items={workload} /> : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data for this selection.</div>}
        </div>

        <div style={cardStyle}>
          <div style={chartTitleStyle}>Monthly Task Trend</div>
          <LineTrend
            days={daysInMonth}
            series={[
              { label: 'Created', color: 'var(--caa-blue)', values: createdPerDay },
              { label: 'Completed', color: STATUS_COLORS['Completed'], values: completedPerDay },
            ]}
          />
        </div>

        <div style={cardStyle}>
          <div style={chartTitleStyle}>EOD Submission Trend</div>
          <StackedWeeklyBars weeks={weeks} />
        </div>
      </div>

      {/* Employee performance */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ ...chartTitleStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="var(--caa-blue)" /> Employee Performance
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th style={{ textAlign: 'center' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Completed</th>
                <th style={{ textAlign: 'center' }}>In Progress</th>
                <th style={{ textAlign: 'center' }}>Blocked</th>
                <th style={{ textAlign: 'center' }}>Avg Progress</th>
                <th style={{ textAlign: 'center' }}>EOD Submission</th>
              </tr>
            </thead>
            <tbody>
              {employeeStats.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data for this selection.</td></tr>
              ) : (
                employeeStats.map((e, idx) => (
                  <tr key={e.employeeName}>
                    <td>{idx === 0 ? <Award size={14} color="#D97706" /> : idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{e.employeeName}</td>
                    <td style={{ textAlign: 'center' }}>{e.total}</td>
                    <td style={{ textAlign: 'center', color: STATUS_COLORS['Completed'] }}>{e.completed}</td>
                    <td style={{ textAlign: 'center', color: STATUS_COLORS['In Progress'] }}>{e.inProgress}</td>
                    <td style={{ textAlign: 'center', color: STATUS_COLORS['Blocked'] }}>{e.blocked}</td>
                    <td style={{ textAlign: 'center' }}>{e.avgProgress}%</td>
                    <td style={{ textAlign: 'center' }}>{e.eodPct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blocked / pending work */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ ...chartTitleStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} color="#DC2626" /> Blocked / Pending Work
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Employee</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {pendingWork.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No blocked or pending work for this selection.</td></tr>
              ) : (
                pendingWork.map((t) => (
                  <tr key={t.id}>
                    <td>{t.task}</td>
                    <td>{t.employeeName}</td>
                    <td style={{ textAlign: 'center', color: STATUS_COLORS[t.status] }}>{t.status}</td>
                    <td style={{ textAlign: 'center' }}>{t.progress}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Management insights */}
      <div style={cardStyle}>
        <div style={{ ...chartTitleStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} color="var(--caa-blue)" /> Management Insights
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-main)' }}>
          <li>{highestCompletion ? <><strong>{highestCompletion.employeeName}</strong> completed the most tasks ({highestCompletion.completed}).</> : 'No completed tasks this month.'}</li>
          <li>{highestAvgProgress ? <><strong>{highestAvgProgress.employeeName}</strong> has the highest average progress ({highestAvgProgress.avgProgress}%).</> : 'No progress data this month.'}</li>
          <li>{highestSelfInitiated ? <><strong>{highestSelfInitiated.employeeName}</strong> took up the most self‑initiated work ({highestSelfInitiated.selfInitiated} tasks).</> : 'No self‑initiated work this month.'}</li>
          <li>{mostBlocked ? <><strong>{mostBlocked.employeeName}</strong> has the most blocked work ({mostBlocked.blocked} tasks).</> : 'No blocked tasks this month.'}</li>
          <li>{lowestEodRate ? <><strong>{lowestEodRate.employeeName}</strong> has the lowest EOD submission rate ({lowestEodRate.eodPct}%).</> : 'No EOD data this month.'}</li>
          <li>Total pending workload across the team: <strong>{totalPending}</strong> task{totalPending === 1 ? '' : 's'}.</li>
        </ul>
      </div>
    </div>
  );
};
