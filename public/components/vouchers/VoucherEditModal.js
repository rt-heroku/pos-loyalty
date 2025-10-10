// VoucherEditModal Component
// Modal for editing value voucher amounts

window.Components = window.Components || {};
window.Components.VoucherEditModal = function({ 
    voucher, 
    isOpen, 
    onClose, 
    onSave,
    onCancel 
}) {
    const [amount, setAmount] = React.useState('');
    const [error, setError] = React.useState('');

    // Initialize amount when voucher changes
    React.useEffect(() => {
        if (voucher && voucher.voucher_type === 'Value') {
            setAmount(voucher.remaining_value?.toString() || '0');
        }
    }, [voucher]);

    // Handle amount change
    const handleAmountChange = (e) => {
        const value = e.target.value;
        setAmount(value);
        setError('');
        
        // Validate amount
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
            setError('Amount must be a positive number');
        } else if (numValue > voucher.remaining_value) {
            setError(`Amount cannot exceed remaining value of $${parseFloat(voucher.remaining_value).toFixed(2)}`);
        }
    };

    // Handle save
    const handleSave = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 0) {
            setError('Please enter a valid amount');
            return;
        }
        
        if (numAmount > voucher.remaining_value) {
            setError(`Amount cannot exceed remaining value of $${parseFloat(voucher.remaining_value).toFixed(2)}`);
            return;
        }
        
        onSave?.(voucher, numAmount);
        onClose?.();
    };

    // Handle cancel
    const handleCancel = () => {
        onCancel?.();
        onClose?.();
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (!isOpen || !voucher) return null;

    return React.createElement('div', { 
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' 
    }, [
        React.createElement('div', { 
            key: 'modal', 
            className: 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto' 
        }, [
            // Header
            React.createElement('div', { 
                key: 'header', 
                className: 'flex items-center justify-between p-6 border-b dark:border-gray-700' 
            }, [
                React.createElement('h3', { 
                    key: 'title', 
                    className: 'text-lg font-semibold text-gray-900 dark:text-white' 
                }, 'Edit Voucher Amount'),
                React.createElement('button', {
                    key: 'close',
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
                // Voucher Info
                React.createElement('div', { 
                    key: 'voucher-info', 
                    className: 'mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg' 
                }, [
                    React.createElement('div', { 
                        key: 'code', 
                        className: 'font-medium text-gray-900 dark:text-white' 
                    }, voucher.voucher_code),
                    React.createElement('div', { 
                        key: 'name', 
                        className: 'text-sm text-gray-600 dark:text-gray-400 mt-1' 
                    }, voucher.name),
                    React.createElement('div', { 
                        key: 'remaining', 
                        className: 'text-sm text-gray-600 dark:text-gray-400 mt-1' 
                    }, `Remaining: $${voucher.remaining_value ? parseFloat(voucher.remaining_value).toFixed(2) : '0.00'}`)
                ]),

                // Amount Input
                React.createElement('div', { key: 'amount-input', className: 'mb-4' }, [
                    React.createElement('label', { 
                        key: 'label', 
                        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
                    }, 'Amount to Use'),
                    React.createElement('div', { key: 'input-container', className: 'relative' }, [
                        React.createElement('span', { 
                            key: 'dollar-sign', 
                            className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400' 
                        }, '$'),
                        React.createElement('input', {
                            key: 'input',
                            type: 'number',
                            step: '0.01',
                            min: '0',
                            max: voucher.remaining_value,
                            value: amount,
                            onChange: handleAmountChange,
                            onKeyPress: handleKeyPress,
                            className: 'w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            placeholder: '0.00'
                        })
                    ]),
                    error && React.createElement('div', { 
                        key: 'error', 
                        className: 'text-red-500 text-sm mt-1' 
                    }, error)
                ]),

                // Help Text
                React.createElement('div', { 
                    key: 'help', 
                    className: 'text-sm text-gray-500 dark:text-gray-400 mb-6' 
                }, [
                    React.createElement('p', { key: 'help-text' }, 'Enter the amount you want to use from this voucher. The remaining balance will be available for future use.')
                ])
            ]),

            // Footer
            React.createElement('div', { 
                key: 'footer', 
                className: 'flex items-center justify-end space-x-3 p-6 border-t dark:border-gray-700' 
            }, [
                React.createElement('button', {
                    key: 'cancel',
                    onClick: handleCancel,
                    className: 'px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors'
                }, 'Cancel'),
                React.createElement('button', {
                    key: 'save',
                    onClick: handleSave,
                    disabled: !!error || !amount || parseFloat(amount) <= 0,
                    className: 'px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors'
                }, 'Save Amount')
            ])
        ])
    ]);
};
