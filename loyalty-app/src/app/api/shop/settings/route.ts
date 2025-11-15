import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetchBackend('/api/shop/settings');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      throw new Error(`Backend returned ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching shop settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop settings' },
      { status: 500 }
    );
  }
}

