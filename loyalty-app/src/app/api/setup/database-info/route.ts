import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Get Database Connection Information
 * 
 * Returns database connection details for MuleSoft deployment.
 * This is a public endpoint (no auth required) for use during initial setup.
 */
export async function GET() {
  try {
    console.log('[Next.js API] Proxying database info request to backend');
    
    const backendResponse = await fetchBackend('/api/setup/database-info');
    
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
    console.error('[Next.js API] Error proxying database info request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database information' },
      { status: 500 }
    );
  }
}

