if (!window.Modals) {
    window.Modals = {};
}

window.Modals.ReceiptModal = function ReceiptModal({
    show, onClose, transaction, subtotal, tax, total, paymentMethod, amountReceived, change, appliedVouchers, voucherDiscounts
}) {
    if (!show || !transaction) return null;
    
    // Debug logging
    console.log('ReceiptModal props:', { subtotal, tax, total, appliedVouchers, voucherDiscounts });

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    }, [
        React.createElement('div', { key: 'modal', className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full' }, [
            React.createElement('div', { key: 'header', className: 'text-center mb-6' }, [
                React.createElement('h2', { key: 'header-title', className: 'text-2xl font-bold text-gray-900 dark:text-gray-100' }, 'Receipt'),
                React.createElement('p', { key: 'transaction-id', className: 'text-gray-600 dark:text-gray-400' }, `Transaction #${transaction.id}`),
                React.createElement('p', { key: 'transaction-date', className: 'text-sm text-gray-500 dark:text-gray-500' },
                    new Date().toLocaleString()
                )
            ]),

            transaction.customer && React.createElement('div', { key: 'customer-info', className: 'mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded' }, [
                React.createElement('div', { key: 'customer-name', className: 'font-medium text-green-800 dark:text-green-200' }, transaction.customer.name),
                React.createElement('div', { key: 'customer-loyalty', className: 'text-sm text-green-600 dark:text-green-400' }, `${transaction.customer.loyalty_number} • +${Math.floor(total)} points earned`)
            ]),

            React.createElement('div', { key: 'items', className: 'space-y-2 mb-4' },
                transaction.items.map(item =>
                    React.createElement('div', { key: item.id, className: 'flex justify-between text-gray-900 dark:text-gray-100' }, [
                        React.createElement('span', { key: 'item' }, `${item.name} x${item.quantity}`),
                        React.createElement('span', { key: 'price' }, `$${(item.price * item.quantity).toFixed(2)}`)
                    ])
                )
            ),

            // Applied Vouchers Section
            appliedVouchers && appliedVouchers.length > 0 && React.createElement('div', { key: 'vouchers', className: 'mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded' }, [
                React.createElement('div', { key: 'vouchers-title', className: 'font-medium text-blue-800 dark:text-blue-200 mb-2' }, 'Applied Vouchers'),
                ...appliedVouchers.map(voucher => 
                    React.createElement('div', { key: `voucher-${voucher.id}`, className: 'flex justify-between text-sm text-blue-700 dark:text-blue-300' }, [
                        React.createElement('span', { key: 'voucher-name' }, voucher.name),
                        React.createElement('span', { key: 'voucher-value' }, 
                            voucher.voucher_type === 'Value' ? `-$${(parseFloat(voucher.applied_amount || voucher.remaining_value || 0)).toFixed(2)}` :
                            voucher.voucher_type === 'Discount' ? `-${voucher.discount_percent}%` :
                            voucher.voucher_type === 'ProductSpecific' ? 
                                (voucher.discount_percent ? `-${voucher.discount_percent}%` : `-$${(parseFloat(voucher.face_value || 0)).toFixed(2)}`) :
                                '-$0.00'
                        )
                    ])
                )
            ]),

            React.createElement('div', { key: 'totals', className: 'border-t dark:border-gray-600 pt-4 space-y-1' }, [
                React.createElement('div', { key: 'subtotal', className: 'flex justify-between text-gray-900 dark:text-gray-100' }, [
                    React.createElement('span', { key: 'label' }, 'Subtotal:'),
                    React.createElement('span', { key: 'value' }, `$${(subtotal || 0).toFixed(2)}`)
                ]),
                voucherDiscounts && voucherDiscounts > 0 && React.createElement('div', { key: 'voucher-discount', className: 'flex justify-between text-green-600 dark:text-green-400' }, [
                    React.createElement('span', { key: 'label' }, 'Voucher Discount:'),
                    React.createElement('span', { key: 'value' }, `-$${voucherDiscounts.toFixed(2)}`)
                ]),
                React.createElement('div', { key: 'tax', className: 'flex justify-between text-gray-900 dark:text-gray-100' }, [
                    React.createElement('span', { key: 'label' }, 'Tax:'),
                    React.createElement('span', { key: 'value' }, `$${(tax || 0).toFixed(2)}`)
                ]),
                React.createElement('div', { key: 'total', className: 'flex justify-between font-bold text-lg text-gray-900 dark:text-gray-100' }, [
                    React.createElement('span', { key: 'label' }, 'Total:'),
                    React.createElement('span', { key: 'value' }, `$${(total || 0).toFixed(2)}`)
                ]),
                paymentMethod === 'cash' && amountReceived && [
                    React.createElement('div', { key: 'received', className: 'flex justify-between' }, [
                        React.createElement('span', { key: 'label' }, 'Amount Received:'),
                        React.createElement('span', { key: 'value' }, `$${parseFloat(amountReceived).toFixed(2)}`)
                    ]),
                    React.createElement('div', { key: 'change', className: 'flex justify-between' }, [
                        React.createElement('span', { key: 'label' }, 'Change:'),
                        React.createElement('span', { key: 'value' }, `$${change.toFixed(2)}`)
                    ])
                ]
            ]),

            React.createElement('div', { key: 'footer', className: 'text-center mt-6' }, [
                React.createElement('p', { key: 'thank-you', className: 'text-sm text-gray-600 dark:text-gray-400 mb-4' }, 'Thank you for your business!'),
                React.createElement('button', {
                    key: 'close-button',
                    onClick: onClose,
                    className: 'bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors'
                }, 'Close')
            ])
        ])
    ]);
};
