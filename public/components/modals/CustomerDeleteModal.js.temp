if (!window.Modals) {
    window.Modals = {};
}

// Confirmation Modal for Deleting Customers
window.Modals.CustomerDeleteModal = ({
    show,
    onClose,
    customer,
    onConfirm,
    loading
}) => {
    if (!show || !customer) return null;

    const { X, Trash2, AlertTriangle } = window.Icons;

    return React.createElement('div', {
        key: 'modal-container',
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    }, [
        React.createElement('div', {
            key: 'modal',
            className: 'bg-white rounded-lg w-full max-w-md'
        }, [
            // Header
            React.createElement('div', { key: 'header', className: 'px-6 py-4 border-b flex justify-between items-center' }, [
                React.createElement('h2', { key: 'header-title', className: 'text-xl font-bold text-red-600 flex items-center gap-2' }, [
                    React.createElement(Trash2, { key: 'icon', size: 24 }),
                    'Delete Customer'
                ]),
                React.createElement('button', {
                    onClick: onClose,
                    key: 'close-button',
                    className: 'text-gray-400 hover:text-gray-600 transition-colors'
                }, React.createElement(X, { size: 24 }))
            ]),

            // Content
            React.createElement('div', { key: 'content', className: 'p-6' }, [
                React.createElement('div', { key: 'warning-container', className: 'flex items-start gap-4 mb-4' }, [
                    React.createElement(AlertTriangle, {
                        key: 'warning-icon',
                        className: 'text-red-500 mt-1',
                        size: 24
                    }),
                    React.createElement('div', { key: 'warning-text' }, [
                        React.createElement('h3', { key: 'warning-title', className: 'font-semibold text-gray-900 mb-2' },
                            'Are you sure you want to delete this customer?'
                        ),
                        React.createElement('p', { key: 'warning-description', className: 'text-gray-600 text-sm mb-4' },
                            'This action cannot be undone. All customer data and purchase history will be permanently removed.'
                        )
                    ])
                ]),

                // Customer Info
                React.createElement('div', { key: 'customer-info', className: 'bg-gray-50 p-4 rounded-lg border' }, [
                    React.createElement('div', { key: 'customer-name', className: 'font-semibold text-lg' }, customer.name),
                    React.createElement('div', { key: 'customer-loyalty', className: 'text-blue-600 font-mono text-sm' }, customer.loyalty_number),
                    customer.email && React.createElement('div', { key: 'customer-email', className: 'text-gray-600 text-sm' }, customer.email),
                    React.createElement('div', { key: 'customer-stats', className: 'mt-2 flex gap-4 text-sm' }, [
                        React.createElement('span', { key: 'points' }, [
                            React.createElement('strong', { key: 'label' }, 'Points: '),
                            React.createElement('span', { key: 'value', className: 'text-green-600' }, customer.points || 0)
                        ]),
                        React.createElement('span', { key: 'visits' }, [
                            React.createElement('strong', { key: 'label' }, 'Visits: '),
                            React.createElement('span', { key: 'value', className: 'text-blue-600' }, customer.visit_count || 0)
                        ]),
                        React.createElement('span', { key: 'spent' }, [
                            React.createElement('strong', { key: 'label' }, 'Spent: '),
                            React.createElement('span', { key: 'value', className: 'text-purple-600' },
                                `${parseFloat(customer.total_spent || 0).toFixed(2)}`
                            )
                        ])
                    ])
                ])
            ]),

            // Footer
            React.createElement('div', { key: 'footer', className: 'px-6 py-4 border-t bg-gray-50 flex gap-3 justify-end' }, [
                React.createElement('button', {
                    onClick: onClose,
                    disabled: loading,
                    key: 'cancel-button',
                    className: 'px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50'
                }, 'Cancel'),
                React.createElement('button', {
                    onClick: () => onConfirm(customer.id),
                    disabled: loading,
                    key: 'delete-button',
                    className: 'px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2'
                }, [
                    loading && React.createElement('div', {
                        key: 'spinner',
                        className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white'
                    }),
                    React.createElement(Trash2, { key: 'icon', size: 16 }),
                    loading ? 'Deleting...' : 'Delete Customer'
                ])
            ])
        ])
    ]);
};

