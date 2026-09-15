import { NextRequest, NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/repositories/dataProvider';
import { CreateTaskInput, TaskPriority, TaskStatus, TaskSource } from '@/lib/types';
import { notificationService } from '@/services/notificationService';
import { getAuthenticatedUser, hasManagerAccess } from '@/lib/auth';

const VALID_PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

export async function GET(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    let employeeName = searchParams.get('employeeName') || undefined;
    const status = (searchParams.get('status') as TaskStatus) || undefined;
    const priority = (searchParams.get('priority') as TaskPriority) || undefined;

    // Strict Server-Side Employee Isolation
    if (session.role === 'Employee') {
      employeeName = session.name;
    }

    const provider = getDataProvider();
    const tasks = await provider.getTasks({ date, employeeName, status, priority });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // Authorization: Managers can assign tasks to any employee;
    // Employees can self-add tasks for themselves only.
    const body = await request.json();
    const { employeeName, task, description, priority, dueTime, date } = body;

    if (session.role === 'Manager' || session.role === 'Owner') {
      // Managers and Owner may assign tasks to any employee; source will be ASSIGNED server‑side.
    } else if (session.role === 'Employee') {
      // Employees can only create tasks for themselves.
      if (employeeName && employeeName.trim().toLowerCase() !== session.name.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Employees can only create tasks for themselves' },
          { status: 403 }
        );
      }
      body.employeeName = session.name;
    } else {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid role' },
        { status: 401 }
      );
    }



    if (!employeeName || !task || !task.trim() || !priority || !dueTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: employeeName, task, priority, dueTime' },
        { status: 400 }
      );
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { success: false, error: 'Invalid priority. Must be High, Medium, or Low' },
        { status: 400 }
      );
    }

    const input: CreateTaskInput = {
      employeeName: employeeName.trim(),
      task: task.trim(),
      description: description ? description.trim() : '',
      priority,
      dueTime: dueTime.trim(),
      date,
      // Set source based on role
      source: hasManagerAccess(session.role) ? TaskSource.ASSIGNED : TaskSource.SELF_ADDED,
    };

    const provider = getDataProvider();
    const newTask = await provider.createTask(input);

    // Trigger notification stub
    notificationService.sendTaskAssignment(employeeName, task, dueTime);

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
