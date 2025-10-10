'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { X, Plus, Heart, Share2, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types/product';
import { useAuth } from '@/contexts/AuthContext';

export default function ProductComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const productIds = searchParams.get('products')?.split(',') || [];
    if (productIds.length > 0) {
      loadProducts(productIds);
    }
  }, [searchParams]);

  const loadProducts = async (productIds: string[]) => {
    try {
      setLoading(true);
      const productPromises = productIds.map(id =>
        fetch(`/loyalty/api/products/${id}`).then(res => res.json())
      );

      const results = await Promise.all(productPromises);
      const loadedProducts = results.map(result => result.product);
      setProducts(loadedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProductToCompare = () => {
    // This would typically open a product selector modal
    router.push('/products');
  };

  const removeProduct = (productId: string) => {
    const newProducts = products.filter(p => p.id !== productId);
    setProducts(newProducts);

    // Update URL
    const newIds = newProducts.map(p => p.id).join(',');
    if (newIds) {
      router.push(`/products/compare?products=${newIds}`);
    } else {
      router.push('/products');
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const isInWishlist = wishlistItems.has(productId);

      if (isInWishlist) {
        // Remove from wishlist
        await fetch(
          `/loyalty/api/wishlist/items?wishlistId=default&productId=${productId}`,
          {
            method: 'DELETE',
          }
        );
        setWishlistItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      } else {
        // Add to wishlist
        await fetch('/loyalty/api/wishlist/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wishlistId: 'default',
            productId,
          }),
        });
        setWishlistItems(prev => new Set(Array.from(prev).concat(productId)));
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const shareComparison = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Product Comparison',
          text: 'Check out this product comparison',
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Comparison link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'text-green-600 bg-green-100';
      case 'low_stock':
        return 'text-yellow-600 bg-yellow-100';
      case 'out_of_stock':
        return 'text-red-600 bg-red-100';
      case 'pre_order':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-8 h-8 w-1/4 rounded bg-gray-200"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <div className="h-48 rounded bg-gray-200"></div>
                  <div className="h-6 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">
              Product Comparison
            </h1>
            <p className="mb-6 text-gray-600">
              No products selected for comparison
            </p>
            <button
              onClick={addProductToCompare}
              className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700"
            >
              <Plus className="mr-2 inline h-5 w-5" />
              Add Products to Compare
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Product Comparison
            </h1>
            <p className="mt-2 text-gray-600">
              Compare {products.length} product
              {products.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={addProductToCompare}
              className="flex items-center rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </button>

            <button
              onClick={shareComparison}
              className="flex items-center rounded-lg bg-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-700"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                    Features
                  </th>
                  {products.map(product => (
                    <th key={product.id} className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="ml-auto text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-gray-200">
                          {product.images &&
                          product.images.length > 0 &&
                          product.images[0] ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.images[0].alt}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200">
                              <span className="text-xs text-gray-400">
                                No image
                              </span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-center text-sm font-medium text-gray-900">
                          {product.name}
                        </h3>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleWishlist(product.id)}
                            className={`rounded-lg border-2 p-2 ${
                              wishlistItems.has(product.id)
                                ? 'border-red-500 text-red-500 hover:bg-red-50'
                                : 'border-gray-300 text-gray-600 hover:border-gray-400'
                            }`}
                          >
                            <Heart
                              className={`h-4 w-4 ${wishlistItems.has(product.id) ? 'fill-current' : ''}`}
                            />
                          </button>

                          <button
                            onClick={() =>
                              router.push(`/products/${product.id}`)
                            }
                            className="rounded-lg border-2 border-gray-300 p-2 text-gray-600 hover:border-gray-400"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {/* Price */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Price
                  </td>
                  {products.map(product => (
                    <td key={product.id} className="px-6 py-4 text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-gray-900">
                          ${product.price.toFixed(2)}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Product Type */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Product Type
                  </td>
                  {products.map(product => (
                    <td key={product.id} className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-600">
                        {product.productType}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Stock Status */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Stock Status
                  </td>
                  {products.map(product => (
                    <td key={product.id} className="px-6 py-4 text-center">
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${getStockStatusColor(product.stockStatus)}`}
                      >
                        {getStockStatusText(product.stockStatus)}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Brand */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Brand
                  </td>
                  {products.map(product => (
                    <td
                      key={product.id}
                      className="px-6 py-4 text-center text-sm text-gray-600"
                    >
                      {product.brand}
                    </td>
                  ))}
                </tr>

                {/* Category */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Category
                  </td>
                  {products.map(product => (
                    <td
                      key={product.id}
                      className="px-6 py-4 text-center text-sm text-gray-600"
                    >
                      {product.category}
                    </td>
                  ))}
                </tr>

                {/* Features */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Features
                  </td>
                  {products.map(product => (
                    <td key={product.id} className="px-6 py-4 text-center">
                      <div className="flex flex-wrap justify-center gap-2">
                        {product.isFeatured && (
                          <span className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Actions
                  </td>
                  {products.map(product => (
                    <td key={product.id} className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          /* Add to cart functionality */
                        }}
                        disabled={product.stockStatus === 'out_of_stock'}
                        className="flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {products.length < 2 && (
          <div className="mt-8 text-center">
            <p className="mb-4 text-gray-600">
              Add more products to see a detailed comparison
            </p>
            <button
              onClick={addProductToCompare}
              className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700"
            >
              <Plus className="mr-2 inline h-5 w-5" />
              Add More Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
