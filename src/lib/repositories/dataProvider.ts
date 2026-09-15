import { CONFIG } from '../config';
import { mockRepository } from './mockRepository';
import { googleSheetsRepository } from './googleSheetsRepository';
import { Employee, Task, CreateTaskInput, UpdateTaskInput, TaskFilterOptions } from '../types';

export interface ITaskRepository {
  getEmployees(): Promise<Employee[]>;
  getTasks(filter?: TaskFilterOptions): Promise<Task[]>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(id: string, input: UpdateTaskInput): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;
  submitEOD(employeeName: string, date?: string): Promise<{ success: boolean; count: number }>;
  reopenEOD(employeeName: string, date?: string): Promise<{ success: boolean; count: number }>;
}

export function getDataProvider(): ITaskRepository {
  if (!CONFIG.isDemoMode && CONFIG.googleSheets.spreadsheetId) {
    return googleSheetsRepository;
  }
  return mockRepository;
}
