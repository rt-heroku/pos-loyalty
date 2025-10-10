import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get all transactions
    const transactionsResult = await query(
      `SELECT 
        t.id,
        t.total,
        t.points_earned,
        t.points_redeemed,
        t.created_at,
        t.payment_method
       FROM transactions t
       WHERE t.customer_id = $1
       ORDER BY t.created_at DESC`,
      [customerId]
    );

    // Create CSV content
    const csvHeaders = [
      'Transaction ID',
      'Date',
      'Total Amount',
      'Points Earned',
      'Points Redeemed',
      'Payment Method',
    ];

    const csvRows = transactionsResult.rows.map(row => [
      row.id,
      new Date(row.created_at).toLocaleDateString(),
      row.total,
      row.points_earned,
      row.points_redeemed,
      row.payment_method,
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(',')),
    ].join('\n');

    // Log the export
    await query(
      `INSERT INTO user_activity_log (user_id, activity_type, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        'data_export',
        'Transactions exported to CSV',
        request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      ]
    );

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="transactions.csv"',
      },
    });
  } catch (error) {
    console.error('Error exporting transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
