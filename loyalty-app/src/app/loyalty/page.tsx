'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import {
  Gift,
  Star,
  TrendingUp,
  Calendar,
  Crown,
  Award,
  Users,
  Copy,
  Check,
  X,
  AlertCircle,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatDate,
  getLoyaltyTierInfo,
} from '@/lib/utils';

interface PointsData {
  currentBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  totalTransactions: number;
  tier: string;
  memberStatus: string;
  enrollmentDate: string;
  history: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Voucher {
  id: number;
  voucher_code: string;
  name: string;
  description: string;
  voucher_type: string;
  face_value: number;
  discount_percent: number;
  remaining_value: number;
  redeemed_value: number;
  reserved_value: number;
  status: string;
  created_date: string;
  expiration_date: string;
  use_date: string;
  image_url: string;
  is_active: boolean;
  effective_date: string;
  product_name: string;
  product_price: number;
  product_image_url: string;
}

interface VouchersData {
  vouchers: Voucher[];
  groupedVouchers: {
    issued: Voucher[];
    redeemed: Voucher[];
    expired: Voucher[];
  };
  total: number;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  origin: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  order_date: string;
  items: any[];
}

interface LoyaltyTier {
  id: number;
  tier_name: string;
  tier_level: number;
  min_spending: number;
  min_visits: number;
  min_points: number;
  points_multiplier: number;
  benefits: {
    description: string;
    features: string[];
  };
  tier_color: string;
  tier_icon: string;
}

export default function LoyaltyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [vouchersData, setVouchersData] = useState<VouchersData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchLoyaltyData = async () => {
    try {
      setIsLoading(true);

      // Fetch loyalty tiers
      const tiersResponse = await fetch('/loyalty/api/loyalty/tiers', {
        credentials: 'include',
      });
      if (tiersResponse.ok) {
        const tiersData = await tiersResponse.json();
        setTiers(tiersData);
        console.log('[Loyalty] Tiers loaded:', tiersData);
      }

      // Fetch points data
      const pointsResponse = await fetch('/loyalty/api/loyalty/points', {
        credentials: 'include',
      });
      if (pointsResponse.ok) {
        const pointsData = await pointsResponse.json();
        setPointsData(pointsData);
      }

      // Fetch vouchers data
      const vouchersResponse = await fetch('/loyalty/api/loyalty/vouchers', {
        credentials: 'include',
      });
      if (vouchersResponse.ok) {
        const vouchersData = await vouchersResponse.json();
        setVouchersData(vouchersData);
      }

      // Fetch orders data
      console.log('[Loyalty] Fetching orders for user:', user?.id, user?.email);
      const ordersResponse = await fetch('/loyalty/api/orders', {
        credentials: 'include', // Ensure cookies are sent
      });
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
        console.log('[Loyalty] Orders loaded:', ordersData.length, 'orders:', ordersData);
      } else if (ordersResponse.status === 401) {
        console.warn('[Loyalty] Orders fetch failed: Not authenticated');
        setOrders([]); // Set empty array if not authenticated
      } else {
        console.error('[Loyalty] Orders fetch failed:', ordersResponse.status);
        const errorText = await ordersResponse.text();
        console.error('[Loyalty] Orders error response:', errorText);
        setOrders([]); // Set empty array on error
      }

      // Fetch promotions data
      console.log('[Loyalty] ===== PROMOTIONS FETCH DEBUG =====');
      console.log('[Loyalty] User object:', user);
      console.log('[Loyalty] User loyaltyNumber:', user?.loyaltyNumber);
      console.log('[Loyalty] User id:', user?.id);
      console.log('[Loyalty] User email:', user?.email);
      
      if (user?.loyaltyNumber) {
        const promotionsUrl = `/loyalty/api/promotions?loyalty_number=${user.loyaltyNumber}`;
        console.log('[Loyalty] Fetching promotions from URL:', promotionsUrl);
        
        const promotionsResponse = await fetch(promotionsUrl, {
          credentials: 'include',
        });
        
        console.log('[Loyalty] Promotions response status:', promotionsResponse.status);
        console.log('[Loyalty] Promotions response headers:', Object.fromEntries(promotionsResponse.headers.entries()));
        
        if (promotionsResponse.ok) {
          const promotionsData = await promotionsResponse.json();
          console.log('[Loyalty] Promotions data received:', promotionsData);
          console.log('[Loyalty] Promotions array length:', promotionsData.promotions?.length || 0);
          console.log('[Loyalty] Promotions array:', promotionsData.promotions);
          
          setPromotions(promotionsData.promotions || []);
          console.log('[Loyalty] ✅ Promotions successfully set in state');
        } else {
          console.error('[Loyalty] ❌ Promotions fetch failed with status:', promotionsResponse.status);
          const errorText = await promotionsResponse.text();
          console.error('[Loyalty] Error response text:', errorText);
          setPromotions([]);
        }
      } else {
        console.warn('[Loyalty] ❌ No loyaltyNumber found for user');
        console.warn('[Loyalty] User object keys:', Object.keys(user || {}));
        setPromotions([]);
      }
      console.log('[Loyalty] ===== END PROMOTIONS FETCH DEBUG =====');
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = () => {
    const referralCode = `LOY${user?.id?.toString().padStart(3, '0')}`;
    navigator.clipboard.writeText(referralCode);
    showToast('success', 'Referral code copied to clipboard!');
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Normalize tier name (remove " Tier" suffix if present)
  const normalizeTier = (tier: string) => {
    if (!tier) return 'Bronze';
    return tier.replace(' Tier', '').trim();
  };

  const normalizedTier = normalizeTier(pointsData?.tier || 'Bronze');
  
  // Calculate actual progress to next tier using database tiers
  const currentTierName = normalizedTier;
  const currentPoints = pointsData?.currentBalance || 0;
  
  const sortedTiers = [...tiers].sort((a, b) => a.tier_level - b.tier_level);
  const currentTierData = sortedTiers.find(t => normalizeTier(t.tier_name) === currentTierName);
  const currentTierIndex = sortedTiers.findIndex(t => t.id === currentTierData?.id);
  
  // Get tier benefits from database instead of hardcoded
  const tierBenefits = currentTierData?.benefits?.features || [];
  const tierDescription = currentTierData?.benefits?.description || '';
  
  // Get badge classes from getLoyaltyTierInfo (still useful for styling)
  const tierInfo = getLoyaltyTierInfo(normalizedTier);
  const nextTierData = currentTierIndex >= 0 && currentTierIndex < sortedTiers.length - 1 
    ? sortedTiers[currentTierIndex + 1] 
    : null;
  
  let progressToNext = 0;
  let pointsToNext = 0;
  
  if (nextTierData && currentTierData) {
    const currentTierThreshold = currentTierData.min_points;
    const nextTierThreshold = nextTierData.min_points;
    const pointsInCurrentTier = currentPoints - currentTierThreshold;
    const pointsNeededForNextTier = nextTierThreshold - currentTierThreshold;
    
    if (pointsNeededForNextTier > 0) {
      progressToNext = Math.min(100, Math.max(0, (pointsInCurrentTier / pointsNeededForNextTier) * 100));
      pointsToNext = Math.max(0, nextTierThreshold - currentPoints);
    }
  } else if (!nextTierData && currentTierData) {
    // At max tier
    progressToNext = 100;
    pointsToNext = 0;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Star },
    { id: 'promotions', label: 'Promotions', icon: Gift },
    { id: 'vouchers', label: 'Vouchers', icon: Percent },
    { id: 'orders', label: 'Online Orders', icon: ShoppingBag },
    { id: 'history', label: 'In-Store Transactions', icon: Calendar },
    { id: 'referrals', label: 'Referrals', icon: Users },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Loyalty Program
        </h1>
        <p className="text-gray-600">
          Manage your points, rewards, and tier status
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Points Overview Card */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Current Balance */}
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary-600">
                {pointsData?.currentBalance?.toLocaleString() || 0}
              </div>
              <p className="text-gray-600">Current Points</p>
            </div>

            {/* Total Earned */}
            <div className="text-center">
              <div className="mb-2 text-2xl font-bold text-green-600">
                {pointsData?.totalEarned?.toLocaleString() || 0}
              </div>
              <p className="text-gray-600">Total Earned</p>
            </div>

            {/* Total Redeemed */}
            <div className="text-center">
              <div className="mb-2 text-2xl font-bold text-orange-600">
                {pointsData?.totalRedeemed?.toLocaleString() || 0}
              </div>
              <p className="text-gray-600">Total Redeemed</p>
            </div>
          </div>

          {/* Tier Progress */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Crown className="h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {normalizedTier} Member
                  </h3>
                  <p className="text-sm text-gray-600">
                    {nextTierData ? `Progress to ${nextTierData.tier_name}` : 'Max Tier Achieved!'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {nextTierData ? `${pointsToNext} points to go` : 'Congratulations!'}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round(progressToNext)}% complete
                </div>
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-1000"
                style={{ width: `${progressToNext}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
          <nav className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center space-x-2 rounded-lg px-4 py-2 transition-colors',
                    activeTab === tab.id
                      ? 'border border-primary-200 bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Loyalty Overview
              </h2>

              {/* Tier Benefits */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Your {normalizedTier} Benefits
                </h3>
                {tierDescription && (
                  <p className="mb-4 text-sm text-gray-600">{tierDescription}</p>
                )}
                {tierBenefits.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {tierBenefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                          <Award className="h-4 w-4 text-primary-600" />
                        </div>
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No benefits information available for this tier.
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <TrendingUp className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-900">
                    {pointsData?.totalTransactions || 0}
                  </div>
                  <p className="text-sm text-blue-700">Total Transactions</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <Calendar className="mx-auto mb-2 h-8 w-8 text-green-600" />
                  <div className="text-lg font-bold text-green-900">
                    {formatDate(
                      pointsData?.enrollmentDate || new Date().toISOString(),
                      { month: 'short', year: 'numeric' }
                    )}
                  </div>
                  <p className="text-sm text-green-700">Member Since</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 text-center">
                  <Crown className="mx-auto mb-2 h-8 w-8 text-purple-600" />
                  <div className="text-lg font-bold text-purple-900">
                    {normalizedTier}
                  </div>
                  <p className="text-sm text-purple-700">Current Tier</p>
                </div>
              </div>
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'promotions' && (() => {
            console.log('[Loyalty Render] Promotions tab active');
            console.log('[Loyalty Render] Promotions state length:', promotions.length);
            console.log('[Loyalty Render] Promotions state:', promotions);
            return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  My Promotions ({promotions.length})
                </h2>
              </div>

              {promotions.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {promotions.map(promo => (
                    <div
                      key={promo.id}
                      className={cn(
                        "rounded-xl border p-6 transition-shadow hover:shadow-lg",
                        promo.is_enrolled
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      )}
                    >
                      {promo.image_url && (
                        <div className="mb-4 h-32 w-full overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={promo.image_url}
                            alt={promo.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}

                      <div className="mb-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900">
                            {promo.display_name || promo.name}
                          </h3>
                          {promo.is_enrolled && (
                            <span className="rounded-full bg-green-600 px-2 py-1 text-xs font-medium text-white">
                              ✓ Enrolled
                            </span>
                          )}
                        </div>
                        {promo.description && (
                          <p className="mb-3 text-sm text-gray-600">
                            {promo.description}
                          </p>
                        )}
                        {promo.total_reward_points && (
                          <div className="text-lg font-bold text-primary-600">
                            {promo.total_reward_points} points
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-xs text-gray-500">
                        {promo.promotion_source && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Type:</span>
                            <span className="capitalize">{promo.promotion_source}</span>
                          </div>
                        )}
                        {promo.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(promo.start_date).toLocaleDateString()}
                              {promo.end_date && ` - ${new Date(promo.end_date).toLocaleDateString()}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Gift className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <p className="text-gray-500">No promotions available</p>
                  <p className="text-sm text-gray-400">
                    Check back later for new promotions
                  </p>
                </div>
              )}
            </div>
            );
          })()}

          {/* Vouchers Tab */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  My Vouchers
                </h2>
                <div className="text-sm text-gray-500">
                  {vouchersData?.total || 0} total vouchers
                </div>
              </div>

              {/* Voucher Status Summary */}
              {vouchersData && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Available
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          {vouchersData.groupedVouchers.issued.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Award className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-800">
                          Redeemed
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          {vouchersData.groupedVouchers.redeemed.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <X className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-800">
                          Expired
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {vouchersData.groupedVouchers.expired.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Available Vouchers */}
              {vouchersData?.groupedVouchers?.issued && vouchersData.groupedVouchers.issued.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Available Vouchers
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vouchersData.groupedVouchers.issued.map(voucher => (
                      <div
                        key={voucher.id}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                      >
                        {voucher.image_url && (
                          <div className="mb-4">
                            <Image
                              src={voucher.image_url}
                              alt={voucher.name}
                              width={400}
                              height={128}
                              className="h-32 w-full rounded-lg object-cover"
                            />
                          </div>
                        )}
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {voucher.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {voucher.voucher_code}
                            </p>
                          </div>
                          
                          {voucher.description && (
                            <p className="text-sm text-gray-600">
                              {voucher.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              {voucher.voucher_type === 'Discount' && voucher.discount_percent && (
                                <span className="text-lg font-bold text-green-600">
                                  {voucher.discount_percent}% OFF
                                </span>
                              )}
                              {voucher.voucher_type === 'Value' && (
                                <span className="text-lg font-bold text-green-600">
                                  {formatCurrency(voucher.face_value)} Value
                                </span>
                              )}
                              {voucher.voucher_type === 'ProductSpecific' && (
                                <span className="text-lg font-bold text-green-600">
                                  {voucher.product_name || 'Product Discount'}
                                </span>
                              )}
                            </div>
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                              Available
                            </span>
                          </div>

                          {voucher.expiration_date && (
                            <p className="text-xs text-gray-500">
                              Expires: {formatDate(voucher.expiration_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Redeemed Vouchers */}
              {vouchersData?.groupedVouchers?.redeemed && vouchersData.groupedVouchers.redeemed.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Redeemed Vouchers
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vouchersData.groupedVouchers.redeemed.map(voucher => (
                      <div
                        key={voucher.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-6 opacity-75"
                      >
                        {voucher.image_url && (
                          <div className="mb-4">
                            <Image
                              src={voucher.image_url}
                              alt={voucher.name}
                              width={400}
                              height={128}
                              className="h-32 w-full rounded-lg object-cover grayscale"
                            />
                          </div>
                        )}
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-700">
                              {voucher.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {voucher.voucher_code}
                            </p>
                          </div>
                          
                          {voucher.description && (
                            <p className="text-sm text-gray-500">
                              {voucher.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              {voucher.voucher_type === 'Discount' && voucher.discount_percent && (
                                <span className="text-lg font-bold text-gray-600">
                                  {voucher.discount_percent}% OFF
                                </span>
                              )}
                              {voucher.voucher_type === 'Value' && (
                                <span className="text-lg font-bold text-gray-600">
                                  {formatCurrency(voucher.face_value)} Value
                                </span>
                              )}
                              {voucher.voucher_type === 'ProductSpecific' && (
                                <span className="text-lg font-bold text-gray-600">
                                  {voucher.product_name || 'Product Discount'}
                                </span>
                              )}
                            </div>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                              Redeemed
                            </span>
                          </div>

                          {voucher.use_date && (
                            <p className="text-xs text-gray-500">
                              Redeemed: {formatDate(voucher.use_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expired Vouchers */}
              {vouchersData?.groupedVouchers?.expired && vouchersData.groupedVouchers.expired.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Expired Vouchers
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vouchersData.groupedVouchers.expired.map(voucher => (
                      <div
                        key={voucher.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-6 opacity-50"
                      >
                        {voucher.image_url && (
                          <div className="mb-4">
                            <Image
                              src={voucher.image_url}
                              alt={voucher.name}
                              width={400}
                              height={128}
                              className="h-32 w-full rounded-lg object-cover grayscale"
                            />
                          </div>
                        )}
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-500">
                              {voucher.name}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {voucher.voucher_code}
                            </p>
                          </div>
                          
                          {voucher.description && (
                            <p className="text-sm text-gray-400">
                              {voucher.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              {voucher.voucher_type === 'Discount' && voucher.discount_percent && (
                                <span className="text-lg font-bold text-gray-400">
                                  {voucher.discount_percent}% OFF
                                </span>
                              )}
                              {voucher.voucher_type === 'Value' && (
                                <span className="text-lg font-bold text-gray-400">
                                  {formatCurrency(voucher.face_value)} Value
                                </span>
                              )}
                              {voucher.voucher_type === 'ProductSpecific' && (
                                <span className="text-lg font-bold text-gray-400">
                                  {voucher.product_name || 'Product Discount'}
                                </span>
                              )}
                            </div>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                              Expired
                            </span>
                          </div>

                          {voucher.expiration_date && (
                            <p className="text-xs text-gray-400">
                              Expired: {formatDate(voucher.expiration_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Vouchers Message */}
              {vouchersData?.total === 0 && (
                <div className="py-12 text-center">
                  <Percent className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <p className="text-gray-500">No vouchers found</p>
                  <p className="text-sm text-gray-400">
                    You don't have any vouchers yet
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Online Orders
                </h2>
                <div className="text-sm text-gray-500">
                  {orders.length} total orders
                </div>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Order #{order.order_number}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.order_date, { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </div>
                          <span
                            className={cn(
                              'inline-flex rounded-full px-3 py-1 text-xs font-medium',
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            Items ({order.items.length}):
                          </p>
                          <div className="space-y-1">
                            {order.items.slice(0, 3).map((item: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-600">
                                  {item.quantity}x {item.product_name}
                                </span>
                                <span className="text-gray-900">
                                  {formatCurrency(item.total_price)}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{order.items.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="text-gray-900">
                            {formatCurrency(order.subtotal)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Tax:</span>
                          <span className="text-gray-900">
                            {formatCurrency(order.tax_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No Online Orders Yet
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Your online orders will appear here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                In-Store Transactions
              </h2>

              <div className="space-y-4">
                {pointsData?.history?.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                        <ShoppingBag className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {entry.description}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {entry.points_earned > 0 && (
                        <div className="font-medium text-green-600">
                          +{entry.points_earned}
                        </div>
                      )}
                      {entry.points_redeemed > 0 && (
                        <div className="font-medium text-red-600">
                          -{entry.points_redeemed}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {formatCurrency(parseFloat(entry.total))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pointsData?.history?.length === 0 && (
                <div className="py-12 text-center">
                  <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <p className="text-gray-500">No points history yet</p>
                  <p className="text-sm text-gray-400">
                    Your points activity will appear here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Referral Program
              </h2>

              <div className="rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="mb-2 text-xl font-bold">
                      Earn Points for Referrals
                    </h3>
                    <p className="mb-4 text-primary-100">
                      Share your referral code with friends and earn 500 points
                      for each successful referral!
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="rounded-lg bg-white/20 px-4 py-2">
                        <span className="font-mono text-lg">
                          LOY{user.id?.toString().padStart(3, '0')}
                        </span>
                      </div>
                      <button
                        onClick={copyReferralCode}
                        className="flex items-center space-x-2 rounded-lg bg-white px-4 py-2 text-primary-600 transition-colors hover:bg-gray-100"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy Code</span>
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">500</div>
                    <div className="text-primary-100">points per referral</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">
                    How it Works
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                        <span className="text-sm font-bold text-primary-600">
                          1
                        </span>
                      </div>
                      <span className="text-sm text-gray-700">
                        Share your referral code
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                        <span className="text-sm font-bold text-primary-600">
                          2
                        </span>
                      </div>
                      <span className="text-sm text-gray-700">
                        Friend signs up using your code
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                        <span className="text-sm font-bold text-primary-600">
                          3
                        </span>
                      </div>
                      <span className="text-sm text-gray-700">
                        Both of you earn 500 points!
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">
                    Your Referrals
                  </h3>
                  <div className="py-8 text-center">
                    <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p className="text-gray-500">No referrals yet</p>
                    <p className="text-sm text-gray-400">
                      Start sharing your code to earn points!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={cn(
              'flex max-w-sm items-center space-x-3 rounded-lg px-6 py-4 shadow-lg',
              toast.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-800'
                : 'border border-red-200 bg-red-50 text-red-800'
            )}
          >
            {toast.type === 'success' ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
