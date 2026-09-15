/**
 * Notification Service Stub
 * Prepared for future integrations with Google Chat, Email, or Webhooks.
 */
export class NotificationService {
  async sendTaskAssignment(employeeName: string, taskTitle: string, dueTime: string): Promise<void> {
    console.log(`[STUB NOTIFICATION] Task assigned to ${employeeName}: "${taskTitle}" (Due: ${dueTime})`);
  }

  async sendEODReminder(employeeName: string): Promise<void> {
    console.log(`[STUB NOTIFICATION] EOD Reminder sent to ${employeeName}`);
  }

  async sendEODSubmissionAlert(employeeName: string, date: string, taskCount: number): Promise<void> {
    console.log(`[STUB NOTIFICATION] ${employeeName} submitted EOD for ${date} (${taskCount} tasks updated)`);
  }
}

export const notificationService = new NotificationService();
