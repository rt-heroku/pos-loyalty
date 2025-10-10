import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer tier
    const customerResult = await query(
      'SELECT customer_tier FROM customers WHERE user_id = $1',
      [user.id]
    );

    const customerTier = customerResult.rows[0]?.customer_tier || 'Bronze';

    // Get available rewards
    const rewardsResult = await query(
      `SELECT 
        id,
        reward_name,
        reward_type,
        points_required,
        discount_percentage,
        discount_amount,
        description,
        terms_conditions,
        valid_from,
        valid_until,
        max_redemptions,
        current_redemptions,
        tier_restriction,
        is_active
       FROM loyalty_rewards 
       WHERE is_active = true 
       AND (tier_restriction IS NULL OR tier_restriction = $1)
       AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
       ORDER BY points_required ASC`,
      [customerTier]
    );

    // Get user's redeemed rewards
    const redeemedRewardsResult = await query(
      `SELECT reward_id, earned_at, status
       FROM customer_rewards cr
       JOIN customers c ON cr.customer_id = c.id
       WHERE c.user_id = $1
       ORDER BY earned_at DESC`,
      [user.id]
    );

    const rewards = rewardsResult.rows.map(reward => {
      const isAvailable =
        reward.max_redemptions === null ||
        reward.current_redemptions < reward.max_redemptions;

      return {
        ...reward,
        isAvailable,
        remainingRedemptions: reward.max_redemptions
          ? reward.max_redemptions - reward.current_redemptions
          : null,
      };
    });

    return NextResponse.json({
      rewards,
      redeemedRewards: redeemedRewardsResult.rows,
      customerTier,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
