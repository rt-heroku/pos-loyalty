if (!window.Views) {
    window.Views = {};
}

// Enhanced POS View with all features
window.Views.LoyaltyView= ({ 
    loyaltyNumber, 
    setLoyaltyNumber, 
    onSearchByLoyalty, 
    loyaltySearchTerm, 
    setLoyaltySearchTerm, 
    customerSearchResults, 
    onLoadCustomerHistory, 
    customers = [],
    onRefreshCustomers,
    onEditCustomer,
    onDeleteCustomer,
    onAddNewCustomer,
    loading 
}) => {
    const { Award, Users, Plus, Edit, Trash2, Search, Eye, User } = window.Icons;
    
    const [currentTab, setCurrentTab] = React.useState('manage'); // 'search', 'manage', or 'vouchers'
    const [selectedCustomerForVouchers, setSelectedCustomerForVouchers] = React.useState(null);
    const [showVouchersModal, setShowVouchersModal] = React.useState(false);
    const [searchMode, setSearchMode] = React.useState('loyalty'); // 'loyalty' or 'general'
    const [sortBy, setSortBy] = React.useState('name');
    const [sortOrder, setSortOrder] = React.useState('asc');
    const [filterBy, setFilterBy] = React.useState('all'); // 'all', 'active', 'inactive'
    const [customerAvatars, setCustomerAvatars] = React.useState({});
    const [actionMenuOpen, setActionMenuOpen] = React.useState(null);
    const [loadingAvatars, setLoadingAvatars] = React.useState(new Set());
    const attemptedAvatars = React.useRef(new Set());


    // Load customer avatars
    const loadCustomerAvatar = async (customerId) => {
        // Prevent duplicate requests
        if (loadingAvatars.has(customerId) || customerAvatars[customerId] || attemptedAvatars.current.has(customerId)) {
            return;
        }

        attemptedAvatars.current.add(customerId);
        setLoadingAvatars(prev => new Set(prev).add(customerId));
        
        try {
            const response = await fetch(`/api/customers/${customerId}/avatar`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCustomerAvatars(prev => ({
                    ...prev,
                    [customerId]: data.avatar.image_data
                }));
            } else if (response.status === 404) {
                return;
            } else {
                console.warn('Error fetching avatar for customer', customerId, 'Status:', response.status);
            }
        } catch (error) {
            // Only log unexpected errors, not network issues
            if (error.name !== 'TypeError' && error.name !== 'NetworkError') {
                console.warn('Error loading avatar for customer', customerId, error.message);
            }
        } finally {
            setLoadingAvatars(prev => {
                const newSet = new Set(prev);
                newSet.delete(customerId);
                return newSet;
            });
        }
    };

    // Load avatars for all customers
    React.useEffect(() => {
        if (customers.length > 0) {
            customers.forEach(customer => {
                if (!attemptedAvatars.current.has(customer.id)) {
                    loadCustomerAvatar(customer.id).catch(error => {
                        console.error('Error loading avatar for customer', customer.id, error);
                    });
                }
            });
        }
    }, [customers]);

    // Toggle action menu
    const toggleActionMenu = (customerId) => {
        setActionMenuOpen(actionMenuOpen === customerId ? null : customerId);
    };
    
    // Close action menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionMenuOpen && !event.target.closest('.relative')) {
                setActionMenuOpen(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [actionMenuOpen]);
        // Load customers on component mount
    React.useEffect(() => {
        if (onRefreshCustomers) {
            onRefreshCustomers();
        }
    }, []);

    // Sort customers
    const sortedCustomers = React.useMemo(() => {
        let filtered = customers.filter(customer => {
            if (filterBy === 'active') return customer.visit_count > 0;
            if (filterBy === 'inactive') return customer.visit_count === 0;
            return true;
        });

        if (loyaltySearchTerm.trim()) {
            const term = loyaltySearchTerm.toLowerCase();
            filtered = filtered.filter(customer => 
                customer.name.toLowerCase().includes(term) ||
                customer.email?.toLowerCase().includes(term) ||
                customer.loyalty_number.toLowerCase().includes(term) ||
                customer.phone?.includes(term)
            );
        }

        return filtered.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal?.toLowerCase() || '';
            }
            
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }, [customers, loyaltySearchTerm, sortBy, sortOrder, filterBy]);

    const TabButton = ({ tab, label, active, count }) => (
        React.createElement('button', {
            key: tab,
            onClick: () => setCurrentTab(tab),
            className: `px-4 py-2 font-medium text-sm rounded-lg transition-colors flex items-center gap-2 ${
                active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`
        }, [
            React.createElement('span', { key: 'label' }, label),
            count !== undefined && React.createElement('span', {
                key: 'count',
                className: `px-2 py-1 rounded-full text-xs ${
                    active ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`
            }, count)
        ])
    );

    const CustomerCard = ({ customer, avatar }) => {
        const { MoreVertical } = window.Icons;
        const [showMenu, setShowMenu] = React.useState(false);
        const menuRef = React.useRef(null);

        const toggleMenu = (e) => {
            e.stopPropagation();
            setShowMenu(prev => !prev);
        };

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        React.useEffect(() => {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, []);

        // Status styling
        const getStatusStyle = (status) => {
            switch (status) {
                case 'Active':
                    return 'bg-green-100 text-green-800 border-green-200';
                case 'Inactive':
                    return 'bg-gray-50 dark:bg-gray-700 text-gray-800 border-gray-200';
                case 'Under Fraud Investigation':
                    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                case 'Merged':
                    return 'bg-purple-100 text-purple-800 border-purple-200';
                case 'Fraudulent Member':
                    return 'bg-red-100 text-red-800 border-red-200';
                default:
                    return 'bg-gray-50 dark:bg-gray-700 text-gray-800 border-gray-200';
            }
        };

        // Tier styling
        const getTierStyle = (tier) => {
            switch (tier) {
                case 'Bronze':
                    return { bg: 'bg-amber-100', text: 'text-amber-800', icon: '🥉' };
                case 'Silver':
                    return { bg: 'bg-gray-50 dark:bg-gray-700', text: 'text-gray-800', icon: '🥈' };
                case 'Gold':
                    return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🥇' };
                case 'Platinum':
                    return { bg: 'bg-purple-100', text: 'text-purple-800', icon: '💎' };
                default:
                    return { bg: 'bg-gray-50 dark:bg-gray-700', text: 'text-gray-800', icon: '🥉' };
            }
        };

        const tierStyle = getTierStyle(customer.customer_tier);
        const memberSince = customer.enrollment_date ? new Date(customer.enrollment_date) : new Date(customer.created_at);
        const daysSinceMember = Math.floor((new Date() - memberSince) / (1000 * 60 * 60 * 24));
        
        return React.createElement('div', { 
            className: `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow ${
                customer.member_status !== 'Active' ? 'opacity-75' : ''
            }` 
        }, [
            React.createElement('div', { key: 'header', className: 'flex justify-between items-start mb-3' }, [
                React.createElement('div', { key: 'info', className: 'flex items-start gap-3' }, [
                    // Avatar
                    React.createElement('div', { 
                        key: 'avatar',
                        className: 'w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0'
                    }, [
                        avatar ? 
                            React.createElement('img', {
                                key: 'avatar-img',
                                src: avatar,
                                alt: customer.name,
                                className: 'w-full h-full object-cover'
                            }) :
                            React.createElement(User, { key: 'avatar-placeholder', size: 24, className: 'text-gray-400' })
                    ]),
                    React.createElement('div', { key: 'details' }, [
                        React.createElement('div', { key: 'name-row', className: 'flex items-center gap-2 mb-1' }, [
                            React.createElement('h3', { key: 'customer-name', className: 'font-semibold text-lg text-gray-900 dark:text-white' }, customer.name),
                            React.createElement('span', { 
                                key: 'member-type',
                                className: `px-2 py-1 text-xs rounded-full ${
                                    customer.member_type === 'Corporate' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`
                            }, customer.member_type === 'Corporate' ? '🏢 Corp' : '👤 Ind')
                        ]),
                        React.createElement('p', { key: 'loyalty-number', className: 'text-sm text-blue-600 font-mono mb-1' }, customer.loyalty_number),
                        customer.email && React.createElement('p', { key: 'email', className: 'text-sm text-gray-600 dark:text-gray-300' }, customer.email),
                        customer.phone && React.createElement('p', { key: 'phone', className: 'text-sm text-gray-600 dark:text-gray-300' }, customer.phone),
                        
                        // Status and Tier badges
                        React.createElement('div', { key: 'badges', className: 'flex flex-wrap gap-2 mt-2' }, [
                            React.createElement('span', { 
                                key: 'status',
                                className: `px-2 py-1 text-xs rounded-full border ${getStatusStyle(customer.member_status)}`
                            }, customer.member_status),
                            React.createElement('span', { 
                                key: 'tier',
                                className: `px-2 py-1 text-xs rounded-full ${tierStyle.bg} ${tierStyle.text}`
                            }, [
                                React.createElement('span', { key: 'icon' }, tierStyle.icon + ' '),
                                React.createElement('span', { key: 'text' }, customer.customer_tier)
                            ])
                        ])
                    ])
                ]),
                React.createElement('div', { key: 'actions', className: 'relative', ref: menuRef }, [
                    React.createElement('button', {
                        key: 'menu-button',
                        onClick: toggleMenu,
                        className: 'p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors',
                        title: 'More Actions'
                    }, React.createElement(MoreVertical, { key: 'more-icon', size: 16 })),
                    showMenu && React.createElement('div', {
                        key: 'action-menu',
                        className: 'absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600'
                    }, [
                        React.createElement('button', {
                            key: 'view-history-menu-item',
                            onClick: () => { onLoadCustomerHistory(customer.id); setShowMenu(false); },
                            className: 'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-md'
                        }, [React.createElement(Eye, { key: 'eye-icon', size: 16 }), 'View History']),
                        React.createElement('button', {
                            key: 'edit-menu-item',
                            onClick: () => { onEditCustomer(customer); setShowMenu(false); },
                            className: 'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }, [React.createElement(Edit, { key: 'edit-icon', size: 16 }), 'Edit']),
                        React.createElement('button', {
                            key: 'delete-menu-item',
                            onClick: () => { onDeleteCustomer(customer.id); setShowMenu(false); },
                            className: 'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-800/50 rounded-b-md',
                            disabled: customer.member_status === 'Under Fraud Investigation'
                        }, [React.createElement(Trash2, { key: 'trash-icon', size: 16 }), 'Delete'])
                    ])
                ])
            ]),
            
            React.createElement('div', { key: 'stats', className: 'grid grid-cols-3 gap-4 pt-3 border-t' }, [
                React.createElement('div', { key: 'points', className: 'text-center' }, [
                    React.createElement('div', { key: 'points-value', className: 'font-bold text-xl text-green-600' }, customer.points || 0),
                    React.createElement('div', { key: 'points-label', className: 'text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide' }, 'Points')
                ]),
                React.createElement('div', { key: 'spent', className: 'text-center' }, [
                    React.createElement('div', { key: 'spent-value', className: 'font-bold text-xl text-blue-600' }, 
                        `$${parseFloat(customer.total_spent || 0).toFixed(0)}`
                    ),
                    React.createElement('div', { key: 'spent-label', className: 'text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide' }, 'Total Spent')
                ]),
                React.createElement('div', { key: 'visits', className: 'text-center' }, [
                    React.createElement('div', { key: 'visits-value', className: 'font-bold text-xl text-purple-600' }, customer.visit_count || 0),
                    React.createElement('div', { key: 'visits-label', className: 'text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide' }, 'Visits')
                ])
            ]),
            
            // Enhanced info section
            React.createElement('div', { key: 'enhanced-info', className: 'mt-3 pt-3 border-t space-y-1' }, [
                React.createElement('div', { key: 'info-row', className: 'flex justify-between text-xs text-gray-500 dark:text-gray-400' }, [
                    React.createElement('span', { key: 'member-since' }, [
                        React.createElement('span', { key: 'label' }, 'Member: '),
                        React.createElement('span', { key: 'duration' }, 
                            daysSinceMember < 30 ? `${daysSinceMember} days` :
                            daysSinceMember < 365 ? `${Math.floor(daysSinceMember / 30)} months` :
                            `${Math.floor(daysSinceMember / 365)} years`
                        )
                    ]),
                    customer.tier_calculation_number && React.createElement('span', { key: 'tier-score' }, [
                        React.createElement('span', { key: 'label' }, 'Score: '),
                        React.createElement('span', { key: 'score' }, parseFloat(customer.tier_calculation_number).toFixed(0))
                    ])
                ]),
                customer.last_visit && React.createElement('div', { key: 'last-visit', className: 'text-xs text-gray-500 dark:text-gray-400' }, [
                    React.createElement('span', { key: 'label' }, 'Last Visit: '),
                    React.createElement('span', { key: 'date' }, new Date(customer.last_visit).toLocaleDateString())
                ])
            ])
        ]);
    };

    return React.createElement('div', { className: 'space-y-2 lg:space-y-3' }, [
        // Header with tabs
        React.createElement('div', { key: 'header', className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6' }, [
            React.createElement('div', { key: 'header-content', className: 'flex items-center justify-between mb-2' }, [
                React.createElement('div', { key: 'title' }, [
                    React.createElement('h2', { key: 'title', className: 'text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3' }, [
                        React.createElement(Award, { key: 'icon', size: 28 }),
                        'Customer Loyalty Management'
                    ]),
                    React.createElement('p', { key: 'subtitle', className: 'text-gray-600 dark:text-gray-300 mt-1' }, 
                        `${customers.length} total customers • ${customers.filter(c => c.visit_count > 0).length} active`
                    )
                ]),
                React.createElement('button', {
                    key: 'add-customer',
                    onClick: onAddNewCustomer,
                    className: 'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                }, [
                    React.createElement(Plus, { key: 'icon', size: 20 }),
                    'Add Customer'
                ])
            ]),

        // Tab navigation with search controls (when manage tab is active)
        React.createElement('div', { key: 'tabs', className: 'flex items-center justify-between mb-6' }, [
            React.createElement('div', { key: 'tab-buttons', className: 'flex gap-2' }, [
                React.createElement(TabButton, { 
                    key: 'manage-tab',
                    tab: 'manage', 
                    label: 'Manage Customers', 
                    active: currentTab === 'manage',
                    count: customers.length 
                }),
                React.createElement(TabButton, { 
                    key: 'search-tab',
                    tab: 'search', 
                    label: 'Customer Search', 
                    active: currentTab === 'search' 
                })
            ]),
            
            // Search controls (show when manage tab is active)
            currentTab === 'manage' && React.createElement('div', { key: 'search-controls', className: 'flex items-center gap-4' }, [
                React.createElement('div', { key: 'search-container', className: 'relative' }, [
                    React.createElement(Search, { 
                        key: 'search-icon',
                        className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
                        size: 20 
                    }),
                    React.createElement('input', {
                        key: 'manage-search-input',
                        type: 'text',
                        value: loyaltySearchTerm,
                        onChange: (e) => setLoyaltySearchTerm(e.target.value),
                        placeholder: 'Search customers...',
                        className: 'w-80 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    })
                ]),
                
                // Sort controls
                React.createElement('div', { key: 'sort', className: 'flex items-center gap-2' }, [
                    React.createElement('select', {
                        key: 'sort-select',
                        value: sortBy,
                        onChange: (e) => setSortBy(e.target.value),
                        className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    }, [
                        React.createElement('option', { key: 'name', value: 'name' }, 'Name'),
                        React.createElement('option', { key: 'loyalty', value: 'loyalty_number' }, 'Loyalty #'),
                        React.createElement('option', { key: 'points', value: 'points' }, 'Points'),
                        React.createElement('option', { key: 'spent', value: 'total_spent' }, 'Total Spent'),
                        React.createElement('option', { key: 'visits', value: 'visit_count' }, 'Visit Count'),
                        React.createElement('option', { key: 'created', value: 'created_at' }, 'Date Added')
                    ]),
                    React.createElement('button', {
                        key: 'sort-order-btn',
                        onClick: () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'),
                        className: 'p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                        title: `Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`
                    }, sortOrder === 'asc' ? '↑' : '↓')
                ]),
                
                // Filter
                React.createElement('select', {
                    key: 'filter',
                    value: filterBy,
                    onChange: (e) => setFilterBy(e.target.value),
                    className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                }, [
                    React.createElement('option', { key: 'all', value: 'all' }, 'All'),
                    React.createElement('option', { key: 'active', value: 'active' }, 'Active'),
                    React.createElement('option', { key: 'inactive', value: 'inactive' }, 'New')
                ])
            ]),
            
            // Search mode controls (show when search tab is active)
            currentTab === 'search' && React.createElement('div', { key: 'search-mode-controls', className: 'flex items-center gap-3' }, [
                // Search mode toggle buttons
                React.createElement('div', { key: 'search-mode-buttons', className: 'flex gap-1 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700' }, [
                    React.createElement('button', {
                        key: 'loyalty-search-btn',
                        onClick: () => setSearchMode('loyalty'),
                        className: `px-3 py-2 text-xs transition-colors flex items-center gap-1 ${
                            searchMode === 'loyalty' 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`
                    }, [
                        React.createElement('span', { key: 'icon' }, '🔢'),
                        'Loyalty #'
                    ]),
                    React.createElement('button', {
                        key: 'general-search-btn',
                        onClick: () => setSearchMode('general'),
                        className: `px-3 py-2 text-xs transition-colors flex items-center gap-1 ${
                            searchMode === 'general' 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`
                    }, [
                        React.createElement('span', { key: 'icon' }, '👤'),
                        'Name'
                    ])
                ]),
                
                // Search input
                React.createElement('div', { key: 'search-input-container', className: 'relative' }, [
                    React.createElement(Search, { 
                        key: 'search-icon',
                        className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
                        size: 16 
                    }),
                    searchMode === 'loyalty' ? 
                        React.createElement('input', {
                            key: 'loyalty-search-input',
                            type: 'text',
                            value: loyaltyNumber,
                            onChange: (e) => setLoyaltyNumber(e.target.value.toUpperCase()),
                            placeholder: 'LOY001',
                            className: 'w-48 pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                        }) :
                        React.createElement('input', {
                            key: 'general-search-input',
                            type: 'text',
                            value: loyaltySearchTerm,
                            onChange: (e) => setLoyaltySearchTerm(e.target.value),
                            placeholder: 'Search by name, email...',
                            className: 'w-48 pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                        })
                ]),
                
                // Search button
                React.createElement('button', {
                    key: 'search-execute-btn',
                    onClick: () => searchMode === 'loyalty' ? onSearchByLoyalty(loyaltyNumber) : null,
                    disabled: (searchMode === 'loyalty' && !loyaltyNumber.trim()) || loading,
                    className: 'px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors'
                }, loading ? '...' : 'Search')
            ])
        ])
        ]),

        // Customer Search Tab
        currentTab === 'search' && React.createElement('div', { key: 'search-content', className: 'space-y-6' }, [
            // Search results
            customerSearchResults.length > 0 && React.createElement('div', { key: 'search-results', className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6' }, [
                    React.createElement('h4', { key: 'search-results-title', className: 'font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2' }, [
                        React.createElement(Users, { key: 'search-results-icon', size: 18 }),
                        'Search Results'
                    ]),
                    React.createElement('div', { key: 'search-results-grid', className: 'grid grid-cols-1 md:grid-cols-2 gap-4' }, 
                        customerSearchResults.map(customer => 
                            React.createElement('div', { 
                                key: customer.id, 
                                className: 'p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors' 
                            }, [
                                React.createElement('div', { key: 'customer-header', className: 'flex justify-between items-start mb-3' }, [
                                    React.createElement('div', { key: 'customer-info', className: 'flex items-center gap-3' }, [
                                        // Avatar
                                        React.createElement('div', { 
                                            key: 'customer-avatar',
                                            className: 'w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden'
                                        }, [
                                            customerAvatars[customer.id] ? 
                                                React.createElement('img', {
                                                    key: 'avatar-img',
                                                    src: customerAvatars[customer.id],
                                                    alt: customer.name,
                                                    className: 'w-full h-full object-cover'
                                                }) :
                                                React.createElement(User, { key: 'avatar-placeholder', size: 24, className: 'text-gray-400' })
                                        ]),
                                        React.createElement('div', { key: 'customer-details' }, [
                                            React.createElement('div', { key: 'customer-name', className: 'font-semibold text-lg text-gray-900 dark:text-white' }, customer.name),
                                            React.createElement('div', { key: 'customer-loyalty', className: 'text-sm text-blue-600 font-mono' }, customer.loyalty_number),
                                            customer.email && React.createElement('div', { key: 'customer-email', className: 'text-sm text-gray-600 dark:text-gray-300' }, customer.email),
                                            customer.phone && React.createElement('div', { key: 'customer-phone', className: 'text-sm text-gray-600 dark:text-gray-300' }, customer.phone)
                                        ])
                                    ]),
                                    // Action menu
                                    React.createElement('div', { key: 'actions', className: 'relative' }, [
                                        React.createElement('button', {
                                            key: 'action-menu-btn',
                                            onClick: () => toggleActionMenu(customer.id),
                                            className: 'p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors',
                                            title: 'Actions'
                                        }, React.createElement('span', { key: 'menu-icon' }, '⋯')),
                                        actionMenuOpen === customer.id && React.createElement('div', {
                                            key: 'action-menu',
                                            className: 'absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]'
                                        }, [
                                            React.createElement('button', {
                                                key: 'view-history-action',
                                                onClick: () => {
                                                    onLoadCustomerHistory(customer.id);
                                                    setActionMenuOpen(null);
                                                },
                                                className: 'w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2'
                                            }, [
                                                React.createElement(Eye, { key: 'eye-icon', size: 14 }),
                                                'View History'
                                            ]),
                                            React.createElement('button', {
                                                key: 'edit-action',
                                                onClick: () => {
                                                    onEditCustomer(customer);
                                                    setActionMenuOpen(null);
                                                },
                                                className: 'w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2'
                                            }, [
                                                React.createElement(Edit, { key: 'edit-icon', size: 14 }),
                                                'Edit'
                                            ]),
                                            React.createElement('button', {
                                                key: 'vouchers-action',
                                                onClick: () => {
                                                    setSelectedCustomerForVouchers(customer);
                                                    setShowVouchersModal(true);
                                                    setActionMenuOpen(null);
                                                },
                                                className: 'w-full px-3 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2'
                                            }, [
                                                React.createElement('span', { key: 'voucher-icon' }, '🎫'),
                                                'View Vouchers'
                                            ]),
                                            React.createElement('button', {
                                                key: 'delete-action',
                                                onClick: () => {
                                                    onDeleteCustomer(customer.id);
                                                    setActionMenuOpen(null);
                                                },
                                                className: 'w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2'
                                            }, [
                                                React.createElement(Trash2, { key: 'trash-icon', size: 14 }),
                                                'Delete'
                                            ])
                                        ])
                                    ])
                                ]),
                                React.createElement('div', { key: 'customer-stats', className: 'grid grid-cols-3 gap-4 text-sm' }, [
                                    React.createElement('div', { key: 'points', className: 'text-center' }, [
                                        React.createElement('div', { key: 'points-value', className: 'font-bold text-lg text-green-600' }, customer.points || 0),
                                        React.createElement('div', { key: 'points-label', className: 'text-gray-600 dark:text-gray-300 text-xs' }, 'Points')
                                    ]),
                                    React.createElement('div', { key: 'spent', className: 'text-center' }, [
                                        React.createElement('div', { key: 'spent-value', className: 'font-bold text-lg text-blue-600' }, 
                                            `$${parseFloat(customer.total_spent || 0).toFixed(0)}`
                                        ),
                                        React.createElement('div', { key: 'spent-label', className: 'text-gray-600 dark:text-gray-300 text-xs' }, 'Total Spent')
                                    ]),
                                    React.createElement('div', { key: 'visits', className: 'text-center' }, [
                                        React.createElement('div', { key: 'visits-value', className: 'font-bold text-lg text-purple-600' }, customer.visit_count || 0),
                                        React.createElement('div', { key: 'visits-label', className: 'text-gray-600 dark:text-gray-300 text-xs' }, 'Visits')
                                    ])
                                ])
                            ])
                        )
                    )
                ])
            ]),

        // Customer Management Tab
        currentTab === 'manage' && React.createElement('div', { key: 'manage-content', className: 'space-y-3' }, [
            // Customer List
            React.createElement('div', { key: 'customer-list', className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700' }, [
                React.createElement('div', { key: 'list-content', className: 'p-6' }, [
                    loading ? (
                        React.createElement('div', { className: 'text-center py-12' }, [
                            React.createElement('div', { 
                                key: 'spinner',
                                className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4' 
                            }),
                            React.createElement('p', { 
                                key: 'text',
                                className: 'text-gray-600 dark:text-gray-300' 
                            }, 'Loading customers...')
                        ])
                    ) : sortedCustomers.length === 0 ? (
                        React.createElement('div', { className: 'text-center py-12' }, [
                            React.createElement(Users, { 
                                key: 'icon',
                                className: 'mx-auto mb-4 text-gray-400', 
                                size: 64 
                            }),
                            React.createElement('h4', { 
                                key: 'title',
                                className: 'text-xl font-semibold text-gray-900 dark:text-white mb-2' 
                            }, loyaltySearchTerm.trim() ? 'No customers found' : 'No customers yet'),
                            React.createElement('p', { 
                                key: 'description',
                                className: 'text-gray-600 dark:text-gray-300 mb-6' 
                            }, loyaltySearchTerm.trim() 
                                ? 'Try adjusting your search terms or create a new customer.'
                                : 'Get started by adding your first loyalty customer.'
                            ),
                            React.createElement('button', {
                                key: 'action',
                                onClick: onAddNewCustomer,
                                className: 'inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                            }, [
                                React.createElement(Plus, { key: 'icon', size: 20 }),
                                'Add First Customer'
                            ])
                        ])
                    ) : (
                        React.createElement('div', { 
                            key: 'customers-grid',
                            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                        }, sortedCustomers.map(customer => 
                            React.createElement(CustomerCard, { 
                                key: customer.id, 
                                customer,
                                avatar: customerAvatars[customer.id]
                            })
                        ))
                    )
                ])
            ])
        ]),

        // Customer Vouchers Modal
        window.Components.CustomerVouchersModal && React.createElement(window.Components.CustomerVouchersModal, {
            key: 'vouchers-modal',
            customer: selectedCustomerForVouchers,
            isOpen: showVouchersModal,
            onClose: () => {
                setShowVouchersModal(false);
                setSelectedCustomerForVouchers(null);
            }
        })
    ]);
};
