import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer profile with all fields
    const customerResult = await query(
      `SELECT 
        c.id,
        c.loyalty_number,
        c.first_name,
        c.last_name,
        c.name,
        c.email,
        c.phone,
        c.points,
        c.total_spent,
        c.visit_count,
        c.last_visit,
        c.notes,
        (c.member_status = 'Active') as is_active,
        c.preferred_contact,
        c.date_of_birth,
        c.address_line1,
        c.address_line2,
        c.city,
        c.state,
        c.zip_code,
        c.country,
        c.marketing_consent,
        c.member_status,
        c.enrollment_date,
        c.member_type,
        c.sf_id,
        c.customer_tier,
        c.tier_calculation_number,
        c.created_at,
        c.updated_at
      FROM customers c
      WHERE c.user_id = $1`,
      [user.id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const customer = customerResult.rows[0];

    // Get customer avatar separately
    const avatarResult = await query(
      'SELECT image_data, filename, file_size, width, height FROM customer_images WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1',
      [customer.id]
    );

    const avatar = avatarResult.rows.length > 0 ? avatarResult.rows[0] : null;
    
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        loyalty_number: customer.loyalty_number,
        first_name: customer.first_name,
        last_name: customer.last_name,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        points: customer.points,
        total_spent: customer.total_spent,
        visit_count: customer.visit_count,
        last_visit: customer.last_visit,
        notes: customer.notes,
        is_active: customer.is_active,
        preferred_contact: customer.preferred_contact,
        date_of_birth: customer.date_of_birth,
        address_line1: customer.address_line1,
        address_line2: customer.address_line2,
        city: customer.city,
        state: customer.state,
        zip_code: customer.zip_code,
        country: customer.country,
        marketing_consent: customer.marketing_consent,
        member_status: customer.member_status,
        enrollment_date: customer.enrollment_date,
        member_type: customer.member_type,
        sf_id: customer.sf_id,
        customer_tier: customer.customer_tier,
        tier_calculation_number: customer.tier_calculation_number,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        avatar: avatar ? {
          image_data: avatar.image_data,
          filename: avatar.filename,
          file_size: avatar.file_size,
          width: avatar.width,
          height: avatar.height
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      first_name,
      last_name,
      phone,
      date_of_birth,
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      country,
      preferred_contact,
      marketing_consent
    } = await request.json();

    // Update customer profile
    const result = await query(
      `UPDATE customers SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        name = COALESCE(CONCAT($1, ' ', $2), name),
        phone = COALESCE($3, phone),
        date_of_birth = COALESCE($4, date_of_birth),
        address_line1 = COALESCE($5, address_line1),
        address_line2 = COALESCE($6, address_line2),
        city = COALESCE($7, city),
        state = COALESCE($8, state),
        zip_code = COALESCE($9, zip_code),
        country = COALESCE($10, country),
        preferred_contact = COALESCE($11, preferred_contact),
        marketing_consent = COALESCE($12, marketing_consent),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $13
      RETURNING id`,
      [
        first_name,
        last_name,
        phone,
        date_of_birth,
        address_line1,
        address_line2,
        city,
        state,
        zip_code,
        country,
        preferred_contact,
        marketing_consent,
        user.id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
