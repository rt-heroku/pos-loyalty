import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

// Validation schema for forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const clientIp =
      request.headers.get('x-forwarded-for') || request.ip || 'unknown';

    // Check if user exists
    const userResult = await query(
      'SELECT id, email, first_name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message:
          'If an account with that email exists, we have sent a password reset link.',
      });
    }

    const user = userResult.rows[0];

    // Generate reset token (in a real implementation, you'd use a secure token)
    const resetToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in database
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         token = EXCLUDED.token,
         expires_at = EXCLUDED.expires_at,
         created_at = NOW()`,
      [user.id, resetToken, expiresAt]
    );

    // Log password reset request
    await query(
      `INSERT INTO user_activity_log (user_id, activity_type, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'password_reset_request', 'Password reset requested', clientIp]
    );

    // In a real implementation, you would send an email here
    // For now, we'll just log the reset link (remove this in production)
    console.log(
      `Password reset link for ${email}: /reset-password?token=${resetToken}`
    );

    return NextResponse.json({
      success: true,
      message:
        'If an account with that email exists, we have sent a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
