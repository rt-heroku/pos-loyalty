import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { z } from 'zod';

const notificationSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
  marketing: z.boolean(),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = notificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { marketing } = validation.data;
    const clientIp =
      request.headers.get('x-forwarded-for') || request.ip || 'unknown';

    // Update notification preferences in customers table
    await query(
      `UPDATE customers 
       SET marketing_consent = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [marketing, user.id]
    );

    // Log the notification settings update
    await query(
      `INSERT INTO user_activity_log (user_id, activity_type, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        'notification_update',
        'Notification preferences updated',
        clientIp,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
