import React from 'react';
import { TaskSource } from '@/lib/types';

interface SourceBadgeProps {
  source: TaskSource;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source }) => {
  if (source === 'ASSIGNED') {
    return <span className="badge badge-assigned">ASSIGNED</span>;
  }
  return <span className="badge badge-self">SELF‑INITIATED</span>;
};
