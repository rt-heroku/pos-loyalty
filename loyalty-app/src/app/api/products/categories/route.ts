import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get unique categories from products table
    const result = await query(`
      SELECT DISTINCT category
      FROM products 
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `);

    const categories = result.rows.map((row: any) => row.category);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
