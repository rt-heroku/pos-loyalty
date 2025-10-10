import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!searchQuery.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get search suggestions from products
    const suggestionsQuery = `
      SELECT DISTINCT
        p.name,
        p.category,
        p.brand
      FROM products p
      WHERE 
        p.name ILIKE $1 
        OR p.description ILIKE $1 
        OR p.category ILIKE $1 
        OR p.brand ILIKE $1
      ORDER BY 
        CASE 
          WHEN p.name ILIKE $1 THEN 1
          WHEN p.category ILIKE $1 THEN 2
          WHEN p.brand ILIKE $1 THEN 3
          ELSE 4
        END,
        p.name
      LIMIT $3
    `;

    const result = await query(suggestionsQuery, [
      `%${searchQuery}%`,
      `[${searchQuery}]`,
      limit,
    ]);

    // Transform suggestions
    const suggestions = result.rows.map((row: any) => ({
      text: row.name,
      type: 'product',
      category: row.category,
      brand: row.brand,
    }));

    // Get trending searches (most viewed products in last 30 days)
    const trendingQuery = `
      SELECT 
        p.name,
        p.category,
        COUNT(*) as view_count
      FROM product_views pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.viewed_at >= NOW() - INTERVAL '30 days'
      GROUP BY p.id, p.name, p.category
      ORDER BY view_count DESC
      LIMIT 5
    `;

    let trendingSearches: any[] = [];
    try {
      const trendingResult = await query(trendingQuery);
      trendingSearches = trendingResult.rows.map((row: any) => ({
        text: row.name,
        type: 'trending',
        category: row.category,
        viewCount: parseInt(row.view_count),
      }));
    } catch (error) {
      // Product views table might not exist yet, ignore
      console.log('Product views table not available');
    }

    // Get popular categories
    const categoriesQuery = `
      SELECT 
        category,
        COUNT(*) as product_count
      FROM products
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY product_count DESC
      LIMIT 5
    `;

    const categoriesResult = await query(categoriesQuery);
    const popularCategories = categoriesResult.rows.map((row: any) => ({
      text: row.category,
      type: 'category',
      productCount: parseInt(row.product_count),
    }));

    return NextResponse.json({
      suggestions,
      trendingSearches,
      popularCategories,
    });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
