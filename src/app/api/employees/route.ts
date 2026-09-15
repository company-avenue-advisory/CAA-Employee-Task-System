import { NextRequest, NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/repositories/dataProvider';
import { getAuthenticatedUser } from '@/lib/auth';

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

    if (session.role === 'Employee') {
      const self = employees.filter(
        (e) => e.email.toLowerCase() === session.email.toLowerCase()
      );
      return NextResponse.json({ success: true, data: self });
    }

    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
