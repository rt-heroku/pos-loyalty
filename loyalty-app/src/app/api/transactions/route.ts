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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const paymentMethod = searchParams.get('paymentMethod');

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
      console.log('No customer found for user:', { userId: user.id, email: user.email });
      return NextResponse.json({ 
        transactions: [], 
        total: 0,
        page: 1,
        limit,
        totalPages: 0 
      });
    }

    const customerId = customerResult.rows[0].id;
    console.log('Found customer ID:', customerId);

    // Build WHERE conditions
    const whereConditions = ['t.customer_id = $1'];
    const queryParams = [customerId];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(t.id::text ILIKE $${paramIndex} OR t.payment_method ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex += 1;
    }

    if (dateFrom) {
      whereConditions.push(`t.created_at >= $${paramIndex}`);
      queryParams.push(dateFrom);
      paramIndex += 1;
    }

    if (dateTo) {
      whereConditions.push(`t.created_at <= $${paramIndex}`);
      queryParams.push(dateTo);
      paramIndex += 1;
    }

    if (minAmount) {
      whereConditions.push(`t.total >= $${paramIndex}`);
      queryParams.push(parseFloat(minAmount));
      paramIndex += 1;
    }

    if (maxAmount) {
      whereConditions.push(`t.total <= $${paramIndex}`);
      queryParams.push(parseFloat(maxAmount));
      paramIndex += 1;
    }

    if (paymentMethod) {
      whereConditions.push(`t.payment_method = $${paramIndex}`);
      queryParams.push(paymentMethod);
      paramIndex += 1;
    }

    const whereClause = whereConditions.join(' AND ');

    // Fetch transactions with pagination and filters
    const transactionsResult = await query(
      `SELECT t.id, t.total, t.points_earned, t.points_redeemed, t.created_at, t.payment_method
       FROM transactions t
       WHERE ${whereClause}
       ORDER BY t.created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    // Get total count with same filters
    const countResult = await query(
      `SELECT COUNT(*) as total FROM transactions t WHERE ${whereClause}`,
      queryParams
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
