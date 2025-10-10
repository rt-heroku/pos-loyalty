import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params: { id: workOrderId } }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const body = await request.json();

    // Verify the work order belongs to the user
    const verifySql = `
      SELECT user_id FROM work_orders WHERE id = $1
    `;
    const verifyResult = await query(verifySql, [workOrderId]);

    if (verifyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    if (verifyResult.rows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the work order
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      params.push(body.status);
      paramIndex++;
    }

    if (body.customerNotes !== undefined) {
      updateFields.push(`customer_notes = $${paramIndex}`);
      params.push(body.customerNotes);
      paramIndex++;
    }

    if (body.estimatedCost !== undefined) {
      updateFields.push(`estimated_cost = $${paramIndex}`);
      params.push(body.estimatedCost);
      paramIndex++;
    }

    if (body.estimatedCompletion !== undefined) {
      updateFields.push(`estimated_completion = $${paramIndex}`);
      params.push(body.estimatedCompletion);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(workOrderId);

    const updateSql = `
      UPDATE work_orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id
    `;

    const result = await query(updateSql, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update work order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Work order updated successfully',
    });
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json(
      { error: 'Failed to update work order' },
      { status: 500 }
    );
  }
}
