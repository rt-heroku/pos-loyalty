import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
export const dynamic = 'force-dynamic';

import { getBackendUrl } from '@/lib/backend';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('order_number');
    const backendUrl = getBackendUrl();

    // If order_number is provided, fetch that specific order (no auth required for confirmation page)
    if (orderNumber) {
      console.log('[Orders API] Fetching order by number:', orderNumber);
      const url = `${backendUrl}/api/orders?search=${orderNumber}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('[Orders API] Backend returned error:', response.status);
        throw new Error(`Backend returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[Orders API] Found orders:', data.length);
      
      return NextResponse.json(data);
    }

    // Otherwise, fetch orders for authenticated customer using JWT
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      console.log('[Orders API] No auth-token cookie found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await verifyToken(authToken.value);
    
    if (!user) {
      console.log('[Orders API] Invalid or expired token');
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    console.log('[Orders API] Authenticated user:', user.id, user.email);

    // Get the customer_id from the customers table using user_id
    const customerResult = await query(
      'SELECT id FROM customers WHERE user_id = $1',
      [user.id]
    );

    if (customerResult.rows.length === 0) {
      console.log('[Orders API] No customer record found for user:', user.id);
      return NextResponse.json([]);
    }

    const customerId = customerResult.rows[0].id;
    console.log('[Orders API] Found customer_id:', customerId, 'for user_id:', user.id);

    // Fetch ALL online orders for this customer (both shop and mobile origins)
    // We exclude POS orders by only showing orders with origin that's NOT 'pos'
    // Backend already sorts by order_date DESC
    const url = `${backendUrl}/api/orders?customer_id=${customerId}`;
    
    console.log('[Orders API] Fetching all online orders for customer_id:', customerId);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('[Orders API] Backend returned error:', response.status);
      throw new Error(`Backend returned ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[Orders API] Found orders:', data.length);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Orders API] Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
