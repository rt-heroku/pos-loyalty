import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/products/${params.id}/modifiers`);
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching product modifiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product modifiers' },
      { status: 500 }
    );
  }
}

