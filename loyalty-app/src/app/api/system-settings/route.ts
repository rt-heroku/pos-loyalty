import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  getSystemSetting,
  setSystemSetting,
  getSystemSettingsByCategory,
  getAllSystemSettings,
  deleteSystemSetting,
  getSystemSettingAsType,
  setSystemSettingWithType,
} from '@/lib/system-settings';

/**
 * GET /api/system-settings
 * Get system settings with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const key = searchParams.get('key');
    const type = searchParams.get('type') as
      | 'string'
      | 'number'
      | 'boolean'
      | 'json'
      | null;

    // Get specific setting by key
    if (key) {
      if (type) {
        // Get as specific type
        let defaultValue: any;
        switch (type) {
          case 'string':
            defaultValue = '';
            break;
          case 'number':
            defaultValue = 0;
            break;
          case 'boolean':
            defaultValue = false;
            break;
          case 'json':
            defaultValue = {};
            break;
        }

        const value = await getSystemSettingAsType(key, type, defaultValue);
        return NextResponse.json({ key, value, type });
      } else {
        // Get as string
        const value = await getSystemSetting(key);
        return NextResponse.json({ key, value });
      }
    }

    // Get settings by category
    if (category) {
      const settings = await getSystemSettingsByCategory(category);
      return NextResponse.json({ category, settings });
    }

    // Get all settings
    const allSettings = await getAllSystemSettings();
    return NextResponse.json({ settings: allSettings });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/system-settings
 * Create or update a system setting
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      key,
      value,
      type = 'string',
      description,
      category = 'general',
    } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
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
        message: 'Setting created/updated successfully',
        key,
        value,
        type,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to create/update setting' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating/updating system setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/system-settings
 * Update multiple system settings
 */
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings must be an array' },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      settings.map(async (setting: any) => {
        const {
          key,
          value,
          type = 'string',
          description,
          category = 'general',
        } = setting;

        if (type === 'string') {
          return await setSystemSetting(key, String(value), {
            description,
            category: category as any,
            user: user.email,
          });
        } else {
          return await setSystemSettingWithType(
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
      })
    );

    const successful = results.filter(
      result => result.status === 'fulfilled' && result.value
    ).length;
    const failed = results.length - successful;

    return NextResponse.json({
      message: `Updated ${successful} settings successfully`,
      successful,
      failed,
      total: results.length,
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/system-settings
 * Delete a system setting
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

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
    console.error('Error deleting system setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
