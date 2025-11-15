import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Save MuleSoft Settings
 * 
 * Saves the MuleSoft endpoint to system_settings after Step 5 of setup wizard.
 * This allows Step 6 to work without passing the endpoint parameter.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Next.js API] Proxying save MuleSoft settings request to backend');
    
    const body = await request.json();
    
    const backendResponse = await fetchBackend('/api/setup/save-mulesoft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!backendResponse.ok) {
      console.error(`[Next.js API] Backend responded with status ${backendResponse.status}`);
      const errorText = await backendResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { success: false, message: errorText };
      }
      return NextResponse.json(errorData, { status: backendResponse.status });
    }
    
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Next.js API] Error proxying save MuleSoft settings:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

