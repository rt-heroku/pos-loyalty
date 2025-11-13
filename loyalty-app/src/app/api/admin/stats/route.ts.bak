import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getConnectionStats } from '@/lib/db';
import { getAllSystemSettings } from '@/lib/system-settings';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get database connection stats
    const dbStats = getConnectionStats();

    // Get system settings
    const systemSettings = await getAllSystemSettings();

    // Get environment variables (filtered for security)
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? '***hidden***' : undefined,
      PORT: process.env.PORT,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };

    // Get server info
    const serverInfo = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
    };

    return NextResponse.json({
      database: dbStats,
      systemSettings,
      environment: envVars,
      server: serverInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}
