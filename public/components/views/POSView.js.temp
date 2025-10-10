/**
 * POSView Component
 * 
 * The main Point of Sale interface component that provides the core POS functionality:
 * - Product catalog display with search and filtering
 * - Shopping cart management with quantity controls
 * - Customer selection and loyalty integration
 * - Payment processing with multiple payment methods
 * - Receipt generation and printing
 * - Real-time inventory updates
 * 
 * Features:
 * - Responsive grid layout for products
 * - Real-time cart calculations
 * - Customer loyalty point display
 * - Payment method selection (Cash, Card, Mobile)
 * - Receipt preview and printing
 * - Dark mode support
 * - Mobile-optimized interface
 * 
 * @author Rodrigo Torres
 * @version 1.0.0
 * @since 2025-01-11
 */

// POSView.js - Point of Sale View Component
if (!window.Views) {
    window.Views = {};
}

window.Views.POSView = ({ 
    products, 
    cart, 
    selectedCustomer, 
    searchTerm, 
    setSearchTerm, 
    selectedCategory, 
    setSelectedCategory, 
    categories,
    onAddToCart, 
    onUpdateQuantity, 
    onRemoveFromCart, 
    onClearCart,
    onShowLoyaltyModal,
    onLoadCustomerHistory,
    onRemoveCustomer,
    subtotal,
    tax,
    total,
    discount,
    discountAmount,
    setDiscountAmount,
    discountType,
    setDiscountType,
    paymentMethod,
    setPaymentMethod,
    amountReceived,
    setAmountReceived,
    change,
    onProcessPayment,
    loading
}) => {
    const { ShoppingCart, Search, Users, Plus, Minus, X, CreditCard, DollarSign, Percent } = window.Icons;

    // Credit card validation state
    const [creditCardForm, setCreditCardForm] = React.useState({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
    });
    const [cardValidation, setCardValidation] = React.useState({
        isValid: false,
        cardType: null,
        errors: {}
    });

    // Credit card validation functions
    const validateCreditCard = (cardNumber) => {
        // Remove spaces and non-digits
        const cleanNumber = cardNumber.replace(/\D/g, '');
        
        // Check if empty
        if (!cleanNumber) {
            return { isValid: false, cardType: null, error: 'Card number is required' };
        }

        // Luhn algorithm for credit card validation
        const luhnCheck = (num) => {
            let sum = 0;
            let isEven = false;
            
            for (let i = num.length - 1; i >= 0; i--) {
                let digit = parseInt(num[i]);
                
                if (isEven) {
                    digit *= 2;
                    if (digit > 9) {
                        digit = digit.toString().split('').map(Number).reduce((a, b) => a + b, 0);
                    }
                }
                
                sum += digit;
                isEven = !isEven;
            }
            
            return sum % 10 === 0;
        };

        // Determine card type
        const getCardType = (number) => {
            const patterns = {
                'Visa': /^4[0-9]{12}(?:[0-9]{3})?$/,
                'MasterCard': /^5[1-5][0-9]{14}$/,
                'American Express': /^3[47][0-9]{13}$/,
                'Discover': /^6(?:011|5[0-9]{2})[0-9]{12}$/
            };

            for (const [type, pattern] of Object.entries(patterns)) {
                if (pattern.test(number)) {
                    return type;
                }
            }
            return null;
        };

        // Check length (13-19 digits for most cards)
        if (cleanNumber.length < 13 || cleanNumber.length > 19) {
            return { isValid: false, cardType: null, error: 'Invalid card number length' };
        }

        // Get card type
        const cardType = getCardType(cleanNumber);
        if (!cardType) {
            return { isValid: false, cardType: null, error: 'Unsupported card type' };
        }

        // Luhn check
        const isValid = luhnCheck(cleanNumber);
        if (!isValid) {
            return { isValid: false, cardType, error: 'Invalid card number' };
        }

        return { isValid: true, cardType, error: null };
    };

    const validateExpiryDate = (expiry) => {
        if (!expiry) return { isValid: false, error: 'Expiry date is required' };
        
        const match = expiry.match(/^(\d{2})\/(\d{2})$/);
        if (!match) return { isValid: false, error: 'Format: MM/YY' };
        
        const month = parseInt(match[1]);
        const year = 2000 + parseInt(match[2]);
        
        if (month < 1 || month > 12) {
            return { isValid: false, error: 'Invalid month' };
        }
        
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            return { isValid: false, error: 'Card expired' };
        }
        
        return { isValid: true, error: null };
    };

    const validateCVV = (cvv, cardType) => {
        if (!cvv) return { isValid: false, error: 'CVV is required' };
        
        const expectedLength = cardType === 'American Express' ? 4 : 3;
        if (cvv.length !== expectedLength) {
            return { isValid: false, error: `CVV must be ${expectedLength} digits` };
        }
        
        if (!/^\d+$/.test(cvv)) {
            return { isValid: false, error: 'CVV must be numeric' };
        }
        
        return { isValid: true, error: null };
    };

    // Handle credit card input changes
    const handleCreditCardChange = (field, value) => {
        let formattedValue = value;
        
        // Format card number with spaces
        if (field === 'cardNumber') {
            formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
            if (formattedValue.length > 19) return; // Max length with spaces
        }
        
        // Format expiry date
        if (field === 'expiryDate') {
            formattedValue = value.replace(/\D/g, '');
            if (formattedValue.length >= 2) {
                formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2, 4);
            }
            if (formattedValue.length > 5) return;
        }
        
        // CVV - only numbers
        if (field === 'cvv') {
            formattedValue = value.replace(/\D/g, '');
            if (formattedValue.length > 4) return;
        }

        setCreditCardForm(prev => ({
            ...prev,
            [field]: formattedValue
        }));

        // Real-time validation
        if (field === 'cardNumber') {
            const validation = validateCreditCard(formattedValue);
            setCardValidation(prev => ({
                ...prev,
                isValid: validation.isValid,
                cardType: validation.cardType,
                errors: { ...prev.errors, cardNumber: validation.error }
            }));
        }
    };

    // Format card number for display (show only last 4 digits)
    const formatCardNumberForDisplay = (cardNumber) => {
        const cleanNumber = cardNumber.replace(/\D/g, '');
        if (cleanNumber.length < 4) return '';
        return '**** **** **** ' + cleanNumber.slice(-4);
    };

    // Helper function to get product image with priority order
    const getProductImage = (product) => {
        const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
        if (primaryImage?.url) {
            return { type: 'url', src: primaryImage.url, alt: primaryImage.alt || product.name };
        }
        if (product.main_image_url) {
            return { type: 'url', src: product.main_image_url, alt: product.name };
        }
        return { type: 'emoji', src: product.image || '📦', alt: product.name };
    };

    // Enhanced ProductCard component
    const ProductCard = ({ product }) => {
        const productImage = getProductImage(product);
        const isOutOfStock = product.stock <= 0;
        
        return React.createElement('button', {
            onClick: () => onAddToCart(product),
            disabled: isOutOfStock,
            className: `p-2 lg:p-2 rounded-lg border transition-all duration-200 touch-button ${
                isOutOfStock
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md active:scale-95 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`
        }, [
            React.createElement('div', { key: 'image-container', className: 'relative mb-3' }, [
                React.createElement('div', { key: 'image-wrapper', className: 'w-full h-32 lg:h-40 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center' }, [
                    productImage.type === 'url' ? (
                        React.createElement('img', {
                            key: 'product-img',
                            src: productImage.src,
                            alt: productImage.alt,
                            className: 'w-full h-full object-cover',
                            onError: (e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }
                        })
                    ) : null,
                    
                    React.createElement('div', { 
                        key: 'fallback',
                        className: 'w-full h-full flex items-center justify-center text-4xl lg:text-6xl',
                        style: { display: productImage.type === 'url' ? 'none' : 'flex' }
                    }, productImage.src)
                ]),
                
                React.createElement('div', { 
                    key: 'stock-indicator',
                    className: `absolute top-1 right-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isOutOfStock 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : product.stock <= 5 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`
                }, isOutOfStock ? 'Out' : product.stock <= 5 ? 'Low' : 'In Stock'),
                
                (product.brand || product.collection) && React.createElement('div', { 
                    key: 'brand-badge',
                    className: 'absolute bottom-1 left-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 max-w-full truncate'
                }, product.brand || product.collection)
            ]),
            
            React.createElement('div', { key: 'info', className: 'text-center' }, [
                React.createElement('div', { key: 'name', className: 'font-medium text-xs lg:text-sm mb-1 line-clamp-2 dark:text-white' }, product.name),
                React.createElement('div', { key: 'price', className: 'text-blue-600 dark:text-blue-400 font-bold text-base lg:text-lg' }, `$${parseFloat(product.price).toFixed(2)}`),
                React.createElement('div', { key: 'stock', className: 'text-xs text-gray-500 dark:text-gray-400 mt-1' }, `Stock: ${product.stock}`),
                
                React.createElement('div', { key: 'details', className: 'flex flex-wrap gap-1 justify-center mt-2' }, [
                    product.material && React.createElement('span', { 
                        key: 'material',
                        className: 'px-1 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded' 
                    }, product.material),
                    product.laptop_size && React.createElement('span', { 
                        key: 'laptop',
                        className: 'px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs rounded' 
                    }, product.laptop_size)
                ])
            ])
        ]);
    };

    return React.createElement('div', { className: 'flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 h-full' }, [
        // Products Section
        React.createElement('div', { key: 'products', className: 'lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700' }, [
            React.createElement('div', { key: 'header', className: 'p-6 border-b dark:border-gray-700' }, [
                React.createElement('div', { key: 'title', className: 'mb-4' }, [
                    React.createElement('h2', { key: 'products-title', className: 'text-xl font-bold dark:text-white' }, 'Products'),
                    React.createElement('p', { key: 'products-count', className: 'text-gray-600 dark:text-gray-300 text-sm' }, `${products.length} products available`)
                ]),
                React.createElement('div', { key: 'controls', className: 'flex flex-col sm:flex-row gap-4' }, [
                    React.createElement('div', { key: 'search', className: 'relative flex-1' }, [
                        React.createElement(Search, { 
                            key: 'search-icon',
                            className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
                            size: 20 
                        }),
                        React.createElement('input', {
                            key: 'search-input',
                            type: 'text',
                            placeholder: 'Search products...',
                            value: searchTerm,
                            onChange: (e) => setSearchTerm(e.target.value),
                            className: 'w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                        })
                    ]),
                    React.createElement('select', {
                        key: 'category-select',
                        value: selectedCategory,
                        onChange: (e) => setSelectedCategory(e.target.value),
                        className: 'px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                    }, categories.map(cat => 
                        React.createElement('option', { key: cat, value: cat }, cat)
                    ))
                ])
            ]),
            React.createElement('div', { 
                key: 'products-grid',
                className: 'p-4 lg:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 lg:gap-4 overflow-y-auto custom-scrollbar' 
            }, products.map(product =>
                React.createElement(ProductCard, { key: product.id, product })
            ))
        ]),

        // Enhanced Cart Section with Discount System
        React.createElement('div', { key: 'cart', className: 'cart-panel bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 flex flex-col lg:relative' }, [
            React.createElement('div', { key: 'cart-header', className: 'p-4 lg:p-6 border-b dark:border-gray-700' }, [
                React.createElement('h2', { key: 'cart-title', className: 'text-lg lg:text-xl font-bold flex items-center gap-2 dark:text-white' }, [
                    React.createElement(ShoppingCart, { key: 'cart-icon', size: 20 }),
                    `Cart (${cart.length})`
                ])
            ]),
            React.createElement('div', { key: 'cart-content', className: 'flex-1 p-4 lg:p-6 custom-scrollbar' }, [
                // Enhanced customer info section
                React.createElement(React.Fragment, { key: 'customer-section' }, [
                    selectedCustomer ? (
                        React.createElement('div', { key: 'customer-info', className: 'mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg' }, [
                            React.createElement('div', { key: 'customer-header', className: 'flex justify-between items-start' }, [
                                React.createElement('div', { key: 'customer-details' }, [
                                    React.createElement('div', { key: 'customer-name', className: 'font-semibold text-green-800 dark:text-green-200 text-lg' }, selectedCustomer.name),
                                    React.createElement('div', { key: 'customer-loyalty', className: 'text-sm text-green-700 dark:text-green-300 font-mono' }, selectedCustomer.loyalty_number),
                                    React.createElement('div', { key: 'customer-points', className: 'text-sm text-green-600 dark:text-green-400 flex items-center gap-1' }, [
                                        React.createElement('span', { key: 'points-icon' }, '⭐'),
                                        React.createElement('span', { key: 'points-text' }, `${selectedCustomer.points} points available`)
                                    ])
                                ]),
                                React.createElement('div', { key: 'customer-actions', className: 'flex gap-2' }, [
                                    React.createElement('button', {
                                        key: 'history-btn',
                                        onClick: () => onLoadCustomerHistory(selectedCustomer.id),
                                        className: 'text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors'
                                    }, 'History'),
                                    React.createElement('button', {
                                        key: 'remove-btn',
                                        onClick: onRemoveCustomer,
                                        className: 'text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-colors'
                                    }, 'Remove')
                                ])
                            ])
                        ])
                    ) : (
                        React.createElement('button', {
                            key: 'add-customer-btn',
                            onClick: onShowLoyaltyModal,
                            className: 'mb-4 w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2'
                        }, [
                            React.createElement(Users, { key: 'users-icon', size: 20 }),
                            'Add Loyalty Customer'
                        ])
                    )
                ]),

                // Enhanced cart items display
                React.createElement(React.Fragment, { key: 'cart-items-section' }, [
                    cart.length === 0 ? (
                        React.createElement('div', { key: 'empty-cart', className: 'text-center text-gray-400 py-12' }, [
                            React.createElement(ShoppingCart, { key: 'empty-icon', size: 64, className: 'mx-auto mb-4 opacity-30' }),
                            React.createElement('p', { key: 'empty-text', className: 'text-lg' }, 'Cart is empty'),
                            React.createElement('p', { key: 'empty-subtext', className: 'text-sm mt-2' }, 'Add products to get started')
                        ])
                    ) : (
                        React.createElement('div', { key: 'cart-items', className: 'space-y-3 mb-6' }, cart.map(item => {
                            const itemImage = getProductImage(item);
                            return React.createElement('div', { 
                                key: item.id,
                                className: 'flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600' 
                            }, [
                                React.createElement('div', { key: 'item-image', className: 'w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0' }, [
                                    itemImage.type === 'url' ? (
                                        React.createElement('img', {
                                            key: 'img',
                                            src: itemImage.src,
                                            alt: itemImage.alt,
                                            className: 'w-full h-full object-cover',
                                            onError: (e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }
                                        })
                                    ) : null,
                                    React.createElement('div', { 
                                        key: 'fallback',
                                        className: 'w-full h-full flex items-center justify-center text-lg',
                                        style: { display: itemImage.type === 'url' ? 'none' : 'flex' }
                                    }, itemImage.src)
                                ]),
                                
                                React.createElement('div', { key: 'item-info', className: 'flex-1 min-w-0' }, [
                                    React.createElement('div', { key: 'item-name', className: 'font-medium truncate dark:text-white' }, item.name),
                                    React.createElement('div', { key: 'item-price', className: 'text-sm text-gray-600 dark:text-gray-400' }, `$${parseFloat(item.price).toFixed(2)} each`),
                                    (item.brand || item.material) && React.createElement('div', { key: 'item-details', className: 'text-xs text-gray-500 dark:text-gray-400' }, 
                                        [item.brand, item.material].filter(Boolean).join(' • ')
                                    )
                                ]),
                                React.createElement('div', { key: 'item-controls', className: 'flex items-center gap-2' }, [
                                    React.createElement('button', {
                                        key: 'decrease-btn',
                                        onClick: () => onUpdateQuantity(item.id, item.quantity - 1),
                                        className: 'w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors'
                                    }, 
                                        React.createElement(Minus, { key: 'minus-icon', size: 16 })
                                    ),
                                    React.createElement('span', { key: 'quantity', className: 'w-8 text-center font-medium dark:text-white' }, item.quantity),
                                    React.createElement('button', {
                                        key: 'increase-btn',
                                        onClick: () => onUpdateQuantity(item.id, item.quantity + 1),
                                        className: 'w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors'
                                    }, 
                                        React.createElement(Plus, { key: 'plus-icon', size: 16 })
                                    ),
                                    React.createElement('button', {
                                        key: 'remove-btn',
                                        onClick: () => onRemoveFromCart(item.id),
                                        className: 'w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800 ml-2 transition-colors'
                                    }, 
                                        React.createElement(X, { key: 'x-icon', size: 16 })
                                    )
                                ])
                            ]);
                        }))
                    )
                ]),

                cart.length > 0 && React.createElement(React.Fragment, { key: 'discount-section' }, [
                    // Discount Section
                    React.createElement('div', { key: 'discount', className: 'border-t dark:border-gray-600 pt-4 mb-4' }, [
                        React.createElement('h4', { key: 'discount-title', className: 'font-medium mb-3 dark:text-white flex items-center gap-2' }, [
                            React.createElement(Percent, { key: 'discount-icon', size: 18 }),
                            'Discount'
                        ]),
                        React.createElement('div', { key: 'discount-controls', className: 'grid grid-cols-3 gap-2 mb-2' }, [
                            React.createElement('select', {
                                key: 'discount-type',
                                value: discountType,
                                onChange: (e) => setDiscountType(e.target.value),
                                className: 'px-3 py-2 text-sm border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            }, [
                                React.createElement('option', { key: 'fixed', value: 'fixed' }, '$'),
                                React.createElement('option', { key: 'percentage', value: 'percentage' }, '%')
                            ]),
                            React.createElement('input', {
                                key: 'discount-amount',
                                type: 'number',
                                step: discountType === 'percentage' ? '1' : '0.01',
                                min: '0',
                                max: discountType === 'percentage' ? '100' : undefined,
                                value: discountAmount,
                                onChange: (e) => setDiscountAmount(e.target.value),
                                placeholder: discountType === 'percentage' ? '10' : '5.00',
                                className: 'col-span-2 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            })
                        ]),
                        discount > 0 && React.createElement('div', { key: 'discount-applied', className: 'text-sm text-green-600 dark:text-green-400 font-medium' }, 
                            `Discount Applied: -$${discount.toFixed(2)}`
                        )
                    ]),

                    // Totals Section
                    React.createElement('div', { key: 'totals', className: 'border-t dark:border-gray-600 pt-4 space-y-2 mb-6' }, [
                        React.createElement('div', { key: 'subtotal', className: 'flex justify-between dark:text-white' }, [
                            React.createElement('span', { key: 'subtotal-label' }, 'Subtotal:'),
                            React.createElement('span', { key: 'subtotal-value' }, `$${(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toFixed(2)}`)
                        ]),
                        discount > 0 && React.createElement('div', { key: 'discount-row', className: 'flex justify-between text-green-600 dark:text-green-400' }, [
                            React.createElement('span', { key: 'discount-label' }, 'Discount:'),
                            React.createElement('span', { key: 'discount-value' }, `-${discount.toFixed(2)}`)
                        ]),
                        React.createElement('div', { key: 'tax-row', className: 'flex justify-between dark:text-white' }, [
                            React.createElement('span', { key: 'tax-label' }, 'Tax:'),
                            React.createElement('span', { key: 'tax-value' }, `${tax.toFixed(2)}`)
                        ]),
                        React.createElement('div', { key: 'total-row', className: 'flex justify-between font-bold text-lg border-t dark:border-gray-600 pt-2 dark:text-white' }, [
                            React.createElement('span', { key: 'total-label' }, 'Total:'),
                            React.createElement('span', { key: 'total-value' }, `${total.toFixed(2)}`)
                        ]),
                        selectedCustomer && React.createElement('div', { key: 'points-row', className: 'flex justify-between text-green-600 dark:text-green-400 text-sm' }, [
                            React.createElement('span', { key: 'points-label' }, 'Points to earn:'),
                            React.createElement('span', { key: 'points-value' }, `+${Math.floor(total)} points`)
                        ])
                    ]),

                    // Enhanced Payment Section
                    React.createElement('div', { key: 'payment', className: 'space-y-4' }, [
                        React.createElement('div', { key: 'payment-method' }, [
                            React.createElement('label', { key: 'payment-label', className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Payment Method'),
                            React.createElement('select', {
                                key: 'payment-select',
                                value: paymentMethod,
                                onChange: (e) => {
                                    setPaymentMethod(e.target.value);
                                    // Reset credit card form when switching away from card
                                    if (e.target.value !== 'card') {
                                        setCreditCardForm({
                                            cardNumber: '', expiryDate: '', cvv: '', cardholderName: ''
                                        });
                                        setCardValidation({
                                            isValid: false, cardType: null, errors: {}
                                        });
                                    }
                                },
                                className: 'w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            }, [
                                React.createElement('option', { key: 'cash', value: 'cash' }, 'Cash'),
                                React.createElement('option', { key: 'card', value: 'card' }, 'Credit/Debit Card'),
                                React.createElement('option', { key: 'mobile', value: 'mobile' }, 'Mobile Payment')
                            ])
                        ]),

                        // Cash Payment
                        paymentMethod === 'cash' && React.createElement('div', { key: 'cash-payment' }, [
                            React.createElement('label', { key: 'cash-label', className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Amount Received'),
                            React.createElement('input', {
                                key: 'cash-input',
                                type: 'number',
                                step: '0.01',
                                min: total.toFixed(2),
                                value: amountReceived,
                                onChange: (e) => setAmountReceived(e.target.value),
                                placeholder: total.toFixed(2),
                                className: 'w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            }),
                            amountReceived && parseFloat(amountReceived) >= total && React.createElement('div', {
                                key: 'change-display',
                                className: 'mt-2 text-green-600 dark:text-green-400 font-medium'
                            }, `Change: ${change.toFixed(2)}`)
                        ]),

                        // Credit Card Payment
                        paymentMethod === 'card' && React.createElement('div', { key: 'card-payment', className: 'space-y-4' }, [
                            React.createElement('div', { key: 'card-form', className: 'grid grid-cols-1 gap-4' }, [
                                // Cardholder Name
                                React.createElement('div', { key: 'cardholder' }, [
                                    React.createElement('label', { key: 'cardholder-label', className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Cardholder Name'),
                                    React.createElement('input', {
                                        key: 'cardholder-input',
                                        type: 'text',
                                        value: creditCardForm.cardholderName,
                                        onChange: (e) => handleCreditCardChange('cardholderName', e.target.value),
                                        placeholder: 'John Doe',
                                        className: 'w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                    })
                                ]),

                                // Card Number
                                React.createElement('div', { key: 'card-number' }, [
                                    React.createElement('label', { key: 'card-number-label', className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Card Number'),
                                    React.createElement('div', { key: 'card-number-wrapper', className: 'relative' }, [
                                        React.createElement('input', {
                                            key: 'card-number-input',
                                            type: 'text',
                                            value: creditCardForm.cardNumber,
                                            onChange: (e) => handleCreditCardChange('cardNumber', e.target.value),
                                            placeholder: '1234 5678 9012 3456',
                                            className: `w-full p-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${
                                                cardValidation.errors.cardNumber 
                                                    ? 'border-red-500 focus:ring-red-500' 
                                                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                            }`
                                        }),
                                        // Card type indicator
                                        cardValidation.cardType && React.createElement('div', {
                                            key: 'card-type-indicator',
                                            className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-blue-600 dark:text-blue-400'
                                        }, cardValidation.cardType),
                                        React.createElement(CreditCard, {
                                            key: 'card-icon',
                                            className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400',
                                            size: 20
                                        })
                                    ]),
                                    cardValidation.errors.cardNumber && React.createElement('p', {
                                        key: 'card-error',
                                        className: 'text-sm text-red-500 mt-1'
                                    }, cardValidation.errors.cardNumber)
                                ]),

                                // Expiry and CVV
                                React.createElement('div', { key: 'expiry-cvv', className: 'grid grid-cols-2 gap-4' }, [
                                    React.createElement('div', { key: 'expiry' }, [
                                        React.createElement('label', { key: 'expiry-label', className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Expiry Date'),
                                        React.createElement('input', {
                                            key: 'expiry-input',
                                            type: 'text',
                                            value: creditCardForm.expiryDate,
                                            onChange: (e) => handleCreditCardChange('expiryDate', e.target.value),
                                            placeholder: 'MM/YY',
                                            className: 'w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        })
                                    ]),
                                    React.createElement('div', { key: 'cvv' }, [
                                        React.createElement('label', { key: 'cvv-label', className: 'block text-sm font-medium mb-2 dark:text-white' }, 'CVV'),
                                        React.createElement('input', {
                                            key: 'cvv-input',
                                            type: 'text',
                                            value: creditCardForm.cvv,
                                            onChange: (e) => handleCreditCardChange('cvv', e.target.value),
                                            placeholder: '123',
                                            className: 'w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        })
                                    ])
                                ])
                            ]),

                            // Card validation status
                            creditCardForm.cardNumber && React.createElement('div', { 
                                key: 'card-validation',
                                className: `p-3 rounded-lg border ${
                                    cardValidation.isValid 
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                                }`
                            }, [
                                React.createElement('div', { key: 'validation-status', className: 'flex items-center gap-2' }, [
                                    React.createElement('span', { key: 'validation-text', className: 'font-medium' }, 
                                        cardValidation.isValid ? '✓ Card Valid' : '✗ Card Invalid'
                                    ),
                                    cardValidation.cardType && React.createElement('span', { key: 'card-type-text', className: 'text-sm' }, 
                                        `(${cardValidation.cardType})`
                                    )
                                ]),
                                creditCardForm.cardNumber && React.createElement('div', { key: 'card-display', className: 'text-sm mt-1' }, 
                                    formatCardNumberForDisplay(creditCardForm.cardNumber)
                                )
                            ])
                        ]),

                        // Mobile Payment
                        paymentMethod === 'mobile' && React.createElement('div', { key: 'mobile-payment', className: 'p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg' }, [
                            React.createElement('p', { key: 'mobile-text', className: 'text-blue-800 dark:text-blue-200 text-sm' }, 
                                'Customer will pay using mobile payment (Apple Pay, Google Pay, etc.)'
                            )
                        ]),

                        // Action Buttons
                        React.createElement('div', { key: 'action-buttons', className: 'flex gap-2 pt-4' }, [
                            React.createElement('button', {
                                key: 'clear-cart-btn',
                                onClick: onClearCart,
                                className: 'flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
                            }, 'Clear Cart'),
                            React.createElement('button', {
                                key: 'process-payment-btn',
                                onClick: onProcessPayment,
                                disabled: loading || (
                                    paymentMethod === 'cash' && parseFloat(amountReceived) < total
                                ) || (
                                    paymentMethod === 'card' && (!cardValidation.isValid || !creditCardForm.cardholderName.trim() || !creditCardForm.expiryDate || !creditCardForm.cvv)
                                ),
                                className: 'flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2'
                            }, [
                                loading && React.createElement('div', { 
                                    key: 'loading-spinner',
                                    className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white' 
                                }),
                                React.createElement(paymentMethod === 'card' ? CreditCard : DollarSign, { key: 'payment-icon', size: 18 }),
                                loading ? 'Processing...' : `Pay ${total.toFixed(2)}`
                            ])
                        ])
                    ])
                ])
            ])
        ])
    ]);
};
