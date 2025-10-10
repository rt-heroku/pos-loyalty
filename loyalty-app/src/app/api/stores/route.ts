import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const services = searchParams.get('services')?.split(',');
    const amenities = searchParams.get('amenities')?.split(',');

    const rating = searchParams.get('rating');
    const isOpen = searchParams.get('isOpen');
    const hasParking = searchParams.get('hasParking');
    const isWheelchairAccessible = searchParams.get('isWheelchairAccessible');
    const hasWifi = searchParams.get('hasWifi');

    // Build the base query
    let sql = `
      SELECT 
        s.id,
        s.name,
        s.address,
        s.city,
        s.state,
        s.zip_code as "zipCode",
        s.country,
        s.latitude,
        s.longitude,
        s.phone,
        s.email,
        s.website,
        s.description,
        s.manager,
        s.capacity,
        s.parking_available as "parkingAvailable",
        s.wheelchair_accessible as "wheelchairAccessible",
        s.wifi_available as "wifiAvailable",
        s.rating,
        s.review_count as "reviewCount",
        s.featured,
        s.created_at as "createdAt",
        s.updated_at as "updatedAt"
      FROM store_locations s
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Add service filter
    if (services && services.length > 0) {
      sql += ` AND EXISTS (
        SELECT 1 FROM store_services ss 
        WHERE ss.store_id = s.id 
        AND ss.service_name = ANY($${paramIndex})
      )`;
      params.push(services);
      paramIndex++;
    }

    // Add amenity filter
    if (amenities && amenities.length > 0) {
      const amenityConditions = amenities
        .map((_, index) => {
          if (index === 0) {
            return `s.parking_available = $${paramIndex}`;
          } else if (index === 1) {
            return `s.wheelchair_accessible = $${paramIndex}`;
          } else if (index === 2) {
            return `s.wifi_available = $${paramIndex}`;
          }
          return '';
        })
        .filter(Boolean);

      if (amenityConditions.length > 0) {
        sql += ` AND (${amenityConditions.join(' OR ')})`;
        params.push(...amenities.map(a => a === 'true'));
        paramIndex += amenityConditions.length;
      }
    }

    // Add rating filter
    if (rating) {
      sql += ` AND s.rating >= $${paramIndex}`;
      params.push(parseFloat(rating));
      paramIndex++;
    }

    // Add open/closed filter
    if (isOpen !== null) {
      sql += ` AND s.is_open = $${paramIndex}`;
      params.push(isOpen === 'true');
      paramIndex++;
    }

    // Add parking filter
    if (hasParking !== null) {
      sql += ` AND s.parking_available = $${paramIndex}`;
      params.push(hasParking === 'true');
      paramIndex++;
    }

    // Add accessibility filter
    if (isWheelchairAccessible !== null) {
      sql += ` AND s.wheelchair_accessible = $${paramIndex}`;
      params.push(isWheelchairAccessible === 'true');
      paramIndex++;
    }

    // Add WiFi filter
    if (hasWifi !== null) {
      sql += ` AND s.wifi_available = $${paramIndex}`;
      params.push(hasWifi === 'true');
      paramIndex++;
    }

    // Add ordering
    sql += ` ORDER BY s.featured DESC, s.rating DESC, s.name ASC`;

    const result = await query(sql, params);

    // Transform the results to match our interface
    const stores = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zipCode,
      country: row.country,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      phone: row.phone,
      email: row.email,
      website: row.website,
      description: row.description,
      manager: row.manager,
      capacity: row.capacity,
      parkingAvailable: row.parkingAvailable,
      wheelchairAccessible: row.wheelchairAccessible,
      wifiAvailable: row.wifiAvailable,
      rating: parseFloat(row.rating),
      reviewCount: parseInt(row.reviewCount),
      featured: row.featured,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      // Add default values for required fields
      hours: {
        monday: { open: '09:00', close: '17:00', isClosed: false },
        tuesday: { open: '09:00', close: '17:00', isClosed: false },
        wednesday: { open: '09:00', close: '17:00', isClosed: false },
        thursday: { open: '09:00', close: '17:00', isClosed: false },
        friday: { open: '09:00', close: '17:00', isClosed: false },
        saturday: { open: '10:00', close: '16:00', isClosed: false },
        sunday: { open: '10:00', close: '16:00', isClosed: false },
      },
      services: ['Repair', 'Maintenance', 'Installation', 'Consultation'],
      amenities: [
        row.parkingAvailable ? 'Parking' : null,
        row.wheelchairAccessible ? 'Wheelchair Accessible' : null,
        row.wifiAvailable ? 'WiFi' : null,
        'Restroom',
        'Waiting Area',
      ].filter(Boolean),
      isOpen: true, // This would need to be calculated based on current time and hours
      images: ['/api/stores/default-store-image.jpg'], // Placeholder
    }));

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}
