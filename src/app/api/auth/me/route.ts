import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDataProvider } from '@/lib/repositories/dataProvider';

export async function GET(request: NextRequest) {
  const session = getAuthenticatedUser(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthenticated' },
      { status: 401 }
    );
  }

  // Re-verify against EMPLOYEES sheet to ensure user role/status is current
  try {
    const provider = getDataProvider();
    const employees = await provider.getEmployees();
    const currentEmp = employees.find(
      (e) => e.email && e.email.toLowerCase() === session.email.toLowerCase()
    );

    if (!currentEmp || !currentEmp.active) {
      return NextResponse.json(
        { success: false, error: 'Account is no longer active or registered' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: currentEmp.id,
        name: currentEmp.name,
        email: currentEmp.email,
        role: currentEmp.role,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
      },
    });
  }
}
