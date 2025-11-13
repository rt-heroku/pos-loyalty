import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { z } from 'zod';
import { getSystemSetting } from '@/lib/system-settings';

// Validation schema for registration
const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().optional(),
    marketingConsent: z.boolean().default(false),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, phone } = validation.data;
    const clientIp =
      request.headers.get('x-forwarded-for') || request.ip || 'unknown';

    // Check if user already exists in users table
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'User already exists',
          redirectTo: '/forgot-password',
          message:
            'An account with this email already exists. Please use the forgot password feature to reset your password.',
        },
        { status: 409 }
      );
    }

    // Check if email exists in customers table
    const existingCustomer = await query(
      'SELECT id, user_id FROM customers WHERE email = $1',
      [email]
    );

    // Hash password using PostgreSQL function (same as POS)
    const passwordHashResult = await query(
      'SELECT hash_password($1) as hash',
      [password]
    );
    const passwordHash = passwordHashResult.rows[0].hash;

    try {
      // Create user
      const userResult = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, marketing_consent, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING id, email, first_name, last_name, role`,
        [
          email,
          passwordHash,
          firstName,
          lastName,
          phone || null,
          'customer', // Default role for new registrations
          true,
          validation.data.marketingConsent,
        ]
      );

      const user = userResult.rows[0];

      console.log('User created:', user);
      console.log('existingCustomer.rows.length', existingCustomer.rows.length);
      // If customer exists, update the user_id; otherwise create new customer record
      if (existingCustomer.rows.length > 0) {
        console.log(`✅ Updating existing customer (ID: ${existingCustomer.rows[0].id}) with new user_id: ${user.id}`);
        // Update existing customer with new user_id
        const updateResult = await query(
          `UPDATE customers 
           SET user_id = $1, 
               first_name = $2,
               last_name = $3,
               name = $4, 
               phone = $5, 
               marketing_consent = $6,
               updated_at = NOW()
           WHERE email = $7
           RETURNING id, user_id, email`,
          [
            user.id,
            firstName,
            lastName,
            `${firstName} ${lastName}`,
            phone || null,
            validation.data.marketingConsent,
            email,
          ]
        );
        
        if (updateResult.rows.length > 0) {
          console.log('✅ Customer updated successfully:', updateResult.rows[0]);
          console.log('ℹ️  Existing customer - MuleSoft sync not needed (already synced when created in POS)');
        } else {
          console.error('❌ Customer update failed - no rows returned');
        }
      } else {
        console.log('Creating new customer record');
        // Create new customer record
        await query(
          `INSERT INTO customers (user_id, loyalty_number, first_name, last_name, name, email, phone, points, total_spent, visit_count, created_at, updated_at, marketing_consent, member_status, enrollment_date, member_type, customer_tier)
           VALUES ($1, generate_loyalty_number(), $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10, $11, NOW(), $12, $13)`,
          [
            user.id,
            firstName,
            lastName,
            `${firstName} ${lastName}`,
            email,
            phone || null,
            0, // Starting points
            '0.00', // Starting total spent
            0, // Starting visit count
            validation.data.marketingConsent,
            'Active',
            'Individual',
            'Bronze', // Starting tier
          ]
        );

        // Sync new customer with MuleSoft Loyalty Cloud
        try {
          console.log('Syncing new customer with MuleSoft');

          // Get the MuleSoft endpoint from system settings (same as POS)
          const mulesoftEndpoint = await getSystemSetting(
            'mulesoft_loyalty_sync_endpoint'
          );

          if (mulesoftEndpoint) {
            // Get the complete customer data for sync
            const customerSyncData = await query(
              `SELECT c.id, u.first_name, u.last_name, c.name, c.loyalty_number, c.enrollment_date,
                      get_system_setting('loyalty_program_id') as sf_loyalty_program_id, c.sf_id,
                      c.address_line1, c.address_line2, c.city, c.state, c.zip_code,
                      c.phone, u.email, c.date_of_birth
              FROM users u, customers c
              WHERE u.id = c.user_id AND u.id = $1`,
              [user.id]
            );

            if (customerSyncData.rows.length > 0) {
              const customerData = customerSyncData.rows[0];

              // Format dates to yyyy-MM-dd (same as POS)
              const formatDate = (date: any) => {
                if (!date) return null;
                if (date instanceof Date) {
                  return date.toISOString().split('T')[0];
                }
                // If it's already a string, try to parse and format
                return new Date(date).toISOString().split('T')[0];
              };

              const syncPayload = {
                id: customerData.id,
                first_name: customerData.first_name,
                last_name: customerData.last_name,
                name: customerData.name,
                loyalty_number: customerData.loyalty_number,
                enrollment_date: formatDate(customerData.enrollment_date),
                sf_loyalty_program_id: customerData.sf_loyalty_program_id,
                sf_id: customerData.sf_id,
                address_line1: customerData.address_line1,
                address_line2: customerData.address_line2,
                city: customerData.city,
                state: customerData.state,
                zip_code: customerData.zip_code,
                phone: customerData.phone,
                email: customerData.email,
                date_of_birth: formatDate(customerData.date_of_birth),
              };

              console.log('Calling MuleSoft at:', `${mulesoftEndpoint}/member/create`);

              // Fire-and-forget: trigger MuleSoft API call asynchronously (same as POS)
              (async () => {
                try {
                  const syncResponse = await fetch(
                    `${mulesoftEndpoint}/member/create`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(syncPayload),
                    }
                  );

                  if (syncResponse.ok) {
                    console.log('✅ New customer successfully synced with MuleSoft');
                  } else {
                    console.error(
                      '❌ MuleSoft sync failed:',
                      syncResponse.status,
                      syncResponse.statusText
                    );
                  }
                } catch (err) {
                  console.error('❌ MuleSoft sync error:', err);
                }
              })();
            }
          }
        } catch (syncError) {
          console.error(
            'Error syncing new customer with MuleSoft:',
            syncError
          );
          // Don't fail the registration if sync fails
        }
      }
      console.log('Logging registration activity');

      // Log registration activity
      await query(
        `INSERT INTO user_activity_log (user_id, activity_type, description, ip_address)
         VALUES ($1, $2, $3, $4)`,
        [user.id, 'registration', 'User registered successfully', clientIp]
      );
      console.log('Registration activity logged');
      
      // Generate JWT token (same as login)
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      // Get full user data with customer information
      const fullUserResult = await query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.is_active,
                c.points, c.total_spent, c.visit_count, c.customer_tier, c.member_status, c.enrollment_date
         FROM users u
         LEFT JOIN customers c ON u.id = c.user_id
         WHERE u.id = $1`,
        [user.id]
      );
      
      const fullUser = fullUserResult.rows[0];
      
      // Create response with auth cookie
      const response = NextResponse.json({
        success: true,
        message: 'Registration successful',
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
      
      // Set HTTP-only auth cookie (same as login)
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
      
      console.log('Registration successful - user is now logged in');
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
