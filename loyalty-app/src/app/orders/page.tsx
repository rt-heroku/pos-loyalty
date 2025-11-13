'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, ChevronUp, Package, Calendar, MapPin, CreditCard, ShoppingBag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  modifiers?: string | any[] | any; // Can be string, array, or object
}

interface Order {
  id: number;
  order_number: string;
  order_date: string;
  status: string;
  origin: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  customer_name: string;
  location_name: string;
  payment_method: string;
  order_type?: string;
  delivery_address?: string;
  items: OrderItem[];
  item_count: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'mobile' | 'pos'>('all');

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      
      // Get customer ID from user
      const profileRes = await fetch(`${basePath}/api/customers/profile`);
      if (!profileRes.ok) {
        throw new Error('Failed to fetch profile');
      }
      const profileData = await profileRes.json();
      const customerId = profileData.customer.id;

      // Fetch orders for this customer
      const response = await fetch(`${basePath}/api/orders?customer_id=${customerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOriginIcon = (origin: string) => {
    switch (origin.toLowerCase()) {
      case 'mobile':
      case 'online':
        return <ShoppingBag className="h-4 w-4" />;
      case 'pos':
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.origin.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <p className="mt-2 text-gray-600">View all your past orders and track their status</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilter('mobile')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'mobile'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Online ({orders.filter(o => o.origin.toLowerCase() === 'mobile').length})
          </button>
          <button
            onClick={() => setFilter('pos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pos'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            In-Store ({orders.filter(o => o.origin.toLowerCase() === 'pos').length})
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? "You haven't placed any orders yet."
                : `No ${filter} orders found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <button
                  onClick={() => toggleOrder(order.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Origin Icon */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                        {getOriginIcon(order.origin)}
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.order_number}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDistanceToNow(new Date(order.order_date), { addSuffix: true })}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {order.location_name || 'Unknown location'}
                        </span>
                        <span>
                          {order.item_count} {parseInt(order.item_count) === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {order.origin}
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="flex-shrink-0">
                      {expandedOrders.has(order.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Order Details (Collapsible) */}
                {expandedOrders.has(order.id) && (
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column: Items */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h4>
                        <div className="space-y-3">
                          {order.items.map((item) => {
                            // Parse modifiers if it's a string or handle as object
                            let modifiersDisplay = '';
                            if (item.modifiers) {
                              if (typeof item.modifiers === 'string') {
                                try {
                                  const parsed = JSON.parse(item.modifiers);
                                  if (Array.isArray(parsed)) {
                                    modifiersDisplay = parsed.map((m: any) => m.name || m).join(', ');
                                  } else if (parsed.name) {
                                    modifiersDisplay = parsed.name;
                                  } else {
                                    modifiersDisplay = item.modifiers;
                                  }
                                } catch {
                                  modifiersDisplay = item.modifiers;
                                }
                              } else if (Array.isArray(item.modifiers)) {
                                modifiersDisplay = item.modifiers.map((m: any) => m.name || m).join(', ');
                              } else if (typeof item.modifiers === 'object' && item.modifiers.name) {
                                modifiersDisplay = item.modifiers.name;
                              }
                            }
                            
                            return (
                              <div key={item.id} className="flex justify-between bg-white rounded-lg p-3">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {item.quantity}x {item.product_name}
                                  </div>
                                  {modifiersDisplay && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {modifiersDisplay}
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-600 mt-1">
                                    ${parseFloat(item.unit_price).toFixed(2)} each
                                  </div>
                                </div>
                                <div className="text-right font-semibold text-gray-900">
                                  ${parseFloat(item.total_price).toFixed(2)}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Order Totals */}
                        <div className="mt-4 space-y-2 bg-white rounded-lg p-3">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                          </div>
                          {parseFloat(order.discount_amount || '0') > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Discount</span>
                              <span>-${parseFloat(order.discount_amount).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Tax</span>
                            <span>${parseFloat(order.tax_amount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Order Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Details</h4>
                        <div className="space-y-3 bg-white rounded-lg p-4">
                          <div>
                            <div className="text-xs text-gray-500 uppercase">Order Number</div>
                            <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase">Date</div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(order.order_date).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase">Status</div>
                            <div className="text-sm font-medium">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              Location
                            </div>
                            <div className="text-sm font-medium text-gray-900">{order.location_name}</div>
                          </div>
                          {order.order_type && (
                            <div>
                              <div className="text-xs text-gray-500 uppercase">Order Type</div>
                              <div className="text-sm font-medium text-gray-900 capitalize">{order.order_type}</div>
                            </div>
                          )}
                          {order.delivery_address && (
                            <div>
                              <div className="text-xs text-gray-500 uppercase">Delivery Address</div>
                              <div className="text-sm font-medium text-gray-900">{order.delivery_address}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-gray-500 uppercase flex items-center">
                              <CreditCard className="h-3 w-3 mr-1" />
                              Payment Method
                            </div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {order.payment_method || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Reorder Button */}
                        <button className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                          Reorder
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

