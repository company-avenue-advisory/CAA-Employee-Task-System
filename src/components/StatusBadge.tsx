import React from 'react';
import { TaskStatus, TaskPriority } from '@/lib/types';
import { CheckCircle2, Clock, AlertTriangle, CircleDashed } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'Completed':
      return (
        <span className="badge badge-completed">
          <CheckCircle2 size={13} />
          Completed
        </span>
      );
    case 'In Progress':
      return (
        <span className="badge badge-in-progress">
          <Clock size={13} />
          In Progress
        </span>
      );
    case 'Blocked':
      return (
        <span className="badge badge-blocked">
          <AlertTriangle size={13} />
          Blocked
        </span>
      );
    case 'Not Started':
    default:
      return (
        <span className="badge badge-not-started">
          <CircleDashed size={13} />
          Not Started
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const pClass =
    priority === 'High'
      ? 'priority-high'
      : priority === 'Medium'
      ? 'priority-medium'
      : 'priority-low';

  return <span className={`priority-badge ${pClass}`}>{priority}</span>;
};
