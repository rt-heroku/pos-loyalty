import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get customer ID - try both user_id and email approaches
    let customerResult;
    
    // First try with user_id (more reliable)
    customerResult = await query(
      'SELECT id FROM customers WHERE user_id = $1',
      [user.id]
    );

    // If not found, try with email (fallback)
    if (customerResult.rows.length === 0) {
      customerResult = await query(
        'SELECT id FROM customers WHERE email = $1',
        [user.email]
      );
    }

    if (customerResult.rows.length === 0) {
      return NextResponse.json({ transactions: [], total: 0 });
    }

    const customerId = customerResult.rows[0].id;

    // Fetch transactions with pagination
    const transactionsResult = await query(
      `SELECT id, total, points_earned, points_redeemed, created_at, payment_method
       FROM transactions 
       WHERE customer_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM transactions WHERE customer_id = $1',
      [customerId]
    );

    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      transactions: transactionsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
