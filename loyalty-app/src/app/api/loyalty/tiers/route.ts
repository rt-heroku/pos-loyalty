import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';

export async function GET() {
  try {
    // Fetch all active tiers from database
    const result = await query(
      `SELECT 
        id,
        tier_name,
        tier_level,
        min_spending,
        min_visits,
        min_points,
        points_multiplier,
        benefits,
        tier_color,
        tier_icon,
        is_active
       FROM loyalty_tiers
       WHERE is_active = true
       ORDER BY tier_level ASC`,
      []
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching loyalty tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty tiers' },
      { status: 500 }
    );
  }
}

