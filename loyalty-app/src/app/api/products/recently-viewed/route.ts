import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { RecentlyViewedProduct } from '@/types/product';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recently viewed products
    const recentQuery = `
      SELECT 
        pv.product_id,
        pv.viewed_at,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.product_type,
        p.collection,
        p.material,
        p.color,
        p.dimensions,
        p.weight,
        p.warranty_info,
        p.care_instructions,
        p.main_image_url,
        p.is_active,
        p.featured,
        p.sort_order,
        p.sf_id,
        p.created_at,
        p.updated_at
      FROM product_views pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.user_id = $1
      ORDER BY pv.viewed_at DESC
      LIMIT 12
    `;

    const recentResult = await query(recentQuery, [user.id]);

    const recentlyViewed: RecentlyViewedProduct[] = await Promise.all(
      recentResult.rows.map(async (row: any) => {
        // Get product image
        const imageQuery = `
          SELECT 
            id,
            url,
            alt_text as alt,
            is_primary as "isPrimary",
            thumbnail_url as "thumbnailUrl"
          FROM product_images 
          WHERE product_id = $1 
          ORDER BY is_primary DESC, id ASC
          LIMIT 1
        `;
        const imageResult = await query(imageQuery, [row.product_id]);

        return {
          productId: row.product_id,
          viewedAt: row.viewed_at,
          product: {
            id: row.product_id,
            name: row.name,
            description: row.description,
            price: parseFloat(row.price),
            images:
              imageResult.rows.length > 0
                ? [
                    {
                      id: imageResult.rows[0].id,
                      url: imageResult.rows[0].url,
                      alt: imageResult.rows[0].alt || row.name,
                      isPrimary: imageResult.rows[0].isPrimary || false,
                      thumbnailUrl:
                        imageResult.rows[0].thumbnailUrl ||
                        imageResult.rows[0].url,
                    },
                  ]
                : [],
            category: '',
            brand: '',
            sku: '',
            stockQuantity: parseInt(row.stock || '0'),
            stockStatus: 'in_stock', // Default status
            productType: row.product_type || '',
            collection: row.collection || '',
            material: row.material || '',
            color: row.color || '',
            dimensions: row.dimensions || '',
            weight: parseFloat(row.weight || '0'),
            warrantyInfo: row.warranty_info || '',
            careInstructions: row.care_instructions || '',
            mainImageUrl: row.main_image_url || '',
            isActive: row.is_active || false,
            isFeatured: row.featured || false,
            sortOrder: parseInt(row.sort_order || '0'),
            sfId: row.sf_id || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          },
        };
      })
    );

    return NextResponse.json({ recentlyViewed });
  } catch (error) {
    console.error('Error fetching recently viewed products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recently viewed products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const productQuery = `
      SELECT id FROM products WHERE id = $1
    `;
    const productResult = await query(productQuery, [productId]);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Insert or update product view
    const upsertQuery = `
      INSERT INTO product_views (user_id, product_id, viewed_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, product_id) 
      DO UPDATE SET viewed_at = NOW()
    `;

    await query(upsertQuery, [user.id, productId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking product view:', error);
    return NextResponse.json(
      { error: 'Failed to track product view' },
      { status: 500 }
    );
  }
}
