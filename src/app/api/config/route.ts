import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export async function GET() {
  return NextResponse.json({
    success: true,
    isDemoMode: CONFIG.isDemoMode,
    provider: CONFIG.isDemoMode ? 'Demo / Mock' : 'Google Sheets',
  });
}
