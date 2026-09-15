import { Employee, Task, CreateTaskInput, UpdateTaskInput, TaskFilterOptions, TaskSource } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_TASKS, getTodayDateString } from '../mockData';

// Global in-memory storage for demo mode
let employeesStore: Employee[] = [...INITIAL_EMPLOYEES];
let tasksStore: Task[] = [...INITIAL_TASKS];
let taskCounter = 7; // Next ID TASK-0007

export class MockRepository {
  async getEmployees(): Promise<Employee[]> {
    return [...employeesStore];
  }

  async getTasks(filter?: TaskFilterOptions): Promise<Task[]> {
    let result = [...tasksStore];
    const today = getTodayDateString();

    if (filter) {
      if (filter.date) {
        result = result.filter(t => t.date === filter.date);
      }
      if (filter.employeeName) {
        result = result.filter(
          t => t.employeeName.toLowerCase() === filter.employeeName?.toLowerCase()
        );
      }
      if (filter.status) {
        result = result.filter(t => t.status === filter.status);
      }
      if (filter.priority) {
        result = result.filter(t => t.priority === filter.priority);
      }
    }

    return result;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const today = input.date || getTodayDateString();
    const taskId = `TASK-${String(taskCounter++).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newTask: Task = {
      id: taskId,
      date: today,
      employeeName: input.employeeName,
      task: input.task,
      description: input.description || '',
      priority: input.priority,
      dueTime: input.dueTime,
      status: 'Not Started',
      progress: 0,
      eodNote: '',
      outputLink: '',
      eodSubmitted: false,
      createdAt: now,
      updatedAt: now,
      source: input.source ?? TaskSource.ASSIGNED,
    };

    tasksStore.unshift(newTask);
    return newTask;
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const index = tasksStore.findIndex(t => t.id === id);
    if (index === -1) return null;

    const existing = tasksStore[index];
    const updated: Task = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    tasksStore[index] = updated;
    return updated;
  }

  async submitEOD(employeeName: string, date?: string): Promise<{ success: boolean; count: number }> {
    const targetDate = date || getTodayDateString();
    let count = 0;

    tasksStore = tasksStore.map(t => {
      if (t.employeeName.toLowerCase() === employeeName.toLowerCase() && t.date === targetDate) {
        count++;
        return {
          ...t,
          eodSubmitted: true,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    return { success: true, count };
  }

  async reopenEOD(employeeName: string, date?: string): Promise<{ success: boolean; count: number }> {
    const targetDate = date || getTodayDateString();
    let count = 0;

    tasksStore = tasksStore.map(t => {
      if (t.employeeName.toLowerCase() === employeeName.toLowerCase() && t.date === targetDate) {
        count++;
        return {
          ...t,
          eodSubmitted: false,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    return { success: true, count };
  }

  async deleteTask(id: string): Promise<boolean> {
    const initialLen = tasksStore.length;
    tasksStore = tasksStore.filter(t => t.id !== id);
    return tasksStore.length < initialLen;
  }
}

export const mockRepository = new MockRepository();
