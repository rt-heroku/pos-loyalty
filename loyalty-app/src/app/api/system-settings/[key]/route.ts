import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  getSystemSetting,
  getSystemSettingWithDefault,
  setSystemSetting,
  deleteSystemSetting,
  getSystemSettingAsType,
  setSystemSettingWithType,
} from '@/lib/system-settings';

/**
 * GET /api/system-settings/[key]
 * Get a specific system setting by key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { key } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as
      | 'string'
      | 'number'
      | 'boolean'
      | 'json'
      | null;
    const defaultValue = searchParams.get('default');

    if (type) {
      // Get as specific type
      let defaultVal: any;
      if (defaultValue !== null) {
        try {
          switch (type) {
            case 'string':
              defaultVal = defaultValue;
              break;
            case 'number':
              defaultVal = parseFloat(defaultValue);
              break;
            case 'boolean':
              defaultVal = defaultValue.toLowerCase() === 'true';
              break;
            case 'json':
              defaultVal = JSON.parse(defaultValue);
              break;
          }
        } catch {
          // Use type-specific defaults if parsing fails
          switch (type) {
            case 'string':
              defaultVal = '';
              break;
            case 'number':
              defaultVal = 0;
              break;
            case 'boolean':
              defaultVal = false;
              break;
            case 'json':
              defaultVal = {};
              break;
          }
        }
      } else {
        // Use type-specific defaults
        switch (type) {
          case 'string':
            defaultVal = '';
            break;
          case 'number':
            defaultVal = 0;
            break;
          case 'boolean':
            defaultVal = false;
            break;
          case 'json':
            defaultVal = {};
            break;
        }
      }

      const value = await getSystemSettingAsType(key, type, defaultVal);
      return NextResponse.json({ key, value, type });
    } else if (defaultValue !== null) {
      // Get with default value
      const value = await getSystemSettingWithDefault(key, defaultValue);
      return NextResponse.json({ key, value });
    } else {
      // Get without default
      const value = await getSystemSetting(key);
      return NextResponse.json({ key, value });
    }
  } catch (error) {
    console.error(`Error fetching system setting '${params.key}':`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/system-settings/[key]
 * Update a specific system setting
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { key } = params;
    const body = await request.json();
    const { value, type = 'string', description, category = 'general' } = body;

    if (value === undefined) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 });
    }

    let success: boolean;

    if (type === 'string') {
      success = await setSystemSetting(key, String(value), {
        description,
        category: category as any,
        user: user.email,
      });
    } else {
      success = await setSystemSettingWithType(
        key,
        value,
        type as 'number' | 'boolean' | 'json',
        {
          description,
          category: category as any,
          user: user.email,
        }
      );
    }

    if (success) {
      return NextResponse.json({
        message: 'Setting updated successfully',
        key,
        value,
        type,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Error updating system setting '${params.key}':`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/system-settings/[key]
 * Delete a specific system setting
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { key } = params;
    const success = await deleteSystemSetting(key);

    if (success) {
      return NextResponse.json({
        message: 'Setting deleted successfully',
        key,
      });
    } else {
      return NextResponse.json(
        { error: 'Setting not found or failed to delete' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error(`Error deleting system setting '${params.key}':`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
