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

    // Tab state
    const [activeTab, setActiveTab] = React.useState('local'); // 'local' or 'salesforce'

    // Local orders state
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [originFilter, setOriginFilter] = React.useState('all');
    const [dateFrom, setDateFrom] = React.useState('');
    const [dateTo, setDateTo] = React.useState('');
    const [expandedOrders, setExpandedOrders] = React.useState(new Set());
    const [showFilters, setShowFilters] = React.useState(false);

    // Salesforce orders state
    const [sfOrders, setSfOrders] = React.useState([]);
    const [sfLoading, setSfLoading] = React.useState(false);
    const [sfSearchType, setSfSearchType] = React.useState('all'); // 'all', 'customer', 'email'
    const [sfSearchTerm, setSfSearchTerm] = React.useState('');
    const [sfCustomers, setSfCustomers] = React.useState([]);
    const [sfSelectedCustomer, setSfSelectedCustomer] = React.useState(null);
    const [sfExpandedOrders, setSfExpandedOrders] = React.useState(new Set());

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

    // Salesforce Functions
    
    // Search customers by name
    const searchCustomers = async (searchText) => {
        if (!searchText || searchText.length < 2) {
            setSfCustomers([]);
            return;
        }

        try {
            const response = await window.API.call(`/customers?search=${encodeURIComponent(searchText)}`);
            setSfCustomers(response || []);
        } catch (error) {
            console.error('Error searching customers:', error);
            window.NotificationManager.error('Search Failed', 'Failed to search customers');
            setSfCustomers([]);
        }
    };

    // Fetch Salesforce orders
    const fetchSalesforceOrders = async () => {
        if (sfSearchType === 'customer' && !sfSelectedCustomer) {
            window.NotificationManager.warning('Customer Required', 'Please select a customer first');
            return;
        }

        if (sfSearchType === 'email' && !sfSearchTerm) {
            window.NotificationManager.warning('Email Required', 'Please enter an email address');
            return;
        }

        setSfLoading(true);
        console.log('🔍 Fetching Salesforce orders');
        console.log('   Search type:', sfSearchType);
        console.log('   Selected customer:', sfSelectedCustomer);
        console.log('   Search term:', sfSearchTerm);

        try {
            let endpoint = '';
            
            if (sfSearchType === 'all') {
                endpoint = '/orders/salesforce';
            } else if (sfSearchType === 'customer' && sfSelectedCustomer) {
                endpoint = `/orders/salesforce/account?LoyaltyMemberID=${sfSelectedCustomer.sf_id}`;
            } else if (sfSearchType === 'email' && sfSearchTerm) {
                endpoint = `/orders/salesforce/account?email=${encodeURIComponent(sfSearchTerm)}`;
            }

            console.log('   Calling endpoint:', endpoint);

            const response = await window.API.call(endpoint);
            console.log('✅ Salesforce orders received:', response);
            
            setSfOrders(Array.isArray(response) ? response : []);
            
            window.NotificationManager.success(
                'Orders Retrieved', 
                `Found ${Array.isArray(response) ? response.length : 0} Salesforce order(s)`
            );
        } catch (error) {
            console.error('❌ Error fetching Salesforce orders:', error);
            window.NotificationManager.error('Fetch Failed', error.message || 'Failed to fetch Salesforce orders');
            setSfOrders([]);
        } finally {
            setSfLoading(false);
        }
    };

    // Toggle Salesforce order expansion
    const toggleSfOrder = (orderId) => {
        const newExpanded = new Set(sfExpandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setSfExpandedOrders(newExpanded);
    };

    // Handle customer search input change
    React.useEffect(() => {
        if (sfSearchType === 'customer' && sfSearchTerm) {
            const timeoutId = setTimeout(() => {
                searchCustomers(sfSearchTerm);
            }, 300); // Debounce
            return () => clearTimeout(timeoutId);
        }
    }, [sfSearchTerm, sfSearchType]);

    // Move Salesforce order to cart (create local order)
    const handleMoveSfOrderToCart = async (sfOrder) => {
        try {
            console.log('🛒 Moving Salesforce order to cart:', sfOrder.order_number_sf);
            
            // Validate order has items
            if (!sfOrder.order_items || sfOrder.order_items.length === 0) {
                window.NotificationManager.warning('No Items', 'This order has no items to move');
                return;
            }

            // Validate products have External_ID__c (local DB ID)
            const itemsWithoutLocalId = sfOrder.order_items.filter(item => 
                !item.product || !item.product.External_ID__c
            );
            
            if (itemsWithoutLocalId.length > 0) {
                window.NotificationManager.error(
                    'Missing Product IDs', 
                    `${itemsWithoutLocalId.length} product(s) don't have a local database ID. Cannot create order.`
                );
                return;
            }

            if (!selectedLocation) {
                window.NotificationManager.warning('Location Required', 'Please select a location first');
                return;
            }

            // Create order in local database
            const orderData = {
                sf_id: sfOrder.id,
                order_number_sf: sfOrder.order_number_sf,
                customer_id: null, // Will be set if customer is found
                location_id: selectedLocation.id,
                status: 'pending',
                origin: 'salesforce',
                subtotal: parseFloat(sfOrder.total_amount),
                discount_amount: 0,
                tax_amount: 0,
                total_amount: parseFloat(sfOrder.total_amount),
                items: sfOrder.order_items.map(item => ({
                    product_id: parseInt(item.product.External_ID__c),
                    product_name: item.product.Name,
                    product_sku: item.product.StockKeepingUnit || item.product.ProductCode,
                    product_image_url: item.product.DisplayUrl,
                    quantity: parseFloat(item.quantity),
                    unit_price: parseFloat(item.unit_price),
                    tax_amount: 0,
                    discount_amount: 0,
                    voucher_discount: 0,
                    total_price: parseFloat(item.total_price),
                    sf_id: item.id
                }))
            };

            console.log('📦 Creating local order:', orderData);

            const response = await window.API.call('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });

            console.log('✅ Order created:', response);

            window.NotificationManager.success(
                'Order Created', 
                `Order ${response.order_number} created successfully. You can now edit it in the Orders tab.`
            );

            // Refresh orders if callback provided
            if (onRefresh) {
                onRefresh();
            }

        } catch (error) {
            console.error('❌ Error moving SF order to cart:', error);
            window.NotificationManager.error('Failed to Create Order', error.message || 'Unknown error occurred');
        }
    };

    return React.createElement('div', {
        key: 'orders-view',
        className: 'h-full flex flex-col bg-gray-50 dark:bg-gray-900'
    }, [
        // Header with Tabs
        React.createElement('div', {
            key: 'header',
            className: 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'
        }, [
            // Title and refresh button
            React.createElement('div', {
                key: 'header-content',
                className: 'flex items-center justify-between p-6 pb-0'
            }, [
                React.createElement('div', { key: 'title-section' }, [
                    React.createElement('h1', {
                        key: 'title',
                        className: 'text-2xl font-bold text-gray-900 dark:text-white'
                    }, 'Orders'),
                    React.createElement('p', {
                        key: 'subtitle',
                        className: 'text-sm text-gray-600 dark:text-gray-400 mt-1'
                    }, activeTab === 'local' 
                        ? `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''} found`
                        : `${sfOrders.length} Salesforce order${sfOrders.length !== 1 ? 's' : ''} found`)
                ]),
                React.createElement('button', {
                    key: 'refresh-btn',
                    onClick: activeTab === 'local' ? onRefresh : fetchSalesforceOrders,
                    disabled: activeTab === 'salesforce' && sfLoading,
                    className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                }, activeTab === 'salesforce' && sfLoading ? 'Loading...' : 'Refresh')
            ]),
            
            // Tabs
            React.createElement('div', {
                key: 'tabs',
                className: 'flex gap-1 px-6 mt-4'
            }, [
                React.createElement('button', {
                    key: 'local-tab',
                    onClick: () => setActiveTab('local'),
                    className: `px-6 py-3 font-medium transition-colors rounded-t-lg ${
                        activeTab === 'local'
                            ? 'bg-gray-50 dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`
                }, 'Orders'),
                React.createElement('button', {
                    key: 'salesforce-tab',
                    onClick: () => setActiveTab('salesforce'),
                    className: `px-6 py-3 font-medium transition-colors rounded-t-lg ${
                        activeTab === 'salesforce'
                            ? 'bg-gray-50 dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`
                }, 'Salesforce Orders')
            ])
        ]),

        // LOCAL ORDERS TAB
        activeTab === 'local' && React.createElement('div', {
            key: 'local-orders-content',
            className: 'flex-1 flex flex-col overflow-hidden'
        }, [
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
                                (order.status === 'pickup' || order.status === 'pending') && React.createElement('button', {
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
        ]), // End of local orders tab

        // SALESFORCE ORDERS TAB
        activeTab === 'salesforce' && React.createElement('div', {
            key: 'salesforce-orders-content',
            className: 'flex-1 flex flex-col overflow-hidden'
        }, [
            // Salesforce Search Section
            React.createElement('div', {
                key: 'sf-search',
                className: 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4'
            }, [
                // Search type selector
                React.createElement('div', {
                    key: 'sf-search-type',
                    className: 'mb-4'
                }, [
                    React.createElement('label', {
                        key: 'sf-search-type-label',
                        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    }, 'Search By:'),
                    React.createElement('div', {
                        key: 'sf-search-type-buttons',
                        className: 'flex gap-2'
                    }, [
                        React.createElement('button', {
                            key: 'sf-type-all',
                            onClick: () => {
                                setSfSearchType('all');
                                setSfSearchTerm('');
                                setSfSelectedCustomer(null);
                                setSfCustomers([]);
                            },
                            className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                                sfSearchType === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`
                        }, 'All Orders'),
                        React.createElement('button', {
                            key: 'sf-type-customer',
                            onClick: () => {
                                setSfSearchType('customer');
                                setSfSearchTerm('');
                                setSfSelectedCustomer(null);
                            },
                            className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                                sfSearchType === 'customer'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`
                        }, 'By Customer'),
                        React.createElement('button', {
                            key: 'sf-type-email',
                            onClick: () => {
                                setSfSearchType('email');
                                setSfSearchTerm('');
                                setSfSelectedCustomer(null);
                                setSfCustomers([]);
                            },
                            className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                                sfSearchType === 'email'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`
                        }, 'By Email')
                    ])
                ]),

                // Customer search (when type is 'customer')
                sfSearchType === 'customer' && React.createElement('div', {
                    key: 'sf-customer-search',
                    className: 'mb-4'
                }, [
                    React.createElement('label', {
                        key: 'sf-customer-label',
                        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    }, 'Search Customer:'),
                    React.createElement('div', {
                        key: 'sf-customer-input-wrapper',
                        className: 'relative'
                    }, [
                        React.createElement(User, {
                            key: 'sf-customer-icon',
                            className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
                            size: 20
                        }),
                        React.createElement('input', {
                            key: 'sf-customer-input',
                            type: 'text',
                            value: sfSearchTerm,
                            onChange: (e) => setSfSearchTerm(e.target.value),
                            placeholder: 'Type customer name or last name...',
                            className: 'w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        })
                    ]),
                    // Customer dropdown
                    sfCustomers.length > 0 && React.createElement('div', {
                        key: 'sf-customer-dropdown',
                        className: 'mt-2 max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700'
                    }, sfCustomers.map((customer, idx) =>
                        React.createElement('button', {
                            key: `customer-${customer.id}`,
                            onClick: () => {
                                setSfSelectedCustomer(customer);
                                setSfSearchTerm(`${customer.first_name} ${customer.last_name}`);
                                setSfCustomers([]);
                            },
                            className: 'w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0'
                        }, [
                            React.createElement('div', {
                                key: `customer-name-${customer.id}`,
                                className: 'font-medium text-gray-900 dark:text-white'
                            }, `${customer.first_name} ${customer.last_name}`),
                            React.createElement('div', {
                                key: `customer-details-${customer.id}`,
                                className: 'text-sm text-gray-600 dark:text-gray-400'
                            }, [
                                customer.email && React.createElement('span', {
                                    key: `customer-email-${customer.id}`
                                }, customer.email),
                                customer.loyalty_number && React.createElement('span', {
                                    key: `customer-loyalty-${customer.id}`,
                                    className: 'ml-2'
                                }, ` • Loyalty: ${customer.loyalty_number}`),
                                customer.sf_id && React.createElement('span', {
                                    key: `customer-sf-${customer.id}`,
                                    className: 'ml-2'
                                }, ` • SF ID: ${customer.sf_id}`)
                            ])
                        ])
                    )),
                    // Selected customer display
                    sfSelectedCustomer && React.createElement('div', {
                        key: 'sf-selected-customer',
                        className: 'mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'
                    }, [
                        React.createElement('div', {
                            key: 'sf-selected-label',
                            className: 'text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1'
                        }, 'SELECTED CUSTOMER'),
                        React.createElement('div', {
                            key: 'sf-selected-name',
                            className: 'font-medium text-gray-900 dark:text-white'
                        }, `${sfSelectedCustomer.first_name} ${sfSelectedCustomer.last_name}`),
                        React.createElement('div', {
                            key: 'sf-selected-details',
                            className: 'text-sm text-gray-600 dark:text-gray-400'
                        }, `SF ID: ${sfSelectedCustomer.sf_id || 'N/A'}`)
                    ])
                ]),

                // Email search (when type is 'email')
                sfSearchType === 'email' && React.createElement('div', {
                    key: 'sf-email-search',
                    className: 'mb-4'
                }, [
                    React.createElement('label', {
                        key: 'sf-email-label',
                        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    }, 'Email Address:'),
                    React.createElement('div', {
                        key: 'sf-email-input-wrapper',
                        className: 'relative'
                    }, [
                        React.createElement(Mail, {
                            key: 'sf-email-icon',
                            className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
                            size: 20
                        }),
                        React.createElement('input', {
                            key: 'sf-email-input',
                            type: 'email',
                            value: sfSearchTerm,
                            onChange: (e) => setSfSearchTerm(e.target.value),
                            placeholder: 'Enter email address...',
                            className: 'w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        })
                    ])
                ]),

                // Search button
                React.createElement('button', {
                    key: 'sf-search-btn',
                    onClick: fetchSalesforceOrders,
                    disabled: sfLoading || (sfSearchType === 'customer' && !sfSelectedCustomer) || (sfSearchType === 'email' && !sfSearchTerm),
                    className: 'w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                }, sfLoading ? 'Searching...' : 'Search Salesforce Orders')
            ]),

            // Salesforce Orders List
            React.createElement('div', {
                key: 'sf-orders-list',
                className: 'flex-1 overflow-y-auto p-6'
            }, [
                // Loading state
                sfLoading && React.createElement('div', {
                    key: 'sf-loading',
                    className: 'flex items-center justify-center py-12'
                }, [
                    React.createElement('div', {
                        key: 'sf-loading-spinner',
                        className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'
                    })
                ]),

                // Empty state
                !sfLoading && sfOrders.length === 0 && React.createElement('div', {
                    key: 'sf-empty',
                    className: 'text-center py-12'
                }, [
                    React.createElement(Package, {
                        key: 'sf-empty-icon',
                        className: 'mx-auto mb-4 text-gray-400',
                        size: 64
                    }),
                    React.createElement('h3', {
                        key: 'sf-empty-title',
                        className: 'text-xl font-semibold text-gray-900 dark:text-white mb-2'
                    }, 'No Salesforce Orders Found'),
                    React.createElement('p', {
                        key: 'sf-empty-text',
                        className: 'text-gray-600 dark:text-gray-400'
                    }, 'Select a search method and click "Search Salesforce Orders" to begin')
                ]),

                // Orders list
                !sfLoading && sfOrders.length > 0 && React.createElement('div', {
                    key: 'sf-orders-container',
                    className: 'space-y-4'
                }, sfOrders.map(order =>
                    React.createElement('div', {
                        key: `sf-order-${order.id}`,
                        className: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'
                    }, [
                        // Order header (clickable to expand)
                        React.createElement('div', {
                            key: `sf-order-header-${order.id}`,
                            onClick: () => toggleSfOrder(order.id),
                            className: 'p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                        }, [
                            React.createElement('div', {
                                key: `sf-order-header-content-${order.id}`,
                                className: 'flex items-center justify-between'
                            }, [
                                React.createElement('div', {
                                    key: `sf-order-info-${order.id}`,
                                    className: 'flex-1 grid grid-cols-2 md:grid-cols-5 gap-4'
                                }, [
                                    // Order numbers (both POS and SF)
                                    React.createElement('div', {
                                        key: `sf-order-num-${order.id}`
                                    }, [
                                        React.createElement('div', {
                                            key: `sf-order-num-label-${order.id}`,
                                            className: 'text-xs text-gray-500 dark:text-gray-400'
                                        }, 'Order #'),
                                        React.createElement('div', {
                                            key: `sf-order-num-value-${order.id}`,
                                            className: 'font-medium text-gray-900 dark:text-white'
                                        }, order.order_number || order.order_number_sf),
                                        order.order_number_sf && React.createElement('div', {
                                            key: `sf-order-num-sf-${order.id}`,
                                            className: 'text-xs text-gray-500 dark:text-gray-400 mt-1'
                                        }, `SF: ${order.order_number_sf}`)
                                    ]),
                                    // Customer
                                    React.createElement('div', {
                                        key: `sf-order-customer-${order.id}`
                                    }, [
                                        React.createElement('div', {
                                            key: `sf-order-customer-label-${order.id}`,
                                            className: 'text-xs text-gray-500 dark:text-gray-400'
                                        }, 'Customer'),
                                        React.createElement('div', {
                                            key: `sf-order-customer-value-${order.id}`,
                                            className: 'font-medium text-gray-900 dark:text-white'
                                        }, order.customer?.name || 'N/A'),
                                        order.customer?.email && React.createElement('div', {
                                            key: `sf-order-customer-email-${order.id}`,
                                            className: 'text-xs text-gray-500 dark:text-gray-400 mt-1'
                                        }, order.customer.email)
                                    ]),
                                    // Status
                                    React.createElement('div', {
                                        key: `sf-order-status-${order.id}`
                                    }, [
                                        React.createElement('div', {
                                            key: `sf-order-status-label-${order.id}`,
                                            className: 'text-xs text-gray-500 dark:text-gray-400'
                                        }, 'Status'),
                                        React.createElement('span', {
                                            key: `sf-order-status-badge-${order.id}`,
                                            className: 'inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                        }, order.status)
                                    ]),
                                    // Total
                                    React.createElement('div', {
                                        key: `sf-order-total-${order.id}`
                                    }, [
                                        React.createElement('div', {
                                            key: `sf-order-total-label-${order.id}`,
                                            className: 'text-xs text-gray-500 dark:text-gray-400'
                                        }, 'Total'),
                                        React.createElement('div', {
                                            key: `sf-order-total-value-${order.id}`,
                                            className: 'font-medium text-gray-900 dark:text-white'
                                        }, formatCurrency(parseFloat(order.total_amount)))
                                    ]),
                                    // Date
                                    React.createElement('div', {
                                        key: `sf-order-date-${order.id}`
                                    }, [
                                        React.createElement('div', {
                                            key: `sf-order-date-label-${order.id}`,
                                            className: 'text-xs text-gray-500 dark:text-gray-400'
                                        }, 'Created'),
                                        React.createElement('div', {
                                            key: `sf-order-date-value-${order.id}`,
                                            className: 'text-sm text-gray-900 dark:text-white'
                                        }, formatDate(order.created_date))
                                    ])
                                ]),
                                // Expand icon
                                React.createElement(sfExpandedOrders.has(order.id) ? ChevronUp : ChevronDown, {
                                    key: `sf-order-chevron-${order.id}`,
                                    className: 'text-gray-400',
                                    size: 20
                                })
                            ])
                        ]),

                        // Order details (expanded)
                        sfExpandedOrders.has(order.id) && React.createElement('div', {
                            key: `sf-order-details-${order.id}`,
                            className: 'border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900'
                        }, [
                            // Action buttons
                            React.createElement('div', {
                                key: `sf-actions-${order.id}`,
                                className: 'mb-4 flex gap-2'
                            }, [
                                React.createElement('button', {
                                    key: `sf-move-cart-${order.id}`,
                                    onClick: () => handleMoveSfOrderToCart(order),
                                    className: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2'
                                }, [
                                    React.createElement(ShoppingCart, { key: 'cart-icon', size: 18 }),
                                    React.createElement('span', { key: 'cart-text' }, 'Move to Cart')
                                ])
                            ]),
                            
                            // Order items
                            React.createElement('h4', {
                                key: `sf-items-title-${order.id}`,
                                className: 'font-semibold text-gray-900 dark:text-white mb-3'
                            }, 'Order Items'),
                            React.createElement('div', {
                                key: `sf-items-list-${order.id}`,
                                className: 'space-y-2'
                            }, (order.order_items || []).map((item, idx) =>
                                React.createElement('div', {
                                    key: `sf-item-${order.id}-${idx}`,
                                    className: 'flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'
                                }, [
                                    // Product thumbnail
                                    item.product && item.product.DisplayUrl && React.createElement('img', {
                                        key: `sf-item-img-${order.id}-${idx}`,
                                        src: item.product.DisplayUrl,
                                        alt: item.product.Name || 'Product',
                                        className: 'w-16 h-16 object-cover rounded flex-shrink-0',
                                        onError: (e) => { e.target.style.display = 'none'; }
                                    }),
                                    
                                    // Product info
                                    React.createElement('div', {
                                        key: `sf-item-info-${order.id}-${idx}`,
                                        className: 'flex-1 min-w-0'
                                    }, [
                                        // Product name (most important)
                                        React.createElement('div', {
                                            key: `sf-item-name-${order.id}-${idx}`,
                                            className: 'font-semibold text-gray-900 dark:text-white mb-1'
                                        }, item.product ? item.product.Name : `Item #${item.order_item_number}`),
                                        
                                        // Product code, family, SKU in one line
                                        item.product && React.createElement('div', {
                                            key: `sf-item-details-${order.id}-${idx}`,
                                            className: 'text-xs text-gray-600 dark:text-gray-400 space-x-2'
                                        }, [
                                            item.product.ProductCode && React.createElement('span', {
                                                key: `sf-item-code-${order.id}-${idx}`
                                            }, item.product.ProductCode),
                                            item.product.ProductCode && item.product.Family && React.createElement('span', {
                                                key: `sf-item-sep1-${order.id}-${idx}`
                                            }, '•'),
                                            item.product.Family && React.createElement('span', {
                                                key: `sf-item-family-${order.id}-${idx}`
                                            }, item.product.Family),
                                            item.product.Family && item.product.StockKeepingUnit && React.createElement('span', {
                                                key: `sf-item-sep2-${order.id}-${idx}`
                                            }, '•'),
                                            item.product.StockKeepingUnit && React.createElement('span', {
                                                key: `sf-item-sku-${order.id}-${idx}`
                                            }, `SKU: ${item.product.StockKeepingUnit}`)
                                        ])
                                    ]),
                                    
                                    // Quantity
                                    React.createElement('div', {
                                        key: `sf-item-qty-${order.id}-${idx}`,
                                        className: 'text-center px-3'
                                    }, [
                                        React.createElement('div', {
                                            key: `sf-item-qty-label-${order.id}-${idx}`,
                                            className: 'text-xs text-gray-500 dark:text-gray-400'
                                        }, 'Qty'),
                                        React.createElement('div', {
                                            key: `sf-item-qty-value-${order.id}-${idx}`,
                                            className: 'font-bold text-gray-900 dark:text-white'
                                        }, parseFloat(item.quantity))
                                    ]),
                                    
                                    // Pricing
                                    React.createElement('div', {
                                        key: `sf-item-price-${order.id}-${idx}`,
                                        className: 'text-right'
                                    }, [
                                        React.createElement('div', {
                                            key: `sf-item-unit-${order.id}-${idx}`,
                                            className: 'text-xs text-gray-500 dark:text-gray-400'
                                        }, `@ ${formatCurrency(parseFloat(item.unit_price))}`),
                                        React.createElement('div', {
                                            key: `sf-item-total-${order.id}-${idx}`,
                                            className: 'font-semibold text-gray-900 dark:text-white'
                                        }, formatCurrency(parseFloat(item.total_price)))
                                    ])
                                ])
                            ))
                        ])
                    ])
                ))
            ])
        ])
    ]);
};




