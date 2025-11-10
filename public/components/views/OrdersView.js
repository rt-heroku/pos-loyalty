if (!window.Views) {
    window.Views = {};
}

// Orders View Component
window.Views.OrdersView = ({
    orders = [],
    loading = false,
    onLoadToCart,
    onRefresh,
    selectedLocation
}) => {
    const { Package, Search, Calendar, User, Phone, Mail, ChevronDown, ChevronUp, ShoppingCart, Filter, X } = window.Icons;

    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [originFilter, setOriginFilter] = React.useState('all');
    const [dateFrom, setDateFrom] = React.useState('');
    const [dateTo, setDateTo] = React.useState('');
    const [expandedOrders, setExpandedOrders] = React.useState(new Set());
    const [showFilters, setShowFilters] = React.useState(false);

    // Order statuses
    const orderStatuses = [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'preparing', label: 'Preparing' },
        { value: 'ready', label: 'Ready' },
        { value: 'pickup', label: 'Pickup' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    // Order origins
    const orderOrigins = [
        { value: 'all', label: 'All Origins' },
        { value: 'pos', label: 'POS' },
        { value: 'online', label: 'Online' },
        { value: 'mobile', label: 'Mobile' },
        { value: 'kiosk', label: 'Kiosk' }
    ];

    // Toggle order expansion
    const toggleOrder = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    // Filter orders
    const filteredOrders = React.useMemo(() => {
        return orders.filter(order => {
            // Search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                const matchesSearch = 
                    order.order_number?.toLowerCase().includes(search) ||
                    order.customer_name?.toLowerCase().includes(search) ||
                    order.customer_loyalty_number?.toLowerCase().includes(search) ||
                    order.customer_phone?.toLowerCase().includes(search) ||
                    order.customer_email?.toLowerCase().includes(search);
                if (!matchesSearch) return false;
            }

            // Status filter
            if (statusFilter !== 'all' && order.status !== statusFilter) {
                return false;
            }

            // Origin filter
            if (originFilter !== 'all' && order.origin !== originFilter) {
                return false;
            }

            // Date filter
            if (dateFrom) {
                const orderDate = new Date(order.order_date);
                const fromDate = new Date(dateFrom);
                if (orderDate < fromDate) return false;
            }

            if (dateTo) {
                const orderDate = new Date(order.order_date);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59);
                if (orderDate > toDate) return false;
            }

            return true;
        });
    }, [orders, searchTerm, statusFilter, originFilter, dateFrom, dateTo]);

    // Get status badge color
    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
            confirmed: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
            preparing: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
            ready: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
            pickup: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300',
            completed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
            cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
        };
        return colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setOriginFilter('all');
        setDateFrom('');
        setDateTo('');
    };

    return React.createElement('div', {
        key: 'orders-view',
        className: 'h-full flex flex-col bg-gray-50 dark:bg-gray-900'
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6'
        }, [
            React.createElement('div', {
                key: 'header-content',
                className: 'flex items-center justify-between'
            }, [
                React.createElement('div', { key: 'title-section' }, [
                    React.createElement('h1', {
                        key: 'title',
                        className: 'text-2xl font-bold text-gray-900 dark:text-white'
                    }, 'Orders'),
                    React.createElement('p', {
                        key: 'subtitle',
                        className: 'text-sm text-gray-600 dark:text-gray-400 mt-1'
                    }, `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''} found`)
                ]),
                React.createElement('button', {
                    key: 'refresh-btn',
                    onClick: onRefresh,
                    className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                }, 'Refresh')
            ])
        ]),

        // Search and Filters
        React.createElement('div', {
            key: 'search-filters',
            className: 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4'
        }, [
            // Search bar
            React.createElement('div', {
                key: 'search-bar',
                className: 'flex gap-2 mb-4'
            }, [
                React.createElement('div', {
                    key: 'search-input-wrapper',
                    className: 'flex-1 relative'
                }, [
                    React.createElement(Search, {
                        key: 'search-icon',
                        className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
                        size: 20
                    }),
                    React.createElement('input', {
                        key: 'search-input',
                        type: 'text',
                        value: searchTerm,
                        onChange: (e) => setSearchTerm(e.target.value),
                        placeholder: 'Search by order #, name, loyalty #, phone, or email...',
                        className: 'w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    })
                ]),
                React.createElement('button', {
                    key: 'filter-toggle',
                    onClick: () => setShowFilters(!showFilters),
                    className: `px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : 'bg-white dark:bg-gray-700'}`
                }, [
                    React.createElement(Filter, { key: 'filter-icon', size: 20 }),
                    React.createElement('span', { key: 'filter-text' }, 'Filters')
                ])
            ]),

            // Filter panel
            showFilters && React.createElement('div', {
                key: 'filter-panel',
                className: 'grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg'
            }, [
                // Status filter
                React.createElement('div', { key: 'status-filter' }, [
                    React.createElement('label', {
                        key: 'status-label',
                        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    }, 'Status'),
                    React.createElement('select', {
                        key: 'status-select',
                        value: statusFilter,
                        onChange: (e) => setStatusFilter(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                    }, orderStatuses.map(status =>
                        React.createElement('option', {
                            key: `status-${status.value}`,
                            value: status.value
                        }, status.label)
                    ))
                ]),

                // Origin filter
                React.createElement('div', { key: 'origin-filter' }, [
                    React.createElement('label', {
                        key: 'origin-label',
                        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    }, 'Origin'),
                    React.createElement('select', {
                        key: 'origin-select',
                        value: originFilter,
                        onChange: (e) => setOriginFilter(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                    }, orderOrigins.map(origin =>
                        React.createElement('option', {
                            key: `origin-${origin.value}`,
                            value: origin.value
                        }, origin.label)
                    ))
                ]),

                // Date from
                React.createElement('div', { key: 'date-from-filter' }, [
                    React.createElement('label', {
                        key: 'date-from-label',
                        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    }, 'From Date'),
                    React.createElement('input', {
                        key: 'date-from-input',
                        type: 'date',
                        value: dateFrom,
                        onChange: (e) => setDateFrom(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                    })
                ]),

                // Date to
                React.createElement('div', { key: 'date-to-filter' }, [
                    React.createElement('label', {
                        key: 'date-to-label',
                        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    }, 'To Date'),
                    React.createElement('input', {
                        key: 'date-to-input',
                        type: 'date',
                        value: dateTo,
                        onChange: (e) => setDateTo(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                    })
                ]),

                // Clear filters button
                React.createElement('div', {
                    key: 'clear-filters',
                    className: 'md:col-span-4 flex justify-end'
                }, [
                    React.createElement('button', {
                        key: 'clear-btn',
                        onClick: clearFilters,
                        className: 'px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2'
                    }, [
                        React.createElement(X, { key: 'clear-icon', size: 16 }),
                        React.createElement('span', { key: 'clear-text' }, 'Clear Filters')
                    ])
                ])
            ])
        ]),

        // Orders list
        React.createElement('div', {
            key: 'orders-list',
            className: 'flex-1 overflow-auto p-6'
        }, [
            loading ? React.createElement('div', {
                key: 'loading',
                className: 'text-center py-12'
            }, [
                React.createElement('div', {
                    key: 'spinner',
                    className: 'inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
                }),
                React.createElement('p', {
                    key: 'loading-text',
                    className: 'mt-4 text-gray-600 dark:text-gray-400'
                }, 'Loading orders...')
            ]) : filteredOrders.length === 0 ? React.createElement('div', {
                key: 'empty',
                className: 'text-center py-12'
            }, [
                React.createElement(Package, {
                    key: 'empty-icon',
                    className: 'mx-auto text-gray-400',
                    size: 48
                }),
                React.createElement('p', {
                    key: 'empty-text',
                    className: 'mt-4 text-gray-600 dark:text-gray-400'
                }, 'No orders found')
            ]) : React.createElement('div', {
                key: 'orders-container',
                className: 'space-y-4'
            }, filteredOrders.map(order => {
                const isExpanded = expandedOrders.has(order.id);
                
                return React.createElement('div', {
                    key: `order-${order.id}`,
                    className: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'
                }, [
                    // Order summary row
                    React.createElement('div', {
                        key: `order-summary-${order.id}`,
                        className: 'p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                        onClick: () => toggleOrder(order.id)
                    }, [
                        React.createElement('div', {
                            key: `order-header-${order.id}`,
                            className: 'flex items-center justify-between'
                        }, [
                            // Left side - Order info
                            React.createElement('div', {
                                key: `order-info-${order.id}`,
                                className: 'flex-1 grid grid-cols-1 md:grid-cols-6 gap-4'
                            }, [
                                // Date and Order #
                                React.createElement('div', { key: `order-date-${order.id}` }, [
                                    React.createElement('div', {
                                        key: `order-number-${order.id}`,
                                        className: 'font-semibold text-gray-900 dark:text-white'
                                    }, order.order_number),
                                    React.createElement('div', {
                                        key: `order-date-text-${order.id}`,
                                        className: 'text-sm text-gray-600 dark:text-gray-400'
                                    }, formatDate(order.order_date))
                                ]),

                                // Customer info
                                React.createElement('div', {
                                    key: `customer-info-${order.id}`,
                                    className: 'md:col-span-2'
                                }, [
                                    React.createElement('div', {
                                        key: `customer-name-${order.id}`,
                                        className: 'font-medium text-gray-900 dark:text-white'
                                    }, order.customer_name || 'Guest'),
                                    order.customer_loyalty_number && React.createElement('div', {
                                        key: `customer-loyalty-${order.id}`,
                                        className: 'text-sm text-gray-600 dark:text-gray-400'
                                    }, `Loyalty: ${order.customer_loyalty_number}`),
                                    order.customer_phone && React.createElement('div', {
                                        key: `customer-phone-${order.id}`,
                                        className: 'text-sm text-gray-600 dark:text-gray-400'
                                    }, order.customer_phone),
                                    order.customer_email && React.createElement('div', {
                                        key: `customer-email-${order.id}`,
                                        className: 'text-sm text-gray-600 dark:text-gray-400'
                                    }, order.customer_email)
                                ]),

                                // Products count
                                React.createElement('div', { key: `products-count-${order.id}` }, [
                                    React.createElement('div', {
                                        key: `products-label-${order.id}`,
                                        className: 'text-sm text-gray-600 dark:text-gray-400'
                                    }, 'Products'),
                                    React.createElement('div', {
                                        key: `products-value-${order.id}`,
                                        className: 'font-medium text-gray-900 dark:text-white'
                                    }, order.item_count || 0)
                                ]),

                                // Status
                                React.createElement('div', { key: `status-${order.id}` }, [
                                    React.createElement('span', {
                                        key: `status-badge-${order.id}`,
                                        className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`
                                    }, order.status?.toUpperCase())
                                ]),

                                // Total
                                React.createElement('div', {
                                    key: `total-${order.id}`,
                                    className: 'text-right'
                                }, [
                                    React.createElement('div', {
                                        key: `total-label-${order.id}`,
                                        className: 'text-sm text-gray-600 dark:text-gray-400'
                                    }, 'Total'),
                                    React.createElement('div', {
                                        key: `total-value-${order.id}`,
                                        className: 'font-bold text-lg text-gray-900 dark:text-white'
                                    }, formatCurrency(order.total_amount))
                                ])
                            ]),

                            // Right side - Expand button and actions
                            React.createElement('div', {
                                key: `order-actions-${order.id}`,
                                className: 'flex items-center gap-2 ml-4'
                            }, [
                                // Move to cart button for pickup status
                                order.status === 'pickup' && React.createElement('button', {
                                    key: `move-to-cart-${order.id}`,
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        onLoadToCart(order);
                                    },
                                    className: 'px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1'
                                }, [
                                    React.createElement(ShoppingCart, { key: `cart-icon-${order.id}`, size: 16 }),
                                    React.createElement('span', { key: `cart-text-${order.id}` }, 'Move to Cart')
                                ]),

                                // Expand/collapse icon
                                React.createElement('div', {
                                    key: `expand-icon-${order.id}`,
                                    className: 'text-gray-400'
                                }, [
                                    isExpanded 
                                        ? React.createElement(ChevronUp, { key: `chevron-up-${order.id}`, size: 24 })
                                        : React.createElement(ChevronDown, { key: `chevron-down-${order.id}`, size: 24 })
                                ])
                            ])
                        ])
                    ]),

                    // Expanded details
                    isExpanded && React.createElement('div', {
                        key: `order-details-${order.id}`,
                        className: 'border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900'
                    }, [
                        // Order items
                        React.createElement('div', {
                            key: `order-items-${order.id}`,
                            className: 'mb-4'
                        }, [
                            React.createElement('h4', {
                                key: `items-title-${order.id}`,
                                className: 'font-semibold text-gray-900 dark:text-white mb-3'
                            }, 'Order Items'),
                            React.createElement('div', {
                                key: `items-list-${order.id}`,
                                className: 'space-y-2'
                            }, (order.items || []).map((item, idx) =>
                                React.createElement('div', {
                                    key: `item-${order.id}-${idx}`,
                                    className: 'flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg'
                                }, [
                                    // Product image
                                    item.product_image_url && React.createElement('img', {
                                        key: `item-img-${order.id}-${idx}`,
                                        src: item.product_image_url,
                                        alt: item.product_name,
                                        className: 'w-16 h-16 object-cover rounded'
                                    }),
                                    
                                    // Product details
                                    React.createElement('div', {
                                        key: `item-details-${order.id}-${idx}`,
                                        className: 'flex-1'
                                    }, [
                                        React.createElement('div', {
                                            key: `item-name-${order.id}-${idx}`,
                                            className: 'font-medium text-gray-900 dark:text-white'
                                        }, item.product_name),
                                        item.product_sku && React.createElement('div', {
                                            key: `item-sku-${order.id}-${idx}`,
                                            className: 'text-sm text-gray-600 dark:text-gray-400'
                                        }, `SKU: ${item.product_sku}`),
                                        item.voucher_discount > 0 && React.createElement('div', {
                                            key: `item-voucher-${order.id}-${idx}`,
                                            className: 'text-sm text-green-600 dark:text-green-400'
                                        }, `Voucher Discount: ${formatCurrency(item.voucher_discount)}`)
                                    ]),

                                    // Quantity and price
                                    React.createElement('div', {
                                        key: `item-pricing-${order.id}-${idx}`,
                                        className: 'text-right'
                                    }, [
                                        React.createElement('div', {
                                            key: `item-qty-${order.id}-${idx}`,
                                            className: 'text-sm text-gray-600 dark:text-gray-400'
                                        }, `Qty: ${item.quantity} × ${formatCurrency(item.unit_price)}`),
                                        React.createElement('div', {
                                            key: `item-total-${order.id}-${idx}`,
                                            className: 'font-semibold text-gray-900 dark:text-white'
                                        }, formatCurrency(item.total_price))
                                    ])
                                ])
                            ))
                        ]),

                        // Voucher/Coupon info
                        (order.voucher_discount > 0 || order.coupon_discount > 0) && React.createElement('div', {
                            key: `discounts-${order.id}`,
                            className: 'mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'
                        }, [
                            React.createElement('h4', {
                                key: `discounts-title-${order.id}`,
                                className: 'font-semibold text-gray-900 dark:text-white mb-2'
                            }, 'Applied Discounts'),
                            order.voucher_discount > 0 && React.createElement('div', {
                                key: `voucher-info-${order.id}`,
                                className: 'text-sm text-gray-700 dark:text-gray-300'
                            }, `Voucher Discount: ${formatCurrency(order.voucher_discount)}`),
                            order.coupon_discount > 0 && React.createElement('div', {
                                key: `coupon-info-${order.id}`,
                                className: 'text-sm text-gray-700 dark:text-gray-300'
                            }, `Coupon (${order.coupon_code}): ${formatCurrency(order.coupon_discount)}`)
                        ]),

                        // Order totals
                        React.createElement('div', {
                            key: `totals-${order.id}`,
                            className: 'border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2'
                        }, [
                            React.createElement('div', {
                                key: `subtotal-${order.id}`,
                                className: 'flex justify-between text-sm'
                            }, [
                                React.createElement('span', {
                                    key: `subtotal-label-${order.id}`,
                                    className: 'text-gray-600 dark:text-gray-400'
                                }, 'Subtotal:'),
                                React.createElement('span', {
                                    key: `subtotal-value-${order.id}`,
                                    className: 'text-gray-900 dark:text-white'
                                }, formatCurrency(order.subtotal))
                            ]),
                            order.discount_amount > 0 && React.createElement('div', {
                                key: `discount-${order.id}`,
                                className: 'flex justify-between text-sm'
                            }, [
                                React.createElement('span', {
                                    key: `discount-label-${order.id}`,
                                    className: 'text-gray-600 dark:text-gray-400'
                                }, 'Discount:'),
                                React.createElement('span', {
                                    key: `discount-value-${order.id}`,
                                    className: 'text-green-600 dark:text-green-400'
                                }, `-${formatCurrency(order.discount_amount)}`)
                            ]),
                            React.createElement('div', {
                                key: `tax-${order.id}`,
                                className: 'flex justify-between text-sm'
                            }, [
                                React.createElement('span', {
                                    key: `tax-label-${order.id}`,
                                    className: 'text-gray-600 dark:text-gray-400'
                                }, 'Tax:'),
                                React.createElement('span', {
                                    key: `tax-value-${order.id}`,
                                    className: 'text-gray-900 dark:text-white'
                                }, formatCurrency(order.tax_amount))
                            ]),
                            React.createElement('div', {
                                key: `total-final-${order.id}`,
                                className: 'flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2'
                            }, [
                                React.createElement('span', {
                                    key: `total-final-label-${order.id}`,
                                    className: 'text-gray-900 dark:text-white'
                                }, 'Total:'),
                                React.createElement('span', {
                                    key: `total-final-value-${order.id}`,
                                    className: 'text-gray-900 dark:text-white'
                                }, formatCurrency(order.total_amount))
                            ])
                        ])
                    ])
                ]);
            }))
        ])
    ]);
};




