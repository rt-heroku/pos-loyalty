import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().min(5, 'ZIP code is required'),
    country: z.string().default('USA'),
  }),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, address } = validation.data;
    const clientIp =
      request.headers.get('x-forwarded-for') || request.ip || 'unknown';

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, user.id]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email address is already in use' },
          { status: 409 }
        );
      }
    }

    // Update user information
    await query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3, updated_at = NOW()
       WHERE id = $4`,
      [firstName, lastName, email, user.id]
    );

    // Update customer information
    await query(
      `UPDATE customers 
       SET name = $1, email = $2, phone = $3, updated_at = NOW()
       WHERE user_id = $4`,
      [`${firstName} ${lastName}`, email, phone || null, user.id]
    );

    // Update or create address
    await query(
      `INSERT INTO customer_addresses (customer_id, address_type, is_default, first_name, last_name, address_line1, city, state, zip_code, country, phone, email)
       VALUES (
         (SELECT id FROM customers WHERE user_id = $1),
         'shipping',
         true,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         $8,
         $9,
         $10
       )
       ON CONFLICT (customer_id, address_type, is_default)
       DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         address_line1 = EXCLUDED.address_line1,
         city = EXCLUDED.city,
         state = EXCLUDED.state,
         zip_code = EXCLUDED.zip_code,
         country = EXCLUDED.country,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         updated_at = NOW()`,
      [
        user.id,
        firstName,
        lastName,
        address.street,
        address.city,
        address.state,
        address.zipCode,
        address.country,
        phone || null,
        email,
      ]
    );

    // Log the profile update
    await query(
      `INSERT INTO user_activity_log (user_id, activity_type, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'profile_update', 'Profile information updated', clientIp]
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
