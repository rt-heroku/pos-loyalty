import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Test MuleSoft Connection
 * 
 * Tests connectivity to a MuleSoft endpoint by calling its /programs route.
 * This is a public endpoint (no auth required) for use during initial setup.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Next.js API] Proxying MuleSoft test request to backend');
    
    const backendResponse = await fetchBackend('/api/setup/test-mulesoft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!backendResponse.ok) {
      console.error(`[Next.js API] Backend responded with status ${backendResponse.status}`);
      const errorText = await backendResponse.text();
      return new NextResponse(errorText, {
        status: backendResponse.status,
        headers: backendResponse.headers,
      });
    }
    
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Next.js API] Error proxying MuleSoft test request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test MuleSoft connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

