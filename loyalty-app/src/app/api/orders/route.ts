import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
export const dynamic = 'force-dynamic';

import { getBackendUrl } from '@/lib/backend';

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

    // Otherwise, fetch orders for authenticated customer
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userCookie.value);
    const customerId = user.id || user.customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID not found' },
        { status: 400 }
      );
    }

    // Fetch ALL online orders for this customer (both shop and mobile origins)
    // We exclude POS orders by only showing orders with origin that's NOT 'pos'
    // Backend already sorts by order_date DESC
    const url = `${backendUrl}/api/orders?customer_id=${customerId}`;
    
    console.log('[Orders API] Fetching all online orders for customer:', customerId);
    
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
