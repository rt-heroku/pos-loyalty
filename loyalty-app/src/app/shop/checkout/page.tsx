'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import VoucherSelector from '@/components/shop/VoucherSelector';

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
 const [deliveryService, setDeliveryService] = useState<'grubhub' | 'ubereats' | null>(null);

 // Order instructions
 const [orderInstructions, setOrderInstructions] = useState('');

 // Voucher state
 const [vouchers, setVouchers] = useState<any[]>([]);
 const [appliedVouchers, setAppliedVouchers] = useState<any[]>([]);
 const [voucherLoading, setVoucherLoading] = useState(false);

 // =====================================================
 // LOAD DATA
 // =====================================================

 const loadCheckoutData = useCallback(async () => {
 console.log('[Checkout] Loading checkout data...');
 console.log('[Checkout] isGuest param:', isGuest);
 
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
 console.log('[Checkout] Not guest mode, loading user data...');
 const userData = localStorage.getItem('user');
 console.log('[Checkout] User data exists:', !!userData);
 console.log('[Checkout] Raw user data:', userData);
 
 if (userData) {
 const parsedUser = JSON.parse(userData);
 console.log('[Checkout] Parsed user:', parsedUser);
 console.log('[Checkout] User ID field check - id:', parsedUser.id, 'user_id:', parsedUser.user_id, 'userId:', parsedUser.userId);
 setUser(parsedUser);
 
 // Get user ID from whichever field exists
 const userId = parsedUser.id || parsedUser.user_id || parsedUser.userId;
 console.log('[Checkout] Using user ID:', userId);
 
 if (!userId) {
 console.error('[Checkout] ❌ No user ID found in user object!');
 }
 
 // Fetch full customer profile from API
 try {
 const origin = typeof window !== 'undefined' ? window.location.origin : '';
 const basePath = '/loyalty';
 const profileUrl = `${origin}${basePath}/api/customers/profile?user_id=${userId}`;
 console.log('[Checkout] Fetching profile from:', profileUrl);
 
 const profileRes = await fetch(profileUrl);
 console.log('[Checkout] Profile response status:', profileRes.status);
 
 if (profileRes.ok) {
 const profileData = await profileRes.json();
 console.log('[Checkout] Profile data received:', profileData);
 
 const profile = profileData.customer || profileData;
 
 // Pre-fill user information from profile
 const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
 console.log('[Checkout] Setting name:', fullName);
 if (fullName) setGuestName(fullName);
 
 console.log('[Checkout] Setting phone:', profile.phone);
 if (profile.phone) setGuestPhone(profile.phone);
 
 console.log('[Checkout] Setting email:', profile.email);
 if (profile.email) setGuestEmail(profile.email);
 
 // Pre-fill delivery address if available
 if (profile.address_line1) {
 const fullAddress = `${profile.address_line1}${profile.address_line2 ? ', ' + profile.address_line2 : ''}`;
 console.log('[Checkout] Setting address:', fullAddress);
 setDeliveryAddress(fullAddress);
 }
 } else {
 console.error('[Checkout] Profile fetch failed:', await profileRes.text());
 }
 } catch (error) {
 console.error('[Checkout] Error loading customer profile:', error);
 }
 } else {
 console.log('[Checkout] No user data in localStorage');
 }
 } else {
 console.log('[Checkout] Guest mode - skipping user data load');
 }

 // Load payment methods
 try {
 const origin = typeof window !== 'undefined' ? window.location.origin : '';
 const basePath = '/loyalty';
 const pmRes = await fetch(`${origin}${basePath}/api/payment-methods`);
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
 const origin = typeof window !== 'undefined' ? window.location.origin : '';
 const basePath = '/loyalty';
 const locRes = await fetch(`${origin}${basePath}/api/locations`);
 if (locRes.ok) {
 const locs = await locRes.json();
 setLocations(locs);
 
 // Pre-select location from shop page if available
 const savedLocationData = sessionStorage.getItem('checkout_location');
 if (savedLocationData) {
 const savedLocation = JSON.parse(savedLocationData);
 setSelectedLocation(savedLocation.id);
 } else if (locs.length > 0) {
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
 // VOUCHER LOGIC
 // =====================================================

 const loadVouchers = useCallback(async () => {
 if (isGuest) {
 console.log('[Checkout] Guest mode, skipping voucher load');
 return;
 }

 const userData = localStorage.getItem('user');
 if (!userData) {
 console.log('[Checkout] No user data, skipping voucher load');
 return;
 }

 try {
 const user = JSON.parse(userData);
 const customerId = user.id;
 
 if (!customerId) {
 console.log('[Checkout] No customer ID found');
 return;
 }

 setVoucherLoading(true);
 console.log('[Checkout] Loading vouchers for customer:', customerId);
 
 const origin = typeof window !== 'undefined' ? window.location.origin : '';
 const basePath = '/loyalty';
 const response = await fetch(`${origin}${basePath}/api/customers/${customerId}/vouchers`);
 const data = await response.json();

 if (data.success) {
 // Filter out expired vouchers
 const now = new Date();
 const activeVouchers = (data.vouchers || []).filter((v: any) => {
 if (!v.expiration_date) return true;
 return new Date(v.expiration_date) > now;
 });
 
 console.log('[Checkout] Loaded:', activeVouchers.length, 'active vouchers');
 setVouchers(activeVouchers);

 // Restore applied vouchers from sessionStorage
 const savedAppliedVouchers = sessionStorage.getItem('checkout_applied_vouchers');
 if (savedAppliedVouchers) {
 const appliedIds = JSON.parse(savedAppliedVouchers);
 const restoredVouchers = activeVouchers.filter((v: any) => appliedIds.includes(v.id));
 console.log('[Checkout] Restored:', restoredVouchers.length, 'applied vouchers');
 setAppliedVouchers(restoredVouchers);
 }
 }
 } catch (error) {
 console.error('[Checkout] Error loading vouchers:', error);
 } finally {
 setVoucherLoading(false);
 }
 }, [isGuest]);

 useEffect(() => {
 if (!isGuest) {
 loadVouchers();
 }
 }, [isGuest, loadVouchers]);

 const handleApplyVoucher = (voucher: any) => {
 console.log('[Checkout] Applying voucher:', voucher.voucher_code);
 
 if (appliedVouchers.find(v => v.id === voucher.id)) {
 console.log('[Checkout] Voucher already applied');
 return;
 }

 // For product-specific vouchers, check if the product is in cart
 if (voucher.voucher_type === 'ProductSpecific' && voucher.product_id) {
 const productInCart = cart.find(item => item.product.id === voucher.product_id);
 if (!productInCart) {
 alert(`This voucher requires "${voucher.product_name || 'the specified product'}" to be in your cart.`);
 return;
 }
 }

 const updated = [...appliedVouchers, voucher];
 setAppliedVouchers(updated);
 
 // Save to sessionStorage
 sessionStorage.setItem('checkout_applied_vouchers', JSON.stringify(updated.map(v => v.id)));
 console.log('[Checkout] ✅ Voucher applied successfully');
 };

 const handleRemoveVoucher = (voucher: any) => {
 console.log('[Checkout] Removing voucher:', voucher.voucher_code);
 const updated = appliedVouchers.filter(v => v.id !== voucher.id);
 setAppliedVouchers(updated);
 
 // Update sessionStorage
 if (updated.length > 0) {
 sessionStorage.setItem('checkout_applied_vouchers', JSON.stringify(updated.map(v => v.id)));
 } else {
 sessionStorage.removeItem('checkout_applied_vouchers');
 }
 };

 const calculateVoucherDiscount = () => {
 if (appliedVouchers.length === 0) return 0;
 
 const subtotal = calculateSubtotal();
 let totalDiscount = 0;

 appliedVouchers.forEach(voucher => {
 switch (voucher.voucher_type) {
 case 'Value':
 const valueAmount = voucher.remaining_value || voucher.face_value || 0;
 const sortedCart = [...cart].sort((a, b) => a.item_total - b.item_total);
 let remainingValue = parseFloat(valueAmount.toString());
 let voucherDiscount = 0;

 for (const item of sortedCart) {
 if (remainingValue <= 0) break;
 const itemTotal = item.item_total * item.quantity;
 const discountForItem = Math.min(remainingValue, itemTotal);
 voucherDiscount += discountForItem;
 remainingValue -= discountForItem;
 }

 totalDiscount += voucherDiscount;
 break;

 case 'Discount':
 totalDiscount += subtotal * (voucher.discount_percent / 100);
 break;

 case 'ProductSpecific':
 const productItems = cart.filter(item => item.product.id === voucher.product_id);
 const productSubtotal = productItems.reduce((sum, item) => sum + (item.item_total * item.quantity), 0);
 
 if (voucher.discount_percent) {
 totalDiscount += productSubtotal * (voucher.discount_percent / 100);
 } else if (voucher.face_value) {
 totalDiscount += Math.min(parseFloat(voucher.face_value.toString()), productSubtotal);
 }
 break;
 }
 });

 console.log('[Checkout] Total voucher discount:', totalDiscount);
 return totalDiscount;
 };

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
 const voucherDiscount = calculateVoucherDiscount();
 const subtotalAfterVouchers = subtotal - voucherDiscount;
 return subtotalAfterVouchers * 0.085; // 8.5% tax
 };

 const calculateTotal = () => {
 const subtotal = calculateSubtotal();
 const voucherDiscount = calculateVoucherDiscount();
 return subtotal - voucherDiscount + calculateDeliveryFee() + calculateTax();
 };

 // =====================================================
 // VALIDATION
 // =====================================================

 const canPlaceOrder = () => {
 if (cart.length === 0) return false;
 if (!selectedPaymentMethod) return false;
 if (!selectedLocation) return false;

 // Always require name, phone, and email (for both guest and authenticated users)
 if (!guestName.trim() || !guestPhone.trim() || !guestEmail.trim()) return false;

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
 const voucherDiscount = calculateVoucherDiscount();
 
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
 
 // Vouchers
 voucher_id: appliedVouchers.length > 0 ? appliedVouchers[0].id : null,
 voucher_discount: voucherDiscount > 0 ? voucherDiscount : 0,
 applied_voucher_ids: appliedVouchers.map(v => v.id),
 
 // Totals
 subtotal: calculateSubtotal(),
 discount_amount: voucherDiscount,
 tax_amount: calculateTax(),
 total_amount: calculateTotal()
 };

 const origin = typeof window !== 'undefined' ? window.location.origin : '';
 const basePath = '/loyalty';
 const response = await fetch(`${origin}${basePath}/api/orders/online`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify(orderData)
 });

 if (response.ok) {
 const order = await response.json();
 
 // Clear cart and vouchers
 sessionStorage.removeItem('checkout_cart');
 sessionStorage.removeItem('checkout_applied_vouchers');
 
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
 <div className="min-h-screen flex items-center justify-center bg-gray-50">
 <div className="text-center">
 <p className="text-gray-600 mb-4">Loading checkout...</p>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50 py-6">
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
 <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left Column - Checkout Form */}
 <div className="lg:col-span-2 space-y-6">
 
 {/* Customer Info - Always show, pre-filled if authenticated */}
 <div className="bg-white rounded-xl shadow-sm p-6">
 <h2 className="text-xl font-semibold text-gray-900 mb-4">
 Your Information
 </h2>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
 Full Name *
 </label>
                <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Max Mule"
                />
 {!isGuest && user && (
 <p className="text-xs text-gray-500 mt-1">Pre-filled from your profile</p>
 )}
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
 Phone Number *
 </label>
 <input
 type="tel"
 value={guestPhone}
 onChange={(e) => setGuestPhone(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 placeholder="(555) 123-4567"
 />
 {!isGuest && user && (
 <p className="text-xs text-gray-500 mt-1">Pre-filled from your profile</p>
 )}
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
 Email Address *
 </label>
 <input
 type="email"
 value={guestEmail}
 onChange={(e) => setGuestEmail(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 placeholder="john@example.com"
 />
 {!isGuest && user && (
 <p className="text-xs text-gray-500 mt-1">Pre-filled from your profile</p>
 )}
 </div>
 </div>
 </div>

 {/* Order Type */}
 <div className="bg-white rounded-xl shadow-sm p-6">
 <h2 className="text-xl font-semibold text-gray-900 mb-4">
 Order Type
 </h2>
 <div className="grid grid-cols-2 gap-4">
 <button
 onClick={() => setOrderType('pickup')}
 className={`p-4 rounded-lg border-2 transition-colors ${
 orderType === 'pickup'
 ? 'border-blue-600 bg-blue-50 '
 : 'border-gray-200 hover:border-gray-300'
 }`}
 >
 <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
 </svg>
 <div className="font-semibold text-gray-900">Pickup</div>
 <div className="text-sm text-gray-600">Free</div>
 </button>
 
 <button
 onClick={() => setOrderType('delivery')}
 className={`p-4 rounded-lg border-2 transition-colors ${
 orderType === 'delivery'
 ? 'border-blue-600 bg-blue-50 '
 : 'border-gray-200 hover:border-gray-300'
 }`}
 >
 <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
 </svg>
 <div className="font-semibold text-gray-900">Delivery</div>
 <div className="text-sm text-gray-600">$5.00</div>
 </button>
 </div>
 </div>

 {/* Location Selection */}
 <div className="bg-white rounded-xl shadow-sm p-6">
 <h2 className="text-xl font-semibold text-gray-900 mb-4">
 {orderType === 'pickup' ? 'Pickup Location' : 'Delivery From'}
 </h2>
 <select
 value={selectedLocation || ''}
 onChange={(e) => setSelectedLocation(parseInt(e.target.value))}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
 <div className="bg-white rounded-xl shadow-sm p-6">
 <h2 className="text-xl font-semibold text-gray-900 mb-4">
 Delivery Address
 </h2>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
 Address *
 </label>
 <textarea
 value={deliveryAddress}
 onChange={(e) => setDeliveryAddress(e.target.value)}
 rows={3}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 placeholder="123 Main St, Apt 4B, City, State 12345"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
 Delivery Instructions
 </label>
 <textarea
 value={deliveryInstructions}
 onChange={(e) => setDeliveryInstructions(e.target.value)}
 rows={2}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 placeholder="Ring doorbell, leave at door, etc."
 />
 </div>
 
 {/* Delivery Service Selection */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-3">
 Send order to:
 </label>
 <div className="grid grid-cols-2 gap-4">
 <button
 type="button"
 onClick={() => setDeliveryService('grubhub')}
 className={`p-4 rounded-lg border-2 transition-all ${
 deliveryService === 'grubhub'
 ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
 : 'border-gray-200 hover:border-gray-300'
 }`}
 >
 <div className="flex items-center justify-center h-16">
 <Image
 src="https://www.grubhub.com/assets/img/grubhub-logo.svg"
 alt="Grubhub"
 width={120}
 height={40}
 className="object-contain"
 onError={(e) => {
 // Fallback to text if image fails
 e.currentTarget.style.display = 'none';
 e.currentTarget.nextElementSibling?.classList.remove('hidden');
 }}
 />
 <span className="hidden text-lg font-bold text-orange-600">Grubhub</span>
 </div>
 </button>
 
 <button
 type="button"
 onClick={() => setDeliveryService('ubereats')}
 className={`p-4 rounded-lg border-2 transition-all ${
 deliveryService === 'ubereats'
 ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
 : 'border-gray-200 hover:border-gray-300'
 }`}
 >
 <div className="flex items-center justify-center h-16">
 <Image
 src="https://d3i4yxtzktqr9n.cloudfront.net/web-eats-v2/97c43f8974e6c876.svg"
 alt="Uber Eats"
 width={120}
 height={40}
 className="object-contain"
 onError={(e) => {
 // Fallback to text if image fails
 e.currentTarget.style.display = 'none';
 e.currentTarget.nextElementSibling?.classList.remove('hidden');
 }}
 />
 <span className="hidden text-lg font-bold text-green-600">Uber Eats</span>
 </div>
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Scheduled Time */}
 <div className="bg-white rounded-xl shadow-sm p-6">
 <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
 <span className="text-gray-900">ASAP (30-45 min)</span>
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
 <span className="text-gray-900">Schedule for later</span>
 </label>
 {scheduledTime && (
 <input
 type="datetime-local"
 value={scheduledTime}
 onChange={(e) => setScheduledTime(e.target.value)}
 min={new Date().toISOString().slice(0, 16)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 />
 )}
 </div>
 </div>
 </div>

 {/* Payment Method */}
 <div className="bg-white rounded-xl shadow-sm p-6">
 <h2 className="text-xl font-semibold text-gray-900 mb-4">
 Payment Method
 </h2>
 <div className="space-y-3">
 {paymentMethods.map(method => (
 <button
 key={method.id}
 onClick={() => setSelectedPaymentMethod(method.id)}
 className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
 selectedPaymentMethod === method.id
 ? 'border-blue-600 bg-blue-50 '
 : 'border-gray-200 hover:border-gray-300'
 }`}
 >
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedPaymentMethod === method.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === method.id && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {/* Payment Icon */}
                  {method.icon && (
                    <div className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg flex-shrink-0">
                      {method.icon.startsWith('/') ? (
                        <Image
                          src={method.icon}
                          alt={method.name}
                          width={40}
                          height={40}
                          className="object-contain"
                          onError={(e) => {
                            // Fallback to method name initial if image fails
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-lg font-bold text-gray-600">${method.name.charAt(0)}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-2xl">{method.icon}</span>
                      )}
                    </div>
                  )}
                  <span className="font-medium text-gray-900">{method.name}</span>
                </div>
 </button>
 ))}
 </div>
 </div>

 {/* Order Instructions */}
 <div className="bg-white rounded-xl shadow-sm p-6">
 <h2 className="text-xl font-semibold text-gray-900 mb-4">
 Order Instructions
 </h2>
 <textarea
 value={orderInstructions}
 onChange={(e) => setOrderInstructions(e.target.value)}
 rows={3}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 placeholder="Any special requests for your order?"
 />
 </div>
 </div>

 {/* Right Column - Order Summary */}
 <div className="lg:col-span-1">
 <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
 <h2 className="text-xl font-semibold text-gray-900 mb-4">
 Order Summary
 </h2>

 {/* Cart Items */}
 <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
 {cart.map((item, index) => (
 <div key={index} className="flex space-x-3">
 <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
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
 <span className="text-sm font-medium text-gray-900">
 {item.quantity}x {item.product.name}
 </span>
 <span className="text-sm font-semibold text-gray-900">
 ${item.item_total.toFixed(2)}
 </span>
 </div>
 {item.modifiers.length > 0 && (
 <p className="text-xs text-gray-600 mt-1">
 {item.modifiers.map(m => m.name).join(', ')}
 </p>
 )}
 </div>
 </div>
 ))}
 </div>

 {/* Vouchers Section */}
 {!isGuest && vouchers.length > 0 && (
 <div className="border-t border-gray-200 pt-4 mt-4">
 <VoucherSelector
 vouchers={vouchers}
 appliedVouchers={appliedVouchers}
 onApplyVoucher={handleApplyVoucher}
 onRemoveVoucher={handleRemoveVoucher}
 loading={voucherLoading}
 />
 </div>
 )}

 {/* Totals */}
 <div className="border-t border-gray-200 pt-4 space-y-2 mt-4">
 <div className="flex justify-between text-gray-600">
 <span>Subtotal</span>
 <span>${calculateSubtotal().toFixed(2)}</span>
 </div>
 {calculateVoucherDiscount() > 0 && (
 <div className="flex justify-between text-green-600">
 <span className="flex items-center">
 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
 </svg>
 Voucher Discount
 </span>
 <span className="font-medium">-${calculateVoucherDiscount().toFixed(2)}</span>
 </div>
 )}
 {orderType === 'delivery' && (
 <div className="flex justify-between text-gray-600">
 <span>Delivery Fee</span>
 <span>${calculateDeliveryFee().toFixed(2)}</span>
 </div>
 )}
 <div className="flex justify-between text-gray-600">
 <span>Tax</span>
 <span>${calculateTax().toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
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
 <div className="min-h-screen flex items-center justify-center bg-gray-50">
 <div className="text-center">
 <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
 <p className="mt-4 text-gray-600">Loading checkout...</p>
 </div>
 </div>
 }>
 <CheckoutContent />
 </Suspense>
 );
}

