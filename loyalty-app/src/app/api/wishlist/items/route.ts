import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wishlistId, productId, notes } = await request.json();

    if (!wishlistId || !productId) {
      return NextResponse.json(
        { error: 'Wishlist ID and Product ID are required' },
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

    // Check if product already exists in this wishlist
    const existingQuery = `
      SELECT id FROM customer_wishlists 
      WHERE customer_id = $1 AND product_id = $2 AND wishlist_id = $3
    `;
    const existingResult = await query(existingQuery, [customerId, productId, wishlistId]);

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Product already exists in wishlist' },
        { status: 400 }
      );
    }

    // Add product to customer's wishlist
    const addQuery = `
      INSERT INTO customer_wishlists (customer_id, product_id, wishlist_id, notes, added_at, priority)
      VALUES ($1, $2, $3, $4, NOW(), 1)
      RETURNING id, added_at
    `;

    const result = await query(addQuery, [
      customerId,
      productId,
      parseInt(wishlistId),
      notes || null,
    ]);

    // Update wishlist updated_at timestamp
    await query('UPDATE wishlists SET updated_at = NOW() WHERE id = $1', [
      parseInt(wishlistId),
    ]);

    return NextResponse.json({
      id: result.rows[0].id,
      customerId,
      productId,
      wishlistName: wishlistId,
      notes: notes || null,
      addedAt: result.rows[0].added_at,
    });
  } catch (error) {
    console.error('Error adding product to wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to add product to wishlist' },
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
    const wishlistId = searchParams.get('wishlistId');
    const productId = searchParams.get('productId');

    if (!wishlistId || !productId) {
      return NextResponse.json(
        { error: 'Wishlist ID and Product ID are required' },
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

    // Remove product from customer's wishlist
    const deleteQuery = `
      DELETE FROM customer_wishlists 
      WHERE customer_id = $1 AND product_id = $2 AND wishlist_id = $3
    `;

    const result = await query(deleteQuery, [customerId, productId, parseInt(wishlistId)]);

    // Update wishlist updated_at timestamp
    await query('UPDATE wishlists SET updated_at = NOW() WHERE id = $1', [
      parseInt(wishlistId),
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Product not found in wishlist' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove product from wishlist' },
      { status: 500 }
    );
  }
}
