export type Role = 'Employee' | 'Manager' | 'Owner' | 'Senior Accountant';

// New enum for task origin
export enum TaskSource {
  ASSIGNED = 'ASSIGNED',
  SELF_ADDED = 'SELF_ADDED',
}

export type TaskPriority = 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Completed';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  // Names of employees this person may view/assign/manage (Senior Accountant scope).
  manages?: string[];
}

export interface Task {
  // Existing fields
  id: string; // e.g. TASK-0001
  date: string; // YYYY-MM-DD
  employeeName: string; // Rahul, Ankit, Priya
  task: string; // Task Title
  description?: string;
  priority: TaskPriority;
  dueTime: string; // e.g. "5:00 PM"
  status: TaskStatus;
  progress: number; // 0 to 100
  eodNote: string;
  outputLink?: string;
  eodSubmitted: boolean;
  createdAt: string;
  updatedAt: string;
  // New field indicating who created the task
  source: TaskSource;
}

export interface TaskFilterOptions {
  date?: string;
  employeeName?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface CreateTaskInput {
  employeeName: string;
  task: string;
  description?: string;
  priority: TaskPriority;
  dueTime: string;
  date?: string;
  // source is set server‑side; optional for backward compatibility
  source?: TaskSource;
}


export interface UpdateTaskInput {
  status?: TaskStatus;
  progress?: number;
  eodNote?: string;
  outputLink?: string;
  task?: string;
  description?: string;
  priority?: TaskPriority;
  dueTime?: string;
  employeeName?: string;
  eodSubmitted?: boolean;
}

export interface TeamSummary {
  totalTasks: number;
  completed: number;
  inProgress: number;
  blocked: number;
  notStarted: number;
  eodSubmittedCount: number;
  eodPendingCount: number;
}

export interface EmployeeSummary {
  employeeName: string;
  totalTasks: number;
  completed: number;
  inProgress: number;
  blocked: number;
  notStarted: number;
  overallProgress: number;
  eodSubmitted: boolean;
}
