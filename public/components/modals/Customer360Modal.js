if (!window.Modals) {
    window.Modals = {};
}

/**
 * Customer 360 View Modal
 * Comprehensive view of customer information with tabs:
 * - Info: Profile, contact, address
 * - Loyalty: Member status, tier, loyalty info
 * - Promotions: Customer, tier, and general promotions
 * - Vouchers: Customer vouchers
 * - Orders: Online and Salesforce orders
 * - Transactions: Purchase history
 * - Notes: Read-only notes
 */
window.Modals.Customer360Modal = ({ customer, isOpen, onClose }) => {
    const { 
        X, User, Award, Tag, Ticket, ShoppingBag, Receipt, FileText,
        Mail, Phone, MapPin, Calendar, TrendingUp, CreditCard,
        Package, Clock, CheckCircle, AlertCircle, Loader
    } = window.Icons;

    const [activeTab, setActiveTab] = React.useState('info');
    const [loading, setLoading] = React.useState(false);
    const [promotions, setPromotions] = React.useState([]);
    const [vouchers, setVouchers] = React.useState([]);
    const [onlineOrders, setOnlineOrders] = React.useState([]);
    const [salesforceOrders, setSalesforceOrders] = React.useState([]);
    const [transactions, setTransactions] = React.useState([]);
    const [customerAvatar, setCustomerAvatar] = React.useState(null);

    if (!isOpen || !customer) return null;

    // Fetch data when modal opens
    React.useEffect(() => {
        if (isOpen && customer) {
            fetchCustomerData();
        }
    }, [isOpen, customer?.id, activeTab]);

    const fetchCustomerData = async () => {
        try {
            setLoading(true);

            // Fetch avatar
            if (activeTab === 'info') {
                try {
                    const avatarResponse = await fetch(`/api/customers/${customer.id}/avatar`);
                    if (avatarResponse.ok) {
                        const avatarData = await avatarResponse.json();
                        setCustomerAvatar(avatarData.avatar?.image_data);
                    }
                } catch (err) {
                    console.log('No avatar found');
                }
            }

            // Fetch promotions
            if (activeTab === 'promotions' && customer.loyalty_number) {
                try {
                    const response = await fetch(`/api/customers/${customer.id}/promotions`);
                    if (response.ok) {
                        const data = await response.json();
                        setPromotions(data.promotions || []);
                    }
                } catch (err) {
                    console.error('Error fetching promotions:', err);
                }
            }

            // Fetch vouchers
            if (activeTab === 'vouchers') {
                try {
                    const response = await fetch(`/api/customers/${customer.id}/vouchers`);
                    if (response.ok) {
                        const data = await response.json();
                        setVouchers(data.vouchers || []);
                    }
                } catch (err) {
                    console.error('Error fetching vouchers:', err);
                }
            }

            // Fetch orders
            if (activeTab === 'orders') {
                // Online orders from database
                try {
                    const response = await fetch(`/api/orders?customer_id=${customer.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setOnlineOrders(data || []);
                    }
                } catch (err) {
                    console.error('Error fetching online orders:', err);
                }

                // Salesforce orders (only if sf_id exists)
                if (customer.sf_id) {
                    try {
                        const response = await fetch(`/api/customers/${customer.id}/salesforce-orders`);
                        if (response.ok) {
                            const data = await response.json();
                            setSalesforceOrders(data.orders || []);
                        }
                    } catch (err) {
                        console.error('Error fetching Salesforce orders:', err);
                    }
                }
            }

            // Fetch transactions
            if (activeTab === 'transactions') {
                try {
                    const response = await fetch(`/api/customers/${customer.id}/transactions`);
                    if (response.ok) {
                        const data = await response.json();
                        setTransactions(data.transactions || []);
                    }
                } catch (err) {
                    console.error('Error fetching transactions:', err);
                }
            }

        } catch (error) {
            console.error('Error fetching customer data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Tab component
    const Tab = ({ id, label, icon: Icon }) => (
        React.createElement('button', {
            key: id,
            onClick: () => setActiveTab(id),
            className: `flex items-center gap-2 px-4 py-3 font-medium text-sm rounded-lg transition-colors ${
                activeTab === id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`
        }, [
            React.createElement(Icon, { key: 'icon', size: 18 }),
            React.createElement('span', { key: 'label' }, label)
        ])
    );

    // Info Tab Content
    const renderInfoTab = () => {
        return React.createElement('div', { key: 'info-content', className: 'space-y-6' }, [
            // Profile Section
            React.createElement('div', { key: 'profile', className: 'flex items-start gap-6' }, [
                // Avatar
                React.createElement('div', { 
                    key: 'avatar',
                    className: 'w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0'
                }, [
                    customerAvatar ?
                        React.createElement('img', {
                            key: 'avatar-img',
                            src: customerAvatar,
                            alt: customer.name,
                            className: 'w-full h-full object-cover'
                        }) :
                        React.createElement(User, { key: 'avatar-placeholder', size: 48, className: 'text-gray-400' })
                ]),
                // Basic Info
                React.createElement('div', { key: 'basic-info', className: 'flex-1 space-y-3' }, [
                    React.createElement('div', { key: 'name-section' }, [
                        React.createElement('h3', { key: 'name', className: 'text-2xl font-bold text-gray-900 dark:text-white' }, 
                            customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                        ),
                        React.createElement('p', { key: 'loyalty-number', className: 'text-blue-600 font-mono text-sm mt-1' }, 
                            customer.loyalty_number
                        )
                    ]),
                    React.createElement('div', { key: 'contact-grid', className: 'grid grid-cols-1 md:grid-cols-2 gap-3' }, [
                        customer.email && React.createElement('div', { key: 'email', className: 'flex items-center gap-2 text-sm' }, [
                            React.createElement(Mail, { key: 'icon', size: 16, className: 'text-gray-400' }),
                            React.createElement('span', { key: 'value', className: 'text-gray-700 dark:text-gray-300' }, customer.email)
                        ]),
                        customer.phone && React.createElement('div', { key: 'phone', className: 'flex items-center gap-2 text-sm' }, [
                            React.createElement(Phone, { key: 'icon', size: 16, className: 'text-gray-400' }),
                            React.createElement('span', { key: 'value', className: 'text-gray-700 dark:text-gray-300' }, customer.phone)
                        ]),
                        customer.date_of_birth && React.createElement('div', { key: 'dob', className: 'flex items-center gap-2 text-sm' }, [
                            React.createElement(Calendar, { key: 'icon', size: 16, className: 'text-gray-400' }),
                            React.createElement('span', { key: 'value', className: 'text-gray-700 dark:text-gray-300' }, 
                                new Date(customer.date_of_birth).toLocaleDateString()
                            )
                        ])
                    ])
                ])
            ]),

            // Address Section
            (customer.address || customer.city || customer.state || customer.zip_code) &&
            React.createElement('div', { key: 'address-section', className: 'bg-gray-50 dark:bg-gray-800 rounded-lg p-4' }, [
                React.createElement('h4', { key: 'title', className: 'font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2' }, [
                    React.createElement(MapPin, { key: 'icon', size: 18 }),
                    'Address Information'
                ]),
                React.createElement('div', { key: 'address-details', className: 'text-sm text-gray-700 dark:text-gray-300 space-y-1' }, [
                    customer.address && React.createElement('div', { key: 'street' }, customer.address),
                    React.createElement('div', { key: 'city-state' }, 
                        `${customer.city || ''}, ${customer.state || ''} ${customer.zip_code || ''}`.trim()
                    ),
                    customer.country && React.createElement('div', { key: 'country' }, customer.country)
                ])
            ])
        ]);
    };

    // Loyalty Tab Content
    const renderLoyaltyTab = () => {
        const memberSince = customer.enrollment_date ? new Date(customer.enrollment_date) : new Date(customer.created_at);
        const daysSinceMember = Math.floor((new Date() - memberSince) / (1000 * 60 * 60 * 24));

        return React.createElement('div', { key: 'loyalty-content', className: 'space-y-6' }, [
            // Stats Cards
            React.createElement('div', { key: 'stats', className: 'grid grid-cols-1 md:grid-cols-3 gap-4' }, [
                React.createElement('div', { key: 'points', className: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-800' }, [
                    React.createElement('div', { key: 'icon', className: 'w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-3' }, [
                        React.createElement(TrendingUp, { key: 'icon-inner', size: 24, className: 'text-white' })
                    ]),
                    React.createElement('div', { key: 'value', className: 'text-3xl font-bold text-green-700 dark:text-green-400' }, 
                        customer.points || 0
                    ),
                    React.createElement('div', { key: 'label', className: 'text-sm text-green-600 dark:text-green-500 font-medium' }, 'Loyalty Points')
                ]),
                React.createElement('div', { key: 'spent', className: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800' }, [
                    React.createElement('div', { key: 'icon', className: 'w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3' }, [
                        React.createElement(CreditCard, { key: 'icon-inner', size: 24, className: 'text-white' })
                    ]),
                    React.createElement('div', { key: 'value', className: 'text-3xl font-bold text-blue-700 dark:text-blue-400' }, 
                        `$${parseFloat(customer.total_spent || 0).toFixed(2)}`
                    ),
                    React.createElement('div', { key: 'label', className: 'text-sm text-blue-600 dark:text-blue-500 font-medium' }, 'Total Spent')
                ]),
                React.createElement('div', { key: 'visits', className: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800' }, [
                    React.createElement('div', { key: 'icon', className: 'w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-3' }, [
                        React.createElement(Package, { key: 'icon-inner', size: 24, className: 'text-white' })
                    ]),
                    React.createElement('div', { key: 'value', className: 'text-3xl font-bold text-purple-700 dark:text-purple-400' }, 
                        customer.visit_count || 0
                    ),
                    React.createElement('div', { key: 'label', className: 'text-sm text-purple-600 dark:text-purple-500 font-medium' }, 'Total Visits')
                ])
            ]),

            // Member Information
            React.createElement('div', { key: 'member-info', className: 'bg-gray-50 dark:bg-gray-800 rounded-lg p-6' }, [
                React.createElement('h4', { key: 'title', className: 'font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2' }, [
                    React.createElement(Award, { key: 'icon', size: 20 }),
                    'Member Information'
                ]),
                React.createElement('div', { key: 'info-grid', className: 'grid grid-cols-1 md:grid-cols-2 gap-4' }, [
                    React.createElement('div', { key: 'member-type' }, [
                        React.createElement('div', { key: 'label', className: 'text-sm text-gray-500 dark:text-gray-400 mb-1' }, 'Member Type'),
                        React.createElement('div', { key: 'value', className: 'font-medium text-gray-900 dark:text-white' }, customer.member_type || 'Individual')
                    ]),
                    React.createElement('div', { key: 'member-status' }, [
                        React.createElement('div', { key: 'label', className: 'text-sm text-gray-500 dark:text-gray-400 mb-1' }, 'Member Status'),
                        React.createElement('span', { 
                            key: 'value', 
                            className: `inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                customer.member_status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`
                        }, customer.member_status || 'Active')
                    ]),
                    React.createElement('div', { key: 'member-since' }, [
                        React.createElement('div', { key: 'label', className: 'text-sm text-gray-500 dark:text-gray-400 mb-1' }, 'Member Since'),
                        React.createElement('div', { key: 'value', className: 'font-medium text-gray-900 dark:text-white' }, 
                            memberSince.toLocaleDateString() + ` (${
                                daysSinceMember < 30 ? `${daysSinceMember} days` :
                                daysSinceMember < 365 ? `${Math.floor(daysSinceMember / 30)} months` :
                                `${Math.floor(daysSinceMember / 365)} years`
                            })`
                        )
                    ]),
                    React.createElement('div', { key: 'tier' }, [
                        React.createElement('div', { key: 'label', className: 'text-sm text-gray-500 dark:text-gray-400 mb-1' }, 'Customer Tier'),
                        React.createElement('div', { key: 'value', className: 'font-medium text-gray-900 dark:text-white' }, customer.customer_tier || 'Bronze')
                    ])
                ])
            ])
        ]);
    };

    // Promotions Tab Content
    const renderPromotionsTab = () => {
        if (loading) {
            return React.createElement('div', { key: 'loading', className: 'text-center py-12' }, [
                React.createElement(Loader, { key: 'spinner', size: 48, className: 'mx-auto text-blue-600 animate-spin mb-4' }),
                React.createElement('p', { key: 'text', className: 'text-gray-600 dark:text-gray-400' }, 'Loading promotions...')
            ]);
        }

        if (promotions.length === 0) {
            return React.createElement('div', { key: 'empty', className: 'text-center py-12' }, [
                React.createElement(Tag, { key: 'icon', size: 48, className: 'mx-auto text-gray-400 mb-4' }),
                React.createElement('p', { key: 'text', className: 'text-gray-600 dark:text-gray-400' }, 'No promotions available')
            ]);
        }

        // Group promotions by source
        const customerPromotions = promotions.filter(p => p.promotion_source === 'customer');
        const tierPromotions = promotions.filter(p => p.promotion_source === 'tier');
        const generalPromotions = promotions.filter(p => p.promotion_source === 'general');

        const renderPromotionCard = (promo) => (
            React.createElement('div', {
                key: `promo-${promo.id}`,
                className: `bg-white dark:bg-gray-800 rounded-lg border p-4 hover:shadow-md transition-shadow ${
                    promo.is_enrolled ? 'border-green-300 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'
                }`
            }, [
                promo.image_url && React.createElement('img', {
                    key: 'image',
                    src: promo.image_url,
                    alt: promo.name,
                    className: 'w-full h-32 object-cover rounded-lg mb-3'
                }),
                React.createElement('h5', { key: 'title', className: 'font-semibold text-gray-900 dark:text-white mb-2' }, 
                    promo.display_name || promo.name
                ),
                promo.description && React.createElement('p', { key: 'desc', className: 'text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2' }, 
                    promo.description
                ),
                React.createElement('div', { key: 'footer', className: 'flex items-center justify-between' }, [
                    promo.total_reward_points && React.createElement('span', { 
                        key: 'points', 
                        className: 'text-sm font-semibold text-blue-600 dark:text-blue-400' 
                    }, `${promo.total_reward_points} pts`),
                    promo.is_enrolled && React.createElement('span', { 
                        key: 'enrolled', 
                        className: 'text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full font-medium' 
                    }, '✓ Enrolled')
                ])
            ])
        );

        return React.createElement('div', { key: 'promotions-content', className: 'space-y-8' }, [
            // Individual/Enrolled Promotions
            customerPromotions.length > 0 && React.createElement('div', { key: 'customer-promotions' }, [
                React.createElement('div', { key: 'header', className: 'mb-4' }, [
                    React.createElement('h4', { key: 'title', className: 'text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2' }, [
                        React.createElement(CheckCircle, { key: 'icon', size: 20, className: 'text-green-600' }),
                        `My Enrolled Promotions (${customerPromotions.length})`
                    ]),
                    React.createElement('p', { key: 'desc', className: 'text-sm text-gray-600 dark:text-gray-400 mt-1' }, 
                        'Promotions you\'re currently enrolled in'
                    )
                ]),
                React.createElement('div', { key: 'grid', className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
                    customerPromotions.map(renderPromotionCard)
                )
            ]),

            // Tier Promotions
            tierPromotions.length > 0 && React.createElement('div', { key: 'tier-promotions' }, [
                React.createElement('div', { key: 'header', className: 'mb-4' }, [
                    React.createElement('h4', { key: 'title', className: 'text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2' }, [
                        React.createElement(Award, { key: 'icon', size: 20, className: 'text-purple-600' }),
                        `${customer.customer_tier || 'Tier'} Member Promotions (${tierPromotions.length})`
                    ]),
                    React.createElement('p', { key: 'desc', className: 'text-sm text-gray-600 dark:text-gray-400 mt-1' }, 
                        'Exclusive promotions for your membership tier'
                    )
                ]),
                React.createElement('div', { key: 'grid', className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
                    tierPromotions.map(renderPromotionCard)
                )
            ]),

            // General Promotions
            generalPromotions.length > 0 && React.createElement('div', { key: 'general-promotions' }, [
                React.createElement('div', { key: 'header', className: 'mb-4' }, [
                    React.createElement('h4', { key: 'title', className: 'text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2' }, [
                        React.createElement(Tag, { key: 'icon', size: 20, className: 'text-blue-600' }),
                        `Available Promotions (${generalPromotions.length})`
                    ]),
                    React.createElement('p', { key: 'desc', className: 'text-sm text-gray-600 dark:text-gray-400 mt-1' }, 
                        'General promotions available to all members'
                    )
                ]),
                React.createElement('div', { key: 'grid', className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
                    generalPromotions.map(renderPromotionCard)
                )
            ])
        ]);
    };

    // Vouchers Tab Content (simplified - will need full implementation)
    const renderVouchersTab = () => {
        if (loading) {
            return React.createElement('div', { key: 'loading', className: 'text-center py-12' }, [
                React.createElement(Loader, { key: 'spinner', size: 48, className: 'mx-auto text-blue-600 animate-spin mb-4' }),
                React.createElement('p', { key: 'text', className: 'text-gray-600 dark:text-gray-400' }, 'Loading vouchers...')
            ]);
        }

        if (vouchers.length === 0) {
            return React.createElement('div', { key: 'empty', className: 'text-center py-12' }, [
                React.createElement(Ticket, { key: 'icon', size: 48, className: 'mx-auto text-gray-400 mb-4' }),
                React.createElement('p', { key: 'text', className: 'text-gray-600 dark:text-gray-400' }, 'No vouchers available')
            ]);
        }

        return React.createElement('div', { key: 'vouchers-grid', className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            vouchers.map(voucher => 
                React.createElement('div', {
                    key: `voucher-${voucher.id}`,
                    className: 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4'
                }, [
                    React.createElement('h5', { key: 'name', className: 'font-semibold text-gray-900 dark:text-white mb-2' }, voucher.name),
                    React.createElement('p', { key: 'code', className: 'text-sm font-mono text-blue-600 mb-2' }, voucher.voucher_code),
                    React.createElement('p', { key: 'value', className: 'text-sm text-gray-600 dark:text-gray-400' }, 
                        `Value: $${parseFloat(voucher.face_value || 0).toFixed(2)}`
                    )
                ])
            )
        );
    };

    // Orders Tab Content (simplified)
    const renderOrdersTab = () => {
        return React.createElement('div', { key: 'orders-content', className: 'space-y-6' }, [
            // Online Orders Section
            React.createElement('div', { key: 'online-orders' }, [
                React.createElement('h4', { key: 'title', className: 'font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2' }, [
                    React.createElement(ShoppingBag, { key: 'icon', size: 20 }),
                    `Online Orders (${onlineOrders.length})`
                ]),
                onlineOrders.length === 0 ?
                    React.createElement('p', { key: 'empty', className: 'text-gray-600 dark:text-gray-400 text-center py-8' }, 'No online orders found') :
                    React.createElement('div', { key: 'orders-list', className: 'space-y-3' },
                        onlineOrders.slice(0, 5).map(order => 
                            React.createElement('div', {
                                key: `order-${order.id}`,
                                className: 'bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between'
                            }, [
                                React.createElement('div', { key: 'info' }, [
                                    React.createElement('div', { key: 'number', className: 'font-medium text-gray-900 dark:text-white' }, 
                                        `Order #${order.order_number || order.id}`
                                    ),
                                    React.createElement('div', { key: 'date', className: 'text-sm text-gray-600 dark:text-gray-400' }, 
                                        new Date(order.created_at || order.order_date).toLocaleDateString()
                                    )
                                ]),
                                React.createElement('div', { key: 'amount', className: 'text-right' }, [
                                    React.createElement('div', { key: 'total', className: 'font-semibold text-gray-900 dark:text-white' }, 
                                        `$${parseFloat(order.total_amount || order.total || 0).toFixed(2)}`
                                    ),
                                    React.createElement('span', { 
                                        key: 'status', 
                                        className: 'text-xs px-2 py-1 rounded-full bg-green-100 text-green-800' 
                                    }, order.status || 'Completed')
                                ])
                            ])
                        )
                    )
            ]),

            // Salesforce Orders Section (only if sf_id exists)
            customer.sf_id && React.createElement('div', { key: 'sf-orders', className: 'pt-6 border-t border-gray-200 dark:border-gray-700' }, [
                React.createElement('h4', { key: 'title', className: 'font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2' }, [
                    React.createElement(Package, { key: 'icon', size: 20 }),
                    `Salesforce Orders (${salesforceOrders.length})`
                ]),
                loading ?
                    React.createElement('div', { key: 'loading', className: 'text-center py-8' }, [
                        React.createElement(Loader, { key: 'spinner', size: 32, className: 'mx-auto text-blue-600 animate-spin' })
                    ]) :
                salesforceOrders.length === 0 ?
                    React.createElement('p', { key: 'empty', className: 'text-gray-600 dark:text-gray-400 text-center py-8' }, 'No Salesforce orders found') :
                    React.createElement('div', { key: 'sf-orders-list', className: 'space-y-3' },
                        salesforceOrders.slice(0, 5).map((order, idx) => 
                            React.createElement('div', {
                                key: `sf-order-${idx}`,
                                className: 'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center justify-between border border-blue-200 dark:border-blue-800'
                            }, [
                                React.createElement('div', { key: 'info' }, [
                                    React.createElement('div', { key: 'number', className: 'font-medium text-gray-900 dark:text-white' }, 
                                        order.OrderNumber || `Order ${idx + 1}`
                                    ),
                                    React.createElement('div', { key: 'date', className: 'text-sm text-gray-600 dark:text-gray-400' }, 
                                        order.OrderDate ? new Date(order.OrderDate).toLocaleDateString() : 'N/A'
                                    )
                                ]),
                                React.createElement('div', { key: 'amount', className: 'text-right' }, [
                                    React.createElement('div', { key: 'total', className: 'font-semibold text-gray-900 dark:text-white' }, 
                                        `$${parseFloat(order.TotalAmount || 0).toFixed(2)}`
                                    ),
                                    React.createElement('span', { 
                                        key: 'status', 
                                        className: 'text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800' 
                                    }, order.Status || 'SF Order')
                                ])
                            ])
                        )
                    )
            ])
        ]);
    };

    // Transactions Tab Content
    const renderTransactionsTab = () => {
        if (loading) {
            return React.createElement('div', { key: 'loading', className: 'text-center py-12' }, [
                React.createElement(Loader, { key: 'spinner', size: 48, className: 'mx-auto text-blue-600 animate-spin mb-4' }),
                React.createElement('p', { key: 'text', className: 'text-gray-600 dark:text-gray-400' }, 'Loading transactions...')
            ]);
        }

        if (transactions.length === 0) {
            return React.createElement('div', { key: 'empty', className: 'text-center py-12' }, [
                React.createElement(Receipt, { key: 'icon', size: 48, className: 'mx-auto text-gray-400 mb-4' }),
                React.createElement('p', { key: 'text', className: 'text-gray-600 dark:text-gray-400' }, 'No transactions found')
            ]);
        }

        return React.createElement('div', { key: 'transactions-list', className: 'space-y-3' },
            transactions.map(transaction => 
                React.createElement('div', {
                    key: `transaction-${transaction.id}`,
                    className: 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4'
                }, [
                    React.createElement('div', { key: 'header', className: 'flex items-center justify-between mb-3' }, [
                        React.createElement('div', { key: 'info' }, [
                            React.createElement('div', { key: 'id', className: 'font-medium text-gray-900 dark:text-white' }, 
                                `Transaction #${transaction.id}`
                            ),
                            React.createElement('div', { key: 'date', className: 'text-sm text-gray-600 dark:text-gray-400' }, 
                                new Date(transaction.created_at).toLocaleDateString() + ' ' + new Date(transaction.created_at).toLocaleTimeString()
                            )
                        ]),
                        React.createElement('div', { key: 'amount', className: 'text-right' }, [
                            React.createElement('div', { key: 'total', className: 'text-xl font-bold text-gray-900 dark:text-white' }, 
                                `$${parseFloat(transaction.total || 0).toFixed(2)}`
                            ),
                            React.createElement('div', { key: 'method', className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                                transaction.payment_method || 'N/A'
                            )
                        ])
                    ]),
                    transaction.items && Array.isArray(transaction.items) && React.createElement('div', { 
                        key: 'items', 
                        className: 'text-sm text-gray-600 dark:text-gray-400 space-y-1' 
                    },
                        transaction.items.map((item, idx) => 
                            React.createElement('div', { key: `item-${idx}`, className: 'flex justify-between' }, [
                                React.createElement('span', { key: 'name' }, `${item.quantity}x ${item.name}`),
                                React.createElement('span', { key: 'price' }, `$${parseFloat(item.subtotal || 0).toFixed(2)}`)
                            ])
                        )
                    )
                ])
            )
        );
    };

    // Notes Tab Content
    const renderNotesTab = () => {
        return React.createElement('div', { key: 'notes-content', className: 'space-y-4' }, [
            React.createElement('div', { key: 'header', className: 'flex items-center justify-between' }, [
                React.createElement('h4', { key: 'title', className: 'font-semibold text-gray-900 dark:text-white flex items-center gap-2' }, [
                    React.createElement(FileText, { key: 'icon', size: 20 }),
                    'Customer Notes'
                ]),
                React.createElement('span', { key: 'info', className: 'text-sm text-gray-500 dark:text-gray-400 italic' }, 'Read-only')
            ]),
            customer.notes ?
                React.createElement('div', { 
                    key: 'notes-content', 
                    className: 'bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap' 
                }, customer.notes) :
                React.createElement('div', { key: 'empty', className: 'text-center py-12 text-gray-500 dark:text-gray-400' }, 'No notes available')
        ]);
    };

    // Render tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'info': return renderInfoTab();
            case 'loyalty': return renderLoyaltyTab();
            case 'promotions': return renderPromotionsTab();
            case 'vouchers': return renderVouchersTab();
            case 'orders': return renderOrdersTab();
            case 'transactions': return renderTransactionsTab();
            case 'notes': return renderNotesTab();
            default: return null;
        }
    };

    // Main modal render
    return React.createElement('div', {
        key: 'modal-overlay',
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50',
        onClick: onClose
    }, [
        React.createElement('div', {
            key: 'modal-content',
            className: 'bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col',
            onClick: (e) => e.stopPropagation()
        }, [
            // Modal Header
            React.createElement('div', { 
                key: 'header', 
                className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between'
            }, [
                React.createElement('div', { key: 'title-section' }, [
                    React.createElement('h2', { key: 'title', className: 'text-2xl font-bold' }, 'Customer 360° View'),
                    React.createElement('p', { key: 'subtitle', className: 'text-blue-100 text-sm mt-1' }, 
                        `${customer.name} • ${customer.loyalty_number}`
                    )
                ]),
                React.createElement('button', {
                    key: 'close-btn',
                    onClick: onClose,
                    className: 'p-2 hover:bg-blue-500 rounded-lg transition-colors'
                }, React.createElement(X, { key: 'close-icon', size: 24 }))
            ]),

            // Tabs Navigation
            React.createElement('div', { 
                key: 'tabs-nav', 
                className: 'bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 overflow-x-auto'
            }, [
                React.createElement('div', { key: 'tabs-container', className: 'flex gap-2 min-w-max' }, [
                    React.createElement(Tab, { key: 'info-tab', id: 'info', label: 'Info', icon: User }),
                    React.createElement(Tab, { key: 'loyalty-tab', id: 'loyalty', label: 'Loyalty', icon: Award }),
                    React.createElement(Tab, { key: 'promotions-tab', id: 'promotions', label: 'Promotions', icon: Tag }),
                    React.createElement(Tab, { key: 'vouchers-tab', id: 'vouchers', label: 'Vouchers', icon: Ticket }),
                    React.createElement(Tab, { key: 'orders-tab', id: 'orders', label: 'Orders', icon: ShoppingBag }),
                    React.createElement(Tab, { key: 'transactions-tab', id: 'transactions', label: 'Transactions', icon: Receipt }),
                    React.createElement(Tab, { key: 'notes-tab', id: 'notes', label: 'Notes', icon: FileText })
                ])
            ]),

            // Tab Content
            React.createElement('div', { 
                key: 'tab-content', 
                className: 'flex-1 overflow-y-auto p-6'
            }, renderTabContent())
        ])
    ]);
};

