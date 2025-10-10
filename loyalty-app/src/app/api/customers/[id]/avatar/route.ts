import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Verify the customer belongs to the authenticated user
    const customerResult = await query(
      'SELECT id FROM customers WHERE id = $1 AND user_id = $2',
      [customerId, user.id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get customer avatar
    const avatarResult = await query(
      'SELECT image_data, filename, file_size, width, height FROM customer_images WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1',
      [customerId]
    );

    if (avatarResult.rows.length === 0) {
      return NextResponse.json({ error: 'No avatar found' }, { status: 404 });
    }

    const avatar = avatarResult.rows[0];
    return NextResponse.json({
      success: true,
      avatar: {
        image_data: avatar.image_data,
        filename: avatar.filename,
        file_size: avatar.file_size,
        width: avatar.width,
        height: avatar.height
      }
    });

  } catch (error) {
    console.error('Error getting customer avatar:', error);
    return NextResponse.json(
      { error: 'Failed to get avatar' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Verify the customer belongs to the authenticated user
    const customerResult = await query(
      'SELECT id FROM customers WHERE id = $1 AND user_id = $2',
      [customerId, user.id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const { image_data, filename, file_size, width, height } = await request.json();

    if (!image_data) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Delete existing avatar if any
    await query('DELETE FROM customer_images WHERE customer_id = $1', [customerId]);

    // Insert new avatar
    const result = await query(
      'INSERT INTO customer_images (customer_id, filename, image_data, file_size, width, height) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [customerId, filename || 'avatar.jpg', image_data, file_size || 0, width || 0, height || 0]
    );

    return NextResponse.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar_id: result.rows[0].id
    });

  } catch (error) {
    console.error('Error uploading customer avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Verify the customer belongs to the authenticated user
    const customerResult = await query(
      'SELECT id FROM customers WHERE id = $1 AND user_id = $2',
      [customerId, user.id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Delete avatar
    const result = await query('DELETE FROM customer_images WHERE customer_id = $1', [customerId]);

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully',
      deleted_count: result.rowCount
    });

  } catch (error) {
    console.error('Error deleting customer avatar:', error);
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}
