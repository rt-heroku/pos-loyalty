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
      type,
      priority,
      title,
      description,
      customerNotes,
      estimatedCost,
      estimatedCompletion,
    } = body;

    // Validate required fields
    if (!storeId || !type || !priority || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the work order
    const insertSql = `
      INSERT INTO work_orders (
        user_id,
        store_id,
        service_id,
        type,
        priority,
        status,
        title,
        description,
        customer_notes,
        estimated_cost,
        estimated_completion,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id
    `;

    const result = await query(insertSql, [
      userId,
      storeId,
      serviceId || null,
      type,
      priority,
      'submitted',
      title,
      description,
      customerNotes || null,
      estimatedCost || null,
      estimatedCompletion || null,
    ]);

    const workOrderId = result.rows[0].id;

    return NextResponse.json({
      success: true,
      workOrderId,
      message: 'Work order submitted successfully',
    });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json(
      { error: 'Failed to create work order' },
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
    const type = searchParams.get('type');

    let sql = `
      SELECT 
        w.id,
        w.user_id as "userId",
        w.store_id as "storeId",
        w.service_id as "serviceId",
        w.type,
        w.priority,
        w.status,
        w.title,
        w.description,
        w.customer_notes as "customerNotes",
        w.technician_notes as "technicianNotes",
        w.estimated_cost as "estimatedCost",
        w.actual_cost as "actualCost",
        w.estimated_completion as "estimatedCompletion",
        w.actual_completion as "actualCompletion",
        w.assigned_technician as "assignedTechnician",
        w.customer_signature as "customerSignature",
        w.created_at as "createdAt",
        w.updated_at as "updatedAt",
        s.name as "serviceName",
        s.description as "serviceDescription",
        st.name as "storeName",
        st.address as "storeAddress",
        st.city as "storeCity",
        st.state as "storeState"
      FROM work_orders w
      LEFT JOIN store_services s ON w.service_id = s.id
      LEFT JOIN store_locations st ON w.store_id = st.id
      WHERE w.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND w.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (storeId) {
      sql += ` AND w.store_id = $${paramIndex}`;
      params.push(storeId);
      paramIndex++;
    }

    if (type) {
      sql += ` AND w.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    sql += ` ORDER BY w.created_at DESC`;

    const result = await query(sql, params);

    // Transform the results to match our interface
    const workOrders = result.rows.map((row: any) => ({
      id: row.id,
      userId: parseInt(row.userId),
      storeId: row.storeId,
      serviceId: row.serviceId,
      type: row.type,
      priority: row.priority,
      status: row.status,
      title: row.title,
      description: row.description,
      customerNotes: row.customerNotes,
      technicianNotes: row.technicianNotes,
      estimatedCost: row.estimatedCost
        ? parseFloat(row.estimatedCost)
        : undefined,
      actualCost: row.actualCost ? parseFloat(row.actualCost) : undefined,
      estimatedCompletion: row.estimatedCompletion,
      actualCompletion: row.actualCompletion,
      assignedTechnician: row.assignedTechnician,
      customerSignature: row.customerSignature,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      service: row.serviceId
        ? {
            id: row.serviceId,
            name: row.serviceName,
            description: row.serviceDescription,
            duration: 0,
            price: 0,
            category: '',
            currency: 'USD',
            isAvailable: true,
            storeId: row.storeId,
            requiresAppointment: true,
            images: [],
          }
        : undefined,
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
      images: [],
      attachments: [],
    }));

    return NextResponse.json({ workOrders });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    );
  }
}
