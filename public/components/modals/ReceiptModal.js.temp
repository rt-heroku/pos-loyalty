if (!window.Modals) {
    window.Modals = {};
}

window.Modals.ReceiptModal = function ReceiptModal({
    show, onClose, transaction, subtotal, tax, total, paymentMethod, amountReceived, change
}) {
    if (!show || !transaction) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    }, [
        React.createElement('div', { key: 'modal', className: 'bg-white rounded-lg p-6 max-w-md w-full' }, [
            React.createElement('div', { key: 'header', className: 'text-center mb-6' }, [
                React.createElement('h2', { key: 'header-title', className: 'text-2xl font-bold' }, 'Receipt'),
                React.createElement('p', { key: 'transaction-id', className: 'text-gray-600' }, `Transaction #${transaction.id}`),
                React.createElement('p', { key: 'transaction-date', className: 'text-sm text-gray-500' },
                    new Date().toLocaleString()
                )
            ]),

            transaction.customer && React.createElement('div', { key: 'customer-info', className: 'mb-4 p-3 bg-green-50 border border-green-200 rounded' }, [
                React.createElement('div', { key: 'customer-name', className: 'font-medium text-green-800' }, transaction.customer.name),
                React.createElement('div', { key: 'customer-loyalty', className: 'text-sm text-green-600' }, `${transaction.customer.loyalty_number} • +${Math.floor(total)} points earned`)
            ]),

            React.createElement('div', { key: 'items', className: 'space-y-2 mb-4' },
                transaction.items.map(item =>
                    React.createElement('div', { key: item.id, className: 'flex justify-between' }, [
                        React.createElement('span', { key: 'item' }, `${item.name} x${item.quantity}`),
                        React.createElement('span', { key: 'price' }, `$${(item.price * item.quantity).toFixed(2)}`)
                    ])
                )
            ),

            React.createElement('div', { key: 'totals', className: 'border-t pt-4 space-y-1' }, [
                React.createElement('div', { key: 'subtotal', className: 'flex justify-between' }, [
                    React.createElement('span', { key: 'label' }, 'Subtotal:'),
                    React.createElement('span', { key: 'value' }, `$${subtotal.toFixed(2)}`)
                ]),
                React.createElement('div', { key: 'tax', className: 'flex justify-between' }, [
                    React.createElement('span', { key: 'label' }, 'Tax:'),
                    React.createElement('span', { key: 'value' }, `$${tax.toFixed(2)}`)
                ]),
                React.createElement('div', { key: 'total', className: 'flex justify-between font-bold text-lg' }, [
                    React.createElement('span', { key: 'label' }, 'Total:'),
                    React.createElement('span', { key: 'value' }, `$${total.toFixed(2)}`)
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
                React.createElement('p', { key: 'thank-you', className: 'text-sm text-gray-600 mb-4' }, 'Thank you for your business!'),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors'
                }, 'Close')
            ])
        ])
    ]);
};
