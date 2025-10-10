// CustomerVoucherView Component
// Displays all vouchers for a customer including expired, redeemed, etc.

window.Views = window.Views || {};
window.Views.CustomerVoucherView = function({ customer, onBack }) {
    const [vouchers, setVouchers] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [filter, setFilter] = React.useState('all');
    const [searchTerm, setSearchTerm] = React.useState('');

    // Load all vouchers for customer
    const loadCustomerVouchers = async () => {
        if (!customer) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/customers/${customer.id}/vouchers/all`);
            const data = await response.json();
            
            if (data.success) {
                setVouchers(data.vouchers);
            }
        } catch (error) {
            console.error('Error loading customer vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load vouchers on component mount
    React.useEffect(() => {
        loadCustomerVouchers();
    }, [customer]);

    // Filter vouchers based on status and search
    const filteredVouchers = React.useMemo(() => {
        return vouchers.filter(voucher => {
            const matchesStatus = filter === 'all' || voucher.status === filter;
            const matchesSearch = voucher.voucher_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                voucher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                voucher.description?.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesStatus && matchesSearch;
        });
    }, [vouchers, filter, searchTerm]);

    // Group vouchers by status
    const groupedVouchers = React.useMemo(() => {
        const groups = {
            Issued: [],
            Redeemed: [],
            Expired: [],
            Cancelled: [],
            Reserved: []
        };
        
        filteredVouchers.forEach(voucher => {
            if (groups[voucher.status]) {
                groups[voucher.status].push(voucher);
            }
        });
        
        return groups;
    }, [filteredVouchers]);

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Issued': return 'text-green-600 dark:text-green-400';
            case 'Redeemed': return 'text-blue-600 dark:text-blue-400';
            case 'Expired': return 'text-red-600 dark:text-red-400';
            case 'Cancelled': return 'text-gray-600 dark:text-gray-400';
            case 'Reserved': return 'text-yellow-600 dark:text-yellow-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    // Get status badge color
    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'Issued': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Redeemed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'Cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            case 'Reserved': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    // Get voucher value display
    const getVoucherValue = (voucher) => {
        switch (voucher.voucher_type) {
            case 'Value':
                const remaining = parseFloat(voucher.remaining_value) || 0;
                const face = parseFloat(voucher.face_value) || 0;
                return `$${(remaining || face).toFixed(2)}`;
            case 'Discount':
                return `${voucher.discount_percent}% off`;
            case 'ProductSpecific':
                if (voucher.discount_percent) {
                    return `${voucher.discount_percent}% off ${voucher.product_name || 'product'}`;
                } else if (voucher.face_value) {
                    return `$${parseFloat(voucher.face_value).toFixed(2)} off ${voucher.product_name || 'product'}`;
                }
                return `Free ${voucher.product_name || 'item'}`;
            default:
                return voucher.voucher_code;
        }
    };

    return React.createElement('div', { className: 'customer-voucher-view h-full flex flex-col' }, [
        // Header
        React.createElement('div', { key: 'header', className: 'p-6 border-b dark:border-gray-700' }, [
            React.createElement('div', { key: 'header-content', className: 'flex items-center justify-between' }, [
                React.createElement('div', { key: 'title-section', className: 'flex items-center gap-4' }, [
                    React.createElement('button', {
                        key: 'back-btn',
                        onClick: onBack,
                        className: 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                    }, [
                        React.createElement('svg', {
                            key: 'back-icon',
                            className: 'w-6 h-6 text-gray-600 dark:text-gray-400',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        }, [
                            React.createElement('path', {
                                key: 'path',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M15 19l-7-7 7-7'
                            })
                        ])
                    ]),
                    React.createElement('div', { key: 'title-info' }, [
                        React.createElement('h1', { 
                            key: 'title', 
                            className: 'text-2xl font-bold text-gray-900 dark:text-white' 
                        }, 'Customer Vouchers'),
                        React.createElement('p', { 
                            key: 'subtitle', 
                            className: 'text-gray-600 dark:text-gray-400' 
                        }, `${customer?.name} (${customer?.loyalty_number})`)
                    ])
                ])
            ])
        ]),

        // Controls
        React.createElement('div', { key: 'controls', className: 'p-6 border-b dark:border-gray-700' }, [
            // Search
            React.createElement('div', { key: 'search', className: 'mb-4' }, [
                React.createElement('div', { key: 'search-container', className: 'relative' }, [
                    React.createElement('input', {
                        key: 'search-input',
                        type: 'text',
                        placeholder: 'Search vouchers...',
                        value: searchTerm,
                        onChange: (e) => setSearchTerm(e.target.value),
                        className: 'w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                    }),
                    React.createElement('div', {
                        key: 'search-icon',
                        className: 'absolute left-3 top-2.5 text-gray-400'
                    }, [
                        React.createElement('svg', {
                            key: 'icon',
                            className: 'w-5 h-5',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        }, [
                            React.createElement('path', {
                                key: 'path',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                            })
                        ])
                    ])
                ])
            ]),

            // Status Filter
            React.createElement('div', { key: 'filter', className: 'flex flex-wrap gap-2' }, [
                React.createElement('button', {
                    key: 'all',
                    onClick: () => setFilter('all'),
                    className: `px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filter === 'all' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`
                }, `All (${vouchers.length})`),
                
                ...Object.keys(groupedVouchers).map(status => 
                    groupedVouchers[status].length > 0 && React.createElement('button', {
                        key: status,
                        onClick: () => setFilter(status),
                        className: `px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            filter === status 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`
                    }, `${status} (${groupedVouchers[status].length})`)
                )
            ])
        ]),

        // Content
        React.createElement('div', { key: 'content', className: 'flex-1 p-6 overflow-y-auto' }, [
            // Loading State
            loading && React.createElement('div', { 
                key: 'loading', 
                className: 'flex items-center justify-center py-12' 
            }, [
                React.createElement('div', { 
                    key: 'spinner', 
                    className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500' 
                })
            ]),

            // No Vouchers
            !loading && filteredVouchers.length === 0 && React.createElement('div', { 
                key: 'empty', 
                className: 'text-center py-12 text-gray-500 dark:text-gray-400' 
            }, [
                React.createElement('div', { key: 'icon', className: 'text-4xl mb-4' }, '🎫'),
                React.createElement('div', { key: 'message', className: 'text-lg' }, 'No vouchers found'),
                React.createElement('div', { key: 'submessage', className: 'text-sm mt-2' }, 
                    filter === 'all' ? 'This customer has no vouchers' : `No ${filter.toLowerCase()} vouchers found`
                )
            ]),

            // Voucher Groups
            !loading && filteredVouchers.length > 0 && React.createElement('div', { 
                key: 'vouchers', 
                className: 'space-y-6' 
            }, [
                ...Object.entries(groupedVouchers).map(([status, statusVouchers]) => 
                    statusVouchers.length > 0 && React.createElement('div', { key: status }, [
                        // Status Header
                        React.createElement('div', { 
                            key: 'status-header', 
                            className: 'flex items-center justify-between mb-4' 
                        }, [
                            React.createElement('h3', { 
                                key: 'status-title', 
                                className: `text-lg font-semibold ${getStatusColor(status)}` 
                            }, `${status} Vouchers`),
                            React.createElement('span', { 
                                key: 'status-count', 
                                className: 'text-sm text-gray-500 dark:text-gray-400' 
                            }, `${statusVouchers.length} vouchers`)
                        ]),

                        // Voucher Cards
                        React.createElement('div', { 
                            key: 'voucher-cards', 
                            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                        }, statusVouchers.map(voucher => 
                            React.createElement('div', { 
                                key: voucher.id, 
                                className: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm' 
                            }, [
                                // Voucher Header
                                React.createElement('div', { 
                                    key: 'voucher-header', 
                                    className: 'flex items-start justify-between mb-3' 
                                }, [
                                    React.createElement('div', { key: 'voucher-info', className: 'flex-1' }, [
                                        React.createElement('div', { 
                                            key: 'voucher-code', 
                                            className: 'font-semibold text-gray-900 dark:text-white' 
                                        }, voucher.voucher_code),
                                        React.createElement('div', { 
                                            key: 'voucher-name', 
                                            className: 'text-sm text-gray-600 dark:text-gray-400' 
                                        }, voucher.name)
                                    ]),
                                    React.createElement('span', { 
                                        key: 'status-badge', 
                                        className: `px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(voucher.status)}` 
                                    }, voucher.status)
                                ]),

                                // Voucher Value
                                React.createElement('div', { 
                                    key: 'voucher-value', 
                                    className: 'text-xl font-bold text-gray-900 dark:text-white mb-2' 
                                }, getVoucherValue(voucher)),

                                // Voucher Details
                                React.createElement('div', { 
                                    key: 'voucher-details', 
                                    className: 'space-y-1 text-sm text-gray-600 dark:text-gray-400' 
                                }, [
                                    React.createElement('div', { key: 'type' }, `Type: ${voucher.voucher_type}`),
                                    voucher.product_name && React.createElement('div', { key: 'product' }, `Product: ${voucher.product_name}`),
                                    React.createElement('div', { key: 'created' }, `Created: ${formatDate(voucher.created_date)}`),
                                    voucher.expiration_date && React.createElement('div', { key: 'expires' }, `Expires: ${formatDate(voucher.expiration_date)}`),
                                    voucher.use_date && React.createElement('div', { key: 'used' }, `Used: ${formatDate(voucher.use_date)}`),
                                    voucher.description && React.createElement('div', { key: 'description' }, voucher.description)
                                ]),

                                // Value Voucher Progress
                                voucher.voucher_type === 'Value' && voucher.face_value && React.createElement('div', { 
                                    key: 'progress', 
                                    className: 'mt-3' 
                                }, [
                                    React.createElement('div', { 
                                        key: 'progress-bar', 
                                        className: 'w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2' 
                                    }, [
                                        React.createElement('div', { 
                                            key: 'progress-fill', 
                                            className: 'bg-blue-500 h-2 rounded-full transition-all duration-300',
                                            style: { 
                                                width: `${((voucher.face_value - voucher.remaining_value) / voucher.face_value) * 100}%` 
                                            }
                                        })
                                    ]),
                                    React.createElement('div', { 
                                        key: 'progress-text', 
                                        className: 'text-xs text-gray-500 dark:text-gray-400 mt-1' 
                                    }, `$${voucher.remaining_value ? parseFloat(voucher.remaining_value).toFixed(2) : '0.00'} remaining of $${parseFloat(voucher.face_value).toFixed(2)}`)
                                ])
                            ])
                        ))
                    ])
                )
            ])
        ])
    ]);
};
