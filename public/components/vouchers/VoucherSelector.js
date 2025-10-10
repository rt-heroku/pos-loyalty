// VoucherSelector Component
// Manages voucher selection and application logic

window.Components = window.Components || {};
window.Components.VoucherSelector = function({ 
    customer, 
    vouchers = [], 
    selectedVouchers = [], 
    onVoucherSelect, 
    onVoucherDeselect,
    onApplyVoucher,
    onRemoveVoucher,
    loading = false 
}) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterType, setFilterType] = React.useState('all');

    // Filter vouchers based on search and type
    const filteredVouchers = React.useMemo(() => {
        return vouchers.filter(voucher => {
            const matchesSearch = voucher.voucher_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                voucher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                voucher.description?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesType = filterType === 'all' || voucher.voucher_type === filterType;
            
            return matchesSearch && matchesType;
        });
    }, [vouchers, searchTerm, filterType]);

    // Group vouchers by type
    const groupedVouchers = React.useMemo(() => {
        const groups = {
            Value: [],
            Discount: [],
            ProductSpecific: []
        };
        
        filteredVouchers.forEach(voucher => {
            if (groups[voucher.voucher_type]) {
                groups[voucher.voucher_type].push(voucher);
            }
        });
        
        return groups;
    }, [filteredVouchers]);

    // Handle voucher selection
    const handleVoucherSelect = (voucher) => {
        if (selectedVouchers.find(v => v.id === voucher.id)) {
            onVoucherDeselect?.(voucher);
        } else {
            onVoucherSelect?.(voucher);
        }
    };

    // Handle voucher application
    const handleApplyVoucher = (voucher) => {
        onApplyVoucher?.(voucher);
    };

    // Handle voucher removal
    const handleRemoveVoucher = (voucher) => {
        onRemoveVoucher?.(voucher);
    };

    // Check if voucher is already applied
    const isVoucherApplied = (voucher) => {
        return selectedVouchers.some(v => v.id === voucher.id);
    };

    // Get voucher type display name
    const getTypeDisplayName = (type) => {
        switch (type) {
            case 'Value': return 'Value Vouchers';
            case 'Discount': return 'Discount Vouchers';
            case 'ProductSpecific': return 'Product-Specific Vouchers';
            default: return type;
        }
    };

    // Get voucher type count
    const getTypeCount = (type) => {
        return groupedVouchers[type]?.length || 0;
    };

    return React.createElement('div', { className: 'voucher-selector' }, [
        // Header
        React.createElement('div', { key: 'header', className: 'mb-4' }, [
            React.createElement('h3', { 
                key: 'title', 
                className: 'text-lg font-semibold text-gray-900 dark:text-white mb-2' 
            }, 'Available Vouchers'),
            
            // Customer info
            customer && React.createElement('div', { 
                key: 'customer', 
                className: 'text-sm text-gray-600 dark:text-gray-400 mb-3' 
            }, `For: ${customer.name} (${customer.loyalty_number})`)
        ]),


        // Loading State
        loading && React.createElement('div', { 
            key: 'loading', 
            className: 'flex items-center justify-center py-8' 
        }, [
            React.createElement('div', { 
                key: 'spinner', 
                className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500' 
            })
        ]),

        // No Vouchers State
        !loading && filteredVouchers.length === 0 && React.createElement('div', { 
            key: 'empty', 
            className: 'text-center py-8 text-gray-500 dark:text-gray-400' 
        }, [
            React.createElement('div', { key: 'icon', className: 'text-4xl mb-2' }, '🎫'),
            React.createElement('div', { key: 'message' }, 'No vouchers available')
        ]),

        // Simple Voucher List
        !loading && filteredVouchers.length > 0 && React.createElement('div', { 
            key: 'vouchers', 
            className: 'space-y-2' 
        }, filteredVouchers.map(voucher => 
            React.createElement('div', { 
                key: voucher.id, 
                className: 'flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors' 
            }, [
                React.createElement('div', { key: 'voucher-info', className: 'flex-1' }, [
                    React.createElement('div', { key: 'voucher-code', className: 'font-medium text-gray-900 dark:text-white text-sm' }, voucher.voucher_code),
                    React.createElement('div', { key: 'voucher-name', className: 'text-xs text-gray-600 dark:text-gray-400' }, voucher.name),
                    React.createElement('div', { key: 'voucher-value', className: 'text-sm text-blue-600 dark:text-blue-400' }, 
                        voucher.voucher_type === 'Value' ? `$${parseFloat(voucher.remaining_value || voucher.face_value || 0).toFixed(2)}` :
                        voucher.voucher_type === 'Discount' ? `${voucher.discount_percent}% off` :
                        'Product voucher'
                    ),
                    voucher.expiration_date && React.createElement('div', { 
                        key: 'voucher-expiry', 
                        className: 'text-xs text-gray-500 dark:text-gray-400' 
                    }, `Expires: ${new Date(voucher.expiration_date).toLocaleDateString()}`)
                ]),
                React.createElement('button', {
                    key: 'action-btn',
                    onClick: isVoucherApplied(voucher) ? () => handleRemoveVoucher(voucher) : () => handleApplyVoucher(voucher),
                    className: `px-3 py-1 text-xs rounded transition-colors ${
                        isVoucherApplied(voucher) 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                    }`
                }, isVoucherApplied(voucher) ? 'Remove' : 'Apply')
            ])
        ))
    ]);
};
