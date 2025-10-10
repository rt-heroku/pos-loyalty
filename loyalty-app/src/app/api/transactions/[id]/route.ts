import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactionId = parseInt(params.id);
    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
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

    // Get transaction details with location information
    const transactionResult = await query(
      `SELECT t.id, t.total, t.points_earned, t.points_redeemed, t.created_at, t.payment_method,
              l.store_name, l.store_code, l.address_line1, l.city, l.state
       FROM transactions t
       LEFT JOIN locations l ON t.location_id = l.id
       WHERE t.id = $1 AND t.customer_id = $2`,
      [transactionId, customerId]
    );

    if (transactionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const transaction = transactionResult.rows[0];
    console.log('Transaction details with location:', transaction);

    // Get transaction items
    const itemsResult = await query(
      `SELECT ti.id, ti.product_name, ti.product_price, ti.quantity, ti.subtotal
       FROM transaction_items ti
       WHERE ti.transaction_id = $1
       ORDER BY ti.id`,
      [transactionId]
    );

    // Get transaction vouchers
    const vouchersResult = await query(
      `SELECT 
        tv.id,
        tv.applied_amount,
        tv.discount_amount,
        cv.voucher_code,
        cv.name as voucher_name,
        cv.voucher_type,
        cv.face_value,
        cv.discount_percent,
        cv.image_url,
        cv.description
       FROM transaction_vouchers tv
       JOIN customer_vouchers cv ON tv.voucher_id = cv.id
       WHERE tv.transaction_id = $1
       ORDER BY tv.id`,
      [transactionId]
    );

    return NextResponse.json({
      transaction: {
        ...transaction,
        items: itemsResult.rows,
        vouchers: vouchersResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
