import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

/**
 * Fetch members from MuleSoft Loyalty Cloud
 * This endpoint proxies to the Express backend which handles the MuleSoft communication
 * 
 * This is Step 1 of the load members flow:
 * 1. GET /api/mulesoft/members - Fetch members from MuleSoft (this route)
 * 2. POST /api/mulesoft/members/sync - Sync members to database
 */
export async function GET(_request: NextRequest) {
  try {
    console.log('[Next.js API] Proxying members fetch request to backend');

    // Forward the request to the Express backend
    const backendResponse = await fetchBackend('/api/mulesoft/members', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`[Next.js API] Backend responded with status ${backendResponse.status}: ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Failed to fetch members', details: errorText };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const members = await backendResponse.json();
    console.log(`[Next.js API] Successfully fetched ${members.length || 0} members from MuleSoft`);
    
    return NextResponse.json(members);
  } catch (error) {
    console.error('[Next.js API] Error proxying members fetch:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

