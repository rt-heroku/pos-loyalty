import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const setupSchema = z.object({
  // User fields
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  
  // Customer fields
  companyName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('US'),
});

export async function POST(request: NextRequest) {
  try {
    // Check if setup is still required
    const userCountResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userCountResult.rows[0].count);

    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Setup has already been completed' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = setupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      companyName,
      address,
      city,
      state,
      zipCode,
      country,
    } = validation.data;

    // Get admin role ID
    const roleResult = await query(
      "SELECT id FROM roles WHERE name = 'admin' OR name = 'Admin' LIMIT 1"
    );

    if (roleResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Admin role not found in database' },
        { status: 500 }
      );
    }

    const adminRoleId = roleResult.rows[0].id;

    // Hash password using database function (bcrypt)
    const passwordHashResult = await query(
      'SELECT hash_password($1) as hash',
      [password]
    );
    const passwordHash = passwordHashResult.rows[0].hash;

    // Create user
    const userResult = await query(
      `INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        phone, role_id, role, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, username, email, first_name, last_name, role`,
      [
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        phone || null,
        adminRoleId,
        'admin',
        true,
      ]
    );

    const user = userResult.rows[0];

    // Generate loyalty number
    const loyaltyResult = await query('SELECT generate_loyalty_number() as number');
    const loyaltyNumber = loyaltyResult.rows[0].number;

    // Create customer record
    await query(
      `INSERT INTO customers (
        user_id, loyalty_number, first_name, last_name, name, 
        email, phone, points, total_spent, visit_count, 
        is_active, member_status, enrollment_date, member_type, 
        customer_tier, tier_calculation_number, status,
        address_line1, city, state, zip_code, country,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, 
        $6, $7, 0, 0.00, 0,
        true, 'Active', NOW(), 'Individual',
        'Bronze', 0.00, 'Created',
        $8, $9, $10, $11, $12,
        NOW(), NOW()
      )`,
      [
        user.id,
        loyaltyNumber,
        firstName,
        lastName,
        `${firstName} ${lastName}`,
        email,
        phone || null,
        address || null,
        city || null,
        state || null,
        zipCode || null,
        country,
      ]
    );

    // Update system settings if company name provided
    if (companyName) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description)
         VALUES ('company_name', $1, 'general', 'Company name displayed on receipts and reports')
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
        [companyName]
      );
    }

    console.log(`✅ Setup complete! Admin user created: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Setup completed successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during setup:', error);
    return NextResponse.json(
      { 
        error: 'Setup failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

