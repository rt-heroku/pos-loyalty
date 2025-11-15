import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/mulesoft/members/sync
 * Proxy to backend Express API to sync members from MuleSoft Loyalty Cloud
 * This avoids CORS issues by routing through the backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Next.js API] Proxying members/sync request to backend with loyaltyProgramId:', body.loyaltyProgramId);

    // Forward the request to the Express backend
    const backendResponse = await fetchBackend('/api/mulesoft/members/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`[Next.js API] Backend responded with status ${backendResponse.status}:`, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: `Backend error: ${backendResponse.statusText}` };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log(`[Next.js API] Successfully synced members:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Next.js API] Error proxying members/sync request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

