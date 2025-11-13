'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Force light theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  // Helper function to safely format currency values (handles string/number from DB)
  const formatPrice = (value: any): string => {
    const num = typeof value === 'number' ? value : parseFloat(value || '0');
    return num.toFixed(2);
  };

  const loadOrderDetails = useCallback(async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const basePath = '/loyalty';
      const response = await fetch(`${origin}${basePath}/api/orders?order_number=${orderNumber}`);
      if (response.ok) {
        const orders = await response.json();
        if (orders.length > 0) {
          setOrder(orders[0]);
        }
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    if (orderNumber) {
      loadOrderDetails();
    } else {
      router.push('/shop');
    }
  }, [orderNumber, loadOrderDetails, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Order not found</p>
          <Link href="/shop" className="text-blue-600 hover:text-blue-700">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for your order. We'll get started on it right away.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Order #{order.order_number}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {new Date(order.order_date).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                order.status === 'preparing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                order.status === 'ready' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Order Type & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {order.order_type === 'delivery' ? (
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                )}
              </svg>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {order.order_type === 'delivery' ? order.delivery_address : order.location_name}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Estimated Time
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {order.scheduled_time 
                    ? new Date(order.scheduled_time).toLocaleString()
                    : '30-45 minutes'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.order_items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.quantity}x {item.product_name}
                    </p>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.modifiers.map((m: any) => m.name).join(', ')}
                      </p>
                    )}
                    {item.special_instructions && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        Note: {item.special_instructions}
                      </p>
                    )}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${formatPrice(item.total_price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Totals */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>${formatPrice(order.subtotal)}</span>
            </div>
            {parseFloat(order.discount_amount || '0') > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>-${formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tax</span>
              <span>${formatPrice(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Total</span>
              <span>${formatPrice(order.total_amount)}</span>
            </div>
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Special Instructions
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {order.special_instructions}
              </p>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Need Help?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If you have any questions about your order, please contact us or visit the location.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/shop"
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold text-center hover:bg-blue-700 transition-colors"
          >
            Order Again
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 py-3 rounded-xl font-semibold text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}

