'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Gift, User, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate, getLoyaltyTierInfo } from '@/lib/utils';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<any>(null);

  // Debug logging
  console.log('Dashboard - user:', user);
  console.log('Dashboard - loading:', loading);


  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await fetch('/loyalty/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    }
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      await fetchDashboardStats();
      
      // Trigger async member pull from MuleSoft if user has sf_id (fire-and-forget)
      if (user?.sf_id) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/mulesoft/members/pull?sf_id=${user.sf_id}`, {
          method: 'POST'
        }).catch(err => console.log('Member pull triggered (async)'));
      }
    };

    loadDashboardData();
  }, [fetchDashboardStats, user?.sf_id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const tierInfo = getLoyaltyTierInfo(user.tier || 'Bronze');
  const nextTier = tierInfo.nextTier;
  const pointsToNextTier = nextTier ? tierInfo.pointsToNext : 0;

  return (
    <>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your loyalty account today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Spent */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats
                    ? formatCurrency(parseFloat(stats.totalSpent))
                    : '$0.00'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Visit Count */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Store Visits
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? stats.visitCount : 0}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <User className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Member Since
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats
                    ? formatDate(stats.memberSince, {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Current Tier */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Current Tier
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {user.tier
                    ? user.tier.charAt(0).toUpperCase() + user.tier.slice(1)
                    : 'Bronze'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Loyalty Status */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                Loyalty Status
              </h2>

              {/* Current Points */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Current Points
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    {user.points || 0}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((user.points || 0) / (tierInfo.pointsToNext + (user.points || 0))) * 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {pointsToNextTier > 0
                    ? `${pointsToNextTier} points to reach ${nextTier} tier`
                    : "You've reached the highest tier!"}
                </p>
              </div>

              {/* Tier Benefits */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Current Tier Benefits
                </h3>
                <div className="space-y-3">
                  {tierInfo.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <a
                  href="/profile"
                  className="group flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50"
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500 group-hover:text-primary-600" />
                    <span className="text-sm font-medium text-gray-700">
                      View Profile
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
                </a>

                <a
                  href="/loyalty"
                  className="group flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50"
                >
                  <div className="flex items-center space-x-3">
                    <Gift className="h-5 w-5 text-gray-500 group-hover:text-primary-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Redeem Rewards
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
                </a>

                <a
                  href="/transactions"
                  className="group flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50"
                >
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-gray-500 group-hover:text-primary-600" />
                    <span className="text-sm font-medium text-gray-700">
                      View Transactions
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
                </a>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-primary-500"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Welcome to the Loyalty Program!
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      You've earned 100 bonus points for joining.
                    </p>
                    <p className="mt-1 text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      New reward available!
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Redeem your points for a free coffee.
                    </p>
                    <p className="mt-1 text-xs text-gray-400">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
