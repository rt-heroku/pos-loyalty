'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import VoucherSelector from '@/components/shop/VoucherSelector';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  category_id: number;
  main_image_url: string;
  stock: number;
  is_active: boolean;
  sku: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  product_count: number;
}

interface ModifierGroup {
  id: number;
  name: string;
  description: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number | null;
  modifiers: Modifier[];
}

interface Modifier {
  id: number;
  name: string;
  price_adjustment: number;
  is_default: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  modifiers: { id: number; name: string; price: number }[];
  special_instructions: string;
  item_total: number;
}

interface ShopSettings {
  hero_enabled: boolean;
  hero_title: string;
  hero_subtitle: string;
  logo_url: string;
  location_name: string;
}

interface Location {
  id: number;
  store_name: string;
  address: string;
  city?: string;
  state?: string;
  phone?: string;
  is_active?: boolean;
}

// =====================================================
// MAIN SHOP COMPONENT
// =====================================================

export default function ShopPage() {
  const router = useRouter();
  
  // Force light theme IMMEDIATELY (before any rendering)
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }
  
  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [, setShopSettings] = useState<ShopSettings | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  // Voucher state
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [appliedVouchers, setAppliedVouchers] = useState<any[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<{
    type: string;
    message: string;
    voucher?: any;
    requiredProductId?: number;
  } | null>(null);
  
  // Refs
  const categoryRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // =====================================================
  // DATA FETCHING
  // =====================================================

  const checkAuth = useCallback(() => {
    const userData = localStorage.getItem('user');
    console.log('[Auth] Checking authentication...');
    console.log('[Auth] User data exists:', !!userData);
    
    // Check if user data exists (token is optional as we use cookies)
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('[Auth] Parsed user:', user);
        
        // Verify it's a valid user object with an ID (check multiple possible field names)
        if (user && (user.id || user.user_id || user.userId)) {
          console.log('[Auth] ✅ User is authenticated');
          setIsAuthenticated(true);
        } else {
          console.log('[Auth] ❌ User object missing id field');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[Auth] ❌ Error parsing user data:', error);
        setIsAuthenticated(false);
      }
    } else {
      console.log('[Auth] ❌ No user data in localStorage');
      setIsAuthenticated(false);
    }
  }, []);

  const loadShopData = useCallback(async () => {
    try {
      setLoading(true);
      
      // In local dev: Access through Express proxy at localhost:3000/loyalty
      // In production: Same - single port with Express proxy
      // API routes are at /loyalty/api/* due to basePath in next.config.js
      
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const basePath = '/loyalty';
      console.log('[Shop] Current origin:', origin);
      console.log('[Shop] Calling API routes at', `${origin}${basePath}/api/*`);
      
      // Load shop settings - Next.js API route at /loyalty/api/*
      const settingsRes = await fetch(`${origin}${basePath}/api/shop/settings`);
      console.log('[Shop] Settings response status:', settingsRes.status);
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        console.log('[Shop] Settings loaded:', settings);
        setShopSettings(settings);
      } else {
        const errorText = await settingsRes.text();
        console.error('[Shop] Settings error:', errorText.substring(0, 200));
      }

      // Load categories
      const categoriesRes = await fetch(`${origin}${basePath}/api/categories`);
      console.log('[Shop] Categories response status:', categoriesRes.status);
      if (categoriesRes.ok) {
        const cats = await categoriesRes.json();
        console.log('[Shop] Categories loaded:', cats.length, 'categories');
        setCategories(cats);
      } else {
        const errorText = await categoriesRes.text();
        console.error('[Shop] Categories error:', errorText.substring(0, 200));
      }

      // Load products
      const productsRes = await fetch(`${origin}${basePath}/api/products?active=true`);
      console.log('[Shop] Products response status:', productsRes.status);
      if (productsRes.ok) {
        const prods = await productsRes.json();
        console.log('[Shop] Products loaded:', prods.length, 'products');
        setProducts(prods);
      } else {
        const errorText = await productsRes.text();
        console.error('[Shop] Products error:', errorText.substring(0, 200));
      }

      // Load locations
      const locationsRes = await fetch(`${origin}${basePath}/api/locations`);
      console.log('[Shop] Locations response status:', locationsRes.status);
      if (locationsRes.ok) {
        const locs = await locationsRes.json();
        console.log('[Shop] Locations loaded:', locs.length, 'locations');
        setLocations(locs);
        // Set first location as default
        if (locs.length > 0 && !selectedLocation) {
          setSelectedLocation(locs[0]);
        }
      } else {
        const errorText = await locationsRes.text();
        console.error('[Shop] Locations error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    loadShopData();
    checkAuth();
    
    // Restore cart from sessionStorage if returning from checkout
    if (typeof window !== 'undefined') {
      const savedCart = sessionStorage.getItem('checkout_cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          if (parsedCart && parsedCart.length > 0) {
            console.log('[Shop] 🛒 Restoring cart from sessionStorage:', parsedCart.length, 'items');
            setCart(parsedCart);
          }
        } catch (error) {
          console.error('[Shop] ❌ Error restoring cart:', error);
        }
      }
    }
    
    // Force light theme for shop pages - AGGRESSIVE ENFORCEMENT
    if (typeof document !== 'undefined') {
      // Remove dark class from html and body
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      
      // Set light theme attribute
      document.documentElement.setAttribute('data-theme', 'light');
      
      // Force light colors with inline styles (overrides any CSS)
      document.documentElement.style.backgroundColor = '#f9fafb';
      document.documentElement.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#f9fafb';
      document.body.style.color = '#111827';
      
      // Override any stored theme preference for shop pages
      localStorage.setItem('shop-theme', 'light');
    }
    
    // Collapse sidebar when shop is opened (for authenticated users)
    // This gives more space for the shop layout
    const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
    if (sidebarToggle && isAuthenticated) {
      // Close sidebar on mount if authenticated
      const event = new CustomEvent('closeSidebar');
      window.dispatchEvent(event);
    }
  }, [loadShopData, checkAuth, isAuthenticated]);

  const loadProductModifiers = async (productId: number): Promise<ModifierGroup[]> => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const basePath = '/loyalty';
      const res = await fetch(`${origin}${basePath}/api/products/${productId}/modifiers`);
      if (res.ok) {
        const groups = await res.json();
        setModifierGroups(groups);
        return groups;
      }
    } catch (error) {
      console.error('Error loading modifiers:', error);
    }
    return [];
  };

  // =====================================================
  // VOUCHER FUNCTIONS
  // =====================================================

  const loadVouchers = useCallback(async () => {
    // Only load vouchers if user is authenticated
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.log('[Vouchers] No user data, skipping voucher load');
      return;
    }

    try {
      const user = JSON.parse(userData);
      const customerId = user.id;
      
      if (!customerId) {
        console.log('[Vouchers] No customer ID found');
        return;
      }

      setVoucherLoading(true);
      console.log('[Vouchers] Loading vouchers for customer:', customerId);
      
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
        
        console.log('[Vouchers] Loaded:', activeVouchers.length, 'active vouchers');
        setVouchers(activeVouchers);
      }
    } catch (error) {
      console.error('[Vouchers] Error loading vouchers:', error);
    } finally {
      setVoucherLoading(false);
    }
  }, []);

  // Load vouchers when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadVouchers();
    }
  }, [isAuthenticated, loadVouchers]);

  const handleApplyVoucher = (voucher: any) => {
    console.log('[Vouchers] Applying voucher:', voucher.voucher_code);
    
    // Check if voucher is already applied
    if (appliedVouchers.find(v => v.id === voucher.id)) {
      console.log('[Vouchers] Voucher already applied');
      return;
    }

    // For product-specific vouchers, check if the product is in cart
    if (voucher.voucher_type === 'ProductSpecific' && voucher.product_id) {
      const productInCart = cart.find(item => item.product.id === voucher.product_id);
      if (!productInCart) {
        console.log('[Vouchers] Product not in cart, showing error');
        setVoucherError({
          type: 'product_required',
          message: `This voucher requires "${voucher.product_name || 'the specified product'}" to be in your cart.`,
          voucher: voucher,
          requiredProductId: voucher.product_id
        });
        return;
      }
    }

    // Apply the voucher
    setAppliedVouchers(prev => [...prev, voucher]);
    setVoucherError(null);
    console.log('[Vouchers] ✅ Voucher applied successfully');
  };

  const handleRemoveVoucher = (voucher: any) => {
    console.log('[Vouchers] Removing voucher:', voucher.voucher_code);
    setAppliedVouchers(prev => prev.filter(v => v.id !== voucher.id));
  };

  const calculateVoucherDiscounts = () => {
    if (appliedVouchers.length === 0) return 0;
    
    const subtotal = cart.reduce((sum, item) => sum + item.item_total, 0);
    let totalDiscount = 0;

    appliedVouchers.forEach(voucher => {
      switch (voucher.voucher_type) {
        case 'Value':
          // Apply value vouchers to cheapest items first (same as POS)
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
          // Apply percentage discount to entire order
          totalDiscount += subtotal * (voucher.discount_percent / 100);
          break;

        case 'ProductSpecific':
          // Apply discount only to specific product
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

    console.log('[Vouchers] Total discount calculated:', totalDiscount);
    return totalDiscount;
  };

  const voucherDiscount = calculateVoucherDiscounts();

  // =====================================================
  // CART FUNCTIONS
  // =====================================================

  const addToCart = (product: Product, modifiers: any[] = [], instructions: string = '') => {
    const modifierTotal = modifiers.reduce((sum, m) => sum + m.price, 0);
    const productPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0');
    const itemTotal = (productPrice + modifierTotal);
    
    const cartItem: CartItem = {
      product,
      quantity: 1,
      modifiers,
      special_instructions: instructions,
      item_total: itemTotal
    };

    setCart(prev => {
      // Check if identical item exists
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id &&
        JSON.stringify(item.modifiers) === JSON.stringify(modifiers) &&
        item.special_instructions === instructions
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const existingItem = updated[existingIndex];
        if (existingItem) {
          existingItem.quantity += 1;
          existingItem.item_total = existingItem.quantity * itemTotal;
        }
        return updated;
      }

      return [...prev, cartItem];
    });

    setSelectedProduct(null);
    setShowCart(true);
  };

  const updateCartItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      if (item) {
        const basePrice = item.item_total / item.quantity;
        item.quantity = quantity;
        item.item_total = basePrice * quantity;
      }
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedVouchers([]);
    // Also clear sessionStorage to prevent cart restoration on refresh
    sessionStorage.removeItem('checkout_cart');
    sessionStorage.removeItem('checkout_applied_vouchers');
    sessionStorage.removeItem('checkout_location');
    console.log('[Shop] 🗑️  Cart cleared (including sessionStorage)');
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.item_total, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  // =====================================================
  // FILTERING & SEARCH
  // =====================================================

  const filteredProducts = products.filter(product => {
    // Find the category name for the selected category ID
    const selectedCategoryName = selectedCategory 
      ? categories.find(cat => cat.id === selectedCategory)?.name 
      : null;
    
    const matchesCategory = !selectedCategoryName || product.category === selectedCategoryName;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.is_active;
  });

  const productsByCategory = categories.map(category => ({
    category,
    products: filteredProducts.filter(p => p.category === category.name)
  })).filter(group => group.products.length > 0);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const scrollToCategory = (categoryId: number) => {
    setSelectedCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleQuickAdd = async (product: Product) => {
    // Load modifiers for this product
    await loadProductModifiers(product.id);
    
    // Always show modal (even if no modifiers, for quantity/instructions)
    setSelectedProduct(product);
  };

  // =====================================================
  // CHECKOUT
  // =====================================================

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Store cart in session storage
    sessionStorage.setItem('checkout_cart', JSON.stringify(cart));
    
    // Store selected location for checkout
    if (selectedLocation) {
      sessionStorage.setItem('checkout_location', JSON.stringify(selectedLocation));
    }
    
    // Store applied vouchers for checkout
    if (appliedVouchers.length > 0) {
      sessionStorage.setItem('checkout_applied_vouchers', JSON.stringify(appliedVouchers.map(v => v.id)));
      console.log('[Checkout] Saved', appliedVouchers.length, 'applied vouchers');
    }
    
    // Re-check authentication at checkout time (in case it changed)
    const userData = localStorage.getItem('user');
    console.log('[Checkout] Raw user data from localStorage:', userData);
    
    let isUserAuthenticated = false;
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('[Checkout] Parsed user object:', user);
        console.log('[Checkout] User has id?', !!user?.id);
        console.log('[Checkout] User.id value:', user?.id);
        
        // Check for user.id or user.user_id (different auth systems might use different fields)
        if (user && (user.id || user.user_id || user.userId)) {
          isUserAuthenticated = true;
          console.log('[Checkout] ✅ User is authenticated');
        } else {
          console.log('[Checkout] ❌ User object missing id field');
        }
      } catch (error) {
        console.error('[Checkout] ❌ Error parsing user data at checkout:', error);
      }
    } else {
      console.log('[Checkout] ❌ No user data in localStorage');
    }
    
    // Navigate to checkout with or without guest parameter
    if (isUserAuthenticated) {
      console.log('[Checkout] 🚀 Navigating to checkout (authenticated)');
      router.push('/shop/checkout');
    } else {
      console.log('[Checkout] 🚀 Navigating to checkout (guest mode)');
      router.push('/shop/checkout?guest=true');
    }
  };

  // =====================================================
  // RENDER: LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: MAIN LAYOUT
  // =====================================================

  return (
    <div className="min-h-screen bg-white font-shop" style={{ colorScheme: 'light' }}>
      {/* Location & Cart Bar - Sticky below main top bar (64px) */}
      <div className="sticky top-16 z-20 bg-gray-50 border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Location */}
          <div className="flex items-center space-x-2 text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium text-sm">Delivering to:</span>
            <button 
              className="text-blue-600 font-semibold text-sm hover:text-blue-700 hover:underline transition-colors"
              onClick={() => setShowLocationSelector(true)}
            >
              {selectedLocation?.store_name || 'Select location'}
            </button>
          </div>

          {/* Right: Cart */}
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors relative"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-semibold text-sm">Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {getCartItemCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Horizontal Category Filters - Sticky, Compact (below location bar) */}
      <div className="sticky top-[96px] z-10 bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-all ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600'
            }`}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => scrollToCategory(category.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600'
              }`}
            >
              {category.name} ({filteredProducts.filter(p => p.category === category.name).length})
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-6 py-6">
        <div className="space-y-8">
          {productsByCategory.map(({ category, products }) => (
                      <div
                        key={category.id}
                        ref={el => { categoryRefs.current[category.id] = el; }}
                        className="scroll-mt-36"
                      >
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                {category.name}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickAdd={() => handleQuickAdd(product)}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">
                No products found matching your search.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button (Mobile) */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="lg:hidden fixed bottom-5 left-5 right-5 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center justify-between z-40 hover:bg-blue-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-semibold">View Cart ({getCartItemCount()} items)</span>
          </div>
          <span className="font-bold text-lg">${getCartTotal().toFixed(2)}</span>
        </button>
      )}

      {/* Cart Slide-Out Panel */}
      {showCart && (
        <CartSlideOut
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateCartItemQuantity}
          onRemove={removeFromCart}
          onCheckout={handleCheckout}
          onClear={clearCart}
          vouchers={vouchers}
          appliedVouchers={appliedVouchers}
          voucherDiscount={voucherDiscount}
          onApplyVoucher={handleApplyVoucher}
          onRemoveVoucher={handleRemoveVoucher}
          voucherLoading={voucherLoading}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Product Customization Modal */}
      {selectedProduct && (
        <ProductCustomizationModal
          product={selectedProduct}
          modifierGroups={modifierGroups}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <LocationSelectorModal
          locations={locations}
          currentLocation={selectedLocation}
          onClose={() => setShowLocationSelector(false)}
          onSelectLocation={(location) => {
            setSelectedLocation(location);
            setShowLocationSelector(false);
          }}
        />
      )}

      {/* Voucher Error Modal (Product Required) */}
      {voucherError && voucherError.type === 'product_required' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 rounded-full p-2">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Product Required</h3>
              </div>
              <button
                onClick={() => setVoucherError(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600">
              {voucherError.message}
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // Find the required product
                  const requiredProduct = products.find(p => p.id === voucherError.requiredProductId);
                  if (requiredProduct) {
                    setVoucherError(null);
                    setSelectedProduct(requiredProduct);
                  }
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Add Product
              </button>
              <button
                onClick={() => setVoucherError(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// PRODUCT CARD COMPONENT (DoorDash Style)
// =====================================================

interface ProductCardProps {
  product: Product;
  onQuickAdd: () => void;
}

function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  return (
    <div 
      className={`bg-white rounded-lg overflow-hidden transition-all hover:shadow-md cursor-pointer ${
        isOutOfStock ? 'opacity-60' : ''
      }`}
      onClick={onQuickAdd}
    >
      {/* Product Image with Add Button Overlay */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {product.main_image_url ? (
          <Image
            src={product.main_image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Add Button Circle (Top Right) */}
        {!isOutOfStock && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd();
            }}
            className="absolute top-2 right-2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
          >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-full font-medium text-sm">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 mb-1 text-[15px] leading-tight">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium text-gray-900">
            ${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price || '0').toFixed(2)}
          </span>
          
          {/* Rating & Orders (if available) */}
          <div className="flex items-center text-xs text-gray-600">
            <span className="mr-0.5">👍</span>
            <span className="font-medium">91%</span>
            <span className="ml-1 text-gray-400">(193)</span>
          </div>
        </div>
        
        <div className="mt-1.5 text-xs text-gray-500">
          100+ recent orders
        </div>
      </div>
    </div>
  );
}

// =====================================================
// CART SLIDE-OUT COMPONENT (DoorDash Style)
// =====================================================

interface CartSlideOutProps {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
  onClear: () => void;
  vouchers?: any[];
  appliedVouchers?: any[];
  voucherDiscount?: number;
  onApplyVoucher?: (voucher: any) => void;
  onRemoveVoucher?: (voucher: any) => void;
  voucherLoading?: boolean;
  isAuthenticated?: boolean;
}

function CartSlideOut({ 
  cart, 
  onClose, 
  onUpdateQuantity, 
  onRemove, 
  onCheckout, 
  onClear,
  vouchers = [],
  appliedVouchers = [],
  voucherDiscount = 0,
  onApplyVoucher,
  onRemoveVoucher,
  voucherLoading = false,
  isAuthenticated = false
}: CartSlideOutProps) {
  const total = cart.reduce((sum, item) => sum + item.item_total, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalAfterVouchers = total - voucherDiscount;
  const tax = subtotalAfterVouchers * 0.085;
  const finalTotal = subtotalAfterVouchers + tax;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col lg:rounded-l-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            Your Cart ({itemCount})
          </h3>
          <div className="flex items-center space-x-3">
            {cart.length > 0 && (
              <button
                onClick={onClear}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 text-lg">Your cart is empty</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.map((item, index) => (
                <CartItemCard
                  key={index}
                  item={item}
                  index={index}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemove}
                />
              ))}
              
              {/* Vouchers Section */}
              {isAuthenticated && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <VoucherSelector
                    vouchers={vouchers}
                    appliedVouchers={appliedVouchers}
                    onApplyVoucher={onApplyVoucher || (() => {})}
                    onRemoveVoucher={onRemoveVoucher || (() => {})}
                    loading={voucherLoading}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 space-y-4 bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Voucher Discount
                    </span>
                    <span className="font-medium">-${voucherDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all active:scale-95"
              >
                Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// =====================================================
// CART ITEM CARD (DoorDash Style)
// =====================================================

interface CartItemCardProps {
  item: CartItem;
  index: number;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
}

function CartItemCard({ item, index, onUpdateQuantity, onRemove }: CartItemCardProps) {
  return (
    <div className="flex space-x-4 bg-white border border-gray-200 rounded-xl p-4">
      {/* Thumbnail */}
      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
        {item.product.main_image_url ? (
          <Image
            src={item.product.main_image_url}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900 text-base line-clamp-1">
            {item.product.name}
          </h4>
          <button
            onClick={() => onRemove(index)}
            className="text-gray-400 hover:text-red-600 transition-colors ml-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        
        {item.modifiers.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {item.modifiers.map(m => m.name).join(', ')}
          </p>
        )}
        
        {item.special_instructions && (
          <p className="text-sm text-gray-600 mt-1 italic">
            Note: {item.special_instructions}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          {/* Quantity Controls */}
          <div className="flex items-center space-x-3 bg-gray-100 rounded-lg px-2 py-1">
            <button
              onClick={() => onUpdateQuantity(index, item.quantity - 1)}
              className="w-6 h-6 flex items-center justify-center hover:text-blue-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="font-semibold text-gray-900 w-6 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
              className="w-6 h-6 flex items-center justify-center hover:text-blue-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Price */}
          <span className="font-bold text-gray-900 text-lg">
            ${item.item_total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PRODUCT CUSTOMIZATION MODAL (DoorDash Style)
// =====================================================

interface ProductCustomizationModalProps {
  product: Product;
  modifierGroups: ModifierGroup[];
  onClose: () => void;
  onAddToCart: (product: Product, modifiers: any[], instructions: string) => void;
}

function ProductCustomizationModal({ product, modifierGroups, onClose, onAddToCart }: ProductCustomizationModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<{ [groupId: number]: number[] }>({});
  const [specialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Set default modifiers
    const defaults: { [groupId: number]: number[] } = {};
    modifierGroups.forEach(group => {
      const defaultMods = group.modifiers.filter(m => m.is_default).map(m => m.id);
      if (defaultMods.length > 0) {
        defaults[group.id] = defaultMods;
      }
    });
    setSelectedModifiers(defaults);
  }, [modifierGroups]);

  const toggleModifier = (groupId: number, modifierId: number, maxSelections: number | null) => {
    setSelectedModifiers(prev => {
      const current = prev[groupId] || [];
      const isSelected = current.includes(modifierId);

      if (isSelected) {
        return { ...prev, [groupId]: current.filter(id => id !== modifierId) };
      } else {
        if (maxSelections === 1) {
          return { ...prev, [groupId]: [modifierId] };
        } else if (maxSelections === null || current.length < maxSelections) {
          return { ...prev, [groupId]: [...current, modifierId] };
        }
        return prev;
      }
    });
  };

  const calculateTotal = () => {
    const productPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0');
    let total = productPrice;
    Object.entries(selectedModifiers).forEach(([groupId, modifierIds]) => {
      const group = modifierGroups.find(g => g.id === parseInt(groupId));
      if (group) {
        modifierIds.forEach(modId => {
          const modifier = group.modifiers.find(m => m.id === modId);
          if (modifier) {
            const priceAdjustment = typeof modifier.price_adjustment === 'number' 
              ? modifier.price_adjustment 
              : parseFloat(modifier.price_adjustment || '0');
            total += priceAdjustment;
          }
        });
      }
    });
    return total * quantity;
  };

  const canAddToCart = () => {
    return modifierGroups.every(group => {
      const selected = selectedModifiers[group.id]?.length || 0;
      return selected >= group.min_selections && (group.max_selections === null || selected <= group.max_selections);
    });
  };

  const handleAddToCart = () => {
    const modifiers: any[] = [];
    Object.entries(selectedModifiers).forEach(([groupId, modifierIds]) => {
      const group = modifierGroups.find(g => g.id === parseInt(groupId));
      if (group) {
        modifierIds.forEach(modId => {
          const modifier = group.modifiers.find(m => m.id === modId);
          if (modifier) {
            const priceAdjustment = typeof modifier.price_adjustment === 'number' 
              ? modifier.price_adjustment 
              : parseFloat(modifier.price_adjustment || '0');
            modifiers.push({
              id: modifier.id,
              name: modifier.name,
              price: priceAdjustment
            });
          }
        });
      }
    });

    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, modifiers, specialInstructions);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col relative">
          {/* Product Image */}
          {product.main_image_url && (
            <div className="relative w-full aspect-[16/9] bg-gray-100">
              <Image
                src={product.main_image_url}
                alt={product.name}
                fill
                className="object-cover rounded-t-2xl"
                sizes="(max-width: 768px) 100vw, 512px"
              />
              
              {/* Close Button - Overlay on Image (Top Right) */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-20"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Close Button - When No Image */}
          {!product.main_image_url && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {product.name}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Header - Only show if we have an image (otherwise it's in the top bar) */}
            {product.main_image_url && (
              <div className="p-4 pb-0">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {product.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <span className="mr-1">👍</span>
                  <span className="font-medium">91%</span>
                  <span className="mx-1">(49)</span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  1130 cal
                </div>
                {product.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>
            )}

            {/* Recommended Options (Mock Data) */}
            <div className="p-4 border-t border-gray-100">
              <h4 className="text-base font-semibold text-gray-900 mb-3">Your recommended options</h4>
              <div className="space-y-2">
                <button className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5"></div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">#1 • Ordered recently by 10+ others</div>
                        <div className="text-xs text-gray-600 mt-0.5">Beef - No Pink • Steak Fries</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price || '0').toFixed(2)}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Modifier Groups */}
            <div className="p-4 space-y-4 border-t border-gray-100">
              {modifierGroups.map(group => (
                <div key={group.id}>
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-gray-900">
                        {group.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {group.is_required && (
                          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">Required</span>
                        )}
                        <span className="text-xs text-gray-500">
                          Select {group.max_selections === 1 ? '1' : group.max_selections || 'any'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.modifiers.map(modifier => {
                      const isSelected = selectedModifiers[group.id]?.includes(modifier.id) || false;
                      const inputType = group.max_selections === 1 ? 'radio' : 'checkbox';
                      
                      return (
                        <button
                          key={modifier.id}
                          onClick={() => toggleModifier(group.id, modifier.id, group.max_selections)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 flex-shrink-0 ${
                              inputType === 'radio' ? 'rounded-full' : 'rounded'
                            } border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-black bg-black' : 'border-gray-300'
                            }`}>
                              {isSelected && inputType === 'radio' && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                              {isSelected && inputType === 'checkbox' && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm text-gray-900">{modifier.name}</span>
                          </div>
                          {modifier.price_adjustment !== 0 && (
                            <span className="text-sm text-gray-900 font-medium">
                              {(() => {
                                const priceAdjustment = typeof modifier.price_adjustment === 'number' 
                                  ? modifier.price_adjustment 
                                  : parseFloat(modifier.price_adjustment || '0');
                                return `${priceAdjustment > 0 ? '+' : ''}$${priceAdjustment.toFixed(2)}`;
                              })()}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Preferences - Special Instructions */}
            <div className="p-4 border-t border-gray-100">
              <h4 className="text-base font-semibold text-gray-900 mb-1">Preferences</h4>
              <p className="text-xs text-gray-500 mb-3">(Optional)</p>
              
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-900">Add Special Instructions</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Footer - Quantity & Add to Cart */}
          <div className="border-t border-gray-200 p-4 bg-white flex items-center space-x-3">
            {/* Quantity Controls */}
            <div className="flex items-center border border-gray-300 rounded-full">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-l-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                </svg>
              </button>
              <div className="w-12 text-center">
                <span className="text-base font-semibold text-gray-900">{quantity}</span>
              </div>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-r-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart()}
              className={`flex-1 py-3 rounded-full font-semibold text-base transition-all ${
                canAddToCart()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Add to cart - ${calculateTotal().toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// =====================================================
// LOCATION SELECTOR MODAL
// =====================================================

interface LocationSelectorModalProps {
  locations: Location[];
  currentLocation: Location | null;
  onClose: () => void;
  onSelectLocation: (location: Location) => void;
}

function LocationSelectorModal({ locations, currentLocation, onClose, onSelectLocation }: LocationSelectorModalProps) {

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Location Selector</h2>
              <p className="text-gray-600 mt-1">Choose your pickup or delivery location</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search locations by name, city, or address..."
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Use My Location</span>
                </button>
              </div>
            </div>

            {/* Location List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Locations ({locations.length})</h3>
              
              {locations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No locations available
                </div>
              )}
              
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`border rounded-xl p-6 transition-all ${
                    location.id === currentLocation?.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    {/* Location Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">{location.store_name}</h4>
                        {location.is_active && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ● Open
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-600 mb-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{location.address}</span>
                        {location.city && location.state && (
                          <span>, {location.city}, {location.state}</span>
                        )}
                      </div>

                      {location.phone && (
                        <div className="flex items-center space-x-2 text-gray-600 mb-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{location.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => onSelectLocation(location)}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                          location.id === currentLocation?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {location.id === currentLocation?.id ? '✓ Selected' : `Pickup at this location`}
                      </button>
                      <button className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        Directions
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

