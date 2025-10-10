import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get unique brands from products table
    const result = await query(`
      SELECT DISTINCT brand
      FROM products 
      WHERE brand IS NOT NULL AND brand != ''
      ORDER BY brand
    `);

    const brands = result.rows.map((row: any) => row.brand);

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
