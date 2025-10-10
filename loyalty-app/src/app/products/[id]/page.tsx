'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Heart,
  Share2,
  Star,
  ArrowLeft,
  Minus,
  Plus,
  Truck,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Product } from '@/types/product';
import WishlistModal from '@/components/products/WishlistModal';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistModal, setWishlistModal] = useState<{
    isOpen: boolean;
    productId: number;
    productName: string;
  }>({
    isOpen: false,
    productId: 0,
    productName: '',
  });

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/loyalty/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
        setRelatedProducts(data.relatedProducts);
      } else {
        console.error('Failed to load product');
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const trackProductView = useCallback(async () => {
    try {
      await fetch('/loyalty/api/products/recently-viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id }),
      });
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
    if (user) {
      trackProductView();
    }
  }, [loadProduct, trackProductView, user]);

  const toggleWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setWishlistLoading(true);
      if (isInWishlist) {
        // Remove from wishlist
        await fetch('/loyalty/api/wishlist/items?wishlistId=default&productId=' + id, {
          method: 'DELETE',
        });
        setIsInWishlist(false);
      } else {
        // Add to wishlist
        await fetch('/loyalty/api/wishlist/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wishlistId: 'default',
            productId: id,
          }),
        });
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setWishlistLoading(false);
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
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error adding product to wishlist:', error);
    }
  };

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'Product',
          text: product?.description || 'Check out this product',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
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
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="h-96 rounded bg-gray-200"></div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="h-20 w-20 rounded bg-gray-200"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 w-3/4 rounded bg-gray-200"></div>
                <div className="h-6 w-1/2 rounded bg-gray-200"></div>
                <div className="h-4 w-full rounded bg-gray-200"></div>
                <div className="h-4 w-2/3 rounded bg-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-semibold text-gray-900">
            Product not found
          </h1>
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative h-96 overflow-hidden rounded-lg bg-white">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={
                    product.images[currentImageIndex]?.url ||
                    '/placeholder-product.jpg'
                  }
                  alt={product.images[currentImageIndex]?.alt || product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 ${
                      index === currentImageIndex
                        ? 'border-primary-500'
                        : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <div className="mb-2 flex items-center space-x-2">
                {product.isFeatured && (
                  <span className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                    Featured
                  </span>
                )}
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${getStockStatusColor(product.stockStatus || 'in_stock')}`}
                >
                  {getStockStatusText(product.stockStatus || 'in_stock')}
                </span>
              </div>

              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                {product.name}
              </h1>

              <div className="mb-4 flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">
                    {product.productType}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  SKU: {product.sku}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-gray-900">
                ${(product.price || 0).toFixed(2)}
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Description
              </h3>
              <p className="leading-relaxed text-gray-600">
                {product.description}
              </p>
            </div>

            {/* Product Details */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Product Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Brand:</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Material:</span>
                  <span className="font-medium">{product.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Color:</span>
                  <span className="font-medium">{product.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimensions:</span>
                  <span className="font-medium">{product.dimensions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">{product.weight} lbs</span>
                </div>
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">
                  Quantity:
                </label>
                <div className="flex items-center rounded-lg border border-gray-300">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (!user) {
                      router.push('/login');
                      return;
                    }
                    handleAddToWishlist(parseInt(product.id), product.name);
                  }}
                  disabled={product.stockStatus === 'out_of_stock'}
                  className="flex flex-1 items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Add to Wishlist
                </button>

                <button
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  className={`rounded-lg border-2 p-3 ${
                    isInWishlist
                      ? 'border-red-500 text-red-500 hover:bg-red-50'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`}
                  />
                </button>

                <button
                  onClick={shareProduct}
                  className="rounded-lg border-2 border-gray-300 p-3 text-gray-600 hover:border-gray-400"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Product Features */}
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Free shipping</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Secure payment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-gray-600">
                    Quality guarantee
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Related Products
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map(relatedProduct => (
                <div
                  key={relatedProduct.id}
                  onClick={() => router.push(`/products/${relatedProduct.id}`)}
                  className="cursor-pointer rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="aspect-square rounded-t-lg bg-gray-200"></div>
                  <div className="p-4">
                    <h3 className="mb-2 font-medium text-gray-900">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">
                        ${(relatedProduct.price || 0).toFixed(2)}
                      </span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600">
                          {relatedProduct.productType}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <WishlistModal
        isOpen={wishlistModal.isOpen}
        onClose={() => setWishlistModal({ isOpen: false, productId: 0, productName: '' })}
        productId={wishlistModal.productId}
        productName={wishlistModal.productName}
        onAddToWishlist={handleWishlistSelect}
      />
    </div>
  );
}
