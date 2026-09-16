import { NextRequest, NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/repositories/dataProvider';
import { getAuthenticatedUser, hasManagerAccess, resolveManagedNames, resolveCurrentRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { employeeName, date } = body;

    if (!employeeName) {
      return NextResponse.json(
        { success: false, error: 'Employee name is required' },
        { status: 400 }
      );
    }

    const provider = getDataProvider();
    const employees = await provider.getEmployees();
    const currentRole = resolveCurrentRole(employees, session);

    // Authorization: Managers/Owner can reopen anyone's EOD; Senior Accountant
    // only for the employees they manage.
    if (!hasManagerAccess(currentRole)) {
      if (currentRole !== 'Senior Accountant') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Only Managers can reopen an EOD submission' },
          { status: 403 }
        );
      }
      const managed = resolveManagedNames(employees, session.email);
      if (!managed.has(employeeName.trim().toLowerCase())) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You can only reopen EOD for employees you manage' },
          { status: 403 }
        );
      }
    }

    const result = await provider.reopenEOD(employeeName, date);

    return NextResponse.json({
      success: true,
      message: `EOD unlocked for ${employeeName}`,
      updatedCount: result.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to reopen EOD' },
      { status: 500 }
    );
  }
}
