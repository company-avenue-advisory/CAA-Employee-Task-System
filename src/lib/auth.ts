import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Employee, Role } from './types';

const SESSION_COOKIE_NAME = 'caa_session';
const SESSION_SECRET = (() => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is required in production');
    }
    // Development fallback (optional but explicit)
    return 'dev-secret-key-2026';
  }
  return secret;
})();

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  exp: number;
}

// Owner inherits full Manager capability plus Admin-only functionality.
export function hasManagerAccess(role: Role): boolean {
  return role === 'Manager' || role === 'Owner';
}

export function isOwner(role: Role): boolean {
  return role === 'Owner';
}

export function createSessionToken(employee: Employee): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: UserSession = {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: UserSession = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    );

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export function getAuthenticatedUser(request: NextRequest): UserSession | null {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie || !cookie.value) {
    return null;
  }
  return verifySessionToken(cookie.value);
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60, // 24 hours
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
