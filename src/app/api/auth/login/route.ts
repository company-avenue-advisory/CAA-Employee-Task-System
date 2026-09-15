import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { getDataProvider } from '@/lib/repositories/dataProvider';
import { createSessionToken, setSessionCookie } from '@/lib/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const SESSION_SECRET = process.env.SESSION_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, email: rawEmail } = body;

    let targetEmail = '';

    // 1. Authenticate Google ID Token if provided
    if (idToken) {
      if (!GOOGLE_CLIENT_ID) {
        return NextResponse.json(
          { success: false, error: 'Google OAuth Client ID is not configured on the server.' },
          { status: 400 }
        );
      }
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return NextResponse.json(
          { success: false, error: 'Invalid Google ID token payload' },
          { status: 401 }
        );
      }
      targetEmail = payload.email;
    } else {
      // No email token provided – enforce Google authentication only
      return NextResponse.json(
        { success: false, error: 'Google authentication is required.' },
        { status: 400 }
      );
    }

    targetEmail = targetEmail.toLowerCase();

    // 2. Map authenticated email against the EMPLOYEES sheet
    const provider = getDataProvider();
    const employees = await provider.getEmployees();

    const matchedEmployee = employees.find(
      (emp) => emp.email && emp.email.toLowerCase() === targetEmail
    );

    if (!matchedEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Your Google account is not authorized for the CAA Employee System. Please contact the CAA administrator.',
        },
        { status: 403 }
      );
    }

    if (!matchedEmployee.active) {
      return NextResponse.json(
        { success: false, error: `Access Denied: The account for "${targetEmail}" is inactive.` },
        { status: 403 }
      );
    }

    // 3. Generate session token and set HTTP-only cookie
    const token = createSessionToken(matchedEmployee);
    const response = NextResponse.json({
      success: true,
      data: {
        id: matchedEmployee.id,
        name: matchedEmployee.name,
        email: matchedEmployee.email,
        role: matchedEmployee.role,
      },
    });

    setSessionCookie(response, token);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Authentication failed. ' + (error.message || '') },
      { status: 500 }
    );
  }
}
