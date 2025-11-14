import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

/**
 * Fetch product catalogs from MuleSoft Loyalty Cloud
 * This endpoint proxies to the Express backend which handles the MuleSoft communication
 * 
 * Used in the setup wizard and settings to load available product catalogs
 */
export async function GET(_request: NextRequest) {
  try {
    console.log('[Next.js API] Proxying catalogs fetch request to backend');

    // Forward the request to the Express backend
    const backendResponse = await fetchBackend('/api/loyalty/catalogs', {
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
        errorData = { error: 'Failed to fetch catalogs', details: errorText };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const catalogs = await backendResponse.json();
    console.log(`[Next.js API] Successfully fetched ${catalogs.length || 0} catalogs from MuleSoft`);
    
    return NextResponse.json(catalogs);
  } catch (error) {
    console.error('[Next.js API] Error proxying catalogs fetch:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

