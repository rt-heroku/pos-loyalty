// VoucherCard Component
// Displays individual voucher information and selection state

window.Components = window.Components || {};
window.Components.VoucherCard = function({ voucher, isSelected, onSelect, onDeselect, canSelect = true }) {
    const {
        id,
        voucher_code,
        name,
        voucher_type,
        face_value,
        discount_percent,
        remaining_value,
        description,
        expiration_date,
        product_name,
        image_url
    } = voucher;

    // Format expiration date
    const formatExpirationDate = (dateString) => {
        if (!dateString) return 'No expiration';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Get voucher display value
    const getVoucherValue = () => {
        switch (voucher_type) {
            case 'Value':
                const remaining = parseFloat(remaining_value) || 0;
                const face = parseFloat(face_value) || 0;
                return `$${(remaining || face).toFixed(2)}`;
            case 'Discount':
                return `${discount_percent}% off`;
            case 'ProductSpecific':
                if (discount_percent) {
                    return `${discount_percent}% off ${product_name || 'product'}`;
                } else if (face_value) {
                    return `$${parseFloat(face_value).toFixed(2)} off ${product_name || 'product'}`;
                }
                return `Free ${product_name || 'item'}`;
            default:
                return voucher_code;
        }
    };

    // Get voucher status color
    const getStatusColor = () => {
        if (expiration_date && new Date(expiration_date) < new Date()) {
            return 'text-red-500';
        }
        if (voucher_type === 'Value' && remaining_value <= 0) {
            return 'text-gray-500';
        }
        return 'text-green-600';
    };

    // Handle selection toggle
    const handleToggle = () => {
        if (isSelected) {
            onDeselect?.(voucher);
        } else {
            onSelect?.(voucher);
        }
    };

    return React.createElement('div', {
        className: `voucher-card p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
            isSelected 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
        } ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''}`,
        onClick: canSelect ? handleToggle : undefined
    }, [
        // Voucher Header
        React.createElement('div', { key: 'header', className: 'flex items-start justify-between mb-3' }, [
            // Voucher Code and Type
            React.createElement('div', { key: 'info', className: 'flex-1' }, [
                React.createElement('div', { 
                    key: 'code', 
                    className: 'font-semibold text-lg text-gray-900 dark:text-white' 
                }, voucher_code),
                React.createElement('div', { 
                    key: 'type', 
                    className: `text-sm text-gray-600 dark:text-gray-400 capitalize` 
                }, voucher_type.replace(/([A-Z])/g, ' $1').trim())
            ]),
            
            // Selection Indicator
            React.createElement('div', { key: 'selection', className: 'ml-3' }, [
                isSelected ? React.createElement('div', {
                    key: 'selected',
                    className: 'w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center'
                }, [
                    React.createElement('svg', {
                        key: 'check',
                        className: 'w-4 h-4 text-white',
                        fill: 'currentColor',
                        viewBox: '0 0 20 20'
                    }, [
                        React.createElement('path', {
                            key: 'path',
                            fillRule: 'evenodd',
                            d: 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z',
                            clipRule: 'evenodd'
                        })
                    ])
                ]) : React.createElement('div', {
                    key: 'unselected',
                    className: 'w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full'
                })
            ])
        ]),

        // Voucher Value
        React.createElement('div', { 
            key: 'value', 
            className: `text-2xl font-bold ${getStatusColor()}` 
        }, getVoucherValue()),

        // Description
        description && React.createElement('div', { 
            key: 'description', 
            className: 'text-sm text-gray-600 dark:text-gray-400 mt-2' 
        }, description),

        // Product Name (for product-specific vouchers)
        product_name && React.createElement('div', { 
            key: 'product', 
            className: 'text-sm text-blue-600 dark:text-blue-400 mt-1' 
        }, `For: ${product_name}`),

        // Expiration Date
        React.createElement('div', { 
            key: 'expiration', 
            className: `text-xs mt-2 ${getStatusColor()}` 
        }, `Expires: ${formatExpirationDate(expiration_date)}`),

        // Remaining Value (for value vouchers)
        voucher_type === 'Value' && remaining_value !== face_value && React.createElement('div', { 
            key: 'remaining', 
            className: 'text-xs text-gray-500 dark:text-gray-400 mt-1' 
        }, `Remaining: $${remaining_value?.toFixed(2) || '0.00'}`)
    ]);
};
