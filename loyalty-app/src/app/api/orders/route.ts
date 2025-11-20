import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
export const dynamic = 'force-dynamic';

import { getBackendUrl } from '@/lib/backend';

export async function GET() {
  try {
    // Get user from cookies
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

    // Fetch orders from backend for this customer with origin=shop
    // Backend already sorts by order_date DESC
    const backendUrl = getBackendUrl();
    const url = `${backendUrl}/api/orders?customer_id=${customerId}&origin=shop`;
    
    console.log('[Orders API] Fetching orders from:', url);
    
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
