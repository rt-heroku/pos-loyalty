'use client';

import { useState, useEffect } from 'react';
import { X, Heart, Plus } from 'lucide-react';
import type { Wishlist } from '@/types/product';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  onAddToWishlist: (wishlistId: number, productId: number) => void;
}

export default function WishlistModal({
  isOpen,
  onClose,
  productId,
  productName,
  onAddToWishlist,
}: WishlistModalProps) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWishlists();
    }
  }, [isOpen]);

  const fetchWishlists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/loyalty/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        setWishlists(data.wishlists || []);
      }
    } catch (error) {
      console.error('Error fetching wishlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWishlist = async () => {
    if (!newWishlistName.trim()) return;

    try {
      setCreating(true);
      const response = await fetch('/loyalty/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWishlistName.trim(),
          isPublic: false,
        }),
      });

      if (response.ok) {
        const newWishlist = await response.json();
        setWishlists([newWishlist, ...wishlists]);
        setNewWishlistName('');
        setShowCreateForm(false);
        // Automatically add product to the new wishlist
        onAddToWishlist(parseInt(newWishlist.id), productId);
        onClose();
      }
    } catch (error) {
      console.error('Error creating wishlist:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleWishlistSelect = (wishlistId: number) => {
    onAddToWishlist(wishlistId, productId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Add to Wishlist
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Add "{productName}" to a wishlist
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Existing Wishlists */}
            {wishlists.map((wishlist) => (
              <button
                key={wishlist.id}
                onClick={() => handleWishlistSelect(parseInt(wishlist.id))}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">{wishlist.name}</p>
                    <p className="text-sm text-gray-500">
                      {wishlist.items?.length || 0} items
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {/* Create New Wishlist Button */}
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex w-full items-center space-x-3 rounded-lg border-2 border-dashed border-gray-300 p-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <Plus className="h-5 w-5 text-primary-600" />
                <span className="font-medium text-primary-600">
                  Create New Wishlist
                </span>
              </button>
            ) : (
              <div className="rounded-lg border border-gray-200 p-3">
                <input
                  type="text"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                  placeholder="Enter wishlist name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  autoFocus
                />
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={createWishlist}
                    disabled={!newWishlistName.trim() || creating}
                    className="rounded-md bg-primary-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-300"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewWishlistName('');
                    }}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
