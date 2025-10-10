// VoucherApplied Component
// Displays applied vouchers in the cart

window.Components = window.Components || {};
window.Components.VoucherApplied = function({ 
    appliedVouchers = [], 
    onRemoveVoucher,
    onEditVoucher 
}) {
    // Handle voucher removal
    const handleRemoveVoucher = (voucher) => {
        onRemoveVoucher?.(voucher);
    };

    // Handle voucher editing
    const handleEditVoucher = (voucher) => {
        onEditVoucher?.(voucher);
    };

    // Get voucher display value
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
                    return `${voucher.discount_percent}% off`;
                } else if (voucher.face_value) {
                    return `$${parseFloat(voucher.face_value).toFixed(2)} off`;
                }
                return 'Free';
            default:
                return voucher.voucher_code;
        }
    };

    // Get voucher status color
    const getStatusColor = (voucher) => {
        if (voucher.expiration_date && new Date(voucher.expiration_date) < new Date()) {
            return 'text-red-500';
        }
        if (voucher.voucher_type === 'Value' && voucher.remaining_value <= 0) {
            return 'text-gray-500';
        }
        return 'text-green-600';
    };

    // Format expiration date
    const formatExpirationDate = (dateString) => {
        if (!dateString) return 'No expiration';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    return React.createElement('div', { className: 'voucher-applied' }, [
        // Header
        React.createElement('div', { key: 'header', className: 'flex items-center justify-between mb-3' }, [
            React.createElement('h4', { 
                key: 'title', 
                className: 'font-medium text-gray-900 dark:text-white' 
            }, 'Applied Vouchers'),
            React.createElement('span', { 
                key: 'count', 
                className: 'text-sm text-gray-500 dark:text-gray-400' 
            }, `${appliedVouchers.length} applied`)
        ]),

        // Applied Vouchers List
        appliedVouchers.length === 0 ? 
            React.createElement('div', { 
                key: 'empty', 
                className: 'text-center py-4 text-gray-500 dark:text-gray-400' 
            }, [
                React.createElement('div', { key: 'icon', className: 'text-2xl mb-1' }, '🎫'),
                React.createElement('div', { key: 'message', className: 'text-sm' }, 'No vouchers applied')
            ]) :
            React.createElement('div', { 
                key: 'vouchers', 
                className: 'space-y-2' 
            }, appliedVouchers.map(voucher => 
                React.createElement('div', { 
                    key: voucher.id, 
                    className: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3' 
                }, [
                    // Voucher Header
                    React.createElement('div', { 
                        key: 'header', 
                        className: 'flex items-start justify-between mb-2' 
                    }, [
                        // Voucher Info
                        React.createElement('div', { key: 'info', className: 'flex-1' }, [
                            React.createElement('div', { 
                                key: 'code', 
                                className: 'font-medium text-gray-900 dark:text-white' 
                            }, voucher.voucher_code),
                            React.createElement('div', { 
                                key: 'name', 
                                className: 'text-sm text-gray-600 dark:text-gray-400' 
                            }, voucher.name)
                        ]),
                        
                        // Remove Button
                        React.createElement('button', {
                            key: 'remove',
                            onClick: () => handleRemoveVoucher(voucher),
                            className: 'ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors'
                        }, [
                            React.createElement('svg', {
                                key: 'remove-icon',
                                className: 'w-4 h-4',
                                fill: 'none',
                                stroke: 'currentColor',
                                viewBox: '0 0 24 24'
                            }, [
                                React.createElement('path', {
                                    key: 'path',
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round',
                                    strokeWidth: 2,
                                    d: 'M6 18L18 6M6 6l12 12'
                                })
                            ])
                        ])
                    ]),

                    // Voucher Value
                    React.createElement('div', { 
                        key: 'value', 
                        className: `text-lg font-semibold ${getStatusColor(voucher)}` 
                    }, getVoucherValue(voucher)),

                    // Voucher Details
                    React.createElement('div', { 
                        key: 'details', 
                        className: 'text-xs text-gray-500 dark:text-gray-400 mt-1' 
                    }, [
                        React.createElement('div', { key: 'type' }, voucher.voucher_type),
                        voucher.product_name && React.createElement('div', { key: 'product' }, `For: ${voucher.product_name}`),
                        React.createElement('div', { key: 'expiration' }, `Expires: ${formatExpirationDate(voucher.expiration_date)}`)
                    ]),

                    // Edit Button (for value vouchers)
                    voucher.voucher_type === 'Value' && React.createElement('button', {
                        key: 'edit',
                        onClick: () => handleEditVoucher(voucher),
                        className: 'mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors'
                    }, 'Edit Amount')
                ])
            ))
    ]);
};
