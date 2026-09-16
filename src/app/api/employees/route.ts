import { NextRequest, NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/repositories/dataProvider';
import { getAuthenticatedUser, resolveManagedNames, resolveCurrentRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const provider = getDataProvider();
    const employees = await provider.getEmployees();
    const currentRole = resolveCurrentRole(employees, session);

    if (currentRole === 'Employee') {
      const self = employees.filter(
        (e) => e.email.toLowerCase() === session.email.toLowerCase()
      );
      return NextResponse.json({ success: true, data: self });
    }

    if (currentRole === 'Senior Accountant') {
      const managed = resolveManagedNames(employees, session.email);
      const scoped = employees.filter(
        (e) => e.email.toLowerCase() === session.email.toLowerCase() || managed.has(e.name.toLowerCase())
      );
      return NextResponse.json({ success: true, data: scoped });
    }

    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
