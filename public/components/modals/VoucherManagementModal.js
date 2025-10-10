// VoucherManagementModal Component
// Modal for managing vouchers in the POS

window.Components = window.Components || {};
window.Components.VoucherManagementModal = function({ 
    customer, 
    vouchers = [], 
    appliedVouchers = [],
    onApplyVoucher,
    onRemoveVoucher,
    onRefreshVouchers,
    isOpen,
    onClose,
    loading = false 
}) {
    // Filter out already applied vouchers
    const availableVouchers = React.useMemo(() => {
        return vouchers.filter(voucher => 
            !appliedVouchers.find(applied => applied.id === voucher.id)
        );
    }, [vouchers, appliedVouchers]);

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

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    if (!isOpen) return null;

    return React.createElement('div', { 
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' 
    }, [
        React.createElement('div', { 
            key: 'modal', 
            className: 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto' 
        }, [
            // Header
            React.createElement('div', { 
                key: 'header', 
                className: 'flex items-center justify-between p-6 border-b dark:border-gray-700' 
            }, [
                React.createElement('div', { key: 'title-section', className: 'flex items-center justify-between w-full' }, [
                    React.createElement('div', { key: 'title-left', className: 'flex items-center gap-4' }, [
                        React.createElement('div', { key: 'voucher-icon', className: 'text-2xl' }, '🎫'),
                        React.createElement('div', { key: 'title-info' }, [
                            React.createElement('h2', { 
                                key: 'title', 
                                className: 'text-xl font-bold text-gray-900 dark:text-white' 
                            }, 'Available Vouchers'),
                            customer && React.createElement('p', { 
                                key: 'subtitle', 
                                className: 'text-gray-600 dark:text-gray-400' 
                            }, `For: ${customer.name} (${customer.loyalty_number})`)
                        ])
                    ]),
                    React.createElement('button', {
                        key: 'refresh-btn',
                        onClick: onRefreshVouchers,
                        disabled: loading,
                        className: 'flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
                    }, [
                        React.createElement('svg', {
                            key: 'refresh-icon',
                            className: `w-4 h-4 ${loading ? 'animate-spin' : ''}`,
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        }, [
                            React.createElement('path', {
                                key: 'path',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                            })
                        ]),
                        React.createElement('span', { key: 'refresh-text' }, loading ? 'Refreshing...' : 'Refresh')
                    ])
                ]),
                React.createElement('button', {
                    key: 'close-btn',
                    onClick: onClose,
                    className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                }, [
                    React.createElement('svg', {
                        key: 'close-icon',
                        className: 'w-6 h-6',
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

            // Content
            React.createElement('div', { key: 'content', className: 'p-6' }, [
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
                !loading && availableVouchers.length === 0 && React.createElement('div', { 
                    key: 'empty', 
                    className: 'text-center py-12 text-gray-500 dark:text-gray-400' 
                }, [
                    React.createElement('div', { key: 'icon', className: 'text-4xl mb-4' }, '🎫'),
                    React.createElement('div', { key: 'message', className: 'text-lg' }, 'No vouchers available'),
                    React.createElement('div', { key: 'submessage', className: 'text-sm mt-2' }, 'This customer has no available vouchers')
                ]),

                // Voucher Cards
                !loading && availableVouchers.length > 0 && React.createElement('div', { 
                    key: 'vouchers', 
                    className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                }, availableVouchers.map(voucher => 
                    React.createElement('div', { 
                        key: voucher.id, 
                        className: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1' 
                    }, [
                        // Voucher Header
                        React.createElement('div', { 
                            key: 'voucher-header', 
                            className: 'flex items-start justify-between mb-4' 
                        }, [
                            React.createElement('div', { key: 'voucher-info', className: 'flex-1' }, [
                                React.createElement('div', { 
                                    key: 'voucher-code', 
                                    className: 'font-bold text-lg text-gray-900 dark:text-white mb-1' 
                                }, voucher.voucher_code),
                                React.createElement('div', { 
                                    key: 'voucher-name', 
                                    className: 'text-sm text-gray-600 dark:text-gray-400 font-medium' 
                                }, voucher.name)
                            ])
                        ]),

                        // Voucher Value
                        React.createElement('div', { 
                            key: 'voucher-value', 
                            className: 'text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center py-2 bg-gray-100 dark:bg-gray-700 rounded-lg' 
                        }, getVoucherValue(voucher)),

                        // Voucher Details
                        React.createElement('div', { 
                            key: 'voucher-details', 
                            className: 'space-y-2 text-sm' 
                        }, [
                            React.createElement('div', { 
                                key: 'type', 
                                className: 'flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600' 
                            }, [
                                React.createElement('span', { key: 'type-label', className: 'text-gray-600 dark:text-gray-400' }, 'Type:'),
                                React.createElement('span', { key: 'type-value', className: 'font-medium text-gray-900 dark:text-white' }, voucher.voucher_type)
                            ]),
                            voucher.product_name && React.createElement('div', { 
                                key: 'product', 
                                className: 'flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600' 
                            }, [
                                React.createElement('span', { key: 'product-label', className: 'text-gray-600 dark:text-gray-400' }, 'Product:'),
                                React.createElement('span', { key: 'product-value', className: 'font-medium text-gray-900 dark:text-white' }, voucher.product_name)
                            ]),
                            voucher.expiration_date && React.createElement('div', { 
                                key: 'expires', 
                                className: 'flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600' 
                            }, [
                                React.createElement('span', { key: 'expires-label', className: 'text-gray-600 dark:text-gray-400' }, 'Expires:'),
                                React.createElement('span', { 
                                    key: 'expires-value', 
                                    className: `font-medium ${
                                        new Date(voucher.expiration_date) < new Date() 
                                            ? 'text-red-600 dark:text-red-400' 
                                            : 'text-gray-900 dark:text-white'
                                    }` 
                                }, formatDate(voucher.expiration_date))
                            ]),
                            voucher.description && React.createElement('div', { 
                                key: 'description', 
                                className: 'mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' 
                            }, [
                                React.createElement('div', { key: 'desc-label', className: 'text-xs text-gray-500 dark:text-gray-400 mb-1' }, 'Description:'),
                                React.createElement('div', { key: 'desc-value', className: 'text-sm text-gray-700 dark:text-gray-300' }, voucher.description)
                            ])
                        ]),

                        // Apply Button
                        React.createElement('div', { 
                            key: 'apply-section', 
                            className: 'mt-4' 
                        }, [
                            React.createElement('button', {
                                key: 'apply-btn',
                                onClick: () => {
                                    onApplyVoucher(voucher);
                                    onClose();
                                },
                                className: 'w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium'
                            }, 'Apply Voucher')
                        ])
                    ])
                ))
            ])
        ])
    ]);
};
