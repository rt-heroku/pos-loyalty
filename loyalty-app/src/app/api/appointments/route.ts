import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const body = await request.json();

    const {
      storeId,
      serviceId,
      date,
      time,
      notes,
      estimatedDuration,
      totalCost,
    } = body;

    // Validate required fields
    if (!storeId || !serviceId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the time slot is available
    const availabilityCheck = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE store_id = $1 
        AND date = $2 
        AND time = $3 
        AND status NOT IN ('cancelled', 'no_show')
    `,
      [storeId, date, time]
    );

    if (parseInt(availabilityCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Time slot not available' },
        { status: 409 }
      );
    }

    // Create the appointment
    const insertSql = `
      INSERT INTO appointments (
        user_id,
        store_id,
        service_id,
        date,
        time,
        status,
        notes,
        estimated_duration,
        total_cost,
        payment_status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id
    `;

    const result = await query(insertSql, [
      userId,
      storeId,
      serviceId,
      date,
      time,
      'scheduled',
      notes || null,
      estimatedDuration,
      totalCost,
      'pending',
    ]);

    const appointmentId = result.rows[0].id;

    return NextResponse.json({
      success: true,
      appointmentId,
      message: 'Appointment scheduled successfully',
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const storeId = searchParams.get('storeId');

    let sql = `
      SELECT 
        a.id,
        a.user_id as "userId",
        a.store_id as "storeId",
        a.service_id as "serviceId",
        a.date,
        a.time,
        a.status,
        a.notes,
        a.estimated_duration as "estimatedDuration",
        a.actual_duration as "actualDuration",
        a.total_cost as "totalCost",
        a.payment_status as "paymentStatus",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        s.name as "serviceName",
        s.description as "serviceDescription",
        s.duration as "serviceDuration",
        s.price as "servicePrice",
        st.name as "storeName",
        st.address as "storeAddress",
        st.city as "storeCity",
        st.state as "storeState"
      FROM appointments a
      LEFT JOIN store_services s ON a.service_id = s.id
      LEFT JOIN store_locations st ON a.store_id = st.id
      WHERE a.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (storeId) {
      sql += ` AND a.store_id = $${paramIndex}`;
      params.push(storeId);
      paramIndex++;
    }

    sql += ` ORDER BY a.date DESC, a.time DESC`;

    const result = await query(sql, params);

    // Transform the results to match our interface
    const appointments = result.rows.map((row: any) => ({
      id: row.id,
      userId: parseInt(row.userId),
      storeId: row.storeId,
      serviceId: row.serviceId,
      date: row.date,
      time: row.time,
      status: row.status,
      notes: row.notes,
      estimatedDuration: parseInt(row.estimatedDuration),
      actualDuration: row.actualDuration
        ? parseInt(row.actualDuration)
        : undefined,
      totalCost: parseFloat(row.totalCost),
      paymentStatus: row.paymentStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      service: {
        id: row.serviceId,
        name: row.serviceName,
        description: row.serviceDescription,
        duration: parseInt(row.serviceDuration),
        price: parseFloat(row.servicePrice),
        category: '',
        currency: 'USD',
        isAvailable: true,
        storeId: row.storeId,
        requiresAppointment: true,
        images: [],
      },
      store: {
        id: row.storeId,
        name: row.storeName,
        address: row.storeAddress,
        city: row.storeCity,
        state: row.storeState,
        zipCode: '',
        country: 'US',
        latitude: 0,
        longitude: 0,
        phone: '',
        email: '',
        hours: {} as any,
        services: [],
        amenities: [],
        isOpen: true,
        rating: 0,
        reviewCount: 0,
        featured: false,
        images: [],
        description: '',
        createdAt: '',
        updatedAt: '',
      },
    }));

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
