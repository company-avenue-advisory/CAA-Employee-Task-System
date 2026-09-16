import { NextRequest, NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/repositories/dataProvider';
import { TaskStatus, TaskPriority } from '@/lib/types';
import { getAuthenticatedUser, hasManagerAccess, resolveManagedNames, resolveCurrentRole } from '@/lib/auth';

const VALID_STATUSES: TaskStatus[] = ['Not Started', 'In Progress', 'Blocked', 'Completed'];
const VALID_PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { requestingUser, requestingRole, ...updateData } = body;

    // Validate status if provided
    if (updateData.status && !VALID_STATUSES.includes(updateData.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (updateData.priority && !VALID_PRIORITIES.includes(updateData.priority)) {
      return NextResponse.json(
        { success: false, error: 'Invalid priority value' },
        { status: 400 }
      );
    }

    // Validate and clamp progress if provided
    if (updateData.progress !== undefined) {
      let prog = Number(updateData.progress);
      if (isNaN(prog)) {
        return NextResponse.json(
          { success: false, error: 'Progress must be a valid number' },
          { status: 400 }
        );
      }
      updateData.progress = Math.max(0, Math.min(100, prog));
    }

    const provider = getDataProvider();
    const employees = await provider.getEmployees();
    const currentRole = resolveCurrentRole(employees, session);

    // Fetch existing task to check ownership and EOD lock state
    const existingTasks = await provider.getTasks();
    const existingTask = existingTasks.find((t) => t.id === id);

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // SERVER-SIDE AUTHORIZATION & EOD LOCK RULES:
    if (currentRole === 'Employee') {
      // Rule 1: Employee can only update their own task
      if (existingTask.employeeName.toLowerCase() !== session.name.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You can only update your own assigned tasks' },
          { status: 403 }
        );
      }

      // Rule 2: SERVER-SIDE EOD LOCK. Employee cannot update task if EOD is already submitted
      if (existingTask.eodSubmitted) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Today's EOD has already been submitted for this task. Ask your manager to reopen EOD if corrections are required.",
          },
          { status: 400 }
        );
      }
    } else if (currentRole === 'Senior Accountant') {
      const isSelf = existingTask.employeeName.toLowerCase() === session.name.toLowerCase();
      if (!isSelf) {
        const managed = resolveManagedNames(employees, session.email);
        if (!managed.has(existingTask.employeeName.toLowerCase())) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: You can only update tasks for employees you manage' },
            { status: 403 }
          );
        }
      } else if (existingTask.eodSubmitted) {
        // Same EOD lock applies to their own tasks as any employee.
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Today's EOD has already been submitted for this task. Ask your manager to reopen EOD if corrections are required.",
          },
          { status: 400 }
        );
      }
    }

    const updated = await provider.updateTask(id, updateData);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const provider = getDataProvider();
    const employees = await provider.getEmployees();
    const currentRole = resolveCurrentRole(employees, session);

    // Authorization rule: Managers/Owner can delete any task; Senior Accountant only
    // tasks belonging to the employees they manage.
    if (!hasManagerAccess(currentRole)) {
      if (currentRole !== 'Senior Accountant') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Only Managers can delete tasks' },
          { status: 403 }
        );
      }
      const tasks = await provider.getTasks();
      const target = tasks.find((t) => t.id === id);
      const managed = resolveManagedNames(employees, session.email);
      if (!target || !managed.has(target.employeeName.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You can only delete tasks for employees you manage' },
          { status: 403 }
        );
      }
    }

    const success = await provider.deleteTask(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
