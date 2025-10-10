import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get trending searches - for now, return popular product names
    // In a real app, this would be based on actual search analytics
    const result = await query(`
      SELECT name, COUNT(*) as search_count
      FROM products 
      WHERE name IS NOT NULL AND name != ''
      GROUP BY name
      ORDER BY search_count DESC, name ASC
      LIMIT 10
    `);

    const trendingSearches = result.rows.map((row: any) => row.name);

    return NextResponse.json({ trendingSearches });
  } catch (error) {
    console.error('Error fetching trending searches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending searches' },
      { status: 500 }
    );
  }
}
