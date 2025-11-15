import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
  
  // Location fields (Step 3)
  locationId: z.number().optional(),
  createNewLocation: z.boolean().default(false),
  storeCode: z.string().optional(),
  storeName: z.string().optional(),
  locationAddress: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationZipCode: z.string().optional(),
  taxRate: z.string().optional(),
  locationLogo: z.string().optional(),
  
  // MuleSoft fields (Step 5)
  mulesoftEndpoint: z.string().optional(),
  
  // Loyalty Data fields (Step 6)
  loyaltyProgramId: z.string().optional(),
  journalTypeId: z.string().optional(),
  journalSubtypeId: z.string().optional(),
  enrollmentJournalSubtypeId: z.string().optional(),
  loadMembers: z.boolean().optional(),
  loadProducts: z.boolean().optional(),
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

    console.log('🚀 Starting setup transaction...');
    console.log('📝 Step 3 data:', {
      createNewLocation: validation.data.createNewLocation,
      locationId: validation.data.locationId,
      storeName: validation.data.storeName,
      storeCode: validation.data.storeCode,
    });

    // Start a transaction - all or nothing
    await query('BEGIN');

    try {
      // Get admin role ID
      const roleResult = await query(
        "SELECT id FROM roles WHERE name = 'admin' OR name = 'Admin' LIMIT 1"
      );

      if (roleResult.rows.length === 0) {
        throw new Error('Admin role not found in database');
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
      console.log(`✅ Created user: ${user.email} (ID: ${user.id})`);

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
      console.log(`✅ Created customer with loyalty number: ${loyaltyNumber}`);

      // Update system settings if company name provided
      if (companyName) {
        await query(
          `INSERT INTO system_settings (setting_key, setting_value, category, description)
           VALUES ('company_name', $1, 'general', 'Company name displayed on receipts and reports')
           ON CONFLICT (setting_key) 
           DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
          [companyName]
        );
        console.log(`✅ Saved company name: ${companyName}`);
      }

      // Handle location setup (Step 3)
      let currentLocationId = validation.data.locationId;
      
      if (validation.data.createNewLocation) {
        console.log('📍 Creating new location...');
        // Create new location
        const locationResult = await query(
          `INSERT INTO locations (
            store_code, store_name, brand, address_line1, city, state, zip_code,
            tax_rate, logo_base64, is_active, created_at, updated_at, created_by_user
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW(), $10)
          RETURNING id, store_code, store_name`,
          [
            validation.data.storeCode || 'MAIN',
            validation.data.storeName || companyName || 'Main Location',
            companyName || 'My Business',
            validation.data.locationAddress || null,
            validation.data.locationCity || null,
            validation.data.locationState || null,
            validation.data.locationZipCode || null,
            validation.data.taxRate ? parseFloat(validation.data.taxRate) : 0.00,
            validation.data.locationLogo || null,
            user.id,
          ]
        );
        currentLocationId = locationResult.rows[0].id;
        console.log(`✅ Created location: "${locationResult.rows[0].store_name}" (Code: ${locationResult.rows[0].store_code}, ID: ${currentLocationId})`);
      } else if (currentLocationId) {
        console.log(`✅ Using existing location ID: ${currentLocationId}`);
      } else {
        console.log('⚠️  No location created or selected');
      }
      
      // Store current location in system settings
      if (currentLocationId) {
        await query(
          `INSERT INTO system_settings (setting_key, setting_value, category, description)
           VALUES ('current_location_id', $1, 'general', 'Currently active location for POS')
           ON CONFLICT (setting_key) 
           DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
          [currentLocationId.toString()]
        );
        console.log(`✅ Set current_location_id in system_settings: ${currentLocationId}`);
      }
    
    // Save MuleSoft endpoint if provided
    if (validation.data.mulesoftEndpoint) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description)
         VALUES ('mulesoft_loyalty_sync_endpoint', $1, 'integration', 'MuleSoft Loyalty Sync API endpoint')
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
        [validation.data.mulesoftEndpoint]
      );
      console.log(`✅ Saved MuleSoft endpoint: ${validation.data.mulesoftEndpoint}`);
    }

    // Save loyalty program configuration if provided (Step 6)
    if (validation.data.loyaltyProgramId) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description)
         VALUES ('loyalty_program_id', $1, 'loyalty', 'Selected Loyalty Program ID from MuleSoft')
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
        [validation.data.loyaltyProgramId]
      );
      console.log(`✅ Saved Loyalty Program ID: ${validation.data.loyaltyProgramId}`);
    }

    if (validation.data.journalTypeId) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description)
         VALUES ('journal_type_id', $1, 'loyalty', 'Selected Journal Type ID from MuleSoft')
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
        [validation.data.journalTypeId]
      );
      console.log(`✅ Saved Journal Type ID: ${validation.data.journalTypeId}`);
    }

    if (validation.data.journalSubtypeId) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description)
         VALUES ('journal_subtype_id', $1, 'loyalty', 'Selected Transaction Journal Subtype ID from MuleSoft')
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
        [validation.data.journalSubtypeId]
      );
      console.log(`✅ Saved Transaction Journal Subtype ID: ${validation.data.journalSubtypeId}`);
    }

    if (validation.data.enrollmentJournalSubtypeId) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description)
         VALUES ('enrollment_journal_subtype_id', $1, 'loyalty', 'Selected Enrollment Journal Subtype ID from MuleSoft')
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
        [validation.data.enrollmentJournalSubtypeId]
      );
      console.log(`✅ Saved Enrollment Journal Subtype ID: ${validation.data.enrollmentJournalSubtypeId}`);
    }

      // Commit the transaction
      await query('COMMIT');
      console.log(`✅ Transaction committed! Setup complete! Admin user created: ${email}`);

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
    } catch (txError) {
      // Rollback the transaction on error
      await query('ROLLBACK');
      console.error('❌ Transaction rolled back due to error:', txError);
      throw txError; // Re-throw to outer catch
    }
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

