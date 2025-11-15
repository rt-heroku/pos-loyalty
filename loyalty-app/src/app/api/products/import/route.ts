import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Import products from MuleSoft to the database
 * This endpoint proxies to the Express backend which handles the MuleSoft communication
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Next.js API] Proxying products import request to backend');

    // Get the products data from the request body
    const products = await request.json();
    
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Products array is required and cannot be empty' },
        { status: 400 }
      );
    }

    console.log(`[Next.js API] Importing ${products.length} products via backend`);

    // Forward the request to the Express backend
    const backendResponse = await fetchBackend('/api/products/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(products),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`[Next.js API] Backend responded with status ${backendResponse.status}: ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Failed to import products', details: errorText };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const result = await backendResponse.json();
    console.log('[Next.js API] Products imported successfully:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Next.js API] Error proxying products import:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


