import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

import { getBackendUrl } from '@/lib/backend';

/**
 * GET /api/promotions
 * Fetch all active promotions or customer-specific promotions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loyaltyNumber = searchParams.get('loyalty_number');
    const backendUrl = getBackendUrl();

    // If loyalty number is provided, fetch customer-specific promotions
    if (loyaltyNumber) {
      console.log('[Promotions API] Fetching promotions for customer:', loyaltyNumber);
      
      const url = `${backendUrl}/api/loyalty/${loyaltyNumber}/promotions`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'Customer not found' },
            { status: 404 }
          );
        }
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      console.log('[Promotions API] Found customer promotions:', data.promotions?.length || 0);

      return NextResponse.json(data);
    }

    // Otherwise, fetch all active promotions (no authentication required for browsing)
    console.log('[Promotions API] Fetching all active promotions');
    
    const url = `${backendUrl}/api/promotions`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('[Promotions API] Backend returned error:', response.status);
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    console.log('[Promotions API] Found promotions:', data.total || data.promotions?.length || 0);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Promotions API] Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/promotions/enroll
 * Enroll a customer in a promotion
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { promotionId } = body;

    if (!promotionId) {
      return NextResponse.json(
        { error: 'Promotion ID required' },
        { status: 400 }
      );
    }

    const backendUrl = getBackendUrl();
    const url = `${backendUrl}/api/promotions/${promotionId}/enroll`;

    console.log('[Promotions API] Enrolling customer', customerId, 'in promotion', promotionId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('[Promotions API] Enrollment successful');

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Promotions API] Error enrolling in promotion:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in promotion' },
      { status: 500 }
    );
  }
}

