import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

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
        console.log('Updating existing customer with new user_id');
        // Update existing customer with new user_id
        await query(
          `UPDATE customers 
           SET user_id = $1, 
               name = $2, 
               phone = $3, 
               marketing_consent = $4,
               updated_at = NOW()
           WHERE email = $5`,
          [
            user.id,
            `${firstName} ${lastName}`,
            phone || null,
            validation.data.marketingConsent,
            email,
          ]
        );

        //if customer exists, pull loyalty member from Loyalty cloud.

        // Sync customer with external system
      } else {
        console.log('Creating new customer record');
        // Create new customer record
        await query(
          `INSERT INTO customers (user_id, loyalty_number, name, email, phone, points, total_spent, visit_count, created_at, updated_at, marketing_consent, member_status, enrollment_date, member_type, customer_tier)
           VALUES ($1, generate_loyalty_number(), $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9, NOW(), $10, $11)`,
          [
            user.id,
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

        //if customer doesn't exists, create loyalty member.

        // Sync customer with external system
        try {
          console.log('Syncing user with external system');

          // Get the integration endpoint and loyalty program ID from system settings
          const integrationEndpoint = await getSystemSetting(
            'integration_endpoint'
          );
          //        const loyaltyProgramId = await getSystemSetting('loyalty_program_id');

          if (integrationEndpoint) {
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

              const syncPayload = {
                id: customerData.id,
                first_name: customerData.first_name,
                last_name: customerData.last_name,
                name: customerData.name,
                loyalty_number: customerData.loyalty_number,
                enrollment_date: customerData.enrollment_date,
                sf_loyalty_program_id: customerData.sf_loyalty_program_id,
                sf_id: customerData.sf_id,
                address_line1: customerData.address_line1,
                address_line2: customerData.address_line2,
                city: customerData.city,
                state: customerData.state,
                zip_code: customerData.zip_code,
                phone: customerData.phone,
                email: customerData.email,
                date_of_birth: customerData.date_of_birth,
              };

              const syncResponse = await fetch(
                `${integrationEndpoint}/member/create`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(syncPayload),
                }
              );

              if (syncResponse.ok) {
                console.log('User successfully synced with Loyalty Cloud');
              } else {
                console.error(
                  'Failed to sync user with Loyalty Cloud, check MuleSoft logs for more details:',
                  syncResponse.statusText
                );
              }
            }
          }
        } catch (syncError) {
          console.error(
            'Error syncing user with Loyalty Cloud, check MuleSoft logs for more details:',
            syncError
          );
          // Don't fail the registration if sync fails
          // TODO: Add message to Q to be processed later
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
      return NextResponse.json({
        success: true,
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
      });
      console.log('Registration successful');
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
