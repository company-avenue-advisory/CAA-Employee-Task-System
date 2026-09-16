import { google } from 'googleapis';
import { TaskSource } from '../types';
import { Employee, Task, CreateTaskInput, UpdateTaskInput, TaskFilterOptions, TaskPriority, TaskStatus, Role } from '../types';
import { CONFIG } from '../config';
import { mockRepository } from './mockRepository';

export class GoogleSheetsRepository {
  private getAuth() {
    if (!CONFIG.googleSheets.clientEmail || !CONFIG.googleSheets.privateKey) {
      throw new Error('Google Sheets credentials are not configured.');
    }

    return new google.auth.JWT({
      email: CONFIG.googleSheets.clientEmail,
      key: CONFIG.googleSheets.privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  private getSheetsClient() {
    const auth = this.getAuth();
    return google.sheets({ version: 'v4', auth });
  }

  async getEmployees(): Promise<Employee[]> {
    try {
      if (!CONFIG.googleSheets.spreadsheetId) {
        return mockRepository.getEmployees();
      }

      const sheets = this.getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: CONFIG.googleSheets.spreadsheetId,
        range: 'EMPLOYEES!A2:F',
      });

      const rows = response.data.values || [];
      return rows
        .filter((row) => row && row[0] && row[1] && row[0].toString().toUpperCase() !== 'EMPLOYEE ID')
        .map((row) => ({
          id: row[0].toString().trim(),
          name: row[1].toString().trim(),
          email: row[2] ? row[2].toString().trim() : '',
          role: (() => {
            const raw = row[3] ? row[3].toString().trim().toLowerCase() : '';
            if (raw === 'owner') return 'Owner';
            if (raw === 'manager') return 'Manager';
            if (raw === 'senior accountant') return 'Senior Accountant';
            return 'Employee';
          })() as Role,
          active: row[4] ? row[4].toString().toLowerCase() === 'true' || row[4].toString() === '1' : true,
          manages: row[5]
            ? row[5].toString().split(',').map((n: string) => n.trim()).filter(Boolean)
            : [],
        }));
    } catch (error) {
      console.warn('Google Sheets getEmployees failed, falling back to mock data:', error);
      return mockRepository.getEmployees();
    }
  }

  async getTasks(filter?: TaskFilterOptions): Promise<Task[]> {
    try {
      if (!CONFIG.googleSheets.spreadsheetId) {
        return mockRepository.getTasks(filter);
      }

      const sheets = this.getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: CONFIG.googleSheets.spreadsheetId,
        range: 'TASKS!A2:P',
      });

      const rows = response.data.values || [];
      let tasks: Task[] = rows.map((row) => ({
        id: row[0] || '',
        date: row[1] || '',
        employeeName: row[2] || '',
        task: row[3] || '',
        description: row[4] || '',
        priority: (row[5] as TaskPriority) || 'Medium',
        dueTime: row[6] || '5:00 PM',
        status: (row[7] as TaskStatus) || 'Not Started',
        progress: parseInt(row[8] || '0', 10),
        eodNote: row[9] || '',
        outputLink: row[10] || '',
        eodSubmitted: row[11] ? row[11].toLowerCase() === 'yes' || row[11] === 'true' : false,
        createdAt: row[12] || new Date().toISOString(),
        updatedAt: row[13] || new Date().toISOString(),
        source: (row[14] as any) || TaskSource.ASSIGNED,
        client: row[15] || '',
      }));

      if (filter) {
        if (filter.date) tasks = tasks.filter(t => t.date === filter.date);
        if (filter.employeeName) tasks = tasks.filter(t => t.employeeName.toLowerCase() === filter.employeeName?.toLowerCase());
        if (filter.status) tasks = tasks.filter(t => t.status === filter.status);
        if (filter.priority) tasks = tasks.filter(t => t.priority === filter.priority);
      }

      return tasks;
    } catch (error) {
      console.warn('Google Sheets getTasks failed, falling back to mock data:', error);
      return mockRepository.getTasks(filter);
    }
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    try {
      if (!CONFIG.googleSheets.spreadsheetId) {
        return mockRepository.createTask(input);
      }

      const allTasks = await this.getTasks();
      const nextNum = allTasks.length + 1;
      const taskId = `TASK-${String(nextNum).padStart(4, '0')}`;
      const now = new Date().toISOString();
      const today = input.date || new Date().toISOString().split('T')[0];

      const newRow = [
        taskId,
        today,
        input.employeeName,
        input.task,
        input.description || '',
        input.priority,
        input.dueTime,
        'Not Started',
        '0',
        '',
        '',
        'No',
        now,
        now,
        // Source column based on input.source
        input.source ?? TaskSource.ASSIGNED,
        input.client || '',
      ];

      const sheets = this.getSheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: CONFIG.googleSheets.spreadsheetId,
        range: 'TASKS!A:P',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [newRow],
        },
      });

      return {
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
        client: input.client || '',
      };
    } catch (error) {
      console.warn('Google Sheets createTask failed, falling back to mock data:', error);
      return mockRepository.createTask(input);
    }
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
    try {
      if (!CONFIG.googleSheets.spreadsheetId) {
        return mockRepository.updateTask(id, input);
      }

      const sheets = this.getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: CONFIG.googleSheets.spreadsheetId,
        range: 'TASKS!A2:P',
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);
      if (rowIndex === -1) return null;

      const currentRow = rows[rowIndex];
      const now = new Date().toISOString();

      const updatedRow = [
        id,
        currentRow[1],
        input.employeeName ?? currentRow[2],
        input.task ?? currentRow[3],
        input.description ?? currentRow[4],
        input.priority ?? currentRow[5],
        input.dueTime ?? currentRow[6],
        input.status ?? currentRow[7],
        input.progress !== undefined ? String(input.progress) : currentRow[8],
        input.eodNote ?? currentRow[9],
        input.outputLink ?? currentRow[10],
        input.eodSubmitted !== undefined ? (input.eodSubmitted ? 'Yes' : 'No') : currentRow[11],
        currentRow[12],
        now,
        currentRow[14],
        input.client ?? currentRow[15],
      ];

      const sheetRowNumber = rowIndex + 2; // 1-based index + header row
      await sheets.spreadsheets.values.update({
        spreadsheetId: CONFIG.googleSheets.spreadsheetId,
        range: `TASKS!A${sheetRowNumber}:P${sheetRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [updatedRow],
        },
      });

      return {
        id,
        date: currentRow[1],
        employeeName: updatedRow[2],
        task: updatedRow[3],
        description: updatedRow[4],
        priority: updatedRow[5] as TaskPriority,
        dueTime: updatedRow[6],
        status: updatedRow[7] as TaskStatus,
        progress: parseInt(updatedRow[8], 10),
        eodNote: updatedRow[9],
        outputLink: updatedRow[10],
        eodSubmitted: updatedRow[11] === 'Yes',
        createdAt: currentRow[12],
        updatedAt: now,
        source: updatedRow[14] as TaskSource,
        client: updatedRow[15] || '',
      };
    } catch (error) {
      console.warn('Google Sheets updateTask failed, falling back to mock data:', error);
      return mockRepository.updateTask(id, input);
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      if (!CONFIG.googleSheets.spreadsheetId) {
        return mockRepository.deleteTask(id);
      }
      const sheets = this.getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: CONFIG.googleSheets.spreadsheetId,
        range: 'TASKS!A2:A',
      });
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);
      if (rowIndex === -1) return false;

      const sheetRowNumber = rowIndex + 2;
      // Clear row content in Google Sheets
      await sheets.spreadsheets.values.clear({
        spreadsheetId: CONFIG.googleSheets.spreadsheetId,
        range: `TASKS!A${sheetRowNumber}:N${sheetRowNumber}`,
      });
      return true;
    } catch (error) {
      console.warn('Google Sheets deleteTask failed, falling back to mock data:', error);
      return mockRepository.deleteTask(id);
    }
  }

  async submitEOD(employeeName: string, date?: string): Promise<{ success: boolean; count: number }> {
    try {
      if (!CONFIG.googleSheets.spreadsheetId) {
        return mockRepository.submitEOD(employeeName, date);
      }
      const tasks = await this.getTasks({ employeeName, date });
      for (const t of tasks) {
        await this.updateTask(t.id, { eodSubmitted: true });
      }
      return { success: true, count: tasks.length };
    } catch (error) {
      return mockRepository.submitEOD(employeeName, date);
    }
  }

  async reopenEOD(employeeName: string, date?: string): Promise<{ success: boolean; count: number }> {
    try {
      if (!CONFIG.googleSheets.spreadsheetId) {
        return mockRepository.reopenEOD(employeeName, date);
      }
      const tasks = await this.getTasks({ employeeName, date });
      for (const t of tasks) {
        await this.updateTask(t.id, { eodSubmitted: false });
      }
      return { success: true, count: tasks.length };
    } catch (error) {
      return mockRepository.reopenEOD(employeeName, date);
    }
  }
}

export const googleSheetsRepository = new GoogleSheetsRepository();
