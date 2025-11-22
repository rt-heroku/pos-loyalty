if (!window.Views) {
    window.Views = {};
}

// Promotions View Component
window.Views.PromotionsView = () => {
    const { Grid3X3, List, Calendar, Tag, AlertCircle, Loader } = window.Icons;

    const [viewMode, setViewMode] = React.useState('list'); // 'list' or 'grid'
    const [promotions, setPromotions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    // Fetch promotions from API
    React.useEffect(() => {
        const fetchPromotions = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch('/api/promotions');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch promotions');
                }
                
                const data = await response.json();
                setPromotions(data.promotions || []);
            } catch (err) {
                console.error('Error fetching promotions:', err);
                setError(err.message || 'Failed to load promotions');
            } finally {
                setLoading(false);
            }
        };
        
        fetchPromotions();
    }, []);

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric' 
        });
    };

    // Get badge color for usage type
    const getUsageTypeColor = (type) => {
        if (!type) return '';
        const colors = {
            'Unlimited': 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
            'Limited': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
            'Once': 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
        };
        return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    };

    // List view
    const renderListView = () => {
        if (promotions.length === 0) {
            return React.createElement('div', {
                key: 'empty-list',
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center'
            }, [
                React.createElement(Tag, {
                    key: 'empty-icon',
                    size: 48,
                    className: 'mx-auto text-gray-400 mb-4'
                }),
                React.createElement('p', {
                    key: 'empty-text',
                    className: 'text-gray-500 dark:text-gray-400'
                }, 'No active promotions available')
            ]);
        }

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
                React.createElement('div', { key: 'header-type' }, 'Usage Type'),
                React.createElement('div', { key: 'header-points' }, 'Reward Points'),
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
                    className: 'grid grid-cols-6 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer'
                }, [
                    React.createElement('div', {
                        key: `name-${promo.id}`,
                        className: 'font-medium text-gray-900 dark:text-white'
                    }, [
                        React.createElement('div', { key: `title-${promo.id}` }, promo.display_name || promo.name),
                        promo.description && React.createElement('div', {
                            key: `desc-${promo.id}`,
                            className: 'text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1'
                        }, promo.description)
                    ]),
                    React.createElement('div', {
                        key: `start-${promo.id}`,
                        className: 'text-gray-600 dark:text-gray-400 text-sm'
                    }, formatDate(promo.start_date || promo.start_date_time)),
                    React.createElement('div', {
                        key: `type-${promo.id}`
                    }, promo.usage_type ? React.createElement('span', {
                        key: `type-badge-${promo.id}`,
                        className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUsageTypeColor(promo.usage_type)}`
                    }, promo.usage_type) : React.createElement('span', {
                        key: `type-empty-${promo.id}`,
                        className: 'text-gray-400'
                    }, '-')),
                    React.createElement('div', {
                        key: `points-${promo.id}`,
                        className: 'text-gray-600 dark:text-gray-400'
                    }, promo.total_reward_points ? `${promo.total_reward_points} pts` : '-'),
                    React.createElement('div', {
                        key: `end-${promo.id}`,
                        className: 'text-gray-600 dark:text-gray-400 text-sm'
                    }, formatDate(promo.end_date || promo.end_date_time)),
                    React.createElement('div', {
                        key: `enrollment-${promo.id}`,
                        className: 'flex items-center'
                    }, [
                        React.createElement('input', {
                            key: `checkbox-${promo.id}`,
                            type: 'checkbox',
                            checked: promo.is_enrollment_required,
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
        if (promotions.length === 0) {
            return React.createElement('div', {
                key: 'empty-grid',
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center'
            }, [
                React.createElement(Tag, {
                    key: 'empty-icon',
                    size: 48,
                    className: 'mx-auto text-gray-400 mb-4'
                }),
                React.createElement('p', {
                    key: 'empty-text',
                    className: 'text-gray-500 dark:text-gray-400'
                }, 'No active promotions available')
            ]);
        }

        return React.createElement('div', {
            key: 'grid-view',
            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        }, promotions.map(promo =>
            React.createElement('div', {
                key: `promo-card-${promo.id}`,
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer'
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
                    promo.usage_type && React.createElement('span', {
                        key: `card-type-badge-${promo.id}`,
                        className: `px-2 py-1 text-xs font-semibold rounded-full ${getUsageTypeColor(promo.usage_type)}`
                    }, promo.usage_type)
                ]),

                // Title
                React.createElement('h3', {
                    key: `card-title-${promo.id}`,
                    className: 'text-lg font-semibold text-gray-900 dark:text-white mb-2'
                }, promo.display_name || promo.name),

                // Description
                promo.description && React.createElement('p', {
                    key: `card-desc-${promo.id}`,
                    className: 'text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2'
                }, promo.description),

                // Details
                React.createElement('div', {
                    key: `card-details-${promo.id}`,
                    className: 'space-y-3 mt-4'
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
                        }, formatDate(promo.start_date || promo.start_date_time))
                    ]),

                    (promo.end_date || promo.end_date_time) && React.createElement('div', {
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
                        }, formatDate(promo.end_date || promo.end_date_time))
                    ]),

                    promo.total_reward_points && React.createElement('div', {
                        key: `card-points-${promo.id}`,
                        className: 'pt-3 border-t border-gray-200 dark:border-gray-700'
                    }, [
                        React.createElement('span', {
                            key: `points-label-${promo.id}`,
                            className: 'text-xs text-gray-500 dark:text-gray-400'
                        }, 'Reward:'),
                        React.createElement('span', {
                            key: `points-value-${promo.id}`,
                            className: 'ml-2 text-sm font-bold text-blue-600 dark:text-blue-400'
                        }, `${promo.total_reward_points} Points`)
                    ]),

                    promo.is_enrollment_required && React.createElement('div', {
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

    // Loading state
    if (loading) {
        return React.createElement('div', {
            key: 'loading-view',
            className: 'h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900'
        }, [
            React.createElement('div', {
                key: 'loading-content',
                className: 'text-center'
            }, [
                React.createElement(Loader, {
                    key: 'loader-icon',
                    size: 48,
                    className: 'mx-auto text-blue-600 dark:text-blue-400 animate-spin'
                }),
                React.createElement('p', {
                    key: 'loading-text',
                    className: 'mt-4 text-gray-600 dark:text-gray-400'
                }, 'Loading promotions...')
            ])
        ]);
    }

    // Error state
    if (error) {
        return React.createElement('div', {
            key: 'error-view',
            className: 'h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900'
        }, [
            React.createElement('div', {
                key: 'error-content',
                className: 'text-center max-w-md'
            }, [
                React.createElement(AlertCircle, {
                    key: 'error-icon',
                    size: 48,
                    className: 'mx-auto text-red-500 mb-4'
                }),
                React.createElement('h2', {
                    key: 'error-title',
                    className: 'text-xl font-semibold text-gray-900 dark:text-white mb-2'
                }, 'Failed to Load Promotions'),
                React.createElement('p', {
                    key: 'error-message',
                    className: 'text-gray-600 dark:text-gray-400'
                }, error)
            ])
        ]);
    }

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




