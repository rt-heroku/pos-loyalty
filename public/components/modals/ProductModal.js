if (!window.Modals) {
    window.Modals = {};
}

window.Modals.ProductModal = function ProductModal({
    show,
    onClose,
    product,
    onSave,
    loading,
    filters
}) {
    if (!show) return null;

    const { X, Plus, Trash2, Upload, Image } = window.Icons;

    const [formData, setFormData] = React.useState({
        name: '',
        sku: '',
        price: '',
        category: '',
        stock: '',
        productType: '',
        brand: '',
        collection: '',
        material: '',
        color: '',
        description: '',
        dimensions: '',
        weight: '',
        warrantyInfo: '',
        careInstructions: '',
        mainImageUrl: '',
        image: '📦',
        isActive: true,
        featured: false,
        images: [],
        features: []
    });

    const [activeTab, setActiveTab] = React.useState('basic');
    const [newFeature, setNewFeature] = React.useState({ name: '', value: '' });
    const [newImage, setNewImage] = React.useState({ url: '', alt: '', isPrimary: false });
    const [productTypes, setProductTypes] = React.useState([]);
    const [loadingProductTypes, setLoadingProductTypes] = React.useState(false);
    const [findingImage, setFindingImage] = React.useState(false);
    const [aiResults, setAiResults] = React.useState(null);
    const [aiLoading, setAiLoading] = React.useState(false);
    const [salesforceLoading, setSalesforceLoading] = React.useState(false);
    const [showSalesforceResultsModal, setShowSalesforceResultsModal] = React.useState(false);
    const [salesforceResults, setSalesforceResults] = React.useState(null);

    // Initialize form data when product changes
    React.useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                sku: product.sku || '',
                price: product.price?.toString() || '',
                category: product.category || '',
                stock: product.stock?.toString() || '',
                productType: product.product_type || '',
                brand: product.brand || '',
                collection: product.collection || '',
                material: product.material || '',
                gender: product.gender || 'Unisex',
                color: product.color || '',
                description: product.description || '',
                dimensions: product.dimensions || '',
                weight: product.weight?.toString() || '',
                warrantyInfo: product.warranty_info || '',
                careInstructions: product.care_instructions || '',
                mainImageUrl: product.main_image_url || '',
                image: product.image || '📦',
                isActive: product.is_active !== false,
                featured: product.featured || false,
                images: product.images || [],
                features: product.features || []
            });
        } else {
            // Reset form for new product
            setFormData({
                name: '',
                sku: '',
                price: '',
                category: '',
                stock: '',
                productType: '',
                brand: '',
                collection: '',
                material: '',
                color: '',
                description: '',
                dimensions: '',
                weight: '',
                warrantyInfo: '',
                careInstructions: '',
                mainImageUrl: '',
                image: '📦',
                isActive: true,
                featured: false,
                images: [],
                features: []
            });
        }
    }, [product]);

    // Load product types when modal opens
    React.useEffect(() => {
        if (show) {
            loadProductTypes();
        }
    }, [show]);

    const loadProductTypes = async () => {
        setLoadingProductTypes(true);
        try {
            const response = await fetch('/api/products/types');
            if (response.ok) {
                const types = await response.json();
                setProductTypes(types);
            } else {
                console.error('Failed to load product types');
            }
        } catch (error) {
            console.error('Error loading product types:', error);
        } finally {
            setLoadingProductTypes(false);
        }
    };

    const findImage = async (type = 'main') => {
        if (!formData.name && !formData.sku) {
            window.NotificationManager.warning('Image Search', 'Please enter a product name or SKU to find an image');
            return;
        }

        setFindingImage(true);
        try {
            const response = await fetch('/api/products/image/find', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productName: formData.name,
                    sku: formData.sku,
                    brand: formData.brand
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.imageUrl) {
                    if (type === 'main') {
                        handleInputChange('mainImageUrl', result.imageUrl);
                    } else {
                        setNewImage(prev => ({ ...prev, url: result.imageUrl }));
                    }
                    window.NotificationManager.success('Image Found', 'Image found and added successfully!');
                } else {
                    window.NotificationManager.info('Image Search', 'No image found for this product');
                }
            } else {
                const error = await response.json();
                window.NotificationManager.error('Image Search Failed', `Failed to find image: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error finding image:', error);
            window.NotificationManager.error('Image Search Failed', `Failed to find image: ${error.message}`);
        } finally {
            setFindingImage(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAIImprove = async () => {
        if (!product?.id) {
            window.NotificationManager.warning('AI Improvement', 'Product ID is required for AI improvement');
            return;
        }

        setAiLoading(true);
        setAiResults(null);

        try {
            const response = await fetch(`/api/products/improve/${product.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const results = await response.json();
                setAiResults(results);

                // Reload the product data to show the improvements
                // The MuleSoft API has already updated the database
                // We just need to refresh the form data
                if (product) {
                    // Fetch the updated product data from the server
                    try {
                        const productResponse = await fetch(`/api/products/${product.id}/detailed`);
                        if (productResponse.ok) {
                            const updatedProduct = await productResponse.json();
                            // Update the form data with the new product information
                            setFormData(prevFormData => ({
                                ...prevFormData,
                                name: updatedProduct.name || prevFormData.name,
                                sku: updatedProduct.sku || prevFormData.sku,
                                price: updatedProduct.price || prevFormData.price,
                                category: updatedProduct.category || prevFormData.category,
                                stock: updatedProduct.stock || prevFormData.stock,
                                productType: updatedProduct.product_type || prevFormData.productType,
                                brand: updatedProduct.brand || prevFormData.brand,
                                collection: updatedProduct.collection || prevFormData.collection,
                                material: updatedProduct.material || prevFormData.material,
                                color: updatedProduct.color || prevFormData.color,
                                description: updatedProduct.description || prevFormData.description,
                                dimensions: updatedProduct.dimensions || prevFormData.dimensions,
                                weight: updatedProduct.weight || prevFormData.weight,
                                warrantyInfo: updatedProduct.warranty_info || prevFormData.warrantyInfo,
                                careInstructions: updatedProduct.care_instructions || prevFormData.careInstructions,
                                mainImageUrl: updatedProduct.main_image_url || prevFormData.mainImageUrl,
                                image: updatedProduct.image || prevFormData.image,
                                isActive: updatedProduct.is_active !== undefined ? updatedProduct.is_active : prevFormData.isActive,
                                featured: updatedProduct.featured !== undefined ? updatedProduct.featured : prevFormData.featured,
                                images: updatedProduct.images || prevFormData.images,
                                features: updatedProduct.features || prevFormData.features
                            }));
                        }
                    } catch (error) {
                        console.error('Error fetching updated product:', error);
                    }
                }

                // Close the modal after successful AI improvement
                setTimeout(() => {
                    onClose();
                }, 2000); // Wait 2 seconds to show the results
            } else {
                const error = await response.json();
                window.NotificationManager.error('AI Improvement Failed', `AI improvement failed: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error improving product:', error);
            window.NotificationManager.error('AI Improvement Failed', `AI improvement failed: ${error.message}`);
        } finally {
            setAiLoading(false);
        }
    };

    const handleSendToSalesforce = async () => {
        if (!product?.id) {
            window.NotificationManager.warning('Salesforce Sync', 'Product ID is required to send to Salesforce');
            return;
        }

        setSalesforceLoading(true);
        setSalesforceResults(null);

        try {
            const response = await fetch(`/api/loyalty/products/send?product=${product.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setSalesforceResults(result);
                setShowSalesforceResultsModal(true);
                
                // Close the modal after showing the results
                setTimeout(() => {
                    onClose();
                }, 3000); // Wait 3 seconds to allow user to see the results
            } else {
                const error = await response.json();
                window.NotificationManager.error('Salesforce Sync Failed', `Failed to send product to Salesforce: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error sending product to Salesforce:', error);
            window.NotificationManager.error('Salesforce Sync Failed', `Failed to send product to Salesforce: ${error.message}`);
        } finally {
            setSalesforceLoading(false);
        }
    };

    const addFeature = () => {
        if (newFeature.name.trim() && newFeature.value.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, { ...newFeature }]
            }));
            setNewFeature({ name: '', value: '' });
        }
    };

    const removeFeature = (index) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const addImage = () => {
        if (newImage.url.trim()) {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, { ...newImage, sortOrder: prev.images.length }]
            }));
            setNewImage({ url: '', alt: '', isPrimary: false });
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const setPrimaryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => ({
                ...img,
                isPrimary: i === index
            }))
        }));
    };

    // Working save function (based on the fix that worked)
    const handleSave = () => {
        console.log('=== ENHANCED SAVE TRIGGERED ===');
        console.log('Form data:', formData);

        // Validation
        if (!formData.name.trim()) {
            window.NotificationManager.warning('Validation Error', 'Product name is required');
            return;
        }
        if (!formData.price || parseFloat(formData.price) < 0) {
            window.NotificationManager.warning('Validation Error', 'Valid price is required');
            return;
        }
        if (!formData.category.trim()) {
            window.NotificationManager.warning('Validation Error', 'Category is required');
            return;
        }
        if (!formData.stock || parseInt(formData.stock) < 0) {
            window.NotificationManager.warning('Validation Error', 'Valid stock quantity is required');
            return;
        }

        console.log('Enhanced validation passed, calling onSave...');

        // Prepare data for submission with all enhanced fields
        const submitData = {
            ...formData,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            weight: formData.weight ? parseFloat(formData.weight) : null
        };

        console.log('Enhanced save calling onSave with:', submitData);
        onSave(submitData);
    };

    const TabButton = ({ tab, label, active }) => (
        React.createElement('button', {
            type: 'button',
            onClick: () => setActiveTab(tab),
            className: `px-4 py-2 font-medium text-sm rounded-lg transition-colors ${active
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`
        }, label)
    );

    return React.createElement('div', {
        key: 'modal-container',
        className: 'fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4'
    }, [
        React.createElement('div', {
            key: 'modal',
            className: 'bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700'
        }, [
            // Header
            React.createElement('div', { key: 'header', className: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800' }, [
                React.createElement('h2', { key: 'header-title', className: 'text-xl font-bold text-gray-900 dark:text-white' },
                    product ? 'Edit Product' : 'Add New Product'
                ),
                React.createElement('button', {
                    onClick: onClose,
                    key: 'close-button',
                    className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors'
                }, React.createElement(X, { size: 24 }))
            ]),

            // Tab Navigation
            React.createElement('div', { key: 'tabs', className: 'px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800' }, [
                React.createElement('div', { key: 'tabs-container', className: 'flex gap-2' }, [
                    React.createElement(TabButton, {
                        key: 'basic',
                        tab: 'basic',
                        label: 'Basic Info',
                        active: activeTab === 'basic'
                    }),
                    React.createElement(TabButton, {
                        key: 'details',
                        tab: 'details',
                        label: 'Details',
                        active: activeTab === 'details'
                    }),
                    React.createElement(TabButton, {
                        key: 'images',
                        tab: 'images',
                        label: 'Images',
                        active: activeTab === 'images'
                    }),
                    React.createElement(TabButton, {
                        key: 'features',
                        tab: 'features',
                        label: 'Features',
                        active: activeTab === 'features'
                    }),
                    // Advanced Tab - Only for admins
                    window.currentUser && window.currentUser.role === 'admin' && React.createElement(TabButton, {
                        key: 'ai',
                        tab: 'ai',
                        label: 'Advanced',
                        active: activeTab === 'ai'
                    })
                ])
            ]),

            // Form Content
            React.createElement('div', {
                key: 'content',
                className: 'flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900'
            }, [
                // Basic Info Tab
                activeTab === 'basic' && React.createElement('div', { key: 'basic-info', className: 'space-y-6' }, [
                    React.createElement('div', { key: 'basic-info-container', className: 'grid grid-cols-1 md:grid-cols-2 gap-6' }, [
                        // Product Name
                        React.createElement('div', { key: 'product-name' }, [
                            React.createElement('label', { key: 'product-name-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Product Name *'),
                            React.createElement('input', {
                                key: 'product-name-input',
                                type: 'text',
                                value: formData.name,
                                onChange: (e) => handleInputChange('name', e.target.value),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: 'Enter product name',
                                required: true
                            })
                        ]),

                        // SKU
                        React.createElement('div', { key: 'product-sku' }, [
                            React.createElement('label', { key: 'product-sku-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'SKU'),
                            React.createElement('input', {
                                key: 'product-sku-input',
                                type: 'text',
                                value: formData.sku,
                                onChange: (e) => handleInputChange('sku', e.target.value.toUpperCase()),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: 'Auto-generated if empty'
                            })
                        ]),

                        // Price
                        React.createElement('div', { key: 'product-price' }, [
                            React.createElement('label', { key: 'product-price-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Price *'),
                            React.createElement('input', {
                                key: 'product-price-input',
                                type: 'number',
                                step: '0.01',
                                min: '0',
                                value: formData.price,
                                onChange: (e) => handleInputChange('price', e.target.value),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: '0.00',
                                required: true
                            })
                        ]),

                        // Stock
                        React.createElement('div', { key: 'product-stock' }, [
                            React.createElement('label', { key: 'product-stock-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Stock Quantity *'),
                            React.createElement('input', {
                                key: 'product-stock-input',
                                type: 'number',
                                min: '0',
                                value: formData.stock,
                                onChange: (e) => handleInputChange('stock', e.target.value),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: '0',
                                required: true
                            })
                        ]),

                        // Category
                        React.createElement('div', { key: 'product-category' }, [
                            React.createElement('label', { key: 'product-category-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Category *'),
                            React.createElement('input', {
                                key: 'product-category-input',
                                type: 'text',
                                value: formData.category,
                                onChange: (e) => handleInputChange('category', e.target.value),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: 'e.g., Luggage, Backpacks, Accessories',
                                required: true
                            })
                        ]),

                        // Product Type
                        React.createElement('div', { key: 'product-type' }, [
                            React.createElement('label', { key: 'product-type-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Product Type'),
                            React.createElement('select', {
                                value: formData.productType,
                                onChange: (e) => handleInputChange('productType', e.target.value),
                                disabled: loadingProductTypes,
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50'
                            }, [
                                React.createElement('option', { key: 'empty', value: '' }, 
                                    loadingProductTypes ? 'Loading types...' : 'Select Type'
                                ),
                                ...productTypes.map(type => 
                                    React.createElement('option', { key: type, value: type }, type)
                                )
                            ])
                        ]),

                        // Brand
                        React.createElement('div', { key: 'brand' }, [
                            React.createElement('label', { key: 'brand-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Brand'),
                            React.createElement('input', {
                                key: 'brand-input',
                                type: 'text',
                                value: formData.brand,
                                onChange: (e) => handleInputChange('brand', e.target.value),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: 'e.g., TUMI, Samsonite'
                            })
                        ]),

                        // Collection
                        React.createElement('div', { key: 'collection' }, [
                            React.createElement('label', { key: 'collection-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Collection'),
                            React.createElement('input', {
                                key: 'collection-input',
                                type: 'text',
                                value: formData.collection,
                                onChange: (e) => handleInputChange('collection', e.target.value),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: 'e.g., 19 Degree, Alpha, Voyageur'
                            })
                        ])
                    ]),

                    // Description
                    React.createElement('div', { key: 'description' }, [
                        React.createElement('label', { key: 'description-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Description'),
                        React.createElement('textarea', {
                            key: 'description-textarea',
                            value: formData.description,
                            onChange: (e) => handleInputChange('description', e.target.value),
                            rows: 4,
                            className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                            placeholder: 'Detailed product description...'
                        })
                    ]),

                    // Status toggles
                    React.createElement('div', { key: 'status', className: 'flex gap-6' }, [
                        React.createElement('label', { key: 'active-label', className: 'flex items-center gap-2' }, [
                            React.createElement('input', {
                                key: 'active-checkbox',
                                type: 'checkbox',
                                checked: formData.isActive,
                                onChange: (e) => handleInputChange('isActive', e.target.checked),
                                className: 'w-4 h-4 text-blue-600 rounded'
                            }),
                            React.createElement('span', { className: 'text-sm font-medium text-gray-700 dark:text-gray-200' }, 'Active Product')
                        ]),
                        React.createElement('label', { key: 'featured-label', className: 'flex items-center gap-2' }, [
                            React.createElement('input', {
                                key: 'featured-checkbox',
                                type: 'checkbox',
                                checked: formData.featured,
                                onChange: (e) => handleInputChange('featured', e.target.checked),
                                className: 'w-4 h-4 text-blue-600 rounded'
                            }),
                            React.createElement('span', { className: 'text-sm font-medium text-gray-700 dark:text-gray-200' }, 'Featured Product')
                        ])
                    ])
                ]),

                // Details Tab
                activeTab === 'details' && React.createElement('div', { key: 'details-tab', className: 'space-y-6' }, [
                    React.createElement('div', { key: 'details-container', className: 'grid grid-cols-1 md:grid-cols-2 gap-6' }, [
                        // Material
                        React.createElement('div', { key: 'product-material' }, [
                            React.createElement('label', { key: 'material-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Material'),
                            React.createElement('input', {
                                key: 'material-input',
                                type: 'text',
                                value: formData.material,
                                onChange: (e) => handleInputChange('material', e.target.value),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: 'e.g., Ballistic Nylon, Polycarbonate, Leather'
                            })
                        ]),

                        // Color
                        React.createElement('div', { key: 'product-color' }, [
                            React.createElement('label', { key: 'color-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Color'),
                            React.createElement('input', {
                                key: 'color-input',
                                type: 'text',
                                value: formData.color,
                                onChange: (e) => handleInputChange('color', e.target.value),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: 'e.g., Black, Navy, Silver'
                            })
                        ]),



                        // Dimensions
                        React.createElement('div', { key: 'dimensions' }, [
                            React.createElement('label', { key: 'dimensions-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Dimensions'),
                            React.createElement('input', {
                                key: 'dimensions-input',
                                type: 'text',
                                value: formData.dimensions,
                                onChange: (e) => handleInputChange('dimensions', e.target.value),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: 'e.g., 22" x 14" x 9"'
                            })
                        ]),

                        // Weight
                        React.createElement('div', { key: 'weight' }, [
                            React.createElement('label', { key: 'weight-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Weight (lbs)'),
                            React.createElement('input', {
                                key: 'weight-input',
                                type: 'number',
                                step: '0.1',
                                min: '0',
                                value: formData.weight,
                                onChange: (e) => handleInputChange('weight', e.target.value),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: '0.0'
                            })
                        ]),

                        // Emoji Icon
                        React.createElement('div', { key: 'emoji' }, [
                            React.createElement('label', { key: 'emoji-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Emoji Icon'),
                            React.createElement('input', {
                                key: 'emoji-input',
                                type: 'text',
                                value: formData.image,
                                onChange: (e) => handleInputChange('image', e.target.value),
                                className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: '📦'
                            })
                        ])
                    ]),

                    // Warranty Info
                    React.createElement('div', { key: 'warranty' }, [
                        React.createElement('label', { key: 'warranty-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Warranty Information'),
                        React.createElement('textarea', {
                            key: 'warranty-textarea',
                            value: formData.warrantyInfo,
                            onChange: (e) => handleInputChange('warrantyInfo', e.target.value),
                            rows: 3,
                            className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                            placeholder: 'e.g., 5-year warranty against manufacturing defects'
                        })
                    ]),

                    // Care Instructions
                    React.createElement('div', { key: 'care' }, [
                        React.createElement('label', { key: 'care-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Care Instructions'),
                        React.createElement('textarea', {
                            key: 'care-textarea',
                            value: formData.careInstructions,
                            onChange: (e) => handleInputChange('careInstructions', e.target.value),
                            rows: 3,
                            className: 'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                            placeholder: 'Care and maintenance instructions...'
                        })
                    ])
                ]),

                // Images Tab
                activeTab === 'images' && React.createElement('div', { className: 'space-y-6' }, [
                    // Main Image URL
                    React.createElement('div', { key: 'main-image' }, [
                        React.createElement('label', { key: 'main-image-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2' }, 'Main Image URL'),
                        React.createElement('div', { key: 'main-image-container', className: 'flex gap-2' }, [
                            React.createElement('input', {
                                key: 'main-image-input',
                                type: 'url',
                                value: formData.mainImageUrl,
                                onChange: (e) => handleInputChange('mainImageUrl', e.target.value),
                                className: 'flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: 'https://example.com/product-image.jpg'
                            }),
                            React.createElement('button', {
                                key: 'main-image-find-btn',
                                type: 'button',
                                onClick: () => findImage('main'),
                                disabled: findingImage,
                                className: 'px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2',
                                title: 'Find image using MuleSoft API'
                            }, [
                                findingImage ? React.createElement('div', { 
                                    key: 'loading-spinner',
                                    className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white' 
                                }) : React.createElement(Image, { key: 'find-icon', size: 16 }),
                                React.createElement('span', { key: 'btn-text' }, findingImage ? 'Finding...' : 'Find')
                            ])
                        ])
                    ]),

                    // Additional Images
                    React.createElement('div', { key: 'additional-images' }, [
                        React.createElement('label', { key: 'additional-images-label',  className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-4' }, 'Additional Images'),

                        // Add new image form
                        React.createElement('div', { key: 'additional-images-form', className: 'bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4' }, [
                            React.createElement('div', { key: 'additional-images-form-container', className: 'grid grid-cols-1 md:grid-cols-4 gap-4 mb-3' }, [
                                React.createElement('input', {
                                    key: 'additional-images-form-input',
                                    type: 'url',
                                    value: newImage.url,
                                    onChange: (e) => setNewImage(prev => ({ ...prev, url: e.target.value })),
                                    className: 'p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                    placeholder: 'Image URL'
                                }),
                                React.createElement('input', {
                                    key: 'additional-images-form-input-alt',
                                    type: 'text',
                                    value: newImage.alt,
                                    onChange: (e) => setNewImage(prev => ({ ...prev, alt: e.target.value })),
                                    className: 'p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                    placeholder: 'Alt text'
                                }),
                                React.createElement('div', { key: 'additional-images-form-checkbox', className: 'flex items-center gap-2' }, [
                                    React.createElement('label', { key: 'additional-images-form-checkbox-label', className: 'flex items-center gap-2' }, [
                                        React.createElement('input', {
                                            key: 'additional-images-form-checkbox-input',
                                            type: 'checkbox',
                                            checked: newImage.isPrimary,
                                            onChange: (e) => setNewImage(prev => ({ ...prev, isPrimary: e.target.checked })),
                                            className: 'w-4 h-4 text-blue-600 rounded'
                                        }),
                                        React.createElement('span', { className: 'text-sm text-gray-700 dark:text-gray-200' }, 'Primary')
                                    ])
                                ]),
                                React.createElement('button', {
                                    key: 'additional-images-form-find-btn',
                                    type: 'button',
                                    onClick: () => findImage('additional'),
                                    disabled: findingImage,
                                    className: 'px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm',
                                    title: 'Find image using MuleSoft API'
                                }, [
                                    findingImage ? React.createElement('div', { 
                                        key: 'loading-spinner',
                                        className: 'animate-spin rounded-full h-3 w-3 border-b-2 border-white' 
                                    }) : React.createElement(Image, { key: 'find-icon', size: 14 }),
                                    React.createElement('span', { key: 'btn-text' }, findingImage ? 'Finding...' : 'Find')
                                ])
                            ]),
                            React.createElement('button', {
                                type: 'button',
                                onClick: addImage,
                                key: 'additional-images-form-button',
                                className: 'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                            }, [
                                React.createElement(Plus, { key: 'icon', size: 16 }),
                                'Add Image'
                            ])
                        ]),

                        // Images list
                        formData.images.length > 0 && React.createElement('div', { key: 'additional-images-list', className: 'space-y-3' },
                            formData.images.map((image, index) =>
                                React.createElement('div', {
                                    key: `additional-images-list-${index}`,
                                    className: 'flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800'
                                }, [
                                    React.createElement('div', { key: 'additional-images-list-preview', className: 'w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden' }, [
                                        image.url ? React.createElement('img', {
                                            key: `additional-images-list-preview-${index}`,
                                            src: image.url,
                                            alt: image.alt,
                                            className: 'w-full h-full object-cover'
                                        }) : React.createElement(Image, { size: 24, className: 'text-gray-400 dark:text-gray-600' })
                                    ]),
                                    React.createElement('div', { key: 'additional-images-list-info', className: 'flex-1' }, [
                                        React.createElement('div', { key: 'additional-images-list-info-alt', className: 'font-medium text-gray-900 dark:text-white' }, image.alt || 'No alt text'),
                                        React.createElement('div', { key: 'additional-images-list-info-url', className: 'text-sm text-gray-600 dark:text-gray-300 truncate' }, image.url),
                                        image.isPrimary && React.createElement('span', {
                                            key: 'additional-images-list-info-primary',
                                            className: 'inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded mt-1'
                                        }, 'Primary Image')
                                    ]),
                                    React.createElement('div', { key: 'additional-images-list-actions', className: 'flex gap-2' }, [
                                        !image.isPrimary && React.createElement('button', {
                                            key: 'additional-images-list-actions-set-primary',
                                            type: 'button',
                                            onClick: () => setPrimaryImage(index),
                                            className: 'px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors'
                                        }, 'Set Primary'),
                                        React.createElement('button', {
                                            type: 'button',
                                            onClick: () => removeImage(index),
                                            key: 'additional-images-list-actions-remove',
                                            className: 'p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors'
                                        }, React.createElement(Trash2, { size: 16 }))
                                    ])
                                ])
                            )
                        )
                    ])
                ]),

                // Features Tab
                activeTab === 'features' && React.createElement('div', { key: 'features-tab', className: 'space-y-6' }, [
                    React.createElement('div', { key: 'add-feature', className: 'bg-gray-50 dark:bg-gray-800 p-4 rounded-lg' }, [
                        React.createElement('label', { key: 'add-feature-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3' }, 'Add Feature'),
                        React.createElement('div', { key: 'add-feature-form', className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-3' }, [
                            React.createElement('input', {
                                key: 'add-feature-form-name',
                                type: 'text',
                                value: newFeature.name,
                                onChange: (e) => setNewFeature(prev => ({ ...prev, name: e.target.value })),
                                className: 'p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: 'Feature name (e.g., Water Resistant, USB Port)'
                            }),
                            React.createElement('input', {
                                key: 'add-feature-form-value',
                                type: 'text',
                                value: newFeature.value,
                                onChange: (e) => setNewFeature(prev => ({ ...prev, value: e.target.value })),
                                className: 'p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                placeholder: 'Feature value (e.g., Yes, Integrated charging port)'
                            })
                        ]),
                        React.createElement('button', {
                            type: 'button',
                            onClick: addFeature,
                            key: 'add-feature-form-button',
                            className: 'flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
                        }, [
                            React.createElement(Plus, { key: 'icon', size: 16 }),
                            'Add Feature'
                        ])
                    ]),

                    // Features list
                    formData.features.length > 0 && React.createElement('div', { key: 'features-list' }, [
                        React.createElement('label', { key: 'features-list-label', className: 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3' }, 'Product Features'),
                        React.createElement('div', { key: 'features-list-container', className: 'space-y-2' },
                            formData.features.map((feature, index) =>
                                React.createElement('div', {
                                    key: index,
                                    className: 'flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800'
                                }, [
                                    React.createElement('div', { key: 'feature-info' }, [
                                        React.createElement('span', { key: 'feature-info-name', className: 'font-medium text-gray-900 dark:text-white' }, feature.name),
                                        React.createElement('span', { key: 'feature-info-value', className: 'text-gray-600 dark:text-gray-300 ml-2' }, `: ${feature.value}`)
                                    ]),
                                    React.createElement('button', {
                                        key: 'feature-remove',
                                        type: 'button',
                                        onClick: () => removeFeature(index),
                                        className: 'p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors'
                                    }, React.createElement(Trash2, { size: 16 }))
                                ])
                            )
                        )
                    ])
                ]),

                // Advanced Tab - Only for admins
                activeTab === 'ai' && React.createElement('div', { key: 'ai-tab', className: 'space-y-6' }, [
                    // AI Enhancement Section
                    React.createElement('div', { key: 'ai-header', className: 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6' }, [
                        React.createElement('div', { key: 'ai-header-content', className: 'text-center' }, [
                            React.createElement('div', { key: 'ai-icon', className: 'text-4xl mb-4' }, '🤖'),
                            React.createElement('h3', { key: 'ai-title', className: 'text-xl font-semibold text-gray-900 dark:text-white mb-2' }, 'AI Product Enhancement'),
                            React.createElement('p', { key: 'ai-description', className: 'text-gray-600 dark:text-gray-300 mb-6' },
                                'This action will generate missing fields, add relevant descriptions, features and details to this product and will replace some of the current contents.'
                            ),
                            React.createElement('button', {
                                key: 'ai-improve-button',
                                type: 'button',
                                onClick: handleAIImprove,
                                disabled: aiLoading || !product?.id,
                                className: `flex items-center gap-3 mx-auto px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    aiLoading || !product?.id
                                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:scale-105'
                                }`
                            }, [
                                React.createElement('span', { key: 'ai-button-icon' }, '✨'),
                                aiLoading ? 'Improving...' : 'Improve Product Info'
                            ])
                        ])
                    ]),

                    // Salesforce Integration Section
                    React.createElement('div', { key: 'salesforce-header', className: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6' }, [
                        React.createElement('div', { key: 'salesforce-header-content', className: 'text-center' }, [
                            React.createElement('div', { key: 'salesforce-icon', className: 'text-4xl mb-4' }, '☁️'),
                            React.createElement('h3', { key: 'salesforce-title', className: 'text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2' }, 'Salesforce Integration'),
                            React.createElement('p', { key: 'salesforce-description', className: 'text-blue-700 dark:text-blue-300 mb-6' },
                                'Send this product to Salesforce for synchronization with your loyalty program and external systems.'
                            ),
                            React.createElement('button', {
                                key: 'salesforce-send-button',
                                type: 'button',
                                onClick: handleSendToSalesforce,
                                disabled: salesforceLoading || !product?.id,
                                className: `flex items-center gap-3 mx-auto px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    salesforceLoading || !product?.id
                                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:scale-105'
                                }`
                            }, [
                                React.createElement('span', { key: 'salesforce-button-icon' }, '📤'),
                                salesforceLoading ? 'Sending...' : 'Send Product to Salesforce'
                            ])
                        ])
                    ]),

                    // AI Results Section (will be populated after API call)
                    aiResults && React.createElement('div', { key: 'ai-results', className: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4' }, [
                        React.createElement('h4', { key: 'ai-results-title', className: 'font-medium text-green-900 dark:text-green-100 mb-3' }, 'Improvement Results'),
                        React.createElement('div', { key: 'ai-results-content', className: 'space-y-2' },
                            aiResults.map((result, index) =>
                                React.createElement('div', {
                                    key: `result-${index}`,
                                    className: 'flex items-center gap-2 text-sm text-green-800 dark:text-green-200'
                                }, [
                                    React.createElement('span', { key: `result-icon-${index}` }, '✅'),
                                    React.createElement('span', { key: `result-text-${index}` }, result.message)
                                ])
                            )
                        )
                    ])
                ])
            ]),

            // Footer - Using the working button structure
            React.createElement('div', { key: 'footer', className: 'px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-3 justify-end' }, [
                React.createElement('button', {
                    key: 'cancel-button',
                    type: 'button',
                    onClick: () => {
                        console.log('Cancel button clicked');
                        onClose();
                    },
                    disabled: loading,
                    className: 'px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 bg-white dark:bg-gray-800'
                }, 'Cancel'),
                React.createElement('button', {
                    key: 'submit-button',
                    type: 'button',
                    onClick: () => {
                        console.log('Enhanced submit button clicked - calling handleSave');
                        handleSave(); // This is the working save function with all enhanced features
                    },
                    disabled: loading,
                    className: 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2'
                }, [
                    loading && React.createElement('div', {
                        key: 'spinner',
                        className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white'
                    }),
                    loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')
                ])
            ]),

            // Salesforce Results Modal
            showSalesforceResultsModal && salesforceResults && React.createElement('div', {
                key: 'salesforce-results-modal',
                className: 'fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4'
            }, [
                React.createElement('div', {
                    key: 'modal-content',
                    className: 'bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700'
                }, [
                    // Modal Header
                    React.createElement('div', {
                        key: 'modal-header',
                        className: 'flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    }, [
                        React.createElement('div', {
                            key: 'header-content',
                            className: 'flex items-center gap-3'
                        }, [
                            React.createElement('div', {
                                key: 'icon',
                                className: 'w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center'
                            }, [
                                React.createElement('span', { key: 'icon-text', className: 'text-blue-600 dark:text-blue-400 text-lg' }, '☁️')
                            ]),
                            React.createElement('h2', {
                                key: 'title',
                                className: 'text-xl font-bold text-gray-900 dark:text-white'
                            }, 'Salesforce Sync Results')
                        ]),
                        React.createElement('button', {
                            key: 'close-btn',
                            onClick: () => setShowSalesforceResultsModal(false),
                            className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors'
                        }, [
                            React.createElement('span', { key: 'close-icon', className: 'text-2xl' }, '×')
                        ])
                    ]),

                    // Modal Body
                    React.createElement('div', {
                        key: 'modal-body',
                        className: 'p-6 space-y-6 max-h-[60vh] overflow-y-auto bg-white dark:bg-gray-900'
                    }, [
                        // Summary
                        React.createElement('div', {
                            key: 'summary-section',
                            className: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'
                        }, [
                            React.createElement('h3', {
                                key: 'summary-title',
                                className: 'font-semibold text-blue-900 dark:text-blue-100 mb-2'
                            }, 'Summary'),
                            React.createElement('p', {
                                key: 'summary-text',
                                className: 'text-blue-800 dark:text-blue-200 whitespace-pre-line'
                            }, salesforceResults.summary || 'No summary available')
                        ]),

                        // Statistics
                        React.createElement('div', {
                            key: 'statistics-section',
                            className: 'grid grid-cols-2 md:grid-cols-4 gap-4'
                        }, [
                            React.createElement('div', {
                                key: 'total-processed',
                                className: 'bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center'
                            }, [
                                React.createElement('div', {
                                    key: 'total-number',
                                    className: 'text-2xl font-bold text-gray-900 dark:text-white'
                                }, salesforceResults.statistics?.totalProcessed || 0),
                                React.createElement('div', {
                                    key: 'total-label',
                                    className: 'text-sm text-gray-600 dark:text-gray-400'
                                }, 'Total Processed')
                            ]),
                            React.createElement('div', {
                                key: 'created',
                                className: 'bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center'
                            }, [
                                React.createElement('div', {
                                    key: 'created-number',
                                    className: 'text-2xl font-bold text-green-600 dark:text-green-400'
                                }, salesforceResults.statistics?.created || 0),
                                React.createElement('div', {
                                    key: 'created-label',
                                    className: 'text-sm text-gray-600 dark:text-gray-400'
                                }, 'Created')
                            ]),
                            React.createElement('div', {
                                key: 'updated',
                                className: 'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center'
                            }, [
                                React.createElement('div', {
                                    key: 'updated-number',
                                    className: 'text-2xl font-bold text-blue-600 dark:text-blue-400'
                                }, salesforceResults.statistics?.updated || 0),
                                React.createElement('div', {
                                    key: 'updated-label',
                                    className: 'text-sm text-gray-600 dark:text-gray-400'
                                }, 'Updated')
                            ]),
                            React.createElement('div', {
                                key: 'failed',
                                className: 'bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center'
                            }, [
                                React.createElement('div', {
                                    key: 'failed-number',
                                    className: 'text-2xl font-bold text-red-600 dark:text-red-400'
                                }, salesforceResults.statistics?.failed || 0),
                                React.createElement('div', {
                                    key: 'failed-label',
                                    className: 'text-sm text-gray-600 dark:text-gray-400'
                                }, 'Failed')
                            ])
                        ]),

                        // Failures (if any)
                        salesforceResults.failures && salesforceResults.failures.length > 0 && React.createElement('div', {
                            key: 'failures-section',
                            className: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'
                        }, [
                            React.createElement('h3', {
                                key: 'failures-title',
                                className: 'font-semibold text-red-900 dark:text-red-100 mb-3'
                            }, 'Failures'),
                            React.createElement('div', {
                                key: 'failures-list',
                                className: 'space-y-2 max-h-40 overflow-y-auto'
                            }, salesforceResults.failures.map((failure, index) => 
                                React.createElement('div', {
                                    key: `failure-${index}`,
                                    className: 'bg-white dark:bg-gray-800 rounded p-3 border border-red-200 dark:border-red-700'
                                }, [
                                    React.createElement('div', {
                                        key: 'failure-product',
                                        className: 'font-medium text-gray-900 dark:text-white'
                                    }, failure.product_name || 'Unknown Product'),
                                    React.createElement('div', {
                                        key: 'failure-error',
                                        className: 'text-sm text-red-600 dark:text-red-400 mt-1'
                                    }, failure.error || 'Unknown error')
                                ])
                            ))
                        ])
                    ]),

                    // Modal Footer
                    React.createElement('div', {
                        key: 'modal-footer',
                        className: 'flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    }, [
                        React.createElement('button', {
                            key: 'close-button',
                            onClick: () => setShowSalesforceResultsModal(false),
                            className: 'px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors'
                        }, 'Close')
                    ])
                ])
            ])
        ])
    ]);
};

