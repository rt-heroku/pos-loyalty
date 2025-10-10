import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    // Get price range
    const priceRangeQuery = `
      SELECT 
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM products
      WHERE price IS NOT NULL
    `;
    const priceRangeResult = await query(priceRangeQuery);

    const priceRange = {
      min: priceRangeResult.rows[0]?.min_price
        ? parseFloat(priceRangeResult.rows[0].min_price)
        : 0,
      max: priceRangeResult.rows[0]?.max_price
        ? parseFloat(priceRangeResult.rows[0].max_price)
        : 1000,
    };

    return NextResponse.json({ priceRange });
  } catch (error) {
    console.error('Error fetching price range:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price range' },
      { status: 500 }
    );
  }
}
