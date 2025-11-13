import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend';

/**
 * GET /api/customers/[id]/vouchers
 * Proxy to Express backend voucher API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`[Vouchers API] Proxying request for customer ${id} to Express backend`);

    const response = await fetchBackend(`/api/customers/${id}/vouchers`);
    const data = await response.json();

    if (!response.ok) {
      console.error(`[Vouchers API] Backend error:`, data);
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch vouchers' },
        { status: response.status }
      );
    }

    console.log(`[Vouchers API] Successfully fetched ${data.vouchers?.length || 0} vouchers`);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Vouchers API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

