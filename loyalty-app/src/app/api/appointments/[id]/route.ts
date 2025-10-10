import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const appointmentId = params.id;
    const userId = user.id;
    const body = await request.json();

    // Verify the appointment belongs to the user
    const verifySql = `
      SELECT user_id FROM appointments WHERE id = $1
    `;
    const verifyResult = await query(verifySql, [appointmentId]);

    if (verifyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (verifyResult.rows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the appointment
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      queryParams.push(body.status);
      paramIndex++;
    }

    if (body.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`);
      queryParams.push(body.notes);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push(`updated_at = NOW()`);
    queryParams.push(appointmentId);

    const updateSql = `
      UPDATE appointments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id
    `;

    const result = await query(updateSql, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully',
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}
