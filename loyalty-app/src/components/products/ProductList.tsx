'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Eye,
  Share2,
  Clock,
  MapPin,
} from 'lucide-react';
import { Product } from '@/types/product';
import { useAuth } from '@/contexts/AuthContext';
import { cn, formatCurrency } from '@/lib/utils';
import WishlistModal from './WishlistModal';

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [loadingStates, setLoadingStates] = useState<Set<string>>(new Set());
  const [wishlistModal, setWishlistModal] = useState<{
    isOpen: boolean;
    productId: number;
    productName: string;
  }>({
    isOpen: false,
    productId: 0,
    productName: '',
  });

  const toggleWishlist = async (productId: string) => {
    if (!user) return;

    setLoadingStates(prev => new Set(prev).add(productId));

    try {
      const isInWishlist = wishlistItems.has(productId);
      const response = await fetch('/loyalty/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        setWishlistItems(prev => {
          const newSet = new Set(prev);
          if (isInWishlist) {
            newSet.delete(productId);
          } else {
            newSet.add(productId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setLoadingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleAddToWishlist = (productId: number, productName: string) => {
    setWishlistModal({
      isOpen: true,
      productId,
      productName,
    });
  };

  const handleWishlistSelect = async (wishlistId: number, productId: number) => {
    try {
      const response = await fetch('/loyalty/api/wishlist/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wishlistId,
          productId,
        }),
      });

      if (response.ok) {
        // Show success message or update UI
        console.log('Product added to wishlist successfully');
      }
    } catch (error) {
      console.error('Error adding product to wishlist:', error);
    }
  };

  const shareProduct = async (product: Product) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: `${window.location.origin}/products/${product.id}`,
        });
      } catch (error) {
        console.error('Error sharing product:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const url = `${window.location.origin}/products/${product.id}`;
      try {
        await navigator.clipboard.writeText(url);
        // You could add a toast notification here
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
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

  return (
    <>
      <div className="space-y-4 p-6">
      {products.map(product => {
        const isInWishlist = wishlistItems.has(product.id);
        const isLoading = loadingStates.has(product.id);
        const primaryImage =
          product.images.find(img => img.isPrimary) || product.images[0];

        return (
          <div
            key={product.id}
            className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="flex">
              {/* Product Image */}
              <div className="h-48 w-48 flex-shrink-0 overflow-hidden bg-gray-100">
                {primaryImage ? (
                  <Link href={`/loyalty/products/${product.id}`}>
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.alt}
                      width={192}
                      height={192}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </Link>
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
              </div>

              {/* Product Info */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Badges */}
                    <div className="mb-3 flex items-center gap-2">
                      {product.isFeatured && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          Featured
                        </span>
                      )}
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                          getStockStatusColor(product.stockStatus)
                        )}
                      >
                        {getStockStatusText(product.stockStatus)}
                      </span>
                    </div>

                    {/* Category and Brand */}
                    <div className="mb-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>{product.category}</span>
                      <span>•</span>
                      <span>{product.brand}</span>
                      <span>•</span>
                      <span>SKU: {product.sku}</span>
                    </div>

                    {/* Product Name */}
                    <Link href={`/loyalty/products/${product.id}`}>
                      <h3 className="mb-2 text-xl font-semibold text-gray-900 transition-colors duration-200 group-hover:text-primary-600">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Description */}
                    <p className="mb-4 line-clamp-2 text-gray-600">
                      {product.description}
                    </p>

                    {/* Product Type */}
                    <div className="mb-4">
                      <span className="text-sm text-gray-500">
                        {product.productType}
                      </span>
                    </div>

                    {/* Product Details */}
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-sm text-gray-500">Brand:</span>
                      <span className="text-sm font-medium">{product.brand}</span>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="ml-6 flex flex-col items-end space-y-4">
                    {/* Price */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        disabled={isLoading}
                        className={cn(
                          'flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200',
                          isInWishlist
                            ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
                          isLoading && 'cursor-not-allowed opacity-50'
                        )}
                        title={
                          isInWishlist
                            ? 'Remove from wishlist'
                            : 'Add to wishlist'
                        }
                      >
                        <Heart
                          className={cn(
                            'mr-2 h-4 w-4',
                            isInWishlist && 'fill-current'
                          )}
                        />
                        {isInWishlist ? 'Saved' : 'Save'}
                      </button>

                      <button
                        onClick={() => shareProduct(product)}
                        className="flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100"
                        title="Share product"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      <span>
                        Added {new Date(product.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      <span>
                        Available in {product.stockQuantity} locations
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/loyalty/products/${product.id}`}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>

                    <button
                      onClick={() => {
                        if (!user) {
                          // Redirect to login or show login modal
                          return;
                        }
                        handleAddToWishlist(parseInt(product.id), product.name);
                      }}
                      disabled={product.stockStatus === 'out_of_stock'}
                      className={cn(
                        'inline-flex items-center rounded-md px-6 py-2 text-sm font-medium transition-colors duration-200',
                        product.stockStatus === 'out_of_stock'
                          ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      )}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      {product.stockStatus === 'out_of_stock'
                        ? 'Out of Stock'
                        : 'Add to Wishlist'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    <WishlistModal
      isOpen={wishlistModal.isOpen}
      onClose={() => setWishlistModal({ isOpen: false, productId: 0, productName: '' })}
      productId={wishlistModal.productId}
      productName={wishlistModal.productName}
      onAddToWishlist={handleWishlistSelect}
    />
    </>
  );
}
