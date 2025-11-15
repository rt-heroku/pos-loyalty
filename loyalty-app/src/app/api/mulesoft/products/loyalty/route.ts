import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

// Force dynamic rendering since this route uses headers
export const dynamic = 'force-dynamic';

/**
 * GET /api/mulesoft/products/loyalty
 * Proxy to backend Express API to load products from MuleSoft Loyalty Cloud
 * This avoids CORS issues by routing through the backend
 */
export async function GET() {
  try {
    console.log('[Next.js API] Proxying products/loyalty request to backend');

    // Forward the request to the Express backend
    // The backend will fetch from MuleSoft using the configured endpoint
    const backendResponse = await fetchBackend('/api/mulesoft/products/loyalty');

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`[Next.js API] Backend responded with status ${backendResponse.status}:`, errorText);
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.statusText}`, details: errorText },
        { status: backendResponse.status }
      );
    }

    // Check content type before parsing as JSON
    const contentType = backendResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await backendResponse.text();
      console.error('[Next.js API] Backend returned non-JSON response:', text.substring(0, 200));
      return NextResponse.json(
        { error: 'Backend returned non-JSON response', details: text.substring(0, 200) },
        { status: 500 }
      );
    }

    const data = await backendResponse.json();
    console.log(`[Next.js API] Successfully loaded ${data.length || 0} products`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Next.js API] Error proxying products request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

