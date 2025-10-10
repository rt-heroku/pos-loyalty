import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    // Get categories
    const categoriesQuery = `
      SELECT 
        category,
        COUNT(*) as product_count
      FROM products
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY product_count DESC
    `;
    const categoriesResult = await query(categoriesQuery);

    // Get brands
    const brandsQuery = `
      SELECT 
        brand,
        COUNT(*) as product_count
      FROM products
      WHERE brand IS NOT NULL
      GROUP BY brand
      ORDER BY product_count DESC
    `;
    const brandsResult = await query(brandsQuery);

    // Get price range
    const priceRangeQuery = `
      SELECT 
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM products
      WHERE price IS NOT NULL
    `;
    const priceRangeResult = await query(priceRangeQuery);

    // Get stock status options (based on stock quantity)
    const stockStatusQuery = `
      SELECT 
        CASE 
          WHEN stock > 0 THEN 'in_stock'
          WHEN stock <= 0 THEN 'out_of_stock'
          ELSE 'unknown'
        END as stock_status,
        COUNT(*) as product_count
      FROM products
      WHERE stock IS NOT NULL
      GROUP BY 
        CASE 
          WHEN stock > 0 THEN 'in_stock'
          WHEN stock <= 0 THEN 'out_of_stock'
          ELSE 'unknown'
        END
      ORDER BY product_count DESC
    `;
    const stockStatusResult = await query(stockStatusQuery);

    // Get feature counts (only featured exists in database)
    const featureCountsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE featured = true) as featured_count
      FROM products
    `;
    const featureCountsResult = await query(featureCountsQuery);

    const filters = {
      categories: categoriesResult.rows.map((row: any) => ({
        value: row.category,
        label: row.category,
        count: parseInt(row.product_count),
      })),
      brands: brandsResult.rows.map((row: any) => ({
        value: row.brand,
        label: row.brand,
        count: parseInt(row.product_count),
      })),
      priceRange: {
        min: priceRangeResult.rows[0]?.min_price
          ? parseFloat(priceRangeResult.rows[0].min_price)
          : 0,
        max: priceRangeResult.rows[0]?.max_price
          ? parseFloat(priceRangeResult.rows[0].max_price)
          : 1000,
      },
      stockStatus: stockStatusResult.rows.map((row: any) => ({
        value: row.stock_status,
        label: row.stock_status
          .replace('_', ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase()),
        count: parseInt(row.product_count),
      })),
      features: {
        featured: parseInt(featureCountsResult.rows[0]?.featured_count || '0'),
      },
    };

    return NextResponse.json(filters);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
