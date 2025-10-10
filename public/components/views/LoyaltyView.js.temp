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
    
    const [currentTab, setCurrentTab] = React.useState('search'); // 'search' or 'manage'
    const [searchMode, setSearchMode] = React.useState('loyalty'); // 'loyalty' or 'general'
    const [sortBy, setSortBy] = React.useState('name');
    const [sortOrder, setSortOrder] = React.useState('asc');
    const [filterBy, setFilterBy] = React.useState('all'); // 'all', 'active', 'inactive'

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
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`
        }, [
            React.createElement('span', { key: 'label' }, label),
            count !== undefined && React.createElement('span', {
                key: 'count',
                className: `px-2 py-1 rounded-full text-xs ${
                    active ? 'bg-blue-500' : 'bg-gray-200 text-gray-600'
                }`
            }, count)
        ])
    );

    const CustomerCard = ({ customer }) => {
        // Status styling
        const getStatusStyle = (status) => {
            switch (status) {
                case 'Active':
                    return 'bg-green-100 text-green-800 border-green-200';
                case 'Inactive':
                    return 'bg-gray-100 text-gray-800 border-gray-200';
                case 'Under Fraud Investigation':
                    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                case 'Merged':
                    return 'bg-purple-100 text-purple-800 border-purple-200';
                case 'Fraudulent Member':
                    return 'bg-red-100 text-red-800 border-red-200';
                default:
                    return 'bg-gray-100 text-gray-800 border-gray-200';
            }
        };

        // Tier styling
        const getTierStyle = (tier) => {
            switch (tier) {
                case 'Bronze':
                    return { bg: 'bg-amber-100', text: 'text-amber-800', icon: '🥉' };
                case 'Silver':
                    return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '🥈' };
                case 'Gold':
                    return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🥇' };
                case 'Platinum':
                    return { bg: 'bg-purple-100', text: 'text-purple-800', icon: '💎' };
                default:
                    return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '🥉' };
            }
        };

        const tierStyle = getTierStyle(customer.customer_tier);
        const memberSince = customer.enrollment_date ? new Date(customer.enrollment_date) : new Date(customer.created_at);
        const daysSinceMember = Math.floor((new Date() - memberSince) / (1000 * 60 * 60 * 24));
        
        return React.createElement('div', { 
            className: `bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                customer.member_status !== 'Active' ? 'opacity-75' : ''
            }` 
        }, [
            React.createElement('div', { key: 'header', className: 'flex justify-between items-start mb-3' }, [
                React.createElement('div', { key: 'info' }, [
                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' }, [
                        React.createElement('h3', { className: 'font-semibold text-lg' }, customer.name),
                        React.createElement('span', { 
                            className: `px-2 py-1 text-xs rounded-full ${
                                customer.member_type === 'Corporate' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`
                        }, customer.member_type === 'Corporate' ? '🏢 Corp' : '👤 Ind')
                    ]),
                    React.createElement('p', { className: 'text-sm text-blue-600 font-mono mb-1' }, customer.loyalty_number),
                    customer.email && React.createElement('p', { className: 'text-sm text-gray-600' }, customer.email),
                    customer.phone && React.createElement('p', { className: 'text-sm text-gray-600' }, customer.phone),
                    
                    // Status and Tier badges
                    React.createElement('div', { className: 'flex flex-wrap gap-2 mt-2' }, [
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
                ]),
                React.createElement('div', { key: 'actions', className: 'flex gap-1' }, [
                    React.createElement('button', {
                        onClick: () => onLoadCustomerHistory(customer.id),
                        className: 'p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors',
                        title: 'View History'
                    }, React.createElement(Eye, { size: 16 })),
                    React.createElement('button', {
                        onClick: () => onEditCustomer(customer),
                        className: 'p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors',
                        title: 'Edit Customer'
                    }, React.createElement(Edit, { size: 16 })),
                    React.createElement('button', {
                        onClick: () => onDeleteCustomer(customer.id),
                        className: 'p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors',
                        title: 'Delete Customer',
                        disabled: customer.member_status === 'Under Fraud Investigation'
                    }, React.createElement(Trash2, { size: 16 }))
                ])
            ]),
            
            React.createElement('div', { key: 'stats', className: 'grid grid-cols-3 gap-4 pt-3 border-t' }, [
                React.createElement('div', { key: 'points', className: 'text-center' }, [
                    React.createElement('div', { className: 'font-bold text-xl text-green-600' }, customer.points || 0),
                    React.createElement('div', { className: 'text-xs text-gray-500 uppercase tracking-wide' }, 'Points')
                ]),
                React.createElement('div', { key: 'spent', className: 'text-center' }, [
                    React.createElement('div', { className: 'font-bold text-xl text-blue-600' }, 
                        `$${parseFloat(customer.total_spent || 0).toFixed(0)}`
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500 uppercase tracking-wide' }, 'Total Spent')
                ]),
                React.createElement('div', { key: 'visits', className: 'text-center' }, [
                    React.createElement('div', { className: 'font-bold text-xl text-purple-600' }, customer.visit_count || 0),
                    React.createElement('div', { className: 'text-xs text-gray-500 uppercase tracking-wide' }, 'Visits')
                ])
            ]),
            
            // Enhanced info section
            React.createElement('div', { key: 'enhanced-info', className: 'mt-3 pt-3 border-t space-y-1' }, [
                React.createElement('div', { className: 'flex justify-between text-xs text-gray-500' }, [
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
                customer.last_visit && React.createElement('div', { className: 'text-xs text-gray-500' }, [
                    React.createElement('span', { key: 'label' }, 'Last Visit: '),
                    React.createElement('span', { key: 'date' }, new Date(customer.last_visit).toLocaleDateString())
                ])
            ])
        ]);
    };

            return React.createElement('div', { className: 'space-y-4 lg:space-y-6' }, [
        // Header with tabs
        React.createElement('div', { key: 'header', className: 'bg-white rounded-xl shadow-sm border p-6' }, [
            React.createElement('div', { key: 'header-content', className: 'flex items-center justify-between mb-6' }, [
                React.createElement('div', { key: 'title' }, [
                    React.createElement('h2', { key: 'title', className: 'text-2xl font-bold flex items-center gap-3' }, [
                        React.createElement(Award, { key: 'icon', size: 28 }),
                        'Customer Loyalty Management'
                    ]),
                    React.createElement('p', { key: 'subtitle', className: 'text-gray-600 mt-1' }, 
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

            // Tab navigation
            React.createElement('div', { key: 'tabs', className: 'flex gap-2 mb-6' }, [
                React.createElement(TabButton, { 
                    key: 'search-tab',
                    tab: 'search', 
                    label: 'Customer Search', 
                    active: currentTab === 'search' 
                }),
                React.createElement(TabButton, { 
                    key: 'manage-tab',
                    tab: 'manage', 
                    label: 'Manage Customers', 
                    active: currentTab === 'manage',
                    count: customers.length 
                })
            ])
        ]),

        // Customer Search Tab
        currentTab === 'search' && React.createElement('div', { key: 'search-content', className: 'space-y-6' }, [
            React.createElement('div', { key: 'search-section', className: 'bg-white rounded-xl shadow-sm border p-6' }, [
                React.createElement('h3', { key: 'search-section-container', className: 'text-lg font-semibold mb-4 flex items-center gap-2' }, [
                    React.createElement(Search, { key: 'icon', size: 20 }),
                    'Find Customer'
                ]),
                
                // Search mode toggle
                React.createElement('div', { key: 'search-mode-toggle', className: 'flex gap-2 mb-4' }, [
                    React.createElement('button', {
                        key: 'loyalty-search-btn',
                        onClick: () => setSearchMode('loyalty'),
                        className: `px-4 py-2 text-sm rounded-lg transition-colors ${
                            searchMode === 'loyalty' 
                                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`
                    }, 'Search by Loyalty #'),
                    React.createElement('button', {
                        key: 'general-search-btn',
                        onClick: () => setSearchMode('general'),
                        className: `px-4 py-2 text-sm rounded-lg transition-colors ${
                            searchMode === 'general' 
                                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`
                    }, 'Search by Name/Email')
                ]),
                
                React.createElement('div', { key: 'search-forms', className: 'grid grid-cols-1 md:grid-cols-2 gap-4' }, [
                    // Loyalty number search
                    searchMode === 'loyalty' && React.createElement('div', { key: 'loyalty-search' }, [
                        React.createElement('label', { key: 'loyalty-search-label', className: 'block text-sm font-medium mb-2' }, 'Loyalty Number'),
                        React.createElement('div', { key: 'loyalty-input-group', className: 'flex gap-2' }, [
                            React.createElement('input', {
                                key: 'loyalty-input',
                                type: 'text',
                                value: loyaltyNumber,
                                onChange: (e) => setLoyaltyNumber(e.target.value.toUpperCase()),
                                placeholder: 'LOY001',
                                className: 'flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            }),
                            React.createElement('button', {
                                key: 'loyalty-search-btn',
                                onClick: () => onSearchByLoyalty(loyaltyNumber),
                                disabled: !loyaltyNumber.trim() || loading,
                                className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors'
                            }, loading ? 'Searching...' : 'Search')
                        ])
                    ]),
                    
                    // General search
                    searchMode === 'general' && React.createElement('div', { key: 'name-search' }, [
                        React.createElement('label', { key: 'general-search-label', className: 'block text-sm font-medium mb-2' }, 'Name, Email, or Phone'),
                        React.createElement('input', {
                            key: 'general-search-input',
                            type: 'text',
                            value: loyaltySearchTerm,
                            onChange: (e) => setLoyaltySearchTerm(e.target.value),
                            placeholder: 'Enter name, email, or phone',
                            className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        })
                    ])
                ]),

                // Search results
                customerSearchResults.length > 0 && React.createElement('div', { key: 'search-results', className: 'mt-6' }, [
                    React.createElement('h4', { key: 'search-results-title', className: 'font-medium mb-3 flex items-center gap-2' }, [
                        React.createElement(Users, { key: 'search-results-icon', size: 18 }),
                        'Search Results'
                    ]),
                    React.createElement('div', { key: 'search-results-grid', className: 'grid grid-cols-1 md:grid-cols-2 gap-4' }, 
                        customerSearchResults.map(customer => 
                            React.createElement('div', { 
                                key: customer.id, 
                                className: 'p-4 border rounded-lg hover:bg-gray-50 transition-colors' 
                            }, [
                                React.createElement('div', { key: 'customer-header', className: 'flex justify-between items-start mb-3' }, [
                                    React.createElement('div', { key: 'customer-info' }, [
                                        React.createElement('div', { key: 'customer-name', className: 'font-semibold text-lg' }, customer.name),
                                        React.createElement('div', { key: 'customer-loyalty', className: 'text-sm text-blue-600 font-mono' }, customer.loyalty_number),
                                        customer.email && React.createElement('div', { key: 'customer-email', className: 'text-sm text-gray-600' }, customer.email),
                                        customer.phone && React.createElement('div', { key: 'customer-phone', className: 'text-sm text-gray-600' }, customer.phone)
                                    ]),
                                    React.createElement('div', { key: 'actions', className: 'flex gap-1' }, [
                                        React.createElement('button', {
                                            key: 'view-history-btn',
                                            onClick: () => onLoadCustomerHistory(customer.id),
                                            className: 'p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors',
                                            title: 'View History'
                                        }, React.createElement(Eye, { key: 'eye-icon', size: 16 })),
                                        React.createElement('button', {
                                            key: 'edit-btn',
                                            onClick: () => onEditCustomer(customer),
                                            className: 'p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors',
                                            title: 'Edit'
                                        }, React.createElement(Edit, { key: 'edit-icon', size: 16 })),
                                        React.createElement('button', {
                                            key: 'delete-btn',
                                            onClick: () => onDeleteCustomer(customer.id),
                                            className: 'p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors',
                                            title: 'Delete'
                                        }, React.createElement(Trash2, { key: 'trash-icon', size: 16 }))
                                    ])
                                ]),
                                React.createElement('div', { key: 'customer-stats', className: 'grid grid-cols-3 gap-4 text-sm' }, [
                                    React.createElement('div', { key: 'points', className: 'text-center' }, [
                                        React.createElement('div', { key: 'points-value', className: 'font-bold text-lg text-green-600' }, customer.points || 0),
                                        React.createElement('div', { key: 'points-label', className: 'text-gray-600 text-xs' }, 'Points')
                                    ]),
                                    React.createElement('div', { key: 'spent', className: 'text-center' }, [
                                        React.createElement('div', { key: 'spent-value', className: 'font-bold text-lg text-blue-600' }, 
                                            `$${parseFloat(customer.total_spent || 0).toFixed(0)}`
                                        ),
                                        React.createElement('div', { key: 'spent-label', className: 'text-gray-600 text-xs' }, 'Total Spent')
                                    ]),
                                    React.createElement('div', { key: 'visits', className: 'text-center' }, [
                                        React.createElement('div', { key: 'visits-value', className: 'font-bold text-lg text-purple-600' }, customer.visit_count || 0),
                                        React.createElement('div', { key: 'visits-label', className: 'text-gray-600 text-xs' }, 'Visits')
                                    ])
                                ])
                            ])
                        )
                    )
                ])
            ])
        ]),

        // Customer Management Tab
        currentTab === 'manage' && React.createElement('div', { key: 'manage-content', className: 'space-y-6' }, [
            // Controls
            React.createElement('div', { key: 'controls', className: 'bg-white rounded-xl shadow-sm border p-6' }, [
                React.createElement('div', { key: 'controls-content', className: 'flex flex-col lg:flex-row lg:items-center gap-4' }, [
                    // Search
                    React.createElement('div', { key: 'search', className: 'relative flex-1' }, [
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
                            placeholder: 'Search customers by name, email, phone, or loyalty number...',
                            className: 'w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        })
                    ]),
                    
                    // Sort controls
                    React.createElement('div', { key: 'sort', className: 'flex items-center gap-2' }, [
                        React.createElement('select', {
                            key: 'sort-select',
                            value: sortBy,
                            onChange: (e) => setSortBy(e.target.value),
                            className: 'px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
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
                            className: 'p-3 border rounded-lg hover:bg-gray-50 transition-colors',
                            title: `Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`
                        }, sortOrder === 'asc' ? '↑' : '↓')
                    ]),
                    
                    // Filter
                    React.createElement('select', {
                        key: 'filter',
                        value: filterBy,
                        onChange: (e) => setFilterBy(e.target.value),
                        className: 'px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }, [
                        React.createElement('option', { key: 'all', value: 'all' }, 'All Customers'),
                        React.createElement('option', { key: 'active', value: 'active' }, 'Active (Has Purchases)'),
                        React.createElement('option', { key: 'inactive', value: 'inactive' }, 'New (No Purchases)')
                    ])
                ])
            ]),

            // Customer List
            React.createElement('div', { key: 'customer-list', className: 'bg-white rounded-xl shadow-sm border' }, [
                React.createElement('div', { key: 'list-header', className: 'p-6 border-b' }, [
                    React.createElement('div', { key: 'list-header-content', className: 'flex items-center justify-between' }, [
                        React.createElement('h3', { key: 'list-title', className: 'text-lg font-semibold flex items-center gap-2' }, [
                            React.createElement(Users, { key: 'icon', size: 20 }),
                            'Customer Directory'
                        ]),
                        React.createElement('div', { key: 'list-count', className: 'text-sm text-gray-600' }, 
                            `Showing ${sortedCustomers.length} of ${customers.length} customers`
                        )
                    ])
                ]),
                
                React.createElement('div', { key: 'list-content', className: 'p-6' }, [
                    loading ? (
                        React.createElement('div', { className: 'text-center py-12' }, [
                            React.createElement('div', { 
                                key: 'spinner',
                                className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4' 
                            }),
                            React.createElement('p', { 
                                key: 'text',
                                className: 'text-gray-600' 
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
                                className: 'text-xl font-semibold text-gray-900 mb-2' 
                            }, loyaltySearchTerm.trim() ? 'No customers found' : 'No customers yet'),
                            React.createElement('p', { 
                                key: 'description',
                                className: 'text-gray-600 mb-6' 
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
                            React.createElement(CustomerCard, { key: customer.id, customer })
                        ))
                    )
                ])
            ])
        ])
    ]);
};
