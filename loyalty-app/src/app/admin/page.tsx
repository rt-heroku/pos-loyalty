'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Database, 
  Settings, 
  Server, 
  Activity, 
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive
} from 'lucide-react';

interface AdminStats {
  database: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
    lastReset: string;
    poolConfig: {
      max: number;
      idleTimeoutMillis: number;
      connectionTimeoutMillis: number;
      maxUses: number;
    };
    poolStats: {
      totalCount: number;
      idleCount: number;
      waitingCount: number;
    };
  };
  systemSettings: Array<{
    key: string;
    value: string;
    description: string;
    category: string;
    type: string;
  }>;
  environment: {
    NODE_ENV: string;
    DATABASE_URL?: string;
    PORT?: string;
    NEXT_PUBLIC_APP_URL?: string;
  };
  server: {
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    platform: string;
    nodeVersion: string;
    pid: number;
  };
  timestamp: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/loyalty/api/admin/stats', {
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch admin statistics');
      }

      const data = await response.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="h-8 w-8 mr-3 text-primary-600" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                System monitoring and configuration
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {lastRefresh?.toLocaleTimeString()}
              </div>
              <button
                onClick={fetchStats}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Database Connection Stats */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-600" />
              Database Connections
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.database.activeConnections}
                </div>
                <div className="text-sm text-blue-800">Active Connections</div>
                <div className="text-xs text-blue-600">
                  Max: {stats.database.poolConfig.max}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {stats.database.poolStats.idleCount}
                </div>
                <div className="text-sm text-green-800">Idle Connections</div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.database.poolStats.waitingCount}
                </div>
                <div className="text-sm text-yellow-800">Waiting Clients</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.database.totalConnections}
                </div>
                <div className="text-sm text-purple-800">Total Created</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Pool Configuration</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Max Connections: {stats.database.poolConfig.max}</div>
                  <div>Idle Timeout: {stats.database.poolConfig.idleTimeoutMillis}ms</div>
                  <div>Connection Timeout: {stats.database.poolConfig.connectionTimeoutMillis}ms</div>
                  <div>Max Uses: {stats.database.poolConfig.maxUses}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Connection Health</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    {stats.database.activeConnections < stats.database.poolConfig.max ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className={stats.database.activeConnections < stats.database.poolConfig.max ? 'text-green-600' : 'text-red-600'}>
                      {stats.database.activeConnections < stats.database.poolConfig.max ? 'Healthy' : 'At Capacity'}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Utilization: {Math.round((stats.database.activeConnections / stats.database.poolConfig.max) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-green-600" />
              System Settings
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.systemSettings.map((setting, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {setting.key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {setting.value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {setting.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {setting.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Server className="h-5 w-5 mr-2 text-orange-600" />
              Environment Variables
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(stats.environment).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-900">{key}</div>
                  <div className="text-sm text-gray-600 mt-1">{value || 'Not set'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Server Information */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-600" />
              Server Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-600" />
                  Runtime
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Uptime: {formatUptime(stats.server.uptime)}</div>
                  <div>PID: {stats.server.pid}</div>
                  <div>Platform: {stats.server.platform}</div>
                  <div>Node: {stats.server.nodeVersion}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <HardDrive className="h-4 w-4 mr-2 text-green-600" />
                  Memory Usage
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>RSS: {formatBytes(stats.server.memoryUsage.rss)}</div>
                  <div>Heap Total: {formatBytes(stats.server.memoryUsage.heapTotal)}</div>
                  <div>Heap Used: {formatBytes(stats.server.memoryUsage.heapUsed)}</div>
                  <div>External: {formatBytes(stats.server.memoryUsage.external)}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Cpu className="h-4 w-4 mr-2 text-red-600" />
                  Performance
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Heap Usage: {Math.round((stats.server.memoryUsage.heapUsed / stats.server.memoryUsage.heapTotal) * 100)}%</div>
                  <div>Memory Usage: {Math.round((stats.server.memoryUsage.rss / (1024 * 1024 * 1024)) * 100)}% of 1GB</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Last updated: {new Date(stats.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
