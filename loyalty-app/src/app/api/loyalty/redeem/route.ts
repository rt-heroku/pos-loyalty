import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { z } from 'zod';

const redeemSchema = z.object({
  rewardId: z.number().positive('Invalid reward ID'),
  quantity: z.number().positive('Quantity must be positive').default(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = redeemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { rewardId, quantity } = validation.data;
    const clientIp =
      request.headers.get('x-forwarded-for') || request.ip || 'unknown';

    // Get customer data
    const customerResult = await query(
      'SELECT id, points, customer_tier FROM customers WHERE user_id = $1',
      [user.id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customerResult.rows[0];

    // Get reward details
    const rewardResult = await query(
      `SELECT * FROM loyalty_rewards 
       WHERE id = $1 AND is_active = true 
       AND (tier_restriction IS NULL OR tier_restriction = $2)
       AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)`,
      [rewardId, customer.customer_tier]
    );

    if (rewardResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reward not found or not available' },
        { status: 404 }
      );
    }

    const reward = rewardResult.rows[0];

    // Check if reward is available
    if (
      reward.max_redemptions &&
      reward.current_redemptions >= reward.max_redemptions
    ) {
      return NextResponse.json(
        { error: 'Reward is no longer available' },
        { status: 400 }
      );
    }

    // Calculate total points needed
    const totalPointsNeeded = reward.points_required * quantity;

    // Check if customer has enough points
    if (customer.points < totalPointsNeeded) {
      return NextResponse.json(
        {
          error: 'Insufficient points',
          required: totalPointsNeeded,
          available: customer.points,
        },
        { status: 400 }
      );
    }

    // Calculate reward value
    let rewardValue = 0;
    if (reward.reward_type === 'discount') {
      if (reward.discount_percentage) {
        rewardValue = reward.discount_percentage;
      } else if (reward.discount_amount) {
        rewardValue = reward.discount_amount;
      }
    }

    try {
      // Start transaction
      await query('BEGIN');

      // Deduct points from customer
      await query(
        'UPDATE customers SET points = points - $1, updated_at = NOW() WHERE id = $2',
        [totalPointsNeeded, customer.id]
      );

      // Create customer reward record
      const customerRewardResult = await query(
        `INSERT INTO customer_rewards 
         (customer_id, reward_id, points_spent, reward_value, status, earned_at, expires_at)
         VALUES ($1, $2, $3, $4, 'active', NOW(), NOW() + INTERVAL '1 year')
         RETURNING id`,
        [customer.id, rewardId, totalPointsNeeded, rewardValue]
      );

      // Update reward redemption count
      await query(
        'UPDATE loyalty_rewards SET current_redemptions = current_redemptions + $1 WHERE id = $2',
        [quantity, rewardId]
      );

      // Log the redemption
      await query(
        `INSERT INTO user_activity_log (user_id, activity_type, description, ip_address)
         VALUES ($1, $2, $3, $4)`,
        [
          user.id,
          'points_redemption',
          `Redeemed ${quantity}x ${reward.reward_name} for ${totalPointsNeeded} points`,
          clientIp,
        ]
      );

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Reward redeemed successfully',
        redemptionId: customerRewardResult.rows[0].id,
        pointsSpent: totalPointsNeeded,
        rewardValue,
        newBalance: customer.points - totalPointsNeeded,
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Redemption error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
