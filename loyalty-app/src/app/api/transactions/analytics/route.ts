import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('User ID: ', user.id);
    // Get customer ID
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

    // Get basic analytics
    const basicStatsResult = await query(
      `SELECT 
        COALESCE(SUM(total), 0) as total_spent,
        COUNT(*) as total_transactions,
        COALESCE(AVG(total), 0) as average_order_value,
        COALESCE(SUM(points_earned), 0) as total_points_earned,
        COALESCE(SUM(points_redeemed), 0) as total_points_redeemed
       FROM transactions 
       WHERE customer_id = $1`,
      [customerId]
    );

    const stats = basicStatsResult.rows[0];

    // Get spending by month (last 12 months)
    const monthlySpendingResult = await query(
      `SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COALESCE(SUM(total), 0) as amount
       FROM transactions 
       WHERE customer_id = $1 
       AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ORDER BY month DESC`,
      [customerId]
    );

    // Get spending by category (based on product categories)
    const categorySpendingResult = await query(
      `SELECT 
        COALESCE(p.category, 'Other') as category,
        COALESCE(SUM(ti.subtotal), 0) as amount
       FROM transaction_items ti
       JOIN transactions t ON ti.transaction_id = t.id
       LEFT JOIN products p ON ti.product_id = p.id
       WHERE t.customer_id = $1
       GROUP BY p.category
       ORDER BY amount DESC
       LIMIT 10`,
      [customerId]
    );

    // Get top products
    const topProductsResult = await query(
      `SELECT 
        ti.product_name,
        SUM(ti.quantity) as total_quantity
       FROM transaction_items ti
       JOIN transactions t ON ti.transaction_id = t.id
       WHERE t.customer_id = $1
       GROUP BY ti.product_name
       ORDER BY total_quantity DESC
       LIMIT 10`,
      [customerId]
    );

    // Calculate loyalty savings (estimated based on points redeemed)
    const loyaltySavings = parseFloat(stats.total_points_redeemed) * 0.01; // Assuming 1 point = $0.01

    // Get year-over-year comparison
    const currentYearResult = await query(
      `SELECT COALESCE(SUM(total), 0) as current_year_spending
       FROM transactions 
       WHERE customer_id = $1 
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`,
      [customerId]
    );

    const previousYearResult = await query(
      `SELECT COALESCE(SUM(total), 0) as previous_year_spending
       FROM transactions 
       WHERE customer_id = $1 
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()) - 1`,
      [customerId]
    );

    const currentYearSpending = parseFloat(
      currentYearResult.rows[0].current_year_spending
    );
    const previousYearSpending = parseFloat(
      previousYearResult.rows[0].previous_year_spending
    );
    const yearOverYearChange =
      previousYearSpending > 0
        ? ((currentYearSpending - previousYearSpending) /
            previousYearSpending) *
          100
        : 0;

    return NextResponse.json({
      totalSpent: parseFloat(stats.total_spent),
      totalTransactions: parseInt(stats.total_transactions),
      averageOrderValue: parseFloat(stats.average_order_value),
      totalPointsEarned: parseInt(stats.total_points_earned),
      totalPointsRedeemed: parseInt(stats.total_points_redeemed),
      savingsFromLoyalty: loyaltySavings,
      spendingByMonth: monthlySpendingResult.rows.map(row => ({
        month: row.month,
        amount: parseFloat(row.amount),
      })),
      spendingByCategory: categorySpendingResult.rows.map(row => ({
        category: row.category,
        amount: parseFloat(row.amount),
      })),
      topProducts: topProductsResult.rows.map(row => ({
        name: row.product_name,
        quantity: parseInt(row.total_quantity),
      })),
      yearOverYearChange: Math.round(yearOverYearChange * 100) / 100,
      currentYearSpending,
      previousYearSpending,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
