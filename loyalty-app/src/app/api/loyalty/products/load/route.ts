import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Load products from selected catalog in MuleSoft Loyalty Cloud
 * This endpoint proxies to the Express backend which handles the MuleSoft communication
 * and imports products to the database
 * 
 * Used in the setup wizard and settings "Load from Cloud" modal
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Next.js API] Proxying products load request to backend');

    // Get the catalog ID from the request body
    const body = await request.json();
    const { catalogId } = body;

    if (!catalogId) {
      return NextResponse.json(
        { error: 'Catalog ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Next.js API] Loading products from catalog: ${catalogId}`);

    // Forward the request to the Express backend
    const backendResponse = await fetchBackend('/api/loyalty/products/load', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ catalogId }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`[Next.js API] Backend responded with status ${backendResponse.status}: ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Failed to load products', details: errorText };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const result = await backendResponse.json();
    const successCount = Array.isArray(result) ? result.filter((item: any) => item.success).length : 0;
    console.log(`[Next.js API] Products loaded successfully: ${successCount} out of ${result.length} products`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Next.js API] Error proxying products load:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


