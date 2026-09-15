import React from 'react';
import { Task } from '@/lib/types';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface EODSubmitFooterProps {
  tasks: Task[];
  onSubmitEOD: () => Promise<void>;
  isSubmitting: boolean;
  submitSuccess: boolean;
  errorMessage: string | null;
}

export const EODSubmitFooter: React.FC<EODSubmitFooterProps> = ({
  tasks,
  onSubmitEOD,
  isSubmitting,
  submitSuccess,
  errorMessage,
}) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const blocked = tasks.filter((t) => t.status === 'Blocked').length;
  const notStarted = tasks.filter((t) => t.status === 'Not Started').length;

  const isAllSubmitted = total > 0 && tasks.every((t) => t.eodSubmitted);

  return (
    <div className="eod-submit-card">
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
          End of Day Summary
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Review today's task updates and submit your daily EOD status to your manager.
        </p>
      </div>

      <div className="eod-stats-grid">
        <div className="eod-stat-box">
          <div className="eod-stat-num">{total}</div>
          <div className="eod-stat-lbl">Total Tasks</div>
        </div>
        <div className="eod-stat-box">
          <div className="eod-stat-num" style={{ color: 'var(--status-completed-text)' }}>{completed}</div>
          <div className="eod-stat-lbl">Completed</div>
        </div>
        <div className="eod-stat-box">
          <div className="eod-stat-num" style={{ color: 'var(--status-in-progress-text)' }}>{inProgress}</div>
          <div className="eod-stat-lbl">In Progress</div>
        </div>
        <div className="eod-stat-box">
          <div className="eod-stat-num" style={{ color: 'var(--status-blocked-text)' }}>{blocked}</div>
          <div className="eod-stat-lbl">Blocked</div>
        </div>
        <div className="eod-stat-box">
          <div className="eod-stat-num" style={{ color: 'var(--text-muted)' }}>{notStarted}</div>
          <div className="eod-stat-lbl">Not Started</div>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            backgroundColor: 'var(--status-blocked-bg)',
            color: 'var(--status-blocked-text)',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}

      {isAllSubmitted || submitSuccess ? (
        <div
          style={{
            backgroundColor: 'var(--status-completed-bg)',
            color: 'var(--status-completed-text)',
            border: '1px solid var(--status-completed-text)',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          <CheckCircle2 size={20} />
          ✓ Today's EOD Submitted Successfully
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-success"
          style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
          onClick={onSubmitEOD}
          disabled={isSubmitting || total === 0}
        >
          <Send size={18} />
          {isSubmitting ? 'Submitting EOD...' : 'SUBMIT TODAY\'S EOD'}
        </button>
      )}
    </div>
  );
};
