import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Check if initial setup is required
 * Returns setupRequired: true if no users exist in the system
 */
export async function GET() {
  try {
    // Check if any users exist
    const result = await query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(result.rows[0].count);

    return NextResponse.json({
      setupRequired: userCount === 0,
      userCount,
    });
  } catch (error) {
    console.error('Error checking setup status:', error);
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}

