import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data
    const userDataResult = await query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.is_active, u.created_at, u.updated_at,
              c.loyalty_number, c.points, c.total_spent, c.visit_count, c.customer_tier, c.member_status, c.enrollment_date,
              c.marketing_consent
       FROM users u
       LEFT JOIN customers c ON u.id = c.user_id
       WHERE u.id = $1`,
      [user.id]
    );

    // Fetch transactions
    const transactionsResult = await query(
      `SELECT t.id, t.total, t.points_earned, t.points_redeemed, t.payment_method, t.created_at
       FROM transactions t
       JOIN customers c ON t.customer_id = c.id
       WHERE c.user_id = $1
       ORDER BY t.created_at DESC`,
      [user.id]
    );

    // Fetch activity logs
    const activityLogsResult = await query(
      `SELECT activity_type, description, created_at, ip_address
       FROM user_activity_log
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    // Fetch addresses
    const addressesResult = await query(
      `SELECT address_type, first_name, last_name, address_line1, city, state, zip_code, country, phone, email
       FROM customer_addresses ca
       JOIN customers c ON ca.customer_id = c.id
       WHERE c.user_id = $1`,
      [user.id]
    );

    const exportData = {
      exportDate: new Date().toISOString(),
      user: userDataResult.rows[0] || {},
      transactions: transactionsResult.rows || [],
      activityLogs: activityLogsResult.rows || [],
      addresses: addressesResult.rows || [],
    };

    // Log the data export
    await query(
      `INSERT INTO user_activity_log (user_id, activity_type, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        'data_export',
        'User data exported',
        request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      ]
    );

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="loyalty-data.json"',
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
