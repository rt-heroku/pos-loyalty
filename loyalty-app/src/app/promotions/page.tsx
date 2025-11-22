'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tag,
  TrendingUp,
  Calendar,
  Gift,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Grid3x3,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Promotion {
  id: number;
  sf_id: string;
  name: string;
  display_name?: string;
  description?: string;
  is_active: boolean;
  is_automatic: boolean;
  is_enrollment_required: boolean;
  start_date?: string;
  start_date_time?: string;
  end_date?: string;
  end_date_time?: string;
  image_url?: string;
  usage_type?: string;
  total_reward_points?: number;
  point_factor?: number;
  promotion_code?: string;
  terms_and_conditions?: string;
  // Customer enrollment fields (if fetched with loyalty number)
  is_enrolled?: boolean;
  enrollment_status?: string;
  cumulative_usage_completed?: number;
  cumulative_usage_target?: number;
  cumulative_usage_complete_percent?: number;
}

interface PromotionsData {
  promotions: Promotion[];
  total?: number;
  customer?: {
    id: number;
    name: string;
    loyaltyNumber: string;
    tier: string;
  };
}

export default function PromotionsPage() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, [user]);

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all active promotions
      const response = await fetch('/loyalty/api/promotions', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch promotions');
      }

      const data: PromotionsData = await response.json();
      setPromotions(data.promotions || []);
      console.log('[Promotions] Loaded promotions:', data.promotions?.length || 0);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load promotions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (promotionId: number) => {
    if (!user) {
      alert('Please log in to enroll in promotions');
      return;
    }

    try {
      setEnrolling(true);

      const response = await fetch('/loyalty/api/promotions/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ promotionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enroll');
      }

      alert('Successfully enrolled in promotion!');
      fetchPromotions(); // Refresh to show enrollment
      setSelectedPromotion(null);
    } catch (err) {
      console.error('Error enrolling:', err);
      alert(err instanceof Error ? err.message : 'Failed to enroll in promotion');
    } finally {
      setEnrolling(false);
    }
  };

  const getPromotionTypeColor = (usageType?: string) => {
    if (!usageType) return 'bg-gray-100 text-gray-800';
    
    const colors: Record<string, string> = {
      'Once': 'bg-purple-100 text-purple-800',
      'Limited': 'bg-yellow-100 text-yellow-800',
      'Unlimited': 'bg-green-100 text-green-800',
    };
    
    return colors[usageType] || 'bg-gray-100 text-gray-800';
  };

  const formatPromotionDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading promotions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Promotions</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPromotions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-blue-600" />
                Promotions
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {promotions.length} active promotion{promotions.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {promotions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Promotions</h3>
            <p className="text-gray-600">Check back soon for exciting offers!</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className={cn(
                  'bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer',
                  promo.is_enrolled ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
                )}
                onClick={() => setSelectedPromotion(promo)}
              >
                {/* Icon and Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Gift className="w-6 h-6 text-blue-600" />
                  </div>
                  {promo.usage_type && (
                    <span className={cn('px-2 py-1 text-xs font-semibold rounded-full', getPromotionTypeColor(promo.usage_type))}>
                      {promo.usage_type}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {promo.display_name || promo.name}
                </h3>

                {/* Description */}
                {promo.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{promo.description}</p>
                )}

                {/* Reward */}
                {promo.total_reward_points && (
                  <div className="flex items-center gap-2 mb-3 text-blue-600 font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    <span>{promo.total_reward_points} Points</span>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Until {formatPromotionDate(promo.end_date || promo.end_date_time) || 'No end date'}
                  </span>
                </div>

                {/* Enrollment Status */}
                {promo.is_enrollment_required && !promo.is_enrolled && (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <Clock className="w-3 h-3" />
                    <span>Enrollment required</span>
                  </div>
                )}

                {promo.is_enrolled && (
                  <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    <span>Enrolled</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promotions.map((promo) => (
                  <tr
                    key={promo.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedPromotion(promo)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{promo.display_name || promo.name}</div>
                      {promo.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">{promo.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {promo.usage_type && (
                        <span className={cn('px-2 py-1 text-xs font-semibold rounded-full', getPromotionTypeColor(promo.usage_type))}>
                          {promo.usage_type}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {promo.total_reward_points ? `${promo.total_reward_points} pts` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatPromotionDate(promo.end_date || promo.end_date_time) || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {promo.is_enrolled ? (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600 font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Enrolled
                        </span>
                      ) : promo.is_enrollment_required ? (
                        <span className="text-sm text-amber-600">Enrollment required</span>
                      ) : (
                        <span className="text-sm text-gray-400">Available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promotion Details Modal */}
      {selectedPromotion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedPromotion.display_name || selectedPromotion.name}
                  </h2>
                  {selectedPromotion.usage_type && (
                    <span className={cn('px-3 py-1 text-sm font-semibold rounded-full', getPromotionTypeColor(selectedPromotion.usage_type))}>
                      {selectedPromotion.usage_type}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPromotion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Description */}
              {selectedPromotion.description && (
                <p className="text-gray-700 mb-6">{selectedPromotion.description}</p>
              )}

              {/* Reward */}
              {selectedPromotion.total_reward_points && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-600">Reward</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedPromotion.total_reward_points} Points
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Start Date</div>
                  <div className="font-medium">
                    {formatPromotionDate(selectedPromotion.start_date || selectedPromotion.start_date_time) || 'No start date'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">End Date</div>
                  <div className="font-medium">
                    {formatPromotionDate(selectedPromotion.end_date || selectedPromotion.end_date_time) || 'No end date'}
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              {selectedPromotion.terms_and_conditions && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
                  <p className="text-sm text-gray-600">{selectedPromotion.terms_and_conditions}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedPromotion.is_enrolled ? (
                  <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-green-600">Already Enrolled</div>
                  </div>
                ) : selectedPromotion.is_enrollment_required ? (
                  <button
                    onClick={() => handleEnroll(selectedPromotion.id)}
                    disabled={enrolling}
                    className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                ) : (
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600">Automatically applied when eligible</div>
                  </div>
                )}
                <button
                  onClick={() => setSelectedPromotion(null)}
                  className="px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

