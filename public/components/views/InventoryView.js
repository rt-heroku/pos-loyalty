if (!window.Views) {
    window.Views = {};
}

// Inventory View Component
window.Views.InventoryView = ({
    products,
    filters,
    loading,
    onAddProduct,
    onEditProduct,
    onDeleteProduct,
    onBulkUpdate,
    onDuplicateProduct,
    searchFilters,
    onFilterChange,
    selectedProducts,
    onProductSelect,
    onSelectAll,
    showProductModal,
    onShowProductModal,
    onCloseProductModal,
    currentProduct,
    viewMode,
    onViewModeChange
}) => {
    const { Package, Plus, Edit, Trash2, Search, Grid3X3, List, Copy, Settings, Filter, Eye } = window.Icons;

    const [localSearchTerm, setLocalSearchTerm] = React.useState('');
    const [showFilters, setShowFilters] = React.useState(false);
    const [showBulkActions, setShowBulkActions] = React.useState(false);
    const [sortBy, setSortBy] = React.useState('name');
    const [sortOrder, setSortOrder] = React.useState('asc');

    // Debounced search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onFilterChange({ ...searchFilters, q: localSearchTerm });
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearchTerm]);

    const handleBulkAction = (action, updates) => {
        if (selectedProducts.length === 0) {
            alert('Please select products first');
            return;
        }

        switch (action) {
            case 'activate':
                onBulkUpdate(selectedProducts, { isActive: true });
                break;
            case 'deactivate':
                onBulkUpdate(selectedProducts, { isActive: false });
                break;
            case 'feature':
                onBulkUpdate(selectedProducts, { featured: true });
                break;
            case 'unfeature':
                onBulkUpdate(selectedProducts, { featured: false });
                break;
            case 'delete':
                if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
                    selectedProducts.forEach(id => onDeleteProduct(id));
                }
                break;
            default:
                if (updates) {
                    onBulkUpdate(selectedProducts, updates);
                }
        }
    };

    const getStockStatus = (stock) => {
        if (stock <= 0) return { status: 'out', color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300', text: 'Out of Stock' };
        if (stock <= 5) return { status: 'low', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300', text: 'Low Stock' };
        if (stock <= 10) return { status: 'medium', color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300', text: 'Medium Stock' };
        return { status: 'good', color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300', text: 'In Stock' };
    };

    const sortProducts = (productsToSort) => {
        return [...productsToSort].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Handle different data types
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    };

    const sortedProducts = sortProducts(products);

    const ProductCard = ({ product }) => {
        const stockInfo = getStockStatus(product.stock);
        const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

        // Priority order for images: 1) Primary image from images array, 2) main_image_url, 3) emoji fallback
        const getProductImage = () => {
            if (primaryImage?.url) {
                return { type: 'url', src: primaryImage.url, alt: primaryImage.alt || product.name };
            }
            if (product.main_image_url) {
                return { type: 'url', src: product.main_image_url, alt: product.name };
            }
            return { type: 'emoji', src: product.image || '📦', alt: product.name };
        };

        const productImage = getProductImage();

        return React.createElement('div', {
            key: 'product-card',
            className: `bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 overflow-hidden ${selectedProducts.includes(product.id) ? 'ring-2 ring-blue-500' : ''
                }`
        }, [
            // Product Image
//            React.createElement('div', { key: 'image', className: 'relative h-48 bg-gray-50 dark:bg-gray-800 items-center justify-center' }, [
            React.createElement('div', { key: 'image', className: 'relative h-48 flex bg-white dark:bg-gray-800 items-center justify-center' }, [
                    // Show actual image if available centered
                productImage.type === 'url' ? (
                    React.createElement('img', {
                        key: 'product-img',
                        src: productImage.src,
                        alt: productImage.alt,
                        className: 'h-full items-center justify-center object-cover',
                        onError: (e) => {
                            // If image fails to load, show emoji fallback
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }
                    })
                ) : null,

                // Emoji fallback (only shown if no URL image or if URL image fails)
                React.createElement('div', {
                    key: 'fallback',
                    className: 'w-full h-full flex items-center justify-center text-6xl',
                    style: { display: productImage.type === 'url' ? 'none' : 'flex' }
                }, productImage.src),

                // Stock badge
                React.createElement('div', {
                    key: 'stock-badge',
                    className: `absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color}`
                }, stockInfo.text),

                // Featured badge
                product.featured && React.createElement('div', {
                    key: 'featured-badge',
                    className: 'absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                }, '⭐ Featured'),

                // Selection checkbox
                React.createElement('div', { key: 'checkbox', className: 'absolute bottom-2 left-2' }, [
                    React.createElement('input', {
                        key: 'checkbox-input',
                        type: 'checkbox',
                        checked: selectedProducts.includes(product.id),
                        onChange: (e) => onProductSelect(product.id, e.target.checked),
                        className: 'w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
                    })
                ]),

                // Active/Inactive indicator
                !product.is_active && React.createElement('div', {
                    key: 'inactive-overlay',
                    className: 'absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center'
                }, [
                    React.createElement('span', {
                        key: 'inactive-span',
                        className: 'text-white font-medium px-3 py-1 bg-gray-800 rounded'
                    }, 'Inactive')
                ])
            ]),

            // Product Info (rest remains the same)
            React.createElement('div', { key: 'info', className: 'p-4' }, [
                React.createElement('div', { key: 'header', className: 'flex justify-between items-start mb-2' }, [
                    React.createElement('div', { key: 'title-section', className: 'flex-1 pr-2' }, [
                        React.createElement('h3', { key: 'title-h3', className: 'font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 mb-1' }, product.name),
                        React.createElement('p', { key: 'sku-p', className: 'text-sm text-gray-600 dark:text-gray-300 font-mono' }, product.sku),
                        product.brand && React.createElement('p', { key: 'brand-p', className: 'text-sm text-blue-600 dark:text-blue-400 font-medium' },
                            `${product.brand}${product.collection ? ` • ${product.collection}` : ''}`
                        )
                    ]),
                    React.createElement('div', { key: 'quick-actions', className: 'flex flex-col gap-1' }, [
                        React.createElement('button', {
                            key: 'edit-btn',
                            onClick: () => onEditProduct(product),
                            className: 'p-1 text-gray-400 hover:text-blue-600 transition-colors rounded',
                            title: 'Edit Product'
                        }, React.createElement(Edit, { size: 16 })),
                        React.createElement('button', {
                            key: 'duplicate-btn',
                            onClick: () => onDuplicateProduct(product.id),
                            className: 'p-1 text-gray-400 hover:text-green-600 transition-colors rounded',
                            title: 'Duplicate Product'
                        }, React.createElement(Copy, { size: 16 })),
                        React.createElement('button', {
                            key: 'delete-btn',
                            onClick: () => onDeleteProduct(product.id),
                            className: 'p-1 text-gray-400 hover:text-red-600 transition-colors rounded',
                            title: 'Delete Product'
                        }, React.createElement(Trash2, { size: 16 }))
                    ])
                ]),

                React.createElement('div', { key: 'details', className: 'space-y-3' }, [
                    React.createElement('div', { key: 'price-section', className: 'flex justify-between items-center' }, [
                        React.createElement('span', { key: 'price-span', className: 'text-2xl font-bold text-green-600 dark:text-green-400' },
                            `$${parseFloat(product.price).toFixed(2)}`
                        ),
                        React.createElement('div', { key: 'stock-section', className: 'text-right' }, [
                            React.createElement('div', { key: 'stock-div', className: 'text-sm font-medium text-gray-900 dark:text-gray-200' },
                                `Stock: ${product.stock}`
                            ),
                            React.createElement('div', { key: 'category-div', className: 'text-xs text-gray-500 dark:text-gray-400' },
                                product.category
                            )
                        ])
                    ]),

                    product.description && React.createElement('p', {
                        key: 'description-p',
                        className: 'text-sm text-gray-600 dark:text-gray-300 line-clamp-2'
                    }, product.description),

                    // Product attributes
                    React.createElement('div', { key: 'attributes-div', className: 'flex flex-wrap gap-1' }, [
                        product.material && React.createElement('span', {
                            key: 'material',
                            className: 'px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs rounded'
                        }, product.material),
                        product.color && React.createElement('span', {
                            key: 'color',
                            className: 'px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs rounded'
                        }, product.color),
                    ]),

                    // Features preview
                    product.features && product.features.length > 0 && React.createElement('div', {
                        key: 'features-div',
                        className: 'text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1'
                    }, [
                        React.createElement('span', { key: 'features-icon' }, '✨'),
                        React.createElement('span', { key: 'features-count' }, `${product.features.length} features`)
                    ])
                ])
            ])
        ]);
    };
    const ProductRow = ({ product }) => {
        const stockInfo = getStockStatus(product.stock);
        const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

        // Priority order for images: 1) Primary image from images array, 2) main_image_url, 3) emoji fallback
        const getProductImage = () => {
            if (primaryImage?.url) {
                return { type: 'url', src: primaryImage.url, alt: primaryImage.alt || product.name };
            }
            if (product.main_image_url) {
                return { type: 'url', src: product.main_image_url, alt: product.name };
            }
            return { type: 'emoji', src: product.image || '📦', alt: product.name };
        };

        const productImage = getProductImage();

        return React.createElement('tr', {
            key: 'product-row',
            className: `hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 transition-colors ${selectedProducts.includes(product.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                } ${!product.is_active ? 'opacity-60' : ''}`
        }, [
            React.createElement('td', { key: 'select', className: 'p-4' }, [
                React.createElement('input', {
                    key: 'checkbox-input',
                    type: 'checkbox',
                    checked: selectedProducts.includes(product.id),
                    onChange: (e) => onProductSelect(product.id, e.target.checked),
                    className: 'w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
                })
            ]),
            React.createElement('td', { key: 'product', className: 'p-4' }, [
                React.createElement('div', { key: 'product-div', className: 'flex items-center gap-3' }, [
                    React.createElement('div', { key: 'image-div', className: 'w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0' }, [
                        // Show actual image if available
                        productImage.type === 'url' ? (
                            React.createElement('img', {
                                key: 'product-img',
                                src: productImage.src,
                                alt: productImage.alt,
                                className: 'w-full h-full object-cover',
                                onError: (e) => {
                                    // If image fails to load, show emoji fallback
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }
                            })
                        ) : null,

                        // Emoji fallback
                        React.createElement('span', {
                            key: 'fallback',
                            className: 'text-xl',
                            style: { display: productImage.type === 'url' ? 'none' : 'block' }
                        }, productImage.src)
                    ]),
                    React.createElement('div', { key: 'name-div', className: 'min-w-0 flex-1' }, [
                        React.createElement('div', { key: 'name-div', className: 'font-medium text-gray-900 dark:text-gray-200 truncate' }, product.name),
                        React.createElement('div', { key: 'sku-div', className: 'text-sm text-gray-600 dark:text-gray-300 font-mono' }, product.sku),
                        product.brand && React.createElement('div', { key: 'brand-div', className: 'text-sm text-blue-600 dark:text-blue-400' },
                            `${product.brand}${product.collection ? ` • ${product.collection}` : ''}`
                        )
                    ])
                ])
            ]),
            React.createElement('td', { key: 'category', className: 'p-4' }, [
                React.createElement('div', { key: 'category-div', className: 'text-sm text-gray-700 dark:text-gray-200' }, product.category),
                product.product_type && React.createElement('div', { key: 'product-type-div', className: 'text-xs text-gray-500 dark:text-gray-400' }, product.product_type)
            ]),
            React.createElement('td', { key: 'price', className: 'p-4 font-medium text-green-600 dark:text-green-400' },
                `$${parseFloat(product.price).toFixed(2)}`
            ),
            React.createElement('td', { key: 'attributes', className: 'p-4' }, [
                React.createElement('div', { key: 'attributes-div', className: 'flex flex-wrap gap-1' }, [
                    product.material && React.createElement('span', {
                        key: 'material',
                        className: 'px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs rounded'
                    }, product.material),
                    product.color && React.createElement('span', {
                        key: 'color',
                        className: 'px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs rounded'
                    }, product.color)
                ])
            ]),

            React.createElement('td', { key: 'stock', className: 'p-4' }, [
                React.createElement('div', { key: 'stock-div', className: 'flex items-center gap-2' }, [
                    React.createElement('span', { key: 'stock-span', className: `px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color}` },
                        product.stock
                    ),
                    React.createElement('span', { key: 'stock-text-span', className: 'text-xs text-gray-500 dark:text-gray-400' }, stockInfo.text)
                ])
            ]),

            React.createElement('td', { key: 'status', className: 'p-4' }, [
                React.createElement('div', { key: 'status-div', className: 'flex flex-wrap gap-1' }, [
                    React.createElement('span', {
                        key: 'status-span',
                        className: `px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                            }`
                    }, product.is_active ? 'Active' : 'Inactive'),
                    product.featured && React.createElement('span', {
                        key: 'featured',
                        className: 'px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                    }, '⭐ Featured')
                ])
            ]),
            React.createElement('td', { key: 'actions', className: 'p-4' }, [
                React.createElement('div', { key: 'actions-div', className: 'flex gap-1' }, [
                    React.createElement('button', {
                        key: 'edit-btn',
                        onClick: () => onEditProduct(product),
                        className: 'p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors',
                        title: 'Edit'
                    }, React.createElement(Edit, { size: 16 })),
                    React.createElement('button', {
                        key: 'duplicate-btn',
                        onClick: () => onDuplicateProduct(product.id),
                        className: 'p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors',
                        title: 'Duplicate'
                    }, React.createElement(Copy, { size: 16 })),
                    React.createElement('button', {
                        key: 'delete-btn',
                        onClick: () => onDeleteProduct(product.id),
                        className: 'p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors',
                        title: 'Delete'
                    }, React.createElement(Trash2, { size: 16 }))
                ])
            ])
        ]);
    };
    const EmptyState = () => React.createElement('div', {
        key: 'empty-state',
        className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center'
    }, [
        React.createElement(Package, {
            key: 'icon',
            className: 'mx-auto mb-4 text-gray-400',
            size: 64
        }),
        React.createElement('h3', {
            key: 'title',
            className: 'text-xl font-semibold text-gray-900 dark:text-white mb-2'
        }, 'No products found'),
        React.createElement('p', {
            key: 'description',
            className: 'text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto'
        }, Object.keys(searchFilters).length > 0
            ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
            : 'Get started by adding your first product to the inventory.'
        ),
        React.createElement('button', {
            key: 'action',
            onClick: onShowProductModal,
            className: 'inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        }, [
            React.createElement(Plus, { key: 'icon', size: 20 }),
            'Add Product'
        ])
    ]);

    return React.createElement('div', { key: 'inventory-view', className: 'space-y-4 lg:space-y-3' }, [
        // Header with controls
        React.createElement('div', { key: 'header', className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6' }, [
            React.createElement('div', { key: 'header-content', className: 'flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6' }, [
                React.createElement('div', { key: 'title-section' }, [
                    React.createElement('h2', { key: 'title-h2', className: 'text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3' }, [
                        React.createElement(Package, { key: 'icon', size: 28 }),
                        'Product Inventory'
                    ]),
                    React.createElement('p', { key: 'subtitle-p', className: 'text-gray-600 dark:text-gray-300 mt-1' }, [
                        `${products.length} products`,
                        products.filter(p => p.stock <= 5).length > 0 &&
                        ` • ${products.filter(p => p.stock <= 5).length} low stock`,
                        products.filter(p => !p.is_active).length > 0 &&
                        ` • ${products.filter(p => !p.is_active).length} inactive`
                    ])
                ]),

                React.createElement('div', { key: 'actions', className: 'flex flex-wrap gap-3' }, [
                    React.createElement('button', {
                        key: 'add-product-btn',
                        onClick: onShowProductModal,
                        className: 'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    }, [
                        React.createElement(Plus, { key: 'icon', size: 20 }),
                        'Add Product'
                    ]),

                    React.createElement('button', {
                        key: 'filters-btn',
                        onClick: () => setShowFilters(!showFilters),
                        className: `flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`
                    }, [
                        React.createElement(Filter, { key: 'icon', size: 20 }),
                        'Filters',
                        Object.keys(searchFilters).length > 0 && React.createElement('span', {
                            key: 'filter-count-span',
                            className: 'bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'
                        }, Object.keys(searchFilters).length)
                    ]),

                    selectedProducts.length > 0 && React.createElement('button', {
                        key: 'bulk-actions-btn',
                        onClick: () => setShowBulkActions(!showBulkActions),
                        className: 'flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
                    }, [
                        React.createElement(Settings, { key: 'icon', size: 20 }),
                        `Bulk Actions (${selectedProducts.length})`
                    ])
                ])
            ]),

            // Quick search and view controls
            React.createElement('div', { key: 'search-controls', className: 'flex flex-col sm:flex-row gap-3 lg:gap-4 items-center' }, [
                React.createElement('div', { key: 'search', className: 'relative flex-1' }, [
                    React.createElement(Search, {
                        key: 'search-icon',
                        className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
                        size: 20
                    }),
                    React.createElement('input', {
                        key: 'search-input',
                        type: 'text',
                        value: localSearchTerm,
                        onChange: (e) => setLocalSearchTerm(e.target.value),
                        placeholder: 'Search products by name, SKU, description...',
                        className: 'mobile-input w-full pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg'
                    })
                ]),

                React.createElement('div', { key: 'sort', className: 'flex items-center gap-2' }, [
                    React.createElement('select', {
                        key: 'sort-select',
                        value: sortBy,
                        onChange: (e) => setSortBy(e.target.value),
                        className: 'mobile-input px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg'
                    }, [
                        React.createElement('option', { key: 'name', value: 'name' }, 'Name'),
                        React.createElement('option', { key: 'price', value: 'price' }, 'Price'),
                        React.createElement('option', { key: 'stock', value: 'stock' }, 'Stock'),
                        React.createElement('option', { key: 'created', value: 'created_at' }, 'Date Added')
                    ]),
                    React.createElement('button', {
                        key: 'sort-order-btn',
                        onClick: () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'),
                        // className: 'touch-button p-2 border rounded-lg hover:bg-gray-50 transition-colors',
                        className: 'touch-button p-2 border rounded-lg hover:bg-gray-50 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600',
                        title: `Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`
                    }, sortOrder === 'asc' ? '↑' : '↓')
                ]),

                // View mode toggle
                React.createElement('div', { key: 'view-toggle', className: 'flex border rounded-lg overflow-hidden bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600' }, [
                    React.createElement('button', {
                        key: 'grid-view-btn',
                        onClick: () => onViewModeChange('grid'),
                        className: `touch-button p-2 transition-colors bg-white  dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`,
                        title: 'Grid View'
                    }, React.createElement(Grid3X3, { size: 20 })),
                    React.createElement('button', {
                        key: 'list-view-btn',
                        onClick: () => onViewModeChange('list'),
                        className: `touch-button p-2 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`,
                        title: 'List View'
                    }, React.createElement(List, { size: 20 }))
                ])
            ])
        ]),

        // Filters panel
        showFilters && React.createElement('div', { key: 'filters', className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6' }, [
            React.createElement('div', { key: 'filters-content', className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4' }, [
                // Brand filter
                React.createElement('div', { key: 'brand' }, [
                    React.createElement('label', { key: 'brand-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 'Brand'),
                    React.createElement('select', {
                        value: searchFilters.brand || '',
                        onChange: (e) => onFilterChange({ ...searchFilters, brand: e.target.value || undefined }),
                        className: 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    }, [
                        React.createElement('option', { key: 'all', value: '' }, 'All Brands'),
                        ...(filters.brands || []).map(brand =>
                            React.createElement('option', { key: brand, value: brand }, brand)
                        )
                    ])
                ]),

                // Collection filter
                React.createElement('div', { key: 'collection' }, [
                    React.createElement('label', { key: 'collection-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 'Collection'),
                    React.createElement('select', {
                        value: searchFilters.collection || '',
                        onChange: (e) => onFilterChange({ ...searchFilters, collection: e.target.value || undefined }),
                        className: 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    }, [
                        React.createElement('option', { key: 'all', value: '' }, 'All Collections'),
                        ...(filters.collections || []).map(collection =>
                            React.createElement('option', { key: collection, value: collection }, collection)
                        )
                    ])
                ]),

                // Product Type filter
                React.createElement('div', { key: 'type' }, [
                    React.createElement('label', { key: 'type-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 'Type'),
                    React.createElement('select', {
                        value: searchFilters.productType || '',
                        onChange: (e) => onFilterChange({ ...searchFilters, productType: e.target.value || undefined }),
                        className: 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    }, [
                        React.createElement('option', { key: 'all', value: '' }, 'All Types'),
                        ...(filters.productTypes || []).map(type =>
                            React.createElement('option', { key: type, value: type }, type)
                        )
                    ])
                ]),

                // Material filter
                React.createElement('div', { key: 'material' }, [
                    React.createElement('label', { key: 'material-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 'Material'),
                    React.createElement('select', {
                        value: searchFilters.material || '',
                        onChange: (e) => onFilterChange({ ...searchFilters, material: e.target.value || undefined }),
                        className: 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    }, [
                        React.createElement('option', { key: 'all', value: '' }, 'All Materials'),
                        ...(filters.materials || []).map(material =>
                            React.createElement('option', { key: material, value: material }, material)
                        )
                    ])
                ]),

                // Status filter
                React.createElement('div', { key: 'status' }, [
                    React.createElement('label', { key: 'status-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 'Status'),
                    React.createElement('select', {
                        value: (() => {
                            if (searchFilters.inStock === 'true') return 'in-stock';
                            if (searchFilters.featured === 'true') return 'featured';
                            return '';
                        })(),
                        onChange: (e) => {
                            const value = e.target.value;
                            const newFilters = { ...searchFilters };
                            delete newFilters.inStock;
                            delete newFilters.featured;

                            if (value === 'in-stock') newFilters.inStock = 'true';
                            else if (value === 'featured') newFilters.featured = 'true';

                            onFilterChange(newFilters);
                        },
                        className: 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    }, [
                        React.createElement('option', { key: 'all', value: '' }, 'All Products'),
                        React.createElement('option', { key: 'in-stock', value: 'in-stock' }, 'In Stock Only'),
                        React.createElement('option', { key: 'featured', value: 'featured' }, 'Featured Only')
                    ])
                ])
            ]),

            // Price range filters
            React.createElement('div', { key: 'price-filters', className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mt-4' }, [
                React.createElement('div', { key: 'min-price' }, [
                    React.createElement('label', { key: 'min-price-label', className: 'block text-sm font-medium mb-2' }, 'Min Price ($)'),
                    React.createElement('input', {
                        type: 'number',
                        step: '0.01',
                        min: '0',
                        value: searchFilters.minPrice || '',
                        onChange: (e) => onFilterChange({ ...searchFilters, minPrice: e.target.value || undefined }),
                        placeholder: '0.00',
                        className: 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    })
                ]),
                React.createElement('div', { key: 'max-price' }, [
                    React.createElement('label', { key: 'max-price-label', className: 'block text-sm font-medium mb-2' }, 'Max Price ($)'),
                    React.createElement('input', {
                        type: 'number',
                        step: '0.01',
                        min: '0',
                        value: searchFilters.maxPrice || '',
                        onChange: (e) => onFilterChange({ ...searchFilters, maxPrice: e.target.value || undefined }),
                        placeholder: '999.99',
                        className: 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    })
                ])
            ]),

            // Clear filters button
            Object.keys(searchFilters).length > 0 && React.createElement('div', {
                key: 'clear-filters-btn',
                className: 'mt-4 pt-4 border-t flex justify-end'
            }, [
                React.createElement('button', {
                    onClick: () => onFilterChange({}),
                    className: 'px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors'
                }, 'Clear All Filters')
            ])
        ]),

        // Bulk actions panel
        showBulkActions && selectedProducts.length > 0 && React.createElement('div', {
            key: 'bulk-actions',
            className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'
        }, [
            React.createElement('div', { key: 'bulk-actions-header', className: 'flex items-center justify-between mb-4' }, [
                React.createElement('h3', { key: 'bulk-actions-title', className: 'font-medium' }, `Bulk Actions (${selectedProducts.length} selected)`),
                React.createElement('button', {
                    onClick: () => onSelectAll(false),
                    className: 'text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }, 'Clear Selection')
            ]),
            React.createElement('div', { key: 'bulk-actions-buttons', className: 'flex flex-wrap gap-3' }, [
                React.createElement('button', {
                    key: 'activate-btn',
                    onClick: () => handleBulkAction('activate'),
                    className: 'px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors'
                }, '✅ Activate'),
                React.createElement('button', {
                    key: 'deactivate-btn',
                    onClick: () => handleBulkAction('deactivate'),
                    className: 'px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors'
                }, '⏸️ Deactivate'),
                React.createElement('button', {
                    key: 'feature-btn',
                    onClick: () => handleBulkAction('feature'),
                    className: 'px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors'
                }, '⭐ Mark Featured'),
                React.createElement('button', {
                    key: 'unfeature-btn',
                    onClick: () => handleBulkAction('unfeature'),
                    className: 'px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors'
                }, '⭐ Remove Featured'),
                React.createElement('button', {
                    key: 'delete-btn',
                    onClick: () => handleBulkAction('delete'),
                    className: 'px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors'
                }, '🗑️ Delete Selected')
            ])
        ]),

        // Products display
        React.createElement('div', { key: 'products', className: 'h-[calc(100vh-20rem)] overflow-hidden'}, [
            loading ? (
                React.createElement('div', { key: 'loading-div', className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center' }, [
                    React.createElement('div', { key: 'loading-spinner', className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4' }),
                    React.createElement('p', { key: 'loading-text', className: 'text-gray-600 dark:text-gray-300 text-lg' }, 'Loading products...'),
                    React.createElement('p', { key: 'loading-subtext', className: 'text-gray-500 dark:text-gray-400 text-sm mt-2' }, 'Please wait while we fetch your inventory')
                ])
            ) : sortedProducts.length === 0 ? (
                React.createElement(EmptyState, { key: 'empty-state' })
            ) : viewMode === 'grid' ? (
                // Grid view
                React.createElement('div', { key: 'grid-view', className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col' }, [
                    React.createElement('div', { key: 'grid-header', className: 'p-5 rounded-t-xl border-b dark:bg-gray-700 dark:border-gray-600 flex-shrink-0' }, [
                        React.createElement('div', { key: 'grid-header-content', className: 'flex items-center justify-between' }, [
                            React.createElement('div', { key: 'grid-header-select', className: 'flex items-center gap-4' }, [
                                React.createElement('label', { key: 'grid-header-select-label', className: 'flex items-center gap-2 cursor-pointer' }, [
                                    React.createElement('input', {
                                        key: 'grid-header-select-input',
                                        type: 'checkbox',
                                        checked: selectedProducts.length === sortedProducts.length && sortedProducts.length > 0,
                                        onChange: (e) => onSelectAll(e.target.checked),
                                        className: 'w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
                                    }),
                                    React.createElement('span', { key: 'grid-header-select-span', className: 'text-sm font-medium text-gray-900 dark:text-white' }, 'Select All')
                                ])
                            ]),
                            React.createElement('div', { key: 'grid-header-count', className: 'text-sm text-gray-600 dark:text-gray-300' },
                                `Showing ${sortedProducts.length} products`
                            )
                        ])
                    ]),
                    React.createElement('div', { key: 'grid-body', className: 'p-6 flex-1 overflow-y-auto' }, [
                        React.createElement('div', {
                            key: 'grid-body-content',
                            className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'
                        }, sortedProducts.map(product =>
                            React.createElement(ProductCard, { key: product.id, product })
                        ))
                    ])
                ])
            ) : (
                // List view
                React.createElement('div', { key: 'list-view', className: 'flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden' }, [
                    React.createElement('div', { key: 'list-view-header', className: 'p-4 border-b dark:bg-gray-700 dark:border-gray-600 flex-shrink-0' }, [
                        React.createElement('div', { key: 'list-header-content', className: 'flex items-center justify-between' }, [
                            React.createElement('div', { key: 'list-header-select', className: 'flex items-center gap-4' }, [
                                React.createElement('label', { key: 'list-header-select-label', className: 'flex items-center gap-2 cursor-pointer' }, [
                                    React.createElement('input', {
                                        key: 'list-header-select-input',
                                        type: 'checkbox',
                                        checked: selectedProducts.length === sortedProducts.length && sortedProducts.length > 0,
                                        onChange: (e) => onSelectAll(e.target.checked),
                                        className: 'w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
                                    }),
                                    React.createElement('span', { key: 'list-header-select-span', className: 'text-sm font-medium text-gray-900 dark:text-white' }, 'Select All')
                                ])
                            ]),
                            React.createElement('div', { key: 'list-header-count', className: 'text-sm text-gray-600 dark:text-gray-300' },
                                `Showing ${sortedProducts.length} products`
                            )
                        ])
                    ]),
                    React.createElement('div', { key: 'list-view-content', className: 'flex-1 overflow-auto' }, [
                        React.createElement('table', { key: 'list-view-table', className: 'w-full min-w-[800px]' }, [
                            React.createElement('thead', { key: 'thead', className: 'bg-white dark:bg-gray-700 border-b dark:border-gray-600 sticky top-0 z-10' }, [
                                React.createElement('tr', { key: 'header-row' }, [
                                    React.createElement('th', { key: 'select', className: 'p-4 text-left w-16' }, [
                                        React.createElement('input', {
                                            key: 'list-view-select-input',
                                            type: 'checkbox',
                                            checked: selectedProducts.length === sortedProducts.length && sortedProducts.length > 0,
                                            onChange: (e) => onSelectAll(e.target.checked),
                                            className: 'w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
                                        })
                                    ]),
                                    React.createElement('th', { key: 'product', className: 'p-4 text-left font-medium text-gray-900 dark:text-white' }, 'Product'),
                                    React.createElement('th', { key: 'category', className: 'p-4 text-left font-medium text-gray-900 dark:text-white' }, 'Category'),
                                    React.createElement('th', { key: 'price', className: 'p-4 text-left font-medium text-gray-900 dark:text-white' }, 'Price'),
                                    React.createElement('th', { key: 'attributes', className: 'p-4 text-left font-medium text-gray-900 dark:text-white' }, 'Attributes'),
                                    React.createElement('th', { key: 'stock', className: 'p-4 text-left font-medium text-gray-900 dark:text-white' }, 'Stock'),
                                    React.createElement('th', { key: 'status', className: 'p-4 text-left font-medium text-gray-900 dark:text-white' }, 'Status'),
                                    React.createElement('th', { key: 'actions', className: 'p-4 text-left font-medium text-gray-900 dark:text-white w-32' }, 'Actions')
                                ])
                            ]),
                            React.createElement('tbody', { key: 'tbody' },
                                sortedProducts.map(product => React.createElement(ProductRow, { key: product.id, product }))
                            )
                        ])
                    ]),
                    React.createElement('div', { key: 'list-view-footer', className: 'p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-center text-sm text-gray-600 dark:text-gray-300 flex-shrink-0' },
                        `Showing ${sortedProducts.length} of ${products.length} products`
                    )
                ])
            )
        ])
    ]);
};
