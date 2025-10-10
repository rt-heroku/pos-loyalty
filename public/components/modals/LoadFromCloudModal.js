if (!window.Modals) {
    window.Modals = {};
}

window.Modals.LoadFromCloudModal = function LoadFromCloudModal({
    show,
    onClose,
    onProductsLoaded
}) {
    if (!show) return null;

    const { X, Save, AlertCircle, CheckCircle, RefreshCw } = window.Icons;

    const [catalogs, setCatalogs] = React.useState([]);
    const [selectedCatalog, setSelectedCatalog] = React.useState('');
    const [loadingCatalogs, setLoadingCatalogs] = React.useState(false);
    const [loadingProducts, setLoadingProducts] = React.useState(false);
    const [loadResult, setLoadResult] = React.useState(null);
    const [error, setError] = React.useState('');

    // Load catalogs when modal opens
    React.useEffect(() => {
        if (show) {
            loadCatalogs();
        }
    }, [show]);

    const loadCatalogs = async () => {
        setLoadingCatalogs(true);
        setError('');
        try {
            const response = await fetch('/api/loyalty/catalogs');
            if (response.ok) {
                const catalogsData = await response.json();
                setCatalogs(catalogsData);
            } else {
                const errorData = await response.json();
                setError(`Failed to load catalogs: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error loading catalogs:', error);
            setError(`Failed to load catalogs: ${error.message}`);
        } finally {
            setLoadingCatalogs(false);
        }
    };

    const loadProducts = async () => {
        if (!selectedCatalog) {
            setError('Please select a catalog first');
            return;
        }

        setLoadingProducts(true);
        setError('');
        setLoadResult(null);

        try {
            const response = await fetch('/api/loyalty/products/load', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ catalogId: selectedCatalog })
            });

            if (response.ok) {
                const result = await response.json();
                setLoadResult(result);
                
                // Call the callback to refresh products in parent component
                if (onProductsLoaded) {
                    onProductsLoaded();
                }
            } else {
                const errorData = await response.json();
                setError(`Failed to load products: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            setError(`Failed to load products: ${error.message}`);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleClose = () => {
        setCatalogs([]);
        setSelectedCatalog('');
        setLoadResult(null);
        setError('');
        onClose();
    };

    const getSelectedCatalogName = () => {
        const catalog = catalogs.find(c => c.Id === selectedCatalog);
        return catalog ? catalog.Name : '';
    };

    const getSuccessCount = () => {
        if (!loadResult || !Array.isArray(loadResult)) return 0;
        return loadResult.filter(item => item.success).length;
    };

    const getFailureCount = () => {
        if (!loadResult || !Array.isArray(loadResult)) return 0;
        return loadResult.filter(item => !item.success).length;
    };

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    }, [
        React.createElement('div', {
            key: 'modal',
            className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'
        }, [
            // Header
            React.createElement('div', { key: 'header', className: 'px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center' }, [
                React.createElement('h2', { key: 'title', className: 'text-xl font-bold dark:text-white' }, 
                    'Load Products from Cloud'
                ),
                React.createElement('button', {
                    key: 'close-btn',
                    onClick: handleClose,
                    className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }, React.createElement(X, { size: 24 }))
            ]),
            
            // Content
            React.createElement('div', { key: 'content', className: 'p-6 space-y-6 overflow-y-auto flex-1' }, [
                // Catalog Selection
                React.createElement('div', { key: 'catalog-selection' }, [
                    React.createElement('label', { 
                        key: 'catalog-label', 
                        className: 'block text-sm font-medium mb-2 dark:text-white' 
                    }, 'Select Catalog'),
                    React.createElement('select', {
                        key: 'catalog-select',
                        value: selectedCatalog,
                        onChange: (e) => setSelectedCatalog(e.target.value),
                        disabled: loadingCatalogs,
                        className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                    }, [
                        React.createElement('option', { key: 'empty', value: '' }, 
                            loadingCatalogs ? 'Loading catalogs...' : 'Select a catalog'
                        ),
                        ...catalogs.map(catalog => 
                            React.createElement('option', { 
                                key: catalog.Id, 
                                value: catalog.Id 
                            }, catalog.Name)
                        )
                    ])
                ]),

                // Error Display
                error && React.createElement('div', { 
                    key: 'error-display',
                    className: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3'
                }, [
                    React.createElement(AlertCircle, { 
                        key: 'error-icon',
                        size: 20, 
                        className: 'text-red-600 dark:text-red-400 flex-shrink-0' 
                    }),
                    React.createElement('span', { 
                        key: 'error-text',
                        className: 'text-red-700 dark:text-red-300' 
                    }, error)
                ]),

                // Load Products Button
                React.createElement('div', { key: 'load-button-container' }, [
                    React.createElement('button', {
                        key: 'load-products-btn',
                        onClick: loadProducts,
                        disabled: !selectedCatalog || loadingProducts,
                        className: 'w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    }, [
                        loadingProducts ? React.createElement(RefreshCw, { 
                            key: 'loading-spinner',
                            size: 20,
                            className: 'animate-spin' 
                        }) : React.createElement(Save, { key: 'save-icon', size: 20 }),
                        React.createElement('span', { key: 'btn-text' }, 
                            loadingProducts ? 'Loading Products...' : 'Load Products'
                        )
                    ])
                ]),

                // Results Display
                loadResult && React.createElement('div', { key: 'results-display' }, [
                    React.createElement('h3', { 
                        key: 'results-title',
                        className: 'text-lg font-semibold mb-4 dark:text-white' 
                    }, 'Load Results'),
                    
                    // Summary
                    React.createElement('div', { 
                        key: 'results-summary',
                        className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4' 
                    }, [
                        React.createElement('div', { 
                            key: 'summary-stats',
                            className: 'grid grid-cols-3 gap-4 text-center' 
                        }, [
                            React.createElement('div', { key: 'total-stat' }, [
                                React.createElement('div', { 
                                    key: 'total-number',
                                    className: 'text-2xl font-bold text-gray-900 dark:text-white' 
                                }, loadResult.length),
                                React.createElement('div', { 
                                    key: 'total-label',
                                    className: 'text-sm text-gray-600 dark:text-gray-400' 
                                }, 'Total')
                            ]),
                            React.createElement('div', { key: 'success-stat' }, [
                                React.createElement('div', { 
                                    key: 'success-number',
                                    className: 'text-2xl font-bold text-green-600' 
                                }, getSuccessCount()),
                                React.createElement('div', { 
                                    key: 'success-label',
                                    className: 'text-sm text-gray-600 dark:text-gray-400' 
                                }, 'Successful')
                            ]),
                            React.createElement('div', { key: 'failure-stat' }, [
                                React.createElement('div', { 
                                    key: 'failure-number',
                                    className: 'text-2xl font-bold text-red-600' 
                                }, getFailureCount()),
                                React.createElement('div', { 
                                    key: 'failure-label',
                                    className: 'text-sm text-gray-600 dark:text-gray-400' 
                                }, 'Failed')
                            ])
                        ])
                    ]),

                    // Detailed Results
                    React.createElement('div', { 
                        key: 'detailed-results',
                        className: 'max-h-96 overflow-y-auto' 
                    }, [
                        React.createElement('h4', { 
                            key: 'details-title',
                            className: 'text-md font-medium mb-3 dark:text-white' 
                        }, 'Product Details'),
                        React.createElement('div', { 
                            key: 'results-list',
                            className: 'space-y-2' 
                        }, loadResult.map((item, index) => 
                            React.createElement('div', {
                                key: `result-${index}`,
                                className: `p-3 rounded-lg border ${
                                    item.success 
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                }`
                            }, [
                                React.createElement('div', { 
                                    key: 'result-header',
                                    className: 'flex items-center gap-2 mb-2' 
                                }, [
                                    item.success ? React.createElement(CheckCircle, { 
                                        key: 'success-icon',
                                        size: 16, 
                                        className: 'text-green-600' 
                                    }) : React.createElement(AlertCircle, { 
                                        key: 'error-icon',
                                        size: 16, 
                                        className: 'text-red-600' 
                                    }),
                                    React.createElement('span', { 
                                        key: 'result-status',
                                        className: `font-medium ${
                                            item.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                                        }` 
                                    }, item.success ? 'Success' : 'Failed')
                                ]),
                                React.createElement('div', { 
                                    key: 'result-details',
                                    className: 'text-sm text-gray-700 dark:text-gray-300' 
                                }, [
                                    React.createElement('div', { key: 'product-name' }, 
                                        `Product: ${item.product_name || 'N/A'}`
                                    ),
                                    React.createElement('div', { key: 'product-sku' }, 
                                        `SKU: ${item.sku || 'N/A'}`
                                    ),
                                    React.createElement('div', { key: 'product-brand' }, 
                                        `Brand: ${item.brand || 'N/A'}`
                                    ),
                                    item.product_id && React.createElement('div', { key: 'product-id' }, 
                                        `ID: ${item.product_id}`
                                    ),
                                    React.createElement('div', { key: 'product-message' }, 
                                        `Message: ${item.message || 'N/A'}`
                                    )
                                ])
                            ])
                        ))
                    ])
                ])
            ]),

            // Footer
            React.createElement('div', { key: 'footer', className: 'px-6 py-4 border-t dark:border-gray-700 flex gap-3 justify-end' }, [
                React.createElement('button', {
                    key: 'close-btn',
                    onClick: handleClose,
                    className: 'px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
                }, 'Close')
            ])
        ])
    ]);
};
