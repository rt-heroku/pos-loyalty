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

    // Get customer data
    const customerResult = await query(
      `SELECT c.id, c.points, c.total_spent, c.customer_tier, c.member_status, c.enrollment_date
       FROM customers c
       WHERE c.user_id = $1`,
      [user.id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customerResult.rows[0];

    // Get points history from transactions
    const pointsHistoryResult = await query(
      `SELECT 
        t.id,
        t.total,
        t.points_earned,
        t.points_redeemed,
        t.created_at,
        'transaction' as type,
        'Purchase' as description
       FROM transactions t
       WHERE t.customer_id = $1 AND (t.points_earned > 0 OR t.points_redeemed > 0)
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [customer.id, limit, offset]
    );

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM transactions t
       WHERE t.customer_id = $1 AND (t.points_earned > 0 OR t.points_redeemed > 0)`,
      [customer.id]
    );

    const total = parseInt(countResult.rows[0].total);

    // Calculate points statistics
    const statsResult = await query(
      `SELECT 
        COALESCE(SUM(points_earned), 0) as total_earned,
        COALESCE(SUM(points_redeemed), 0) as total_redeemed,
        COUNT(*) as total_transactions
       FROM transactions t
       WHERE t.customer_id = $1`,
      [customer.id]
    );

    const stats = statsResult.rows[0];

    return NextResponse.json({
      currentBalance: customer.points,
      totalEarned: parseInt(stats.total_earned),
      totalRedeemed: parseInt(stats.total_redeemed),
      totalTransactions: parseInt(stats.total_transactions),
      tier: customer.customer_tier,
      memberStatus: customer.member_status,
      enrollmentDate: customer.enrollment_date,
      history: pointsHistoryResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching points data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
