import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { z } from 'zod';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Rate limiting store (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const clientIp =
      request.headers.get('x-forwarded-for') || request.ip || 'unknown';

    // Rate limiting check
    const now = Date.now();
    const attempts = loginAttempts.get(clientIp) || {
      count: 0,
      lastAttempt: 0,
    };

    if (attempts.count >= 5 && now - attempts.lastAttempt < 15 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Reset attempts if 15 minutes have passed
    if (now - attempts.lastAttempt > 15 * 60 * 1000) {
      attempts.count = 0;
    }

    // Find user by email with role information
    const userResult = await query(
      `SELECT u.id, u.email, u.password_hash, u.is_active, u.last_login, r.name as role_name
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      attempts.count++;
      attempts.lastAttempt = now;
      loginAttempts.set(clientIp, attempts);

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      attempts.count++;
      attempts.lastAttempt = now;
      loginAttempts.set(clientIp, attempts);

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    loginAttempts.delete(clientIp);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role_name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Log successful login (if user_activity_log table exists)
    try {
      await query(
        `INSERT INTO user_activity_log (user_id, activity_type, description, ip_address)
         VALUES ($1, $2, $3, $4)`,
        [user.id, 'login', 'User logged in successfully', clientIp]
      );
    } catch (error) {
      // Don't fail login if activity logging fails
      console.log('Activity logging not available:', (error as Error).message);
    }

    // Get full user data for response
    const fullUserResult = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.is_active,
              c.points, c.total_spent, c.visit_count, c.customer_tier, c.member_status, c.enrollment_date
       FROM users u
       LEFT JOIN customers c ON u.id = c.user_id
       WHERE u.id = $1`,
      [user.id]
    );

    const fullUser = fullUserResult.rows[0];

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.first_name,
        lastName: fullUser.last_name,
        role: fullUser.role,
        phone: fullUser.phone,
        points: fullUser.points,
        totalSpent: fullUser.total_spent,
        visitCount: fullUser.visit_count,
        tier: fullUser.customer_tier,
        memberStatus: fullUser.member_status,
        enrollmentDate: fullUser.enrollment_date,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
