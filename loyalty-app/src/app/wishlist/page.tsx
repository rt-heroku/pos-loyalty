'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Wishlist } from '@/types/product';
import {
  Heart,
  Share2,
  Trash2,
  Eye,
  Users,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, formatCurrency } from '@/lib/utils';

export default function WishlistPage() {
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [activeWishlist, setActiveWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  const loadWishlists = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/loyalty/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        setWishlists(data.wishlists);
        if (data.wishlists.length > 0 && !activeWishlist) {
          setActiveWishlist(data.wishlists[0]);
        }
      }
    } catch (error) {
      console.error('Error loading wishlists:', error);
    } finally {
      setLoading(false);
    }
  }, [activeWishlist]);

  // Load user's wishlists
  useEffect(() => {
    if (user) {
      loadWishlists();
    }
  }, [user, loadWishlists]);

  const createWishlist = async () => {
    if (!newWishlistName.trim()) return;

    try {
      const response = await fetch('/loyalty/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWishlistName }),
      });

      if (response.ok) {
        const newWishlist = await response.json();
        setWishlists(prev => [...prev, newWishlist]);
        setActiveWishlist(newWishlist);
        setNewWishlistName('');
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating wishlist:', error);
    }
  };

  const deleteWishlist = async (wishlistId: string) => {
    if (!confirm('Are you sure you want to delete this wishlist?')) return;

    try {
      const response = await fetch(`/loyalty/api/wishlist?id=${wishlistId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWishlists(prev => prev.filter(w => w.id !== wishlistId));
        if (activeWishlist?.id === wishlistId) {
          setActiveWishlist(wishlists[0] || null);
        }
      }
    } catch (error) {
      console.error('Error deleting wishlist:', error);
    }
  };

  const removeFromWishlist = async (wishlistId: string, productId: string) => {
    try {
      const response = await fetch(
        `/loyalty/api/wishlist/items?wishlistId=${wishlistId}&productId=${productId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setWishlists(prev =>
          prev.map(w => {
            if (w.id === wishlistId) {
              return {
                ...w,
                items: w.items.filter(item => item.productId !== productId),
              };
            }
            return w;
          })
        );

        if (activeWishlist?.id === wishlistId) {
          setActiveWishlist(prev =>
            prev
              ? {
                  ...prev,
                  items: prev.items.filter(
                    item => item.productId !== productId
                  ),
                }
              : null
          );
        }
      }
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
    }
  };

  const toggleWishlistPrivacy = async (
    wishlistId: string,
    isPublic: boolean
  ) => {
    try {
      const response = await fetch(`/loyalty/api/wishlist/${wishlistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      });

      if (response.ok) {
        setWishlists(prev =>
          prev.map(w => {
            if (w.id === wishlistId) {
              return { ...w, isPublic };
            }
            return w;
          })
        );

        if (activeWishlist?.id === wishlistId) {
          setActiveWishlist(prev => (prev ? { ...prev, isPublic } : null));
        }
      }
    } catch (error) {
      console.error('Error updating wishlist privacy:', error);
    }
  };

  const shareWishlist = async () => {
    if (!activeWishlist || !shareEmail.trim()) return;

    try {
      const response = await fetch(`/loyalty/api/wishlist/${activeWishlist.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: shareEmail,
          message: shareMessage,
        }),
      });

      if (response.ok) {
        setShareEmail('');
        setShareMessage('');
        setShowShareModal(false);
        // You could add a success toast here
      }
    } catch (error) {
      console.error('Error sharing wishlist:', error);
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'pre_order':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      case 'pre_order':
        return 'Pre-Order';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Loading your wishlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlists</h1>
              <p className="mt-2 text-gray-600">
                Save and organize products you love
              </p>
            </div>

            <div className="mt-4 flex items-center space-x-3 sm:mt-0">
              <button
                onClick={() => setShowShareModal(true)}
                disabled={!activeWishlist}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                <Heart className="mr-2 h-4 w-4" />
                New Wishlist
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Wishlists Sidebar */}
          <div className="lg:w-80">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Wishlists
              </h3>

              {wishlists.length === 0 ? (
                <div className="py-8 text-center">
                  <Heart className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="mb-4 text-gray-500">No wishlists yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center rounded-md border border-transparent bg-primary-50 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-100"
                  >
                    Create your first wishlist
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {wishlists.map(wishlist => (
                    <button
                      key={wishlist.id}
                      onClick={() => setActiveWishlist(wishlist)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-gray-50',
                        activeWishlist?.id === wishlist.id &&
                          'border border-primary-200 bg-primary-50'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center">
                          <Heart
                            className={cn(
                              'mr-2 h-4 w-4',
                              activeWishlist?.id === wishlist.id
                                ? 'fill-current text-primary-600'
                                : 'text-gray-400'
                            )}
                          />
                          <span
                            className={cn(
                              'truncate font-medium',
                              activeWishlist?.id === wishlist.id
                                ? 'text-primary-900'
                                : 'text-gray-900'
                            )}
                          >
                            {wishlist.name}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center">
                          {wishlist.isPublic ? (
                            <Users className="mr-1 h-3 w-3 text-green-500" />
                          ) : (
                            <Lock className="mr-1 h-3 w-3 text-gray-500" />
                          )}
                          <span className="text-xs text-gray-500">
                            {wishlist.items.length} items
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            toggleWishlistPrivacy(
                              wishlist.id,
                              !wishlist.isPublic
                            );
                          }}
                          className="cursor-pointer p-1 text-gray-400 hover:text-gray-600"
                          title={
                            wishlist.isPublic ? 'Make private' : 'Make public'
                          }
                        >
                          {wishlist.isPublic ? (
                            <Users className="h-3 w-3" />
                          ) : (
                            <Lock className="h-3 w-3" />
                          )}
                        </div>

                        <div
                          onClick={e => {
                            e.stopPropagation();
                            deleteWishlist(wishlist.id);
                          }}
                          className="cursor-pointer p-1 text-gray-400 hover:text-red-600"
                          title="Delete wishlist"
                        >
                          <Trash2 className="h-3 w-3" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeWishlist ? (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                {/* Wishlist Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {activeWishlist.name}
                      </h2>
                      <div className="mt-2 flex items-center">
                        {activeWishlist.isPublic ? (
                          <Users className="mr-2 h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="mr-2 h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-500">
                          {activeWishlist.isPublic ? 'Public' : 'Private'} •{' '}
                          {activeWishlist.items.length} items
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </button>

                      <button
                        onClick={() =>
                          toggleWishlistPrivacy(
                            activeWishlist.id,
                            !activeWishlist.isPublic
                          )
                        }
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        {activeWishlist.isPublic ? (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Make Private
                          </>
                        ) : (
                          <>
                            <Users className="mr-2 h-4 w-4" />
                            Make Public
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Wishlist Items */}
                {activeWishlist.items.length > 0 ? (
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {activeWishlist.items.map(item => (
                        <div
                          key={item.id}
                          className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
                        >
                          {/* Product Image */}
                          <div className="relative aspect-square bg-gray-100">
                            {item.product.images[0] ? (
                              <Image
                                src={item.product.images[0].url}
                                alt={item.product.images[0].alt}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <svg
                                  className="h-16 w-16"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}

                            {/* Stock Status Badge */}
                            <div className="absolute left-2 top-2">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                                  getStockStatusColor(item.product.stockStatus)
                                )}
                              >
                                {getStockStatusText(item.product.stockStatus)}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() =>
                                  removeFromWishlist(
                                    activeWishlist.id,
                                    item.productId
                                  )
                                }
                                className="rounded-full border border-gray-200 bg-white p-2 text-red-500 shadow-sm hover:bg-red-50"
                                title="Remove from wishlist"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="p-4">
                            <h3 className="mb-2 line-clamp-2 font-medium text-gray-900">
                              {item.product.name}
                            </h3>

                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-lg font-semibold text-gray-900">
                                {formatCurrency(item.product.price)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {item.product.brand}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  removeFromWishlist(
                                    activeWishlist.id,
                                    item.productId
                                  )
                                }
                                className="flex flex-1 items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </button>

                              <a
                                href={`/products/${item.product.id}`}
                                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            </div>

                            {/* Added Date */}
                            <div className="mt-3 text-xs text-gray-500">
                              Added{' '}
                              {new Date(item.addedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Heart className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      This wishlist is empty
                    </h3>
                    <p className="mb-6 text-gray-500">
                      Start adding products to your wishlist while browsing
                    </p>
                    <a
                      href="/products"
                      className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
                    >
                      Browse Products
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
                <Heart className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No wishlist selected
                </h3>
                <p className="mb-6 text-gray-500">
                  Select a wishlist from the sidebar or create a new one to get
                  started
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
                >
                  Create Wishlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Wishlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Create New Wishlist
            </h3>

            <div className="mb-4">
              <label
                htmlFor="wishlist-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Wishlist Name
              </label>
              <input
                type="text"
                id="wishlist-name"
                value={newWishlistName}
                onChange={e => setNewWishlistName(e.target.value)}
                placeholder="Enter wishlist name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createWishlist}
                disabled={!newWishlistName.trim()}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Wishlist Modal */}
      {showShareModal && activeWishlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Share Wishlist
            </h3>

            <div className="mb-4">
              <label
                htmlFor="share-email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                type="email"
                id="share-email"
                value={shareEmail}
                onChange={e => setShareEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="share-message"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Message (Optional)
              </label>
              <textarea
                id="share-message"
                value={shareMessage}
                onChange={e => setShareMessage(e.target.value)}
                placeholder="Add a personal message"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={shareWishlist}
                disabled={!shareEmail.trim()}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
