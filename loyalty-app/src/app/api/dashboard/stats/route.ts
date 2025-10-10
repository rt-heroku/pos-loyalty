import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer data
    const customerResult = await query(
      `SELECT 
        points, 
        total_spent, 
        visit_count, 
        created_at as member_since,
        customer_tier
       FROM customers 
       WHERE email = $1`,
      [user.email]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customerResult.rows[0];

    // Get spending trend (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentSpendingResult = await query(
      `SELECT COALESCE(SUM(total), 0) as recent_total
       FROM transactions t
       JOIN customers c ON t.customer_id = c.id
       WHERE c.email = $1 AND t.created_at >= $2`,
      [user.email, thirtyDaysAgo.toISOString()]
    );

    const previousSpendingResult = await query(
      `SELECT COALESCE(SUM(total), 0) as previous_total
       FROM transactions t
       JOIN customers c ON t.customer_id = c.id
       WHERE c.email = $1 AND t.created_at >= $2 AND t.created_at < $3`,
      [user.email, sixtyDaysAgo.toISOString(), thirtyDaysAgo.toISOString()]
    );

    const recentTotal = parseFloat(recentSpendingResult.rows[0].recent_total);
    const previousTotal = parseFloat(
      previousSpendingResult.rows[0].previous_total
    );

    let spendingTrend = 0;
    if (previousTotal > 0) {
      spendingTrend = ((recentTotal - previousTotal) / previousTotal) * 100;
    }

    // Get favorite products (most purchased)
    const favoriteProductsResult = await query(
      `SELECT p.name, COUNT(*) as purchase_count
       FROM transaction_items ti
       JOIN transactions t ON ti.transaction_id = t.id
       JOIN customers c ON t.customer_id = c.id
       JOIN products p ON ti.product_id = p.id
       WHERE c.email = $1
       GROUP BY p.id, p.name
       ORDER BY purchase_count DESC
       LIMIT 5`,
      [user.email]
    );

    const favoriteProducts = favoriteProductsResult.rows.map(row => row.name);

    return NextResponse.json({
      totalSpent: customer.total_spent,
      visitCount: customer.visit_count,
      memberSince: customer.member_since,
      favoriteProducts,
      spendingTrend: Math.round(spendingTrend * 100) / 100, // Round to 2 decimal places
      tier: customer.customer_tier,
      points: customer.points,
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
