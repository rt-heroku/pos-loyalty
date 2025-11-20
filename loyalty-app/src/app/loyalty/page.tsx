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
  Search,
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

interface Reward {
  id: number;
  reward_name: string;
  reward_type: string;
  points_required: number;
  discount_percentage?: number;
  discount_amount?: number;
  description: string;
  terms_conditions: string;
  valid_from: string;
  valid_until?: string;
  max_redemptions?: number;
  current_redemptions: number;
  tier_restriction?: string;
  is_active: boolean;
  isAvailable: boolean;
  remainingRedemptions?: number;
}

interface RewardsData {
  rewards: Reward[];
  redeemedRewards: any[];
  customerTier: string;
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

export default function LoyaltyPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null);
  const [vouchersData, setVouchersData] = useState<VouchersData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemQuantity, setRedeemQuantity] = useState(1);
  const [isRedeeming, setIsRedeeming] = useState(false);
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
  }, [user]);

  const fetchLoyaltyData = async () => {
    try {
      setIsLoading(true);

      // Fetch points data
      const pointsResponse = await fetch('/loyalty/api/loyalty/points');
      if (pointsResponse.ok) {
        const pointsData = await pointsResponse.json();
        setPointsData(pointsData);
      }

      // Fetch rewards data
      const rewardsResponse = await fetch('/loyalty/api/loyalty/rewards');
      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setRewardsData(rewardsData);
      }

      // Fetch vouchers data
      const vouchersResponse = await fetch('/loyalty/api/loyalty/vouchers');
      if (vouchersResponse.ok) {
        const vouchersData = await vouchersResponse.json();
        setVouchersData(vouchersData);
      }

      // Fetch orders data
      const ordersResponse = await fetch('/loyalty/api/orders');
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!selectedReward) return;

    try {
      setIsRedeeming(true);
      const response = await fetch('/loyalty/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: selectedReward.id,
          quantity: redeemQuantity,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('success', 'Reward redeemed successfully!');
        setShowRedeemModal(false);
        setSelectedReward(null);
        setRedeemQuantity(1);
        await refreshUser();
        fetchLoyaltyData(); // Refresh data
      } else {
        showToast('error', data.error || 'Failed to redeem reward');
      }
    } catch (error) {
      showToast('error', 'Network error occurred');
    } finally {
      setIsRedeeming(false);
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

  const filteredRewards =
    rewardsData?.rewards.filter(
      reward =>
        reward.reward_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

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

  const tierInfo = getLoyaltyTierInfo(pointsData?.tier || 'Bronze');
  
  // Calculate actual progress to next tier
  const tierRequirements: Record<string, number> = {
    Bronze: 0,
    Silver: 1000,
    Gold: 3500,
    Platinum: 9000,
  };
  
  const currentTierName = pointsData?.tier || 'Bronze';
  const currentPoints = pointsData?.currentBalance || 0;
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const currentTierIndex = tiers.indexOf(currentTierName);
  const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
  
  let progressToNext = 0;
  let pointsToNext = 0;
  
  if (nextTier) {
    const currentTierThreshold = tierRequirements[currentTierName] ?? 0;
    const nextTierThreshold = tierRequirements[nextTier] ?? 0;
    const pointsInCurrentTier = currentPoints - currentTierThreshold;
    const pointsNeededForNextTier = nextTierThreshold - currentTierThreshold;
    
    if (pointsNeededForNextTier > 0) {
      progressToNext = Math.min(100, Math.max(0, (pointsInCurrentTier / pointsNeededForNextTier) * 100));
    }
    pointsToNext = Math.max(0, nextTierThreshold - currentPoints);
  } else {
    // Already at max tier
    progressToNext = 100;
    pointsToNext = 0;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Star },
    { id: 'rewards', label: 'Promotions', icon: Gift },
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
                    {pointsData?.tier || 'Bronze'} Member
                  </h3>
                  <p className="text-sm text-gray-600">
                    {nextTier ? `Progress to ${nextTier}` : 'Max Tier Achieved!'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {nextTier ? `${pointsToNext} points to go` : 'Congratulations!'}
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
                  Your {pointsData?.tier || 'Bronze'} Benefits
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {tierInfo.benefits.map((benefit, index) => (
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
                    {pointsData?.tier || 'Bronze'}
                  </div>
                  <p className="text-sm text-purple-700">Current Tier</p>
                </div>
              </div>
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Available Promotions
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search promotions..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredRewards.map(reward => (
                  <div
                    key={reward.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-6 transition-shadow hover:shadow-lg"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                        {reward.reward_type === 'discount' ? (
                          <Percent className="h-6 w-6 text-primary-600" />
                        ) : (
                          <Gift className="h-6 w-6 text-primary-600" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                          {reward.points_required}
                        </div>
                        <div className="text-sm text-gray-600">points</div>
                      </div>
                    </div>

                    <h3 className="mb-2 font-semibold text-gray-900">
                      {reward.reward_name}
                    </h3>
                    <p className="mb-4 text-sm text-gray-600">
                      {reward.description}
                    </p>

                    {reward.reward_type === 'discount' && (
                      <div className="mb-4">
                        {reward.discount_percentage ? (
                          <div className="text-lg font-bold text-green-600">
                            {reward.discount_percentage}% OFF
                          </div>
                        ) : reward.discount_amount ? (
                          <div className="text-lg font-bold text-green-600">
                            ${reward.discount_amount} OFF
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {reward.remainingRedemptions !== null && (
                          <span>{reward.remainingRedemptions} left</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedReward(reward);
                          setShowRedeemModal(true);
                        }}
                        disabled={!reward.isAvailable}
                        className={cn(
                          'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                          reward.isAvailable
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'cursor-not-allowed bg-gray-300 text-gray-500'
                        )}
                      >
                        {reward.isAvailable ? 'Redeem' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredRewards.length === 0 && (
                <div className="py-12 text-center">
                  <Gift className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <p className="text-gray-500">No promotions found</p>
                  <p className="text-sm text-gray-400">
                    Try adjusting your search terms
                  </p>
                </div>
              )}
            </div>
          )}

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

      {/* Redeem Modal */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Redeem Reward</h3>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-semibold text-gray-900">
                  {selectedReward.reward_name}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedReward.description}
                </p>
                <div className="mt-2 text-lg font-bold text-primary-600">
                  {selectedReward.points_required} points
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={redeemQuantity}
                  onChange={e =>
                    setRedeemQuantity(parseInt(e.target.value) || 1)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Points:</span>
                  <span className="font-semibold">
                    {selectedReward.points_required * redeemQuantity}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your Balance:</span>
                  <span className="font-semibold">
                    {pointsData?.currentBalance}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRedeem}
                  disabled={
                    isRedeeming ||
                    (pointsData?.currentBalance || 0) <
                      selectedReward.points_required * redeemQuantity
                  }
                  className={cn(
                    'flex-1 rounded-lg px-4 py-2 text-white transition-colors',
                    isRedeeming ||
                      (pointsData?.currentBalance || 0) <
                        selectedReward.points_required * redeemQuantity
                      ? 'cursor-not-allowed bg-gray-300'
                      : 'bg-primary-600 hover:bg-primary-700'
                  )}
                >
                  {isRedeeming ? 'Redeeming...' : 'Confirm Redemption'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
