import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import type { Wishlist, WishlistItem } from '@/types/product';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer ID for the user
    const customerResult = await query(
      'SELECT id FROM customers WHERE user_id = $1',
      [user.id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerId = customerResult.rows[0].id;

    // Get all wishlists for this customer
    const wishlistsQuery = `
      SELECT 
        w.id,
        w.name,
        w.description,
        w.is_public,
        w.share_token,
        w.created_at,
        w.updated_at,
        COUNT(cw.id) as item_count
      FROM wishlists w
      LEFT JOIN customer_wishlists cw ON w.id = cw.wishlist_id
      WHERE w.customer_id = $1
      GROUP BY w.id, w.name, w.description, w.is_public, w.share_token, w.created_at, w.updated_at
      ORDER BY w.updated_at DESC
    `;

    const wishlistsResult = await query(wishlistsQuery, [customerId]);

    const wishlists: Wishlist[] = await Promise.all(
      wishlistsResult.rows.map(async (wishlist: any) => {
        // Get items for this wishlist
        const itemsQuery = `
          SELECT 
            cw.id,
            cw.product_id,
            cw.added_at,
            cw.notes,
            cw.priority,
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
          FROM customer_wishlists cw
          JOIN products p ON cw.product_id = p.id
          WHERE cw.wishlist_id = $1
          ORDER BY cw.priority DESC, cw.added_at DESC
        `;

        const itemsResult = await query(itemsQuery, [wishlist.id]);

        const items: WishlistItem[] = await Promise.all(
          itemsResult.rows.map(async (item: any) => {
            // Get product images
            const imagesQuery = `
              SELECT 
                id,
                image_url as url,
                alt_text as alt,
                is_primary as "isPrimary"
              FROM product_images 
              WHERE product_id = $1 
              ORDER BY is_primary DESC, id ASC
              LIMIT 1
            `;
            const imagesResult = await query(imagesQuery, [item.product_id]);
            
            let images: any[] = [];
            if (item.main_image_url) {
              // Fallback to main_image_url from products table
              images = [
                {
                  id: 'main',
                  url: item.main_image_url,
                  alt: item.name,
                  isPrimary: true,
                },
              ];
            }
            else if (imagesResult.rows.length > 0 && imagesResult.rows[0].url) {
              const img = imagesResult.rows[0];
              images = [
                {
                  id: img.id,
                  url: img.url,
                  alt: img.alt || item.name,
                  isPrimary: img.isPrimary || false,
                },
              ];
            } 

            return {
              id: item.id,
              productId: item.product_id,
              userId: user.id,
              addedAt: item.added_at,
              notes: item.notes,
              product: {
                id: item.product_id,
                name: item.name,
                description: item.description,
                shortDescription: item.description?.substring(0, 100) || '',
                price: parseFloat(item.price),
                images,
                category: '',
                brand: '',
                sku: '',
                stockQuantity: parseInt(item.stock || '0'),
                stockStatus: 'in_stock', // Default status
                productType: item.product_type || '',
                collection: item.collection || '',
                material: item.material || '',
                color: item.color || '',
                dimensions: item.dimensions || '',
                weight: parseFloat(item.weight || '0'),
                warrantyInfo: item.warranty_info || '',
                careInstructions: item.care_instructions || '',
                mainImageUrl: item.main_image_url || '',
                isActive: item.is_active || false,
                isFeatured: item.featured || false,
                sortOrder: parseInt(item.sort_order || '0'),
                sfId: item.sf_id || '',
                createdAt: item.created_at,
                updatedAt: item.updated_at,
              },
            };
          })
        );

        return {
          id: wishlist.id.toString(),
          userId: user.id,
          name: wishlist.name,
          isPublic: wishlist.is_public,
          shareToken: wishlist.share_token,
          items,
          createdAt: wishlist.created_at,
          updatedAt: wishlist.updated_at,
        };
      })
    );

    return NextResponse.json({ wishlists });
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, isPublic = false } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Wishlist name is required' },
        { status: 400 }
      );
    }

    // Get customer ID for the user
    const customerResult = await query(
      'SELECT id FROM customers WHERE user_id = $1',
      [user.id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerId = customerResult.rows[0].id;

    // Check if wishlist name already exists for this customer
    const existingQuery = `
      SELECT id FROM wishlists 
      WHERE customer_id = $1 AND name = $2
      LIMIT 1
    `;
    const existingResult = await query(existingQuery, [customerId, name]);

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Wishlist name already exists' },
        { status: 400 }
      );
    }

    // Create new wishlist
    const createQuery = `
      INSERT INTO wishlists (customer_id, name, description, is_public, share_token)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, is_public, share_token, created_at, updated_at
    `;

    const shareToken = `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await query(createQuery, [
      customerId,
      name,
      description || null,
      isPublic,
      shareToken,
    ]);

    const wishlist = result.rows[0];

    return NextResponse.json({
      id: wishlist.id.toString(),
      userId: user.id,
      name: wishlist.name,
      description: wishlist.description,
      isPublic: wishlist.is_public,
      shareToken: wishlist.share_token,
      items: [],
      createdAt: wishlist.created_at,
      updatedAt: wishlist.updated_at,
    });
  } catch (error) {
    console.error('Error creating wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to create wishlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wishlistId = searchParams.get('id');

    if (!wishlistId) {
      return NextResponse.json(
        { error: 'Wishlist ID is required' },
        { status: 400 }
      );
    }

    // Get customer ID for the user
    const customerResult = await query(
      'SELECT id FROM customers WHERE user_id = $1',
      [user.id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerId = customerResult.rows[0].id;

    // Verify wishlist belongs to customer
    const wishlistQuery = `
      SELECT id FROM wishlists 
      WHERE id = $1 AND customer_id = $2
    `;
    const wishlistResult = await query(wishlistQuery, [parseInt(wishlistId), customerId]);

    if (wishlistResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Wishlist not found or access denied' },
        { status: 404 }
      );
    }

    // Delete all items from customer_wishlists first (due to foreign key constraints)
    await query(
      'DELETE FROM customer_wishlists WHERE wishlist_id = $1',
      [parseInt(wishlistId)]
    );

    // Delete the wishlist
    const deleteQuery = `
      DELETE FROM wishlists 
      WHERE id = $1 AND customer_id = $2
    `;

    const result = await query(deleteQuery, [parseInt(wishlistId), customerId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete wishlist' },
      { status: 500 }
    );
  }
}
