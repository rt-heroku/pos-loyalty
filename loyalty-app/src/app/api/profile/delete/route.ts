import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientIp =
      request.headers.get('x-forwarded-for') || request.ip || 'unknown';

    // Log the account deletion request
    await query(
      `INSERT INTO user_activity_log (user_id, activity_type, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'account_deletion', 'Account deletion requested', clientIp]
    );

    // Deactivate user account (soft delete)
    await query(
      `UPDATE users 
       SET is_active = false, updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    // Deactivate customer account
    await query(
      `UPDATE customers 
       SET member_status = 'Inactive', updated_at = NOW()
       WHERE user_id = $1`,
      [user.id]
    );

    // Invalidate all active sessions
    await query(
      `UPDATE user_sessions 
       SET is_active = false, updated_at = NOW()
       WHERE user_id = $1`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
