import React from 'react';
import { Employee } from '@/lib/types';
import { Database, LogOut, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentEmployee: Employee;
  onLogout: () => Promise<void>;
  isDemoMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentEmployee,
  onLogout,
  isDemoMode,
}) => {
  return (
    <>
      <header className="caa-header">
        <div className="brand-section">
          <div className="brand-logo">CAA</div>
          <div className="brand-title">Task & EOD System</div>
        </div>

        <div className="header-right">
          {/* Authenticated User Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'var(--bg-page)',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
            }}
          >
            <UserCheck size={16} style={{ color: 'var(--caa-blue)' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.85rem', lineHeight: 1.1 }}>
                {currentEmployee.name} ({currentEmployee.role})
              </strong>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                {currentEmployee.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.8rem',
            }}
            onClick={onLogout}
            title="Sign Out"
          >
            <LogOut size={14} />
            Sign Out
          </button>

          {/* Live Provider Indicator (subtle) */}
          {!isDemoMode && (
            <div
              style={{
                marginLeft: '1rem',
                fontSize: '0.75rem',
                color: 'var(--caa-blue)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Database size={12} color='var(--caa-blue)' />
              <span>LIVE • Google Sheets</span>
            </div>
          )}
        </div>
      </header>

      {/* Mode Indicator Banner */}
      {isDemoMode && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            fontSize: '0.8rem',
            fontWeight: 600,
            padding: '0.35rem 1rem',
            textAlign: 'center',
            borderBottom: `1px solid #FDE68A`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <Database size={14} color='#D97706' />
          <span><strong>DEMO MODE ACTIVE</strong> — Using simulated data layer.</span>
        </div>
      )}
    </>
  );
};
