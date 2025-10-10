import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storeId = params.id;

    // Fetch services for the specific store
    const sql = `
      SELECT 
        s.id,
        s.name,
        s.description,
        s.category,
        s.duration,
        s.price,
        s.currency,
        s.is_available as "isAvailable",
        s.store_id as "storeId",
        s.requires_appointment as "requiresAppointment",
        s.max_capacity as "maxCapacity",
        s.requirements,
        s.created_at as "createdAt",
        s.updated_at as "updatedAt"
      FROM store_services s
      WHERE s.store_id = $1 AND s.is_available = true
      ORDER BY s.category, s.name
    `;

    const result = await query(sql, [storeId]);

    // Transform the results to match our interface
    const services = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      duration: parseInt(row.duration),
      price: parseFloat(row.price),
      currency: row.currency,
      isAvailable: row.isAvailable,
      storeId: row.storeId,
      requiresAppointment: row.requiresAppointment,
      maxCapacity: row.maxCapacity,
      requirements: row.requirements ? row.requirements.split(',') : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      images: ['/api/services/default-service-image.jpg'], // Placeholder
    }));

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching store services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store services' },
      { status: 500 }
    );
  }
}
