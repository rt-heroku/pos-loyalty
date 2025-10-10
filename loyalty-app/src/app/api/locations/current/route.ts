import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // For now, get the first active location
    // In a real app, this would be based on user's current location or settings
    const result = await query(
      `SELECT 
        id,
        store_code,
        store_name,
        brand,
        logo_url,
        logo_base64,
        is_active
      FROM locations 
      WHERE is_active = true 
      ORDER BY id 
      LIMIT 1`
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No active locations found' 
      }, { status: 404 });
    }

    const location = result.rows[0];
    
    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        store_code: location.store_code,
        store_name: location.store_name,
        brand: location.brand,
        logo_url: location.logo_url,
        logo_base64: location.logo_base64,
        is_active: location.is_active
      }
    });
  } catch (error) {
    console.error('Error fetching current location:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch current location' 
    }, { status: 500 });
  }
}
