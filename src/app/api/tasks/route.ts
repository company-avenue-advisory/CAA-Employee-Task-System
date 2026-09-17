import { NextRequest, NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/repositories/dataProvider';
import { CreateTaskInput, TaskPriority, TaskStatus, TaskSource } from '@/lib/types';
import { notificationService } from '@/services/notificationService';
import { getAuthenticatedUser, resolveManagedNames, resolveCurrentRole } from '@/lib/auth';

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

    const provider = getDataProvider();
    const employees = await provider.getEmployees();
    const currentRole = resolveCurrentRole(employees, session);

    // Strict Server-Side Employee Isolation
    if (currentRole === 'Employee') {
      employeeName = session.name;
    }

    let tasks = await provider.getTasks({ date, employeeName, status, priority });

    // Senior Accountant sees only their own tasks plus their delegated reports' tasks.
    if (currentRole === 'Senior Accountant') {
      const managed = resolveManagedNames(employees, session.email);
      tasks = tasks.filter(
        (t) => t.employeeName.toLowerCase() === session.name.toLowerCase() || managed.has(t.employeeName.toLowerCase())
      );
    }

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
    const { employeeName, task, description, priority, dueTime, date, client } = body;

    const provider = getDataProvider();
    const employees = await provider.getEmployees();
    const currentRole = resolveCurrentRole(employees, session);

    // Whether the target is the creator's own name — true self-add regardless of role, since
    // every role (Employee through Owner) can self-add their own work via "My Tasks".
    const isSelfAdd = !!employeeName && employeeName.trim().toLowerCase() === session.name.toLowerCase();

    if (currentRole === 'Manager' || currentRole === 'Owner') {
      // Managers and Owner may assign to any employee, or self-add their own work.
    } else if (currentRole === 'Senior Accountant') {
      // Senior Accountant may assign to their delegated reports, or self-add their own work
      // (they're still an employee for their own "My Tasks" tab, same as a plain Employee).
      const managed = resolveManagedNames(employees, session.email);
      const targetName = employeeName ? employeeName.trim().toLowerCase() : '';
      if (!isSelfAdd && !managed.has(targetName)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You can only assign tasks to employees you manage' },
          { status: 403 }
        );
      }
    } else if (currentRole === 'Employee') {
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
      client: client ? client.trim() : '',
      // Source reflects who the work is actually for, not who created it: self-targeted work
      // is self-initiated regardless of the creator's role; anything targeting someone else
      // has already passed an assignment-authority check above.
      source: isSelfAdd ? TaskSource.SELF_ADDED : TaskSource.ASSIGNED,
    };

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
