if (!window.Modals) {
    window.Modals = {};
}

   // Customer History Modal
   window.Modals.CustomerHistoryModal = function CustomerHistoryModal({ show, onClose, customerHistory, loading }) {
    if (!show) return null;

    const { X } = window.Icons;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    }, [
        React.createElement('div', { 
            key: 'modal', 
            className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-lg'
        }, [
            React.createElement('div', { key: 'header', className: 'flex justify-between items-center mb-6' }, [
                React.createElement('h2', { className: 'text-xl font-bold' }, 'Customer Purchase History'),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'
                }, React.createElement(X, { size: 24 }))
            ]),

            React.createElement('div', { key: 'history', className: 'space-y-4' },
                customerHistory.length === 0 ?
                    React.createElement('p', { className: 'text-center text-gray-500 dark:text-gray-400 py-8' }, 'No purchase history found') :
                    customerHistory.map(transaction =>
                        React.createElement('div', { 
                            key: transaction.id, 
                            className: 'border rounded-lg p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                        }, [
                            React.createElement('div', { key: 'transaction-header', className: 'flex justify-between items-start mb-3' }, [
                                React.createElement('div', { key: 'date-info' }, [
                                    React.createElement('div', { className: 'font-medium' },
                                        new Date(transaction.created_at).toLocaleDateString()
                                    ),
                                    React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' },
                                        `Transaction #${transaction.id} • ${transaction.payment_method}`
                                    )
                                ]),
                                React.createElement('div', { key: 'total-info', className: 'text-right' }, [
                                    React.createElement('div', { className: 'font-bold text-lg' },
                                        `$${parseFloat(transaction.total).toFixed(2)}`
                                    ),
                                    React.createElement('div', { className: 'text-sm text-green-600 dark:text-green-400' },
                                        `+${transaction.points_earned} points`
                                    )
                                ])
                            ]),
                            React.createElement('div', { key: 'items', className: 'space-y-2' },
                                transaction.items && transaction.items.map((item, index) =>
                                    React.createElement('div', { 
                                        key: index, 
                                        className: 'flex justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded'
                                    }, [
                                        React.createElement('span', { key: 'item-name' }, `${item.name} x${item.quantity}`),
                                        React.createElement('span', { key: 'item-total' }, `$${parseFloat(item.subtotal).toFixed(2)}`)
                                    ])
                                )
                            )
                        ])
                    )
            )
        ])
    ]);
};

