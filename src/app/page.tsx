'use client';

import React, { useState, useEffect } from 'react';
import { Employee, Task, TaskPriority } from '@/lib/types';
import { Header } from '@/components/Header';
import { LoginScreen } from '@/components/LoginScreen';
import { EmployeeDashboard } from '@/components/EmployeeDashboard';
import { ManagerDashboard } from '@/components/ManagerDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Loader2 } from 'lucide-react';

// Anyone who gets some form of team dashboard (full for Manager/Owner, scoped
// server-side to their delegated reports for Senior Accountant).
function hasTeamView(role: string): boolean {
  return role === 'Manager' || role === 'Owner' || role === 'Senior Accountant';
}

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'team' | 'admin' | 'my'>('team');

  // Senior Accountant's primary identity is still "employee doing their own work";
  // default them to their personal view rather than the team-assign view.
  useEffect(() => {
    if (currentEmployee?.role === 'Senior Accountant') {
      setActiveTab('my');
    }
  }, [currentEmployee?.role]);

  // Check authenticated session on load
  const checkAuthSession = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setCurrentEmployee(data.data);
        await fetchTasksAndEmployees(data.data);
      } else {
        setCurrentEmployee(null);
      }
    } catch (err) {
      setCurrentEmployee(null);
    } finally {
      setAuthChecked(true);
      setLoading(false);
    }
  };

  const fetchTasksAndEmployees = async (activeUser: Employee) => {
    try {
      const [empRes, taskRes, configRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/tasks'),
        fetch('/api/config'),
      ]);

      const empData = await empRes.json();
      const taskData = await taskRes.json();
      const configData = await configRes.json();

      if (configData.success) {
        setIsDemoMode(configData.isDemoMode);
      }

      if (empData.success && empData.data) {
        setEmployees(empData.data);
      }

      if (taskData.success && taskData.data) {
        setTasks(taskData.data);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load tasks system data. Please refresh.');
    }
  };

  useEffect(() => {
    checkAuthSession();
  }, []);

  const handleLoginSuccess = async (user: Employee) => {
    setCurrentEmployee(user);
    await fetchTasksAndEmployees(user);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // ignore
    } finally {
      setCurrentEmployee(null);
      setTasks([]);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!currentEmployee) return;

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update task.');
    }

    await fetchTasksAndEmployees(currentEmployee);
  };

  const handleSubmitEOD = async () => {
    if (!currentEmployee) return;

    const res = await fetch('/api/tasks/submit-eod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeName: currentEmployee.name,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit EOD.');
    }

    await fetchTasksAndEmployees(currentEmployee);
  };

  const handleAssignTask = async (taskData: {
    employeeName: string;
    task: string;
    description: string;
    priority: TaskPriority;
    dueTime: string;
    client: string;
  }) => {
    if (!currentEmployee) return;

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to assign task.');
    }

    await fetchTasksAndEmployees(currentEmployee);
  };

  const handleReopenEOD = async (employeeName: string) => {
    if (!currentEmployee) return;

    const res = await fetch('/api/tasks/reopen-eod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeName }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to reopen EOD.');
    }

    await fetchTasksAndEmployees(currentEmployee);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentEmployee) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.error || 'Failed to delete task.');
      return;
    }

    await fetchTasksAndEmployees(currentEmployee);
  };

  if (loading && !authChecked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
        <Loader2 size={36} color="var(--caa-blue)" className="animate-spin" />
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Verifying CAA Authentication Session...</p>
      </div>
    );
  }

  if (!currentEmployee) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        googleClientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}
      />
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--status-blocked-text)', marginBottom: '1rem' }}>{error}</h2>
        <button type="button" className="btn btn-primary" onClick={() => fetchTasksAndEmployees(currentEmployee)}>
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <>
      <Header
        currentEmployee={currentEmployee}
        onLogout={handleLogout}
        isDemoMode={isDemoMode}
      />

      <main className="main-content">
        {hasTeamView(currentEmployee.role) && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              className={activeTab === 'my' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setActiveTab('my')}
            >
              My Tasks
            </button>
            <button
              type="button"
              className={activeTab === 'team' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setActiveTab('team')}
            >
              Team
            </button>
            {currentEmployee.role === 'Owner' && (
              <button
                type="button"
                className={activeTab === 'admin' ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={() => setActiveTab('admin')}
              >
                Admin
              </button>
            )}
          </div>
        )}

        {currentEmployee.role === 'Owner' && activeTab === 'admin' ? (
          <AdminDashboard
            employees={employees}
            tasks={tasks}
            isDemoMode={isDemoMode}
            onReopenEOD={handleReopenEOD}
            onDeleteTask={handleDeleteTask}
          />
        ) : hasTeamView(currentEmployee.role) && activeTab === 'team' ? (
          <ManagerDashboard
            employees={employees}
            tasks={tasks}
            onAssignTask={handleAssignTask}
            onUpdateTask={handleUpdateTask}
            onReopenEOD={handleReopenEOD}
            onDeleteTask={handleDeleteTask}
          />
        ) : (
          <EmployeeDashboard
            currentEmployee={currentEmployee}
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onRefreshTasks={() => fetchTasksAndEmployees(currentEmployee)}
            onSubmitEOD={handleSubmitEOD}
          />
        )}
      </main>
    </>
  );
}
