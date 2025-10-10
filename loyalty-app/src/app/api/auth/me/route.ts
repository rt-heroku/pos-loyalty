import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
      // Verify JWT token
      const payload = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
      
      // Get complete user data from database
      const userResult = await query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.phone, r.name as role_name,
                c.points, c.total_spent, c.visit_count, c.customer_tier, c.member_status, c.enrollment_date
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         LEFT JOIN customers c ON u.id = c.user_id
         WHERE u.id = $1 AND u.is_active = true`,
        [payload.userId]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const user = userResult.rows[0];

      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role_name || 'customer',
        phone: user.phone,
        points: user.points,
        totalSpent: user.total_spent,
        visitCount: user.visit_count,
        tier: user.customer_tier || 'Bronze',
        memberStatus: user.member_status,
        enrollmentDate: user.enrollment_date,
        isAuthenticated: true,
      };

      return NextResponse.json({ user: userData });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
