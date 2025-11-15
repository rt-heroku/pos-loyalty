import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

// Force dynamic rendering since this route uses headers
export const dynamic = 'force-dynamic';

/**
 * Get Current/Default Location
 * 
 * Returns the current active location (first active location in the system).
 * This is a public endpoint (no auth required) for use during setup and login.
 */
export async function GET() {
  try {
    console.log('[Next.js API] Proxying current location request to backend');
    
    const backendResponse = await fetchBackend('/api/locations/current');
    
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
    console.error('[Next.js API] Error proxying current location request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch current location',
        message: 'No locations configured yet'
      },
      { status: 500 }
    );
  }
}
