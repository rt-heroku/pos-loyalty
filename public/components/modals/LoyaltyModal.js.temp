    // Loyalty Modal Component
    if (!window.Modals) {
        window.Modals = {};
    }

    window.Modals.LoyaltyModal = function LoyaltyModal({
        show,
        onClose,
        loyaltyNumber,
        setLoyaltyNumber,
        onSearchByLoyalty,
        loyaltySearchTerm,
        setLoyaltySearchTerm,
        onSearchCustomers,
        customerSearchResults,
        onSelectCustomer,
        loading
    }) {
        if (!show) return null;

        const { X } = window.Icons;

        return React.createElement('div', {
            className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
        }, [
            React.createElement('div', { key: 'modal', className: 'bg-white rounded-lg p-6 max-w-md w-full' }, [
                React.createElement('div', { key: 'header', className: 'flex justify-between items-center mb-6' }, [
                    React.createElement('h2', { className: 'text-xl font-bold' }, 'Loyalty Customer'),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'text-gray-400 hover:text-gray-600'
                    }, React.createElement(X, { size: 24 }))
                ]),

                React.createElement('div', { key: 'content', className: 'space-y-4' }, [
                    React.createElement('div', { key: 'loyalty-input' }, [
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Loyalty Number'),
                        React.createElement('input', {
                            type: 'text',
                            value: loyaltyNumber,
                            onChange: (e) => setLoyaltyNumber(e.target.value.toUpperCase()),
                            placeholder: 'Enter loyalty number (e.g., LOY001)',
                            className: 'w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        })
                    ]),

                    React.createElement('button', {
                        onClick: () => onSearchByLoyalty(loyaltyNumber),
                        disabled: !loyaltyNumber.trim() || loading,
                        className: 'w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors'
                    }, loading ? 'Searching...' : 'Search Customer'),

                    React.createElement('div', { key: 'divider', className: 'text-center text-gray-500' }, 'OR'),

                    React.createElement('div', { key: 'search-input' }, [
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Search by Name/Email'),
                        React.createElement('input', {
                            type: 'text',
                            value: loyaltySearchTerm,
                            onChange: (e) => {
                                setLoyaltySearchTerm(e.target.value);
                                onSearchCustomers(e.target.value);
                            },
                            placeholder: 'Enter name or email',
                            className: 'w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        })
                    ]),

                    customerSearchResults.length > 0 && React.createElement('div', { key: 'search-results', className: 'max-h-40 overflow-y-auto border rounded-lg' },
                        customerSearchResults.map(customer =>
                            React.createElement('button', {
                                key: customer.id,
                                onClick: () => onSelectCustomer(customer),
                                className: 'w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0'
                            }, [
                                React.createElement('div', { key: 'name', className: 'font-medium' }, customer.name),
                                React.createElement('div', { key: 'details', className: 'text-sm text-gray-600' },
                                    `${customer.loyalty_number} • ${customer.points} points • ${customer.email || 'No email'}`
                                )
                            ])
                        )
                    )
                ])
            ])
        ]);
    };
