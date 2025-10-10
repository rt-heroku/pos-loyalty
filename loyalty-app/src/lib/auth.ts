import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export interface AuthenticatedUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  points?: number;
  totalSpent?: string;
  visitCount?: number;
  tier?: string;
  memberStatus?: string;
  enrollmentDate?: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

// Verify JWT token and get user data
export async function verifyToken(
  token: string
): Promise<AuthenticatedUser | null> {
  try {
    // Verify JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
// console.log('verifyToken -> Payload: ', payload);
    // Get user data with role name from roles table
    const userResult = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, r.name as role, u.phone, u.is_active
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1 AND u.is_active = true`,
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];

    // Get additional user data based on role
    let additionalData = {};

    if (user.role === 'customer') {
      const customerResult = await query(
        `SELECT c.points, c.total_spent, c.visit_count, c.customer_tier, c.member_status, c.enrollment_date
         FROM customers c
         WHERE c.user_id = $1`,
        [user.id]
      );

      if (customerResult.rows.length > 0) {
        const customer = customerResult.rows[0];
        additionalData = {
          points: customer.points,
          totalSpent: customer.total_spent,
          visitCount: customer.visit_count,
          tier: customer.customer_tier,
          memberStatus: customer.member_status,
          enrollmentDate: customer.enrollment_date,
        };
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      ...additionalData,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Middleware for protected routes
export async function authMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = await verifyToken(token);
  if (!user) {
    // Clear invalid token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
    return response;
  }

  return null; // Continue to protected route
}

// Middleware for role-based access
export async function roleMiddleware(
  request: NextRequest,
  allowedRoles: string[]
): Promise<NextResponse | null> {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = await verifyToken(token);
  if (!user) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
    return response;
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return null; // Continue to protected route
}

// Get user from request (for API routes)
export async function getUserFromRequest(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

// Check if user has required permissions
export function hasPermission(
  user: AuthenticatedUser,
  requiredRole: string
): boolean {
  const roleHierarchy = {
    customer: 1,
    staff: 2,
    manager: 3,
    admin: 4,
  };

  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel =
    roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Validate CSRF token
export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}
