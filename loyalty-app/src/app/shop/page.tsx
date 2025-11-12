'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

// =====================================================
// MAIN SHOP COMPONENT
// =====================================================

export default function ShopPage() {
  const router = useRouter();
  
  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Refs
  const categoryRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // =====================================================
  // DATA FETCHING
  // =====================================================

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
    }
  }, []);

  const loadShopData = useCallback(async () => {
    try {
      setLoading(true);
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      
      // Load shop settings
      const settingsRes = await fetch(`${basePath}/api/shop/settings`);
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setShopSettings(settings);
      }

      // Load categories
      const categoriesRes = await fetch(`${basePath}/api/categories`);
      if (categoriesRes.ok) {
        const cats = await categoriesRes.json();
        setCategories(cats);
      }

      // Load products
      const productsRes = await fetch(`${basePath}/api/products?active=true`);
      if (productsRes.ok) {
        const prods = await productsRes.json();
        setProducts(prods);
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShopData();
    checkAuth();
    
    // Set light theme for shop by default
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }, [loadShopData, checkAuth]);

  const loadProductModifiers = async (productId: number) => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/products/${productId}/modifiers`);
      if (res.ok) {
        const groups = await res.json();
        setModifierGroups(groups);
      }
    } catch (error) {
      console.error('Error loading modifiers:', error);
    }
  };

  // =====================================================
  // CART FUNCTIONS
  // =====================================================

  const addToCart = (product: Product, modifiers: any[] = [], instructions: string = '') => {
    const modifierTotal = modifiers.reduce((sum, m) => sum + m.price, 0);
    const itemTotal = (product.price + modifierTotal);
    
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
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.is_active;
  });

  const productsByCategory = categories.map(category => ({
    category,
    products: filteredProducts.filter(p => p.category_id === category.id)
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

  const handleQuickAdd = (product: Product) => {
    // Check if product has modifiers
    loadProductModifiers(product.id).then(() => {
      if (modifierGroups.length > 0) {
        setSelectedProduct(product);
      } else {
        addToCart(product);
      }
    });
  };

  // =====================================================
  // CHECKOUT
  // =====================================================

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Store cart in session storage
    sessionStorage.setItem('checkout_cart', JSON.stringify(cart));
    
    if (isAuthenticated) {
      router.push('/shop/checkout');
    } else {
      router.push('/shop/checkout?guest=true');
    }
  };

  // =====================================================
  // RENDER: LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading menu...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: MAIN LAYOUT
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      {shopSettings?.hero_enabled && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 text-center">
            {shopSettings.logo_url && (
              <Image 
                src={shopSettings.logo_url} 
                alt={shopSettings.location_name}
                width={160}
                height={80}
                className="h-16 md:h-20 mx-auto mb-4 object-contain"
                priority
              />
            )}
            <h1 className="text-3xl md:text-5xl font-bold mb-3">
              {shopSettings.hero_title}
            </h1>
            <p className="text-lg md:text-xl text-blue-100">
              {shopSettings.hero_subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR - Categories & Search (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6 space-y-4">
              {/* Search */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Categories */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === null
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    All Items
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category.name}</span>
                        <span className="text-sm opacity-75">
                          {filteredProducts.filter(p => p.category_id === category.id).length}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* MIDDLE - Products */}
          <main className="lg:col-span-6">
            {/* Mobile Search */}
            <div className="lg:hidden mb-4">
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Mobile Categories */}
            <div className="lg:hidden mb-4 overflow-x-auto">
              <div className="flex space-x-2 pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products by Category */}
            <div className="space-y-8">
              {productsByCategory.map(({ category, products }) => (
                <div 
                  key={category.id}
                  ref={el => { categoryRefs.current[category.id] = el; }}
                  className="scroll-mt-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {category.name}
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No products found matching your search.
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT SIDEBAR - Cart (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6">
              <CartPanel
                cart={cart}
                onUpdateQuantity={updateCartItemQuantity}
                onRemove={removeFromCart}
                onCheckout={handleCheckout}
                onClear={clearCart}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="lg:hidden fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-full shadow-lg flex items-center space-x-3 z-40"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="font-semibold">{getCartItemCount()} items</span>
          <span className="font-bold">${getCartTotal().toFixed(2)}</span>
        </button>
      )}

      {/* Mobile Cart Slide-up */}
      {showCart && (
        <MobileCartSlideup
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateCartItemQuantity}
          onRemove={removeFromCart}
          onCheckout={handleCheckout}
          onClear={clearCart}
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
    </div>
  );
}

// =====================================================
// PRODUCT CARD COMPONENT
// =====================================================

interface ProductCardProps {
  product: Product;
  onQuickAdd: () => void;
}

function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md ${
      isOutOfStock ? 'opacity-60' : ''
    }`}>
      {/* Product Image */}
      <div className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-700">
        {product.main_image_url ? (
          <Image
            src={product.main_image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            ${product.price.toFixed(2)}
          </span>
          
          <button
            onClick={onQuickAdd}
            disabled={isOutOfStock}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// CART PANEL COMPONENT (Desktop)
// =====================================================

interface CartPanelProps {
  cart: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
  onClear: () => void;
}

function CartPanel({ cart, onUpdateQuantity, onRemove, onCheckout, onClear }: CartPanelProps) {
  const total = cart.reduce((sum, item) => sum + item.item_total, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Your Order ({itemCount})
        </h3>
        {cart.length > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {cart.map((item, index) => (
              <CartItemCard
                key={index}
                item={item}
                index={index}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// =====================================================
// MOBILE CART SLIDE-UP
// =====================================================

interface MobileCartSlideupProps extends CartPanelProps {
  onClose: () => void;
}

function MobileCartSlideup({ cart, onClose, onUpdateQuantity, onRemove, onCheckout, onClear }: MobileCartSlideupProps) {
  const total = cart.reduce((sum, item) => sum + item.item_total, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Slide-up Panel */}
      <div className="fixed inset-x-0 bottom-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl z-50 lg:hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Order ({itemCount})
          </h3>
          <div className="flex items-center space-x-3">
            {cart.length > 0 && (
              <button
                onClick={onClear}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map((item, index) => (
            <CartItemCard
              key={index}
              item={item}
              index={index}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            onClick={onCheckout}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Checkout
          </button>
        </div>
      </div>
    </>
  );
}

// =====================================================
// CART ITEM CARD
// =====================================================

interface CartItemCardProps {
  item: CartItem;
  index: number;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
}

function CartItemCard({ item, index, onUpdateQuantity, onRemove }: CartItemCardProps) {
  return (
    <div className="flex space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
      {/* Thumbnail */}
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0 relative">
        {item.product.main_image_url ? (
          <Image
            src={item.product.main_image_url}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
          {item.product.name}
        </h4>
        
        {item.modifiers.length > 0 && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {item.modifiers.map(m => m.name).join(', ')}
          </p>
        )}
        
        {item.special_instructions && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
            Note: {item.special_instructions}
          </p>
        )}

        <div className="flex items-center justify-between mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onUpdateQuantity(index, item.quantity - 1)}
              className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="font-medium text-gray-900 dark:text-white w-8 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
              className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Price & Remove */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              ${item.item_total.toFixed(2)}
            </span>
            <button
              onClick={() => onRemove(index)}
              className="text-red-600 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PRODUCT CUSTOMIZATION MODAL
// =====================================================

interface ProductCustomizationModalProps {
  product: Product;
  modifierGroups: ModifierGroup[];
  onClose: () => void;
  onAddToCart: (product: Product, modifiers: any[], instructions: string) => void;
}

function ProductCustomizationModal({ product, modifierGroups, onClose, onAddToCart }: ProductCustomizationModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<{ [groupId: number]: number[] }>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
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
    let total = product.price;
    Object.entries(selectedModifiers).forEach(([groupId, modifierIds]) => {
      const group = modifierGroups.find(g => g.id === parseInt(groupId));
      if (group) {
        modifierIds.forEach(modId => {
          const modifier = group.modifiers.find(m => m.id === modId);
          if (modifier) {
            total += modifier.price_adjustment;
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
            modifiers.push({
              id: modifier.id,
              name: modifier.name,
              price: modifier.price_adjustment
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
        <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {product.description}
              </p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-2">
                ${product.price.toFixed(2)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {modifierGroups.map(group => (
              <div key={group.id}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {group.name}
                    {group.is_required && <span className="text-red-600 ml-1">*</span>}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {group.max_selections === 1 ? 'Choose 1' : 
                     group.max_selections === null ? 'Choose any' :
                     `Choose up to ${group.max_selections}`}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.modifiers.map(modifier => {
                    const isSelected = selectedModifiers[group.id]?.includes(modifier.id) || false;
                    return (
                      <button
                        key={modifier.id}
                        onClick={() => toggleModifier(group.id, modifier.id, group.max_selections)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-gray-900 dark:text-white">{modifier.name}</span>
                        </div>
                        {modifier.price_adjustment !== 0 && (
                          <span className="text-gray-600 dark:text-gray-400">
                            {modifier.price_adjustment > 0 ? '+' : ''}${modifier.price_adjustment.toFixed(2)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Special Instructions */}
            <div>
              <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                Special Instructions
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests?"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-xl font-semibold text-gray-900 dark:text-white w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart()}
              className={`w-full py-4 rounded-xl font-semibold transition-colors ${
                canAddToCart()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Add to Cart - ${calculateTotal().toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

