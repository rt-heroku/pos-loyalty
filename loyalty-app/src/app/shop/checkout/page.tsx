'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

// =====================================================
// TYPES
// =====================================================

interface CartItem {
  product: {
    id: number;
    name: string;
    price: number;
    main_image_url: string;
  };
  quantity: number;
  modifiers: { id: number; name: string; price: number }[];
  special_instructions: string;
  item_total: number;
}

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  icon: string;
  requires_online_payment: boolean;
}

interface Location {
  id: number;
  store_name: string;
  address: string;
}

// =====================================================
// CHECKOUT PAGE
// =====================================================

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest') === 'true';

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Guest checkout fields
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Delivery fields
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Order instructions
  const [orderInstructions, setOrderInstructions] = useState('');

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadCheckoutData = useCallback(async () => {
    // Load cart from session storage
    const cartData = sessionStorage.getItem('checkout_cart');
    if (cartData) {
      setCart(JSON.parse(cartData));
    } else {
      router.push('/shop');
      return;
    }

    // Load user if authenticated
    if (!isGuest) {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Pre-fill delivery address if available
        if (parsedUser.address) {
          setDeliveryAddress(parsedUser.address);
        }
      }
    }

    // Load payment methods
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const pmRes = await fetch(`${basePath}/api/payment-methods`);
      if (pmRes.ok) {
        const methods = await pmRes.json();
        setPaymentMethods(methods);
        if (methods.length > 0) {
          setSelectedPaymentMethod(methods[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }

    // Load locations
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const locRes = await fetch(`${basePath}/api/locations`);
      if (locRes.ok) {
        const locs = await locRes.json();
        setLocations(locs);
        if (locs.length > 0) {
          setSelectedLocation(locs[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }, [router, isGuest]);

  useEffect(() => {
    loadCheckoutData();
  }, [loadCheckoutData]);

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.item_total, 0);
  };

  const calculateDeliveryFee = () => {
    return orderType === 'delivery' ? 5.00 : 0;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.085; // 8.5% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee() + calculateTax();
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const canPlaceOrder = () => {
    if (cart.length === 0) return false;
    if (!selectedPaymentMethod) return false;
    if (!selectedLocation) return false;

    if (isGuest) {
      if (!guestName.trim() || !guestPhone.trim() || !guestEmail.trim()) return false;
    }

    if (orderType === 'delivery') {
      if (!deliveryAddress.trim()) return false;
    }

    return true;
  };

  // =====================================================
  // PLACE ORDER
  // =====================================================

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder()) return;

    setLoading(true);

    try {
      const orderData = {
        customer_id: user?.id || null,
        location_id: selectedLocation,
        order_type: orderType,
        origin: 'mobile',
        status: 'pending',
        payment_method_id: selectedPaymentMethod,
        scheduled_time: scheduledTime || null,
        special_instructions: orderInstructions || null,
        
        // Guest info
        guest_name: isGuest ? guestName : null,
        guest_phone: isGuest ? guestPhone : null,
        guest_email: isGuest ? guestEmail : null,
        
        // Delivery info
        delivery_address: orderType === 'delivery' ? deliveryAddress : null,
        delivery_instructions: orderType === 'delivery' ? deliveryInstructions : null,
        
        // Order items
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          modifiers: item.modifiers,
          special_instructions: item.special_instructions || null
        })),
        
        // Totals
        subtotal: calculateSubtotal(),
        tax_amount: calculateTax(),
        total_amount: calculateTotal()
      };

      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/api/orders/online`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const order = await response.json();
        
        // Clear cart
        sessionStorage.removeItem('checkout_cart');
        
        // Redirect to confirmation
        router.push(`/shop/confirmation?order=${order.order_number}`);
      } else {
        const error = await response.json();
        alert(`Failed to place order: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Shop
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Guest Info */}
            {isGuest && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Your Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Order Type */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Order Type
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    orderType === 'pickup'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <div className="font-semibold text-gray-900 dark:text-white">Pickup</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Free</div>
                </button>
                
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    orderType === 'delivery'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  <div className="font-semibold text-gray-900 dark:text-white">Delivery</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">$5.00</div>
                </button>
              </div>
            </div>

            {/* Location Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {orderType === 'pickup' ? 'Pickup Location' : 'Delivery From'}
              </h2>
              <select
                value={selectedLocation || ''}
                onChange={(e) => setSelectedLocation(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.store_name} - {location.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Address */}
            {orderType === 'delivery' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Delivery Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address *
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="123 Main St, Apt 4B, City, State 12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Delivery Instructions
                    </label>
                    <textarea
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ring doorbell, leave at door, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Scheduled Time */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                When do you want it?
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={!scheduledTime}
                      onChange={() => setScheduledTime('')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900 dark:text-white">ASAP (30-45 min)</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="radio"
                      checked={!!scheduledTime}
                      onChange={() => setScheduledTime(new Date().toISOString().slice(0, 16))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900 dark:text-white">Schedule for later</span>
                  </label>
                  {scheduledTime && (
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Payment Method
              </h2>
              <div className="space-y-3">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPaymentMethod === method.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {selectedPaymentMethod === method.id && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Instructions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Order Instructions
              </h2>
              <textarea
                value={orderInstructions}
                onChange={(e) => setOrderInstructions(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Any special requests for your order?"
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {cart.map((item, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {item.product.main_image_url && (
                      <Image
                        src={item.product.main_image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    )}
                  </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${item.item_total.toFixed(2)}
                        </span>
                      </div>
                      {item.modifiers.length > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {item.modifiers.map(m => m.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Delivery Fee</span>
                    <span>${calculateDeliveryFee().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder() || loading}
                className={`w-full mt-6 py-4 rounded-xl font-semibold transition-colors ${
                  canPlaceOrder() && !loading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

