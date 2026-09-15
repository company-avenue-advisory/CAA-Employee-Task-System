import React from 'react';
import { Employee } from '@/lib/types';
import { UserCheck } from 'lucide-react';

interface UserSelectorProps {
  employees: Employee[];
  currentUserId: string;
  onUserChange: (employeeId: string) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  employees,
  currentUserId,
  onUserChange,
}) => {
  return (
    <div className="user-switcher">
      <UserCheck size={16} style={{ color: '#60A5FA' }} />
      <select
        value={currentUserId}
        onChange={(e) => onUserChange(e.target.value)}
        aria-label="Demo User Login"
      >
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name} ({emp.role})
          </option>
        ))}
      </select>
    </div>
  );
};
