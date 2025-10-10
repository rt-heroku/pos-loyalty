import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const clientIp =
      request.headers.get('x-forwarded-for') || request.ip || 'unknown';

    if (token) {
      try {
        // Decode JWT to get user ID for logging
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Log logout activity (if user_activity_log table exists)
        try {
          await query(
            `INSERT INTO user_activity_log (user_id, activity_type, description, ip_address)
             VALUES ($1, $2, $3, $4)`,
            [payload.userId, 'logout', 'User logged out', clientIp]
          );
        } catch (logError) {
          // Don't fail logout if logging fails
          console.log(
            'Activity logging not available:',
            (logError as Error).message
          );
        }
      } catch (jwtError) {
        // Invalid token, just continue with logout
        console.log(
          'Invalid token during logout:',
          (jwtError as Error).message
        );
      }
    }

    // Clear cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
