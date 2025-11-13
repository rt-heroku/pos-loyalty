import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

// Force dynamic rendering (uses headers in fetchBackend)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetchBackend('/api/categories');
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

