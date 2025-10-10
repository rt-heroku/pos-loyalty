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
        laptopSize: '',
        brand: '',
        collection: '',
        material: '',
        gender: 'Unisex',
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
                laptopSize: product.laptop_size || '',
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
                laptopSize: '',
                brand: '',
                collection: '',
                material: '',
                gender: 'Unisex',
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

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
            alert('Product name is required');
            return;
        }
        if (!formData.price || parseFloat(formData.price) < 0) {
            alert('Valid price is required');
            return;
        }
        if (!formData.category.trim()) {
            alert('Category is required');
            return;
        }
        if (!formData.stock || parseInt(formData.stock) < 0) {
            alert('Valid stock quantity is required');
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
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    }, [
        React.createElement('div', {
            key: 'modal',
            className: 'bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'
        }, [
            // Header
            React.createElement('div', { key: 'header', className: 'px-6 py-4 border-b flex justify-between items-center' }, [
                React.createElement('h2', { key: 'header-title', className: 'text-xl font-bold' },
                    product ? 'Edit Product' : 'Add New Product'
                ),
                React.createElement('button', {
                    onClick: onClose,
                    key: 'close-button',
                    className: 'text-gray-400 hover:text-gray-600 transition-colors'
                }, React.createElement(X, { size: 24 }))
            ]),

            // Tab Navigation
            React.createElement('div', { key: 'tabs', className: 'px-6 py-3 border-b bg-gray-50' }, [
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
                    })
                ])
            ]),

            // Form Content
            React.createElement('div', {
                key: 'content',
                className: 'flex-1 overflow-y-auto p-6'
            }, [
                // Basic Info Tab
                activeTab === 'basic' && React.createElement('div', { key: 'basic-info', className: 'space-y-6' }, [
                    React.createElement('div', { key: 'basic-info-container', className: 'grid grid-cols-1 md:grid-cols-2 gap-6' }, [
                        // Product Name
                        React.createElement('div', { key: 'product-name' }, [
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Product Name *'),
                            React.createElement('input', {
                                type: 'text',
                                value: formData.name,
                                onChange: (e) => handleInputChange('name', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: 'Enter product name',
                                required: true
                            })
                        ]),

                        // SKU
                        React.createElement('div', { key: 'product-sku' }, [
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'SKU'),
                            React.createElement('input', {
                                type: 'text',
                                value: formData.sku,
                                onChange: (e) => handleInputChange('sku', e.target.value.toUpperCase()),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: 'Auto-generated if empty'
                            })
                        ]),

                        // Price
                        React.createElement('div', { key: 'product-price' }, [
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Price *'),
                            React.createElement('input', {
                                type: 'number',
                                step: '0.01',
                                min: '0',
                                value: formData.price,
                                onChange: (e) => handleInputChange('price', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: '0.00',
                                required: true
                            })
                        ]),

                        // Stock
                        React.createElement('div', { key: 'product-stock' }, [
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Stock Quantity *'),
                            React.createElement('input', {
                                type: 'number',
                                min: '0',
                                value: formData.stock,
                                onChange: (e) => handleInputChange('stock', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: '0',
                                required: true
                            })
                        ]),

                        // Category
                        React.createElement('div', { key: 'product-category' }, [
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Category *'),
                            React.createElement('input', {
                                type: 'text',
                                value: formData.category,
                                onChange: (e) => handleInputChange('category', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: 'e.g., Luggage, Backpacks, Accessories',
                                required: true
                            })
                        ]),

                        // Product Type
                        React.createElement('div', { key: 'product-type' }, [
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Product Type'),
                            React.createElement('select', {
                                value: formData.productType,
                                onChange: (e) => handleInputChange('productType', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            }, [
                                React.createElement('option', { key: 'empty', value: '' }, 'Select Type'),
                                React.createElement('option', { key: 'luggage', value: 'Luggage' }, 'Luggage'),
                                React.createElement('option', { key: 'backpack', value: 'Backpack' }, 'Backpack'),
                                React.createElement('option', { key: 'briefcase', value: 'Briefcase' }, 'Briefcase'),
                                React.createElement('option', { key: 'duffel', value: 'Duffel' }, 'Duffel'),
                                React.createElement('option', { key: 'tote', value: 'Tote' }, 'Tote'),
                                React.createElement('option', { key: 'portfolio', value: 'Portfolio' }, 'Portfolio'),
                                React.createElement('option', { key: 'accessory', value: 'Accessory' }, 'Accessory')
                            ])
                        ]),

                        // Brand
                        React.createElement('div', { key: 'brand' }, [
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Brand'),
                            React.createElement('input', {
                                type: 'text',
                                value: formData.brand,
                                onChange: (e) => handleInputChange('brand', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: 'e.g., TUMI, Samsonite'
                            })
                        ]),

                        // Collection
                        React.createElement('div', { key: 'collection' }, [
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Collection'),
                            React.createElement('input', {
                                type: 'text',
                                value: formData.collection,
                                onChange: (e) => handleInputChange('collection', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: 'e.g., 19 Degree, Alpha, Voyageur'
                            })
                        ])
                    ]),

                    // Description
                    React.createElement('div', { key: 'description' }, [
                        React.createElement('label', { key: 'description-label', className: 'block text-sm font-medium mb-2' }, 'Description'),
                        React.createElement('textarea', {
                            key: 'description-textarea',
                            value: formData.description,
                            onChange: (e) => handleInputChange('description', e.target.value),
                            rows: 4,
                            className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
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
                            React.createElement('span', { className: 'text-sm font-medium' }, 'Active Product')
                        ]),
                        React.createElement('label', { key: 'featured-label', className: 'flex items-center gap-2' }, [
                            React.createElement('input', {
                                key: 'featured-checkbox',
                                type: 'checkbox',
                                checked: formData.featured,
                                onChange: (e) => handleInputChange('featured', e.target.checked),
                                className: 'w-4 h-4 text-blue-600 rounded'
                            }),
                            React.createElement('span', { className: 'text-sm font-medium' }, 'Featured Product')
                        ])
                    ])
                ]),

                // Details Tab
                activeTab === 'details' && React.createElement('div', { key: 'details-tab', className: 'space-y-6' }, [
                    React.createElement('div', { key: 'details-container', className: 'grid grid-cols-1 md:grid-cols-2 gap-6' }, [
                        // Material
                        React.createElement('div', { key: 'product-material' }, [
                            React.createElement('label', { key: 'material-label', className: 'block text-sm font-medium mb-2' }, 'Material'),
                            React.createElement('input', {
                                key: 'material-input',
                                type: 'text',
                                value: formData.material,
                                onChange: (e) => handleInputChange('material', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: 'e.g., Ballistic Nylon, Polycarbonate, Leather'
                            })
                        ]),

                        // Color
                        React.createElement('div', { key: 'product-color' }, [
                            React.createElement('label', { key: 'color-label', className: 'block text-sm font-medium mb-2' }, 'Color'),
                            React.createElement('input', {
                                key: 'color-input',
                                type: 'text',
                                value: formData.color,
                                onChange: (e) => handleInputChange('color', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: 'e.g., Black, Navy, Silver'
                            })
                        ]),

                        // Gender
                        React.createElement('div', { key: 'gender' }, [
                            React.createElement('label', { key: 'gender-label', className: 'block text-sm font-medium mb-2' }, 'Gender'),
                            React.createElement('select', {
                                key: 'gender-select',
                                value: formData.gender,
                                onChange: (e) => handleInputChange('gender', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            }, [
                                React.createElement('option', { key: 'unisex', value: 'Unisex' }, 'Unisex'),
                                React.createElement('option', { key: 'men', value: 'Men' }, 'Men'),
                                React.createElement('option', { key: 'women', value: 'Women' }, 'Women')
                            ])
                        ]),

                        // Laptop Size
                        React.createElement('div', { key: 'laptopSize' }, [
                            React.createElement('label', { key: 'laptop-size-label', className: 'block text-sm font-medium mb-2' }, 'Laptop Size'),
                            React.createElement('select', {
                                key: 'laptop-size-select',
                                value: formData.laptopSize,
                                onChange: (e) => handleInputChange('laptopSize', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            }, [
                                React.createElement('option', { key: 'none', value: '' }, 'Not Applicable'),
                                React.createElement('option', { key: '13', value: '13"' }, 'Up to 13"'),
                                React.createElement('option', { key: '15', value: '15"' }, 'Up to 15"'),
                                React.createElement('option', { key: '17', value: '17"' }, 'Up to 17"')
                            ])
                        ]),

                        // Dimensions
                        React.createElement('div', { key: 'dimensions' }, [
                            React.createElement('label', { key: 'dimensions-label', className: 'block text-sm font-medium mb-2' }, 'Dimensions'),
                            React.createElement('input', {
                                key: 'dimensions-input',
                                type: 'text',
                                value: formData.dimensions,
                                onChange: (e) => handleInputChange('dimensions', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: 'e.g., 22" x 14" x 9"'
                            })
                        ]),

                        // Weight
                        React.createElement('div', { key: 'weight' }, [
                            React.createElement('label', { key: 'weight-label', className: 'block text-sm font-medium mb-2' }, 'Weight (lbs)'),
                            React.createElement('input', {
                                key: 'weight-input',
                                type: 'number',
                                step: '0.1',
                                min: '0',
                                value: formData.weight,
                                onChange: (e) => handleInputChange('weight', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: '0.0'
                            })
                        ]),

                        // Emoji Icon
                        React.createElement('div', { key: 'emoji' }, [
                            React.createElement('label', { key: 'emoji-label', className: 'block text-sm font-medium mb-2' }, 'Emoji Icon'),
                            React.createElement('input', {
                                key: 'emoji-input',
                                type: 'text',
                                value: formData.image,
                                onChange: (e) => handleInputChange('image', e.target.value),
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: '📦'
                            })
                        ])
                    ]),

                    // Warranty Info
                    React.createElement('div', { key: 'warranty' }, [
                        React.createElement('label', { key: 'warranty-label', className: 'block text-sm font-medium mb-2' }, 'Warranty Information'),
                        React.createElement('textarea', {
                            key: 'warranty-textarea',
                            value: formData.warrantyInfo,
                            onChange: (e) => handleInputChange('warrantyInfo', e.target.value),
                            rows: 3,
                            className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                            placeholder: 'e.g., 5-year warranty against manufacturing defects'
                        })
                    ]),

                    // Care Instructions
                    React.createElement('div', { key: 'care' }, [
                        React.createElement('label', { key: 'care-label', className: 'block text-sm font-medium mb-2' }, 'Care Instructions'),
                        React.createElement('textarea', {
                            key: 'care-textarea',
                            value: formData.careInstructions,
                            onChange: (e) => handleInputChange('careInstructions', e.target.value),
                            rows: 3,
                            className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                            placeholder: 'Care and maintenance instructions...'
                        })
                    ])
                ]),

                // Images Tab
                activeTab === 'images' && React.createElement('div', { className: 'space-y-6' }, [
                    // Main Image URL
                    React.createElement('div', { key: 'main-image' }, [
                        React.createElement('label', { key: 'main-image-label', className: 'block text-sm font-medium mb-2' }, 'Main Image URL'),
                        React.createElement('input', {
                            key: 'main-image-input',
                            type: 'url',
                            value: formData.mainImageUrl,
                            onChange: (e) => handleInputChange('mainImageUrl', e.target.value),
                            className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                            placeholder: 'https://example.com/product-image.jpg'
                        })
                    ]),

                    // Additional Images
                    React.createElement('div', { key: 'additional-images' }, [
                        React.createElement('label', { key: 'additional-images-label',  className: 'block text-sm font-medium mb-4' }, 'Additional Images'),

                        // Add new image form
                        React.createElement('div', { key: 'additional-images-form', className: 'bg-gray-50 p-4 rounded-lg mb-4' }, [
                            React.createElement('div', { key: 'additional-images-form-container', className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-3' }, [
                                React.createElement('input', {
                                    key: 'additional-images-form-input',
                                    type: 'url',
                                    value: newImage.url,
                                    onChange: (e) => setNewImage(prev => ({ ...prev, url: e.target.value })),
                                    className: 'p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    placeholder: 'Image URL'
                                }),
                                React.createElement('input', {
                                    key: 'additional-images-form-input-alt',
                                    type: 'text',
                                    value: newImage.alt,
                                    onChange: (e) => setNewImage(prev => ({ ...prev, alt: e.target.value })),
                                    className: 'p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
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
                                        React.createElement('span', { className: 'text-sm' }, 'Primary')
                                    ])
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
                                    key: index,
                                    className: 'flex items-center gap-4 p-3 border rounded-lg'
                                }, [
                                    React.createElement('div', { key: 'additional-images-list-preview', className: 'w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden' }, [
                                        image.url ? React.createElement('img', {
                                            key: `additional-images-list-preview-${index}`,
                                            src: image.url,
                                            alt: image.alt,
                                            className: 'w-full h-full object-cover'
                                        }) : React.createElement(Image, { size: 24, className: 'text-gray-400' })
                                    ]),
                                    React.createElement('div', { key: 'additional-images-list-info', className: 'flex-1' }, [
                                        React.createElement('div', { key: 'additional-images-list-info-alt', className: 'font-medium' }, image.alt || 'No alt text'),
                                        React.createElement('div', { key: 'additional-images-list-info-url', className: 'text-sm text-gray-600 truncate' }, image.url),
                                        image.isPrimary && React.createElement('span', {
                                            key: 'additional-images-list-info-primary',
                                            className: 'inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mt-1'
                                        }, 'Primary Image')
                                    ]),
                                    React.createElement('div', { key: 'additional-images-list-actions', className: 'flex gap-2' }, [
                                        !image.isPrimary && React.createElement('button', {
                                            key: 'additional-images-list-actions-set-primary',
                                            type: 'button',
                                            onClick: () => setPrimaryImage(index),
                                            className: 'px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors'
                                        }, 'Set Primary'),
                                        React.createElement('button', {
                                            type: 'button',
                                            onClick: () => removeImage(index),
                                            key: 'additional-images-list-actions-remove',
                                            className: 'p-1 text-red-600 hover:bg-red-50 rounded transition-colors'
                                        }, React.createElement(Trash2, { size: 16 }))
                                    ])
                                ])
                            )
                        )
                    ])
                ]),

                // Features Tab
                    activeTab === 'features' && React.createElement('div', { key: 'features-tab', className: 'space-y-6' }, [
                    React.createElement('div', { key: 'add-feature', className: 'bg-gray-50 p-4 rounded-lg' }, [
                        React.createElement('label', { key: 'add-feature-label', className: 'block text-sm font-medium mb-3' }, 'Add Feature'),
                        React.createElement('div', { key: 'add-feature-form', className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-3' }, [
                            React.createElement('input', {
                                key: 'add-feature-form-name',
                                type: 'text',
                                value: newFeature.name,
                                onChange: (e) => setNewFeature(prev => ({ ...prev, name: e.target.value })),
                                className: 'p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: 'Feature name (e.g., Water Resistant, USB Port)'
                            }),
                            React.createElement('input', {
                                key: 'add-feature-form-value',
                                type: 'text',
                                value: newFeature.value,
                                onChange: (e) => setNewFeature(prev => ({ ...prev, value: e.target.value })),
                                className: 'p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
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
                        React.createElement('label', { key: 'features-list-label', className: 'block text-sm font-medium mb-3' }, 'Product Features'),
                        React.createElement('div', { key: 'features-list-container', className: 'space-y-2' },
                            formData.features.map((feature, index) =>
                                React.createElement('div', {
                                    key: index,
                                    className: 'flex items-center justify-between p-3 border rounded-lg'
                                }, [
                                    React.createElement('div', { key: 'feature-info' }, [
                                        React.createElement('span', { key: 'feature-info-name', className: 'font-medium' }, feature.name),
                                        React.createElement('span', { key: 'feature-info-value', className: 'text-gray-600 ml-2' }, `: ${feature.value}`)
                                    ]),
                                    React.createElement('button', {
                                        key: 'feature-remove',
                                        type: 'button',
                                        onClick: () => removeFeature(index),
                                        className: 'p-1 text-red-600 hover:bg-red-50 rounded transition-colors'
                                    }, React.createElement(Trash2, { size: 16 }))
                                ])
                            )
                        )
                    ])
                ])
            ]),

            // Footer - Using the working button structure
            React.createElement('div', { key: 'footer', className: 'px-6 py-4 border-t bg-gray-50 flex gap-3 justify-end' }, [
                React.createElement('button', {
                    key: 'cancel-button',
                    type: 'button',
                    onClick: () => {
                        console.log('Cancel button clicked');
                        onClose();
                    },
                    disabled: loading,
                    className: 'px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50'
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
            ])
        ])
    ]);
};

