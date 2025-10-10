// Complete Enhanced POS View - Add this to replace the placeholder POSView
// This should be added to your simplified main app or as a separate component

// First, let's create the enhanced POS view that integrates with your current system
const createEnhancedPOSView = () => {
    if (!window.Views) {
        window.Views = {};
    }

    // Enhanced POS View with all features
    window.Views.POSView2 = ({ 
        selectedLocation,
        products = [],
        onLoadProducts,
        customers = [],
        onLoadCustomers
    }) => {
        // POS State
        const [cart, setCart] = React.useState([]);
        const [searchTerm, setSearchTerm] = React.useState('');
        const [selectedCategory, setSelectedCategory] = React.useState('All');
        const [selectedCustomer, setSelectedCustomer] = React.useState(null);
        const [paymentMethod, setPaymentMethod] = React.useState('cash');
        const [amountReceived, setAmountReceived] = React.useState('');
        const [discountAmount, setDiscountAmount] = React.useState('');
        const [discountType, setDiscountType] = React.useState('fixed'); // 'fixed' or 'percentage'
        const [loading, setLoading] = React.useState(false);

        // Sample products if none provided
        const [localProducts, setLocalProducts] = React.useState([
            { id: 1, name: 'Coffee', price: 4.50, category: 'Beverages', stock: 50, image: '☕', brand: 'House Blend' },
            { id: 2, name: 'Croissant', price: 3.75, category: 'Food', stock: 25, image: '🥐', brand: 'Fresh Bakery' },
            { id: 3, name: 'Sandwich', price: 8.99, category: 'Food', stock: 15, image: '🥪', brand: 'Deli Special' },
            { id: 4, name: 'Juice', price: 3.25, category: 'Beverages', stock: 30, image: '🧃', brand: 'Fresh Squeezed' }
        ]);

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

        // Load products on mount
        React.useEffect(() => {
            if (onLoadProducts) {
                onLoadProducts();
            }
        }, [selectedLocation]);

        // Use provided products or local sample products
        const activeProducts = products.length > 0 ? products : localProducts;
        const categories = ['All', ...new Set(activeProducts.map(p => p.category))];

        // Credit card validation functions
        const validateCreditCard = (cardNumber) => {
            const cleanNumber = cardNumber.replace(/\D/g, '');
            
            if (!cleanNumber) {
                return { isValid: false, cardType: null, error: 'Card number is required' };
            }

            // Luhn algorithm
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

            if (cleanNumber.length < 13 || cleanNumber.length > 19) {
                return { isValid: false, cardType: null, error: 'Invalid card number length' };
            }

            const cardType = getCardType(cleanNumber);
            if (!cardType) {
                return { isValid: false, cardType: null, error: 'Unsupported card type' };
            }

            const isValid = luhnCheck(cleanNumber);
            if (!isValid) {
                return { isValid: false, cardType, error: 'Invalid card number' };
            }

            return { isValid: true, cardType, error: null };
        };

        // Handle credit card input changes
        const handleCreditCardChange = (field, value) => {
            let formattedValue = value;
            
            if (field === 'cardNumber') {
                formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                if (formattedValue.length > 19) return;
            }
            
            if (field === 'expiryDate') {
                formattedValue = value.replace(/\D/g, '');
                if (formattedValue.length >= 2) {
                    formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2, 4);
                }
                if (formattedValue.length > 5) return;
            }
            
            if (field === 'cvv') {
                formattedValue = value.replace(/\D/g, '');
                if (formattedValue.length > 4) return;
            }

            setCreditCardForm(prev => ({
                ...prev,
                [field]: formattedValue
            }));

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

        // Cart functions
        const addToCart = (product) => {
            if (product.stock <= 0) return;
            
            const existingItem = cart.find(item => item.id === product.id);
            if (existingItem) {
                setCart(cart.map(item => 
                    item.id === product.id 
                        ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
                        : item
                ));
            } else {
                setCart([...cart, { ...product, quantity: 1 }]);
            }
        };

        const updateQuantity = (id, quantity) => {
            if (quantity <= 0) {
                removeFromCart(id);
                return;
            }
            
            const product = activeProducts.find(p => p.id === id);
            setCart(cart.map(item => 
                item.id === id 
                    ? { ...item, quantity: Math.min(quantity, product.stock) }
                    : item
            ));
        };

        const removeFromCart = (id) => {
            setCart(cart.filter(item => item.id !== id));
        };

        const clearCart = () => {
            setCart([]);
            setSelectedCustomer(null);
            setAmountReceived('');
            setDiscountAmount('');
        };

        // Calculations
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = discountType === 'percentage' 
            ? subtotal * (parseFloat(discountAmount) || 0) / 100
            : parseFloat(discountAmount) || 0;
        const discountedSubtotal = Math.max(0, subtotal - discount);
        const tax = discountedSubtotal * (selectedLocation?.tax_rate || 0.08);
        const total = discountedSubtotal + tax;
        const change = parseFloat(amountReceived) - total;

        // Filter products
        const filteredProducts = activeProducts.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        // Process payment
        const processPayment = async () => {
            if (cart.length === 0) {
                alert('Cart is empty');
                return;
            }
            if (paymentMethod === 'cash' && parseFloat(amountReceived) < total) {
                alert('Insufficient amount received');
                return;
            }
            if (paymentMethod === 'card' && (!cardValidation.isValid || !creditCardForm.cardholderName.trim())) {
                alert('Please complete credit card information');
                return;
            }

            setLoading(true);
            
            // Simulate payment processing
            setTimeout(() => {
                alert(`Payment of $${total.toFixed(2)} processed successfully!`);
                clearCart();
                setCreditCardForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
                setCardValidation({ isValid: false, cardType: null, errors: {} });
                setLoading(false);
            }, 1500);
        };

        // Get icons safely
        const icons = window.Icons || {};
        const { ShoppingCart, Search, Users, Plus, Minus, X, CreditCard, DollarSign, Percent } = icons;

        // Product Card Component
        const ProductCard = ({ product }) => {
            const isOutOfStock = product.stock <= 0;
            
            return React.createElement('button', {
                onClick: () => addToCart(product),
                disabled: isOutOfStock,
                className: `p-4 rounded-lg border-2 transition-all duration-200 ${
                    isOutOfStock
                        ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md active:scale-95 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`
            }, [
                React.createElement('div', { key: 'image-container', className: 'text-center mb-3' }, [
                    React.createElement('div', { className: 'text-4xl mb-2' }, product.image),
                    React.createElement('div', { 
                        key: 'stock-indicator',
                        className: `px-2 py-1 rounded-full text-xs font-medium ${
                            isOutOfStock 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                : product.stock <= 5 
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`
                    }, isOutOfStock ? 'Out of Stock' : product.stock <= 5 ? 'Low Stock' : 'In Stock')
                ]),
                
                React.createElement('div', { key: 'info', className: 'text-center' }, [
                    React.createElement('div', { key: 'name', className: 'font-medium text-sm mb-1 dark:text-white' }, product.name),
                    React.createElement('div', { key: 'brand', className: 'text-xs text-gray-500 dark:text-gray-400 mb-2' }, product.brand),
                    React.createElement('div', { key: 'price', className: 'text-blue-600 dark:text-blue-400 font-bold text-lg' }, `$${parseFloat(product.price).toFixed(2)}`),
                    React.createElement('div', { key: 'stock', className: 'text-xs text-gray-500 dark:text-gray-400 mt-1' }, `Stock: ${product.stock}`)
                ])
            ]);
        };

        return React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6 h-full' }, [
            // Products Section
            React.createElement('div', { key: 'products', className: 'lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700' }, [
                React.createElement('div', { key: 'header', className: 'p-6 border-b dark:border-gray-700' }, [
                    React.createElement('div', { key: 'title', className: 'mb-4' }, [
                        React.createElement('h2', { className: 'text-xl font-bold dark:text-white' }, 'Products'),
                        React.createElement('p', { className: 'text-gray-600 dark:text-gray-300 text-sm' }, `${filteredProducts.length} products available`)
                    ]),
                    React.createElement('div', { key: 'controls', className: 'flex flex-col sm:flex-row gap-4' }, [
                        React.createElement('div', { key: 'search', className: 'relative flex-1' }, [
                            Search && React.createElement(Search, { 
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
                    className: 'p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto' 
                }, filteredProducts.map(product =>
                    React.createElement(ProductCard, { key: product.id, product })
                ))
            ]),

            // Cart Section
            React.createElement('div', { key: 'cart', className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 flex flex-col' }, [
                React.createElement('div', { key: 'cart-header', className: 'p-6 border-b dark:border-gray-700' }, [
                    React.createElement('h2', { className: 'text-xl font-bold flex items-center gap-2 dark:text-white' }, [
                        ShoppingCart && React.createElement(ShoppingCart, { key: 'cart-icon', size: 24 }),
                        `Cart (${cart.length})`
                    ])
                ]),
                
                React.createElement('div', { key: 'cart-content', className: 'flex-1 p-6' }, [
                    // Customer section placeholder
                    React.createElement('div', { key: 'customer-section', className: 'mb-4 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400' }, 
                        'Customer loyalty integration available in full version'
                    ),

                    // Cart items
                    cart.length === 0 ? (
                        React.createElement('div', { className: 'text-center text-gray-400 py-8' }, [
                            ShoppingCart && React.createElement(ShoppingCart, { key: 'empty-icon', size: 48, className: 'mx-auto mb-4 opacity-30' }),
                            React.createElement('p', { key: 'empty-text', className: 'text-lg' }, 'Cart is empty'),
                            React.createElement('p', { key: 'empty-subtext', className: 'text-sm mt-2' }, 'Add products to get started')
                        ])
                    ) : (
                        React.createElement('div', { className: 'space-y-3 mb-6' }, cart.map(item =>
                            React.createElement('div', { 
                                key: item.id,
                                className: 'flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600' 
                            }, [
                                React.createElement('div', { key: 'item-emoji', className: 'text-2xl' }, item.image),
                                React.createElement('div', { key: 'item-info', className: 'flex-1' }, [
                                    React.createElement('div', { className: 'font-medium dark:text-white' }, item.name),
                                    React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, `$${parseFloat(item.price).toFixed(2)} each`)
                                ]),
                                React.createElement('div', { key: 'item-controls', className: 'flex items-center gap-2' }, [
                                    Minus && React.createElement('button', {
                                        onClick: () => updateQuantity(item.id, item.quantity - 1),
                                        className: 'w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500'
                                    }, React.createElement(Minus, { size: 16 })),
                                    React.createElement('span', { className: 'w-8 text-center font-medium dark:text-white' }, item.quantity),
                                    Plus && React.createElement('button', {
                                        onClick: () => updateQuantity(item.id, item.quantity + 1),
                                        className: 'w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500'
                                    }, React.createElement(Plus, { size: 16 })),
                                    X && React.createElement('button', {
                                        onClick: () => removeFromCart(item.id),
                                        className: 'w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800 ml-2'
                                    }, React.createElement(X, { size: 16 }))
                                ])
                            ])
                        ))
                    ),

                    cart.length > 0 && [
                        // Discount Section
                        React.createElement('div', { key: 'discount', className: 'border-t dark:border-gray-600 pt-4 mb-4' }, [
                            React.createElement('h4', { className: 'font-medium mb-3 dark:text-white flex items-center gap-2' }, [
                                Percent && React.createElement(Percent, { size: 18 }),
                                'Discount'
                            ]),
                            React.createElement('div', { className: 'grid grid-cols-3 gap-2 mb-2' }, [
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
                            discount > 0 && React.createElement('div', { className: 'text-sm text-green-600 dark:text-green-400 font-medium' }, 
                                `Discount Applied: -$${discount.toFixed(2)}`
                            )
                        ]),

                        // Totals
                        React.createElement('div', { key: 'totals', className: 'border-t dark:border-gray-600 pt-4 space-y-2 mb-6' }, [
                            React.createElement('div', { className: 'flex justify-between dark:text-white' }, [
                                React.createElement('span', { key: 'subtotal-label' }, 'Subtotal:'),
                                React.createElement('span', { key: 'subtotal-value' }, `$${subtotal.toFixed(2)}`)
                            ]),
                            discount > 0 && React.createElement('div', { className: 'flex justify-between text-green-600 dark:text-green-400' }, [
                                React.createElement('span', { key: 'discount-label' }, 'Discount:'),
                                React.createElement('span', { key: 'discount-value' }, `-$${discount.toFixed(2)}`)
                            ]),
                            React.createElement('div', { className: 'flex justify-between dark:text-white' }, [
                                React.createElement('span', { key: 'tax-label' }, 'Tax:'),
                                React.createElement('span', { key: 'tax-value' }, `$${tax.toFixed(2)}`)
                            ]),
                            React.createElement('div', { className: 'flex justify-between font-bold text-lg border-t dark:border-gray-600 pt-2 dark:text-white' }, [
                                React.createElement('span', { key: 'total-label' }, 'Total:'),
                                React.createElement('span', { key: 'total-value' }, `$${total.toFixed(2)}`)
                            ])
                        ]),

                        // Payment Section
                        React.createElement('div', { key: 'payment', className: 'space-y-4' }, [
                            React.createElement('div', { key: 'payment-method' }, [
                                React.createElement('label', { className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Payment Method'),
                                React.createElement('select', {
                                    value: paymentMethod,
                                    onChange: (e) => setPaymentMethod(e.target.value),
                                    className: 'w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                }, [
                                    React.createElement('option', { key: 'cash', value: 'cash' }, 'Cash'),
                                    React.createElement('option', { key: 'card', value: 'card' }, 'Credit/Debit Card'),
                                    React.createElement('option', { key: 'mobile', value: 'mobile' }, 'Mobile Payment')
                                ])
                            ]),

                            // Cash Payment
                            paymentMethod === 'cash' && React.createElement('div', { key: 'cash-payment' }, [
                                React.createElement('label', { className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Amount Received'),
                                React.createElement('input', {
                                    type: 'number',
                                    step: '0.01',
                                    min: total.toFixed(2),
                                    value: amountReceived,
                                    onChange: (e) => setAmountReceived(e.target.value),
                                    placeholder: total.toFixed(2),
                                    className: 'w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                }),
                                amountReceived && parseFloat(amountReceived) >= total && React.createElement('div', {
                                    className: 'mt-2 text-green-600 dark:text-green-400 font-medium'
                                }, `Change: $${change.toFixed(2)}`)
                            ]),

                            // Credit Card Payment
                            paymentMethod === 'card' && React.createElement('div', { key: 'card-payment', className: 'space-y-3' }, [
                                React.createElement('input', {
                                    type: 'text',
                                    value: creditCardForm.cardholderName,
                                    onChange: (e) => handleCreditCardChange('cardholderName', e.target.value),
                                    placeholder: 'Cardholder Name',
                                    className: 'w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                }),
                                React.createElement('div', { className: 'relative' }, [
                                    React.createElement('input', {
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
                                    cardValidation.cardType && React.createElement('div', {
                                        className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-blue-600 dark:text-blue-400'
                                    }, cardValidation.cardType)
                                ]),
                                React.createElement('div', { className: 'grid grid-cols-2 gap-3' }, [
                                    React.createElement('input', {
                                        type: 'text',
                                        value: creditCardForm.expiryDate,
                                        onChange: (e) => handleCreditCardChange('expiryDate', e.target.value),
                                        placeholder: 'MM/YY',
                                        className: 'w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                    }),
                                    React.createElement('input', {
                                        type: 'text',
                                        value: creditCardForm.cvv,
                                        onChange: (e) => handleCreditCardChange('cvv', e.target.value),
                                        placeholder: 'CVV',
                                        className: 'w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                    })
                                ]),
                                creditCardForm.cardNumber && React.createElement('div', { 
                                    className: `p-3 rounded-lg border ${
                                        cardValidation.isValid 
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
                                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                                    }`
                                }, [
                                    React.createElement('div', { className: 'flex items-center gap-2' }, [
                                        React.createElement('span', { className: 'font-medium' }, 
                                            cardValidation.isValid ? '✓ Card Valid' : '✗ Card Invalid'
                                        ),
                                        cardValidation.cardType && React.createElement('span', { className: 'text-sm' }, 
                                            `(${cardValidation.cardType})`
                                        )
                                    ])
                                ])
                            ]),

                            // Mobile Payment
                            paymentMethod === 'mobile' && React.createElement('div', { key: 'mobile-payment', className: 'p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg' }, [
                                React.createElement('p', { className: 'text-blue-800 dark:text-blue-200 text-sm' }, 
                                    'Customer will pay using mobile payment (Apple Pay, Google Pay, etc.)'
                                )
                            ]),

                            // Action Buttons
                            React.createElement('div', { key: 'action-buttons', className: 'flex gap-2 pt-4' }, [
                                React.createElement('button', {
                                    onClick: clearCart,
                                    className: 'flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
                                }, 'Clear Cart'),
                                React.createElement('button', {
                                    onClick: processPayment,
                                    disabled: loading || (
                                        paymentMethod === 'cash' && parseFloat(amountReceived) < total
                                    ) || (
                                        paymentMethod === 'card' && (!cardValidation.isValid || !creditCardForm.cardholderName.trim())
                                    ),
                                    className: 'flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2'
                                }, [
                                    loading && React.createElement('div', { 
                                        className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white' 
                                    }),
                                    paymentMethod === 'card' && CreditCard ? React.createElement(CreditCard, { size: 18 }) : 
                                        DollarSign ? React.createElement(DollarSign, { size: 18 }) : null,
                                    loading ? 'Processing...' : `Pay ${total.toFixed(2)}`
                                ])
                            ])
                        ])
                    ]
                ])
            ])
        ]);
    };

    // Add the enhanced view creation to the main app
    if (window.POSApp) {
        // If main app exists, add the enhanced POS
        window.POSApp.createEnhancedPOS = createEnhancedPOSView;
    }
};

// Auto-create the enhanced POS view
createEnhancedPOSView();