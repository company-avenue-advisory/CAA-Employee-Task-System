import { NextRequest, NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/repositories/dataProvider';
import { notificationService } from '@/services/notificationService';
import { getAuthenticatedUser } from '@/lib/auth';

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
    let targetEmployee = body.employeeName || session.name;
    const date = body.date;

    // Strict employee isolation: Employee can only submit their own EOD
    if (session.role === 'Employee') {
      targetEmployee = session.name;
    }

    const provider = getDataProvider();
    const employeeTasks = await provider.getTasks({ employeeName: targetEmployee, date });

    if (employeeTasks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No tasks found for today to submit EOD' },
        { status: 400 }
      );
    }

    const result = await provider.submitEOD(targetEmployee, date);

    notificationService.sendEODSubmissionAlert(
      targetEmployee,
      date || new Date().toISOString().split('T')[0],
      result.count
    );

    return NextResponse.json({
      success: true,
      message: `✓ Today's EOD submitted successfully for ${targetEmployee}`,
      updatedCount: result.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to submit EOD' },
      { status: 500 }
    );
  }
}
