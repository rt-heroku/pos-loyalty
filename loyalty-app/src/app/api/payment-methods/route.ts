import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

export async function GET() {
  try {
    const response = await fetchBackend('/api/payment-methods');
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

