    if (!window.Views) {
        window.Views = {};
    }
    
    // Sales View Component
    window.Views.SalesView = ({ analytics, transactions }) => {
        const { DollarSign, BarChart3, Receipt, Users } = window.Icons;

        return React.createElement('div', {key: 'sales-view', className: 'space-y-4 lg:space-y-6' }, [
            // Stats Cards
            React.createElement('div', { key: 'stats', className: 'grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6' }, [
                React.createElement('div', { key: 'today-sales', className: 'bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700' }, [
                    React.createElement('div', { key: 'today-sales-content', className: 'flex items-center justify-between' }, [
                        React.createElement('div', { key: 'content' }, [
                            React.createElement('p', { key: 'today-sales-label', className: 'text-gray-600 dark:text-gray-300 text-sm' }, "Today's Sales"),
                            React.createElement('p', { key: 'today-sales-value', className: 'text-xl lg:text-2xl font-bold text-green-600' }, `${analytics.todaySales.toFixed(2)}`)
                        ]),
                        React.createElement(DollarSign, { key: 'icon', className: 'text-green-600', size: 32 })
                    ])
                ]),
                React.createElement('div', { key: 'total-sales', className: 'bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700' }, [
                    React.createElement('div', { key: 'total-sales-content', className: 'flex items-center justify-between' }, [
                        React.createElement('div', { key: 'content' }, [
                            React.createElement('p', { key: 'total-sales-label', className: 'text-gray-600 dark:text-gray-300 text-sm' }, 'Total Sales'),
                            React.createElement('p', { key: 'total-sales-value', className: 'text-2xl font-bold text-blue-600' }, `${analytics.totalSales.toFixed(2)}`)
                        ]),
                        React.createElement(BarChart3, { key: 'icon', className: 'text-blue-600', size: 32 })
                    ])
                ]),
                React.createElement('div', { key: 'transactions', className: 'bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700' }, [
                    React.createElement('div', { key: 'transactions-content', className: 'flex items-center justify-between' }, [
                        React.createElement('div', { key: 'content' }, [
                            React.createElement('p', { key: 'transactions-label', className: 'text-gray-600 dark:text-gray-300 text-sm' }, 'Transactions'),
                            React.createElement('p', { key: 'transactions-value', className: 'text-2xl font-bold text-purple-600' }, analytics.transactionCount)
                        ]),
                        React.createElement(Receipt, { key: 'icon', className: 'text-purple-600', size: 32 })
                    ])
                ]),
                React.createElement('div', { key: 'customers', className: 'bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700' }, [
                    React.createElement('div', { key: 'customers-content', className: 'flex items-center justify-between' }, [
                        React.createElement('div', { key: 'content' }, [
                            React.createElement('p', { key: 'customers-label', className: 'text-gray-600 dark:text-gray-300 text-sm' }, 'Total Customers'),
                            React.createElement('p', { key: 'customers-value', className: 'text-2xl font-bold text-indigo-600' }, analytics.totalCustomers)
                        ]),
                        React.createElement(Users, { key: 'icon', className: 'text-indigo-600', size: 32 })
                    ])
                ])
            ]),

            // Recent Transactions
            React.createElement('div', { key: 'transactions-table', className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700' }, [
                React.createElement('div', { key: 'header', className: 'p-6 border-b' }, [
                    React.createElement('h2', { key: 'header-title', className: 'text-xl font-bold text-gray-900 dark:text-white' }, 'Recent Transactions')
                ]),
                React.createElement('div', { key: 'content', className: 'p-6' }, [
                    transactions.length === 0 ? (
                        React.createElement('p', { key: 'no-transactions-message', className: 'text-gray-500 dark:text-gray-400 text-center py-8' }, 'No transactions yet')
                    ) : (
                        React.createElement('div', { key: 'table-container', className: 'overflow-x-auto' }, [
                            React.createElement('table', { key: 'table', className: 'w-full' }, [
                                React.createElement('thead', { key: 'thead' }, [
                                    React.createElement('tr', { key: 'tr', className: 'bg-gray-50 dark:bg-gray-700' }, [
                                        React.createElement('th', { key: 'date', className: 'text-left p-3 text-gray-900 dark:text-white' }, 'Date'),
                                        React.createElement('th', { key: 'customer', className: 'text-left p-3 text-gray-900 dark:text-white' }, 'Customer'),
                                        React.createElement('th', { key: 'items', className: 'text-left p-3 text-gray-900 dark:text-white' }, 'Items'), 
                                        React.createElement('th', { key: 'payment', className: 'text-left p-3 text-gray-900 dark:text-white' }, 'Payment'),
                                        React.createElement('th', { key: 'total', className: 'text-left p-3 text-gray-900 dark:text-white' }, 'Total')
                                    ])
                                ]),
                                React.createElement('tbody', { key: 'tbody' }, transactions.slice(0, 10).map(transaction =>
                                    React.createElement('tr', { key: transaction.id, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' }, [
                                        React.createElement('td', { key: 'date', className: 'p-3 border-b text-gray-900 dark:text-white' }, 
                                            new Date(transaction.created_at).toLocaleString()
                                        ),
                                        React.createElement('td', { key: 'customer', className: 'p-3 border-b' }, 
                                            transaction.customer_name ? 
                                                React.createElement('div', {}, [
                                                    React.createElement('div', { key: 'name', className: 'font-medium text-gray-900 dark:text-white' }, transaction.customer_name),
                                                    React.createElement('div', { key: 'loyalty', className: 'text-xs text-gray-500 dark:text-gray-400' }, transaction.loyalty_number)
                                                ]) :
                                                React.createElement('span', { key: 'walk-in-span', className: 'text-gray-400' }, 'Walk-in')
                                        ),
                                        React.createElement('td', { key: 'items', className: 'p-3 border-b text-gray-900 dark:text-white' }, 
                                            transaction.items ? transaction.items.map(item => item.name).join(', ') : 'N/A'
                                        ),
                                        React.createElement('td', { key: 'payment', className: 'p-3 border-b capitalize text-gray-900 dark:text-white' }, 
                                            transaction.payment_method
                                        ),
                                        React.createElement('td', { key: 'total', className: 'p-3 border-b font-medium text-gray-900 dark:text-white' }, 
                                            `${parseFloat(transaction.total).toFixed(2)}`
                                        )
                                    ])
                                ))
                            ])
                        ])
                    )
                ])
            ])
        ]);
    };
