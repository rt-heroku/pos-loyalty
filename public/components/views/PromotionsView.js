if (!window.Views) {
    window.Views = {};
}

// Promotions View Component
window.Views.PromotionsView = () => {
    const { Grid3X3, List, Calendar, Tag } = window.Icons;

    const [viewMode, setViewMode] = React.useState('list'); // 'list' or 'grid'

    // Static promotions data from the image
    const promotions = [
        {
            id: 1,
            name: 'Holiday promotion',
            startDate: '7/1/2025',
            loyaltyPromotionType: '',
            fulfillmentAction: '',
            endDate: '',
            enrollmentRequired: false
        },
        {
            id: 2,
            name: 'Share Post on Social',
            startDate: '9/25/2023',
            loyaltyPromotionType: '',
            fulfillmentAction: '',
            endDate: '',
            enrollmentRequired: false
        },
        {
            id: 3,
            name: 'Welcome Offer: Complete Your Profile',
            startDate: '9/1/2023',
            loyaltyPromotionType: 'Standard',
            fulfillmentAction: 'Credit Points',
            endDate: '',
            enrollmentRequired: true
        },
        {
            id: 4,
            name: 'Download the App',
            startDate: '9/1/2023',
            loyaltyPromotionType: 'Standard',
            fulfillmentAction: 'Credit Points',
            endDate: '',
            enrollmentRequired: true
        },
        {
            id: 5,
            name: 'Bonus 200 points on $100 Burger Monthly Spend',
            startDate: '9/1/2023',
            loyaltyPromotionType: 'Cumulative',
            fulfillmentAction: 'Credit Points',
            endDate: '',
            enrollmentRequired: false
        },
        {
            id: 6,
            name: 'Enrollment Free fries',
            startDate: '9/1/2025',
            loyaltyPromotionType: '',
            fulfillmentAction: '',
            endDate: '',
            enrollmentRequired: false
        },
        {
            id: 7,
            name: '2x Points to reengage Silver Members close to Gold',
            startDate: '10/6/2025',
            loyaltyPromotionType: '',
            fulfillmentAction: '',
            endDate: '',
            enrollmentRequired: false
        },
        {
            id: 8,
            name: 'Member Enrollment: Free Fries',
            startDate: '10/1/2025',
            loyaltyPromotionType: '',
            fulfillmentAction: '',
            endDate: '',
            enrollmentRequired: false
        }
    ];

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return dateStr;
    };

    // Get badge color for promotion type
    const getPromotionTypeColor = (type) => {
        if (!type) return '';
        const colors = {
            'Standard': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
            'Cumulative': 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
        };
        return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    };

    // List view
    const renderListView = () => {
        return React.createElement('div', {
            key: 'list-view',
            className: 'bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden'
        }, [
            // Table header
            React.createElement('div', {
                key: 'table-header',
                className: 'grid grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300'
            }, [
                React.createElement('div', { key: 'header-name' }, 'Name'),
                React.createElement('div', { key: 'header-start' }, 'Start Date'),
                React.createElement('div', { key: 'header-type' }, 'Loyalty Promotion Type'),
                React.createElement('div', { key: 'header-action' }, 'Fulfillment Action'),
                React.createElement('div', { key: 'header-end' }, 'End Date'),
                React.createElement('div', { key: 'header-enrollment' }, 'Enrollment Required')
            ]),

            // Table rows
            React.createElement('div', {
                key: 'table-body',
                className: 'divide-y divide-gray-200 dark:divide-gray-700'
            }, promotions.map(promo =>
                React.createElement('div', {
                    key: `promo-row-${promo.id}`,
                    className: 'grid grid-cols-6 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                }, [
                    React.createElement('div', {
                        key: `name-${promo.id}`,
                        className: 'font-medium text-gray-900 dark:text-white'
                    }, promo.name),
                    React.createElement('div', {
                        key: `start-${promo.id}`,
                        className: 'text-gray-600 dark:text-gray-400'
                    }, formatDate(promo.startDate)),
                    React.createElement('div', {
                        key: `type-${promo.id}`
                    }, promo.loyaltyPromotionType ? React.createElement('span', {
                        key: `type-badge-${promo.id}`,
                        className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPromotionTypeColor(promo.loyaltyPromotionType)}`
                    }, promo.loyaltyPromotionType) : React.createElement('span', {
                        key: `type-empty-${promo.id}`,
                        className: 'text-gray-400'
                    }, '-')),
                    React.createElement('div', {
                        key: `action-${promo.id}`,
                        className: 'text-gray-600 dark:text-gray-400'
                    }, promo.fulfillmentAction || '-'),
                    React.createElement('div', {
                        key: `end-${promo.id}`,
                        className: 'text-gray-600 dark:text-gray-400'
                    }, formatDate(promo.endDate)),
                    React.createElement('div', {
                        key: `enrollment-${promo.id}`,
                        className: 'flex items-center'
                    }, [
                        React.createElement('input', {
                            key: `checkbox-${promo.id}`,
                            type: 'checkbox',
                            checked: promo.enrollmentRequired,
                            readOnly: true,
                            className: 'w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                        })
                    ])
                ])
            ))
        ]);
    };

    // Grid view
    const renderGridView = () => {
        return React.createElement('div', {
            key: 'grid-view',
            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        }, promotions.map(promo =>
            React.createElement('div', {
                key: `promo-card-${promo.id}`,
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow'
            }, [
                // Header
                React.createElement('div', {
                    key: `card-header-${promo.id}`,
                    className: 'flex items-start justify-between mb-4'
                }, [
                    React.createElement('div', {
                        key: `card-icon-${promo.id}`,
                        className: 'w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center'
                    }, [
                        React.createElement(Tag, {
                            key: `icon-${promo.id}`,
                            className: 'text-blue-600 dark:text-blue-400',
                            size: 24
                        })
                    ]),
                    promo.loyaltyPromotionType && React.createElement('span', {
                        key: `card-type-badge-${promo.id}`,
                        className: `px-2 py-1 text-xs font-semibold rounded-full ${getPromotionTypeColor(promo.loyaltyPromotionType)}`
                    }, promo.loyaltyPromotionType)
                ]),

                // Title
                React.createElement('h3', {
                    key: `card-title-${promo.id}`,
                    className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4'
                }, promo.name),

                // Details
                React.createElement('div', {
                    key: `card-details-${promo.id}`,
                    className: 'space-y-3'
                }, [
                    React.createElement('div', {
                        key: `card-start-${promo.id}`,
                        className: 'flex items-center gap-2'
                    }, [
                        React.createElement(Calendar, {
                            key: `cal-icon-${promo.id}`,
                            size: 16,
                            className: 'text-gray-400'
                        }),
                        React.createElement('span', {
                            key: `start-label-${promo.id}`,
                            className: 'text-sm text-gray-600 dark:text-gray-400'
                        }, 'Start:'),
                        React.createElement('span', {
                            key: `start-value-${promo.id}`,
                            className: 'text-sm font-medium text-gray-900 dark:text-white'
                        }, formatDate(promo.startDate))
                    ]),

                    promo.endDate && React.createElement('div', {
                        key: `card-end-${promo.id}`,
                        className: 'flex items-center gap-2'
                    }, [
                        React.createElement(Calendar, {
                            key: `cal-end-icon-${promo.id}`,
                            size: 16,
                            className: 'text-gray-400'
                        }),
                        React.createElement('span', {
                            key: `end-label-${promo.id}`,
                            className: 'text-sm text-gray-600 dark:text-gray-400'
                        }, 'End:'),
                        React.createElement('span', {
                            key: `end-value-${promo.id}`,
                            className: 'text-sm font-medium text-gray-900 dark:text-white'
                        }, formatDate(promo.endDate))
                    ]),

                    promo.fulfillmentAction && React.createElement('div', {
                        key: `card-action-${promo.id}`,
                        className: 'pt-3 border-t border-gray-200 dark:border-gray-700'
                    }, [
                        React.createElement('span', {
                            key: `action-label-${promo.id}`,
                            className: 'text-xs text-gray-500 dark:text-gray-400'
                        }, 'Action:'),
                        React.createElement('span', {
                            key: `action-value-${promo.id}`,
                            className: 'ml-2 text-sm font-medium text-gray-900 dark:text-white'
                        }, promo.fulfillmentAction)
                    ]),

                    promo.enrollmentRequired && React.createElement('div', {
                        key: `card-enrollment-${promo.id}`,
                        className: 'flex items-center gap-2 pt-2'
                    }, [
                        React.createElement('input', {
                            key: `card-checkbox-${promo.id}`,
                            type: 'checkbox',
                            checked: true,
                            readOnly: true,
                            className: 'w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                        }),
                        React.createElement('span', {
                            key: `enrollment-label-${promo.id}`,
                            className: 'text-sm text-gray-600 dark:text-gray-400'
                        }, 'Enrollment Required')
                    ])
                ])
            ])
        ));
    };

    return React.createElement('div', {
        key: 'promotions-view',
        className: 'h-full flex flex-col bg-gray-50 dark:bg-gray-900'
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6'
        }, [
            React.createElement('div', {
                key: 'header-content',
                className: 'flex items-center justify-between'
            }, [
                React.createElement('div', { key: 'title-section' }, [
                    React.createElement('h1', {
                        key: 'title',
                        className: 'text-2xl font-bold text-gray-900 dark:text-white'
                    }, 'Promotions'),
                    React.createElement('p', {
                        key: 'subtitle',
                        className: 'text-sm text-gray-600 dark:text-gray-400 mt-1'
                    }, `${promotions.length} active promotion${promotions.length !== 1 ? 's' : ''}`)
                ]),

                // View mode toggle
                React.createElement('div', {
                    key: 'view-toggle',
                    className: 'flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1'
                }, [
                    React.createElement('button', {
                        key: 'grid-btn',
                        onClick: () => setViewMode('grid'),
                        className: `p-2 rounded transition-colors ${
                            viewMode === 'grid'
                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`
                    }, React.createElement(Grid3X3, { key: 'grid-icon', size: 20 })),
                    React.createElement('button', {
                        key: 'list-btn',
                        onClick: () => setViewMode('list'),
                        className: `p-2 rounded transition-colors ${
                            viewMode === 'list'
                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`
                    }, React.createElement(List, { key: 'list-icon', size: 20 }))
                ])
            ])
        ]),

        // Content
        React.createElement('div', {
            key: 'content',
            className: 'flex-1 overflow-auto p-6'
        }, [
            viewMode === 'list' ? renderListView() : renderGridView()
        ])
    ]);
};

