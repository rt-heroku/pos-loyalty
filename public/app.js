/**
 * POS Application - Main Application Component
 * 
 * The main application component that orchestrates the entire POS system:
 * - User authentication and session management
 * - Multi-location support with location switching
 * - Navigation between different views (POS, Sales, Inventory, etc.)
 * - Global state management for the application
 * - User settings and preferences
 * - Dark mode theme management
 * 
 * Features:
 * - JWT-based authentication
 * - Location-based data filtering
 * - Responsive navigation
 * - User profile management
 * - Theme switching (light/dark mode)
 * - Real-time data synchronization
 * - Error handling and user feedback
 * 
 * Views:
 * - POSView: Main point of sale interface
 * - SalesView: Sales history and analytics
 * - InventoryView: Product and inventory management
 * - LoyaltyView: Customer loyalty program management
 * - SettingsView: System configuration and settings
 * 
 * @author Rodrigo Torres
 * @version 1.0.0
 * @since 2025-01-11
 */

// Updated main POS Application with Settings and Multi-Location Support
// This replaces the existing app.js

const { useState, useEffect } = React;

const POSApp = () => {
    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [setupRequired, setSetupRequired] = useState(false);
    
    // Debug: Make currentUser available in console
    React.useEffect(() => {
        if (currentUser) {
            window.currentUser = currentUser;
            console.log('Current user updated:', currentUser);
            console.log('Stored user ps_user_id =',localStorage.getItem('pos_user_id'));

        }
    }, [currentUser]);
    
    // Load orders when orders view is active
    React.useEffect(() => {
        if (currentView === 'orders' && selectedLocation) {
            refreshOrders();
        }
    }, [currentView, selectedLocation]);
    
    const [authLoading, setAuthLoading] = useState(true);

    // Enhanced state management
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    
    // Voucher state for receipt
    const [appliedVouchers, setAppliedVouchers] = useState([]);
    const [voucherDiscounts, setVoucherDiscounts] = useState(0);
    const [userSettings, setUserSettings] = useState({
        theme_mode: 'light',
        selected_location_id: null
    });
    
    const [analytics, setAnalytics] = useState({
        totalSales: 0,
        todaySales: 0,
        transactionCount: 0,
        lowStockCount: 0,
        totalCustomers: 0,
        activeCustomers: 0
    });
    
    // App state
    const [currentView, setCurrentView] = useState('settings'); // Start with settings for initial setup
    const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(true);
    const [loading, setLoading] = useState(false);
    const [appLoading, setAppLoading] = useState(true);
    
    // POS state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [taxRate, setTaxRate] = useState('');
    const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percentage'
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastTransaction, setLastTransaction] = useState(null);

    // Loyalty system states
    const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
    const [loyaltyNumber, setLoyaltyNumber] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [loyaltySearchTerm, setLoyaltySearchTerm] = useState('');
    const [customerHistory, setCustomerHistory] = useState([]);
    const [showCustomerHistory, setShowCustomerHistory] = useState(false);
    
    // Orders system states
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [currentOrderNumber, setCurrentOrderNumber] = useState(null);
    
    // Navigation states
    const [showOperationsDropdown, setShowOperationsDropdown] = useState(false);
    
    const [newCustomerForm, setNewCustomerForm] = useState({
        name: '', email: '', phone: ''
    });
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

    // Inventory/Products states
    const [detailedProducts, setDetailedProducts] = useState([]);
    const [productFilters, setProductFilters] = useState({});
    const [searchFilters, setSearchFilters] = useState({});
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [productViewMode, setProductViewMode] = useState('grid');


    //Customer Management
    const [showCustomerFormModal, setShowCustomerFormModal] = useState(false);
    const [showCustomerDeleteModal, setShowCustomerDeleteModal] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [customerToDelete, setCustomerToDelete] = useState(null);


    // Generate user identifier for settings
    const getUserId = () => {
        // Get the actual user ID from stored user data
        const userData = localStorage.getItem('user_data');
        if (!userData) {
            throw new Error('User data not found');
        }
        try {
            const user = JSON.parse(userData);
            if (!user || !user.id) {
                throw new Error('User ID not found in user data');
            }
            return user.id; // Return numeric user ID, not username
        } catch (error) {
            console.error('Error parsing user data:', error);
            throw new Error('Invalid user data');
        }
    };

    // Check authentication on app load
    useEffect(() => {
        checkAuthentication();
    }, []);

    // Check if user is authenticated
    const checkAuthentication = async () => {
        // First check if setup is required
        try {
            const setupResponse = await fetch('/api/setup/status');
            const setupData = await setupResponse.json();
            
            if (setupData.setupRequired) {
                setSetupRequired(true);
                setAuthLoading(false);
                return;
            }
        } catch (error) {
            console.error('Error checking setup status:', error);
            // Continue with normal auth check if setup check fails
        }
        
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        const tokenExpires = localStorage.getItem('token_expires');

        if (token && userData && tokenExpires) {
            const expiresAt = new Date(tokenExpires);
            if (expiresAt > new Date()) {
                setCurrentUser(JSON.parse(userData));
                setIsAuthenticated(true);
                // Don't call initializeApp here, let the useEffect handle it
            } else {
                // Token expired, clear storage
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_data');
                localStorage.removeItem('token_expires');
            }
        }
        setAuthLoading(false);
    };

    // Handle successful login
    const handleLoginSuccess = (authData) => {
        setCurrentUser(authData.user);
        setIsAuthenticated(true);
        localStorage.setItem('pos_user_id', authData.user.username);
        // Don't call initializeApp here, let the useEffect handle it
    };

    // Handle logout
    const handleLogout = () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setCart([]);
        setSelectedLocation(null);
        setCurrentView('pos');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('token_expires');
        localStorage.removeItem('pos_user_id');
    };

    // Initial app setup
    useEffect(() => {
        if (isAuthenticated) {
            initializeApp();
        }
    }, [isAuthenticated]);

    // Apply theme when settings change
    useEffect(() => {
        if (userSettings.theme_mode === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
        }
    }, [userSettings.theme_mode]);

    // Refresh products when POS tab is selected (like inventory tab does)
    useEffect(() => {
        if (currentView === 'pos' && isAuthenticated && selectedLocation) {
            loadDetailedProducts();
        }
    }, [currentView, isAuthenticated, selectedLocation]);

    // Initialize theme from localStorage
    const initializeTheme = () => {
        // Check for theme in localStorage first (for immediate application)
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
        }
    };

    // Initialize the application
    const initializeApp = async () => {
        try {
            setAppLoading(true);
            
            // Initialize theme
            initializeTheme();
            
            // Check if setup is required (this endpoint doesn't require auth)
            const setupStatus = await fetch('/api/setup/status').then(r => r.json());
            setIsFirstTimeSetup(setupStatus.setupRequired);
            
            // Load initial data only if authenticated
            if (isAuthenticated && currentUser) {
                await Promise.all([
                    loadLocations(),
                    loadUserSettings(),
                    loadCustomers(),
                    loadDetailedProducts(),
                    loadProductFilters()
                ]);
                
                // If not first-time setup, load location-specific data
                if (!setupStatus.setupRequired) {
                    const userSettings = await loadUserSettings();
                    if (userSettings.selected_location_id) {
                        const locations = await loadLocations();
                        const selectedLoc = locations.find(l => l.id === userSettings.selected_location_id);
                        if (selectedLoc) {
                            setSelectedLocation(selectedLoc);
                            await loadLocationSpecificData(selectedLoc.id);
                            setCurrentView('pos'); // Switch to POS view after setup
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            // Don't show alert for auth errors, just log them
            if (!error.message.includes('Authentication required')) {
                window.NotificationManager.error('Application Error', 'Failed to initialize application. Please refresh the page. Error: ' + error.message);
            }
        } finally {
            setAppLoading(false);
        }
    };

    // Data loading functions
    const loadLocations = async () => {
        try {
            const data = await window.API.call('/locations');
            setLocations(data);
            return data;
        } catch (error) {
            console.error('Failed to load locations:', error);
            return [];
        }
    };

    const loadUserSettings = async () => {
        try {
            const userId = getUserId();
            const data = await window.API.call(`/settings/${userId}`);
            setUserSettings(data);
            
            // Apply theme immediately when settings are loaded
            if (data.theme_mode === 'dark') {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            
            return data;
        } catch (error) {
            console.error('Failed to load user settings:', error);
            return { theme_mode: 'light' };
        }
    };

    const loadLocationSpecificData = async (locationId) => {
        try {
            await Promise.all([
                loadProducts(locationId),
                loadTransactions(locationId),
                loadAnalytics(locationId)
            ]);
        } catch (error) {
            console.error('Failed to load location-specific data:', error);
        }
    };

    const loadProducts = async (locationId) => {
        try {
            const data = await window.API.call('/products');
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products:', error);
            setProducts([]); // Set empty array on error
        }
    };

    const loadTransactions = async (locationId) => {
        try {
            const data = await window.API.call(`/transactions/location/${locationId}`);
            setTransactions(data);
        } catch (error) {
            console.error('Failed to load transactions:', error);
            setTransactions([]); // Set empty array on error
        }
    };

    const loadAnalytics = async (locationId) => {
        try {
            const data = await window.API.call(`/analytics/${locationId}`);
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            setAnalytics({
                totalSales: 0,
                todaySales: 0,
                transactionCount: 0,
                lowStockCount: 0,
                totalCustomers: 0,
                activeCustomers: 0
            }); // Set default values on error
        }
    };

    const loadCustomers = async () => {
        try {
            const data = await window.API.customers.getAll();
            setCustomers(data);
        } catch (error) {
            console.error('Failed to load customers:', error);
            setCustomers([]); // Set empty array on error
        }
    };

    const loadDetailedProducts = async () => {
        try {
            setLoading(true);
            try {
                console.log('Loading detailed products...');
                const data = await window.API.products.getDetailed();
                console.log('Detailed products loaded:', data.length, 'products');
                console.log('First product features:', data[0]?.features);
                console.log('First product images:', data[0]?.images);
                setDetailedProducts(data);
            } catch (detailedError) {
                console.error('Failed to load detailed products, falling back to basic:', detailedError);
                const basicProducts = await window.API.products.getAll();
                const enhancedProducts = basicProducts.map(product => ({
                    ...product,
                    images: [], features: [], sku: product.sku || `SKU-${product.id}`,
                    brand: product.brand || '', collection: product.collection || '',
                    material: product.material || '', color: product.color || '',
                    product_type: product.product_type || product.category,
                    description: product.description || '', is_active: product.is_active !== false,
                    featured: product.featured || false
                }));
                setDetailedProducts(enhancedProducts);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            setDetailedProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const loadProductFilters = async () => {
        try {
            const filters = await window.API.products.getFilters();
            setProductFilters(filters);
        } catch (error) {
            console.error('Failed to load product filters:', error);
            setProductFilters({
                collections: [], brands: [], materials: [], productTypes: [], colors: []
            });
        }
    };

    // Location management functions
    const handleLocationChange = async (location) => {
        if (!location) return;
        
        setLoading(true);
        try {
            // Update selected location
            setSelectedLocation(location);
            
            // Save to user settings
            const userId = getUserId();
            const token = localStorage.getItem('auth_token');
            await window.API.call(`/settings/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ selected_location_id: location.id })
            });
            
            // Load location-specific data
            await loadLocationSpecificData(location.id);
            
            // Clear cart when switching locations
            setCart([]);
            
            // If this was first-time setup, switch to POS view
            if (isFirstTimeSetup) {
                setIsFirstTimeSetup(false);
                setCurrentView('pos');
            }
            
        } catch (error) {
            console.error('Failed to change location:', error);
            window.NotificationManager.error('Location Error', 'Failed to switch location. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLocation = async (locationData) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const newLocation = await window.API.call('/locations', {
                method: 'POST',
                body: JSON.stringify(locationData)
            });
            
            // Reload locations
            await loadLocations();
            
            // Auto-select the new location
            await handleLocationChange(newLocation);
            
            window.NotificationManager.success('Location Created', 'Location created successfully!');
        } catch (error) {
            console.error('Failed to create location:', error);
            window.NotificationManager.error('Location Creation Failed', error.message || 'Failed to create location');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLocation = async (locationId, locationData) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const updatedLocation = await window.API.call(`/locations/${locationId}`, {
                method: 'PUT',
                body: JSON.stringify(locationData)
            });
            
            // Reload locations
            await loadLocations();
            
            // Update selected location if it was the one being edited
            if (selectedLocation?.id === locationId) {
                setSelectedLocation(updatedLocation);
            }
            
            window.NotificationManager.success('Location Updated', 'Location updated successfully!');
        } catch (error) {
            console.error('Failed to update location:', error);
            window.NotificationManager.error('Location Update Failed', error.message || 'Failed to update location');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (locationId, logoBase64) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            await window.API.call(`/locations/${locationId}/logo`, {
                method: 'PUT',
                body: JSON.stringify({ logo_base64: logoBase64 })
            });
            
            // Reload locations and update selected location
            await loadLocations();
            if (selectedLocation?.id === locationId) {
                const locations = await loadLocations();
                const updatedLocation = locations.find(loc => loc.id === locationId);
                if (updatedLocation) {
                    setSelectedLocation(updatedLocation);
                }
            }
            
            window.NotificationManager.success('Logo Updated', 'Logo updated successfully!');
        } catch (error) {
            console.error('Failed to upload logo:', error);
            window.NotificationManager.error('Logo Upload Failed', 'Failed to upload logo');
        } finally {
            setLoading(false);
        }
    };

    const handleThemeToggle = async (theme) => {
        try {
            // Apply theme immediately
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark');
            }
            
            // Update React state
            setUserSettings(prev => ({
                ...prev,
                theme_mode: theme
            }));
            
            // Save to localStorage
            localStorage.setItem('theme', theme);
            
            // Update server settings
            const token = localStorage.getItem('auth_token');
            const userId = getUserId();
            await window.API.call(`/settings/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ theme_mode: theme })
            });
        } catch (error) {
            console.error('Failed to update theme:', error);
        }
    };

    // Enhanced cart functions with location support
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
        
        const product = products.find(p => p.id === id);
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
        setLoyaltyNumber('');
        setAppliedVouchers([]);
        setVoucherDiscounts(0);
    };

    // Enhanced calculations with discount support
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = discountType === 'percentage' 
        ? subtotal * (parseFloat(discountAmount) || 0) / 100
        : parseFloat(discountAmount) || 0;
    const discountedSubtotal = Math.max(0, subtotal - discount - voucherDiscounts);
    const effectiveTaxRate = taxRate ? parseFloat(taxRate) / 100 : (selectedLocation?.tax_rate || 0.08);
    const tax = discountedSubtotal * effectiveTaxRate;
    const total = discountedSubtotal + tax;
    
    // Debug logging
    console.log('App calculations:', { subtotal, discount, voucherDiscounts, discountedSubtotal, tax, total, cart });
    const change = parseFloat(amountReceived) - total;
    const categories = ['All', ...new Set(products.map(p => p.category))];

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Enhanced payment processing with location and discount support
    const processPayment = async () => {
        if (cart.length === 0) return;
        if (!selectedLocation) {
            window.NotificationManager.warning('Location Required', 'Please select a location first');
            return;
        }
        if (paymentMethod === 'cash' && parseFloat(amountReceived) < total) {
            window.NotificationManager.warning('Payment Error', 'Insufficient amount received');
            return;
        }

        setLoading(true);
        try {
            const transactionData = {
                items: cart,
                subtotal,
                tax,
                total,
                paymentMethod,
                customerId: selectedCustomer?.id || null,
                amountReceived: parseFloat(amountReceived) || total,
                change: paymentMethod === 'cash' ? Math.max(0, change) : 0,
                locationId: selectedLocation.id,
                discountAmount: discount,
                discountType: discountAmount ? discountType : null,
                discountReason: discountAmount ? 'Manual discount' : null,
                appliedVouchers: appliedVouchers || [],
                voucherDiscounts: voucherDiscounts || 0
            };

            // Add credit card info if applicable
            if (paymentMethod === 'card') {
                // This would typically come from a credit card input form
                // For now, we'll leave it null - implement credit card form later
                transactionData.cardLastFour = null;
                transactionData.cardType = null;
                transactionData.paymentReference = null;
            }

            // Create transaction
            const transaction = await window.API.transactions.create(transactionData);

            // Handle order creation or linking
            if (currentOrderNumber) {
                // If there's a current order (loaded from "Move to Cart"), link the transaction to it
                console.log('🔗 Linking transaction to existing order:', currentOrderNumber);
                
                // Find the order by order_number
                const ordersResponse = await window.API.call(`/orders?search=${currentOrderNumber}`);
                if (ordersResponse && ordersResponse.length > 0) {
                    const existingOrder = ordersResponse[0];
                    
                    // Link transaction to order
                    await window.API.call(`/orders/${existingOrder.id}/transaction`, {
                        method: 'PATCH',
                        body: JSON.stringify({ transaction_id: transaction.id })
                    });
                    
                    console.log('✅ Transaction linked to order:', existingOrder.order_number);
                    window.NotificationManager.success('Order Completed', `Order ${existingOrder.order_number} completed successfully`);
                }
                
                // Clear the current order reference
                setCurrentOrderNumber(null);
            } else {
                // Create a new order for this transaction
                console.log('📦 Creating new order for transaction:', transaction.id);
                
                const orderData = {
                    customer_id: selectedCustomer?.id || null,
                    location_id: selectedLocation.id,
                    status: 'completed',
                    origin: 'pos',
                    subtotal: subtotal,
                    discount_amount: discount,
                    tax_amount: tax,
                    total_amount: total,
                    voucher_id: appliedVouchers && appliedVouchers.length > 0 ? appliedVouchers[0].id : null,
                    voucher_discount: voucherDiscounts || 0,
                    payment_method: paymentMethod,
                    transaction_id: transaction.id,
                    created_by: currentUser?.id || null,
                    items: cart.map(item => ({
                        product_id: item.id,
                        product_name: item.name,
                        product_sku: item.sku,
                        product_image_url: item.image || item.main_image_url,
                        quantity: item.quantity,
                        unit_price: item.price,
                        tax_amount: (item.price * item.quantity * (taxRate / 100)),
                        discount_amount: 0,
                        voucher_discount: 0,
                        total_price: item.price * item.quantity
                    }))
                };

                const order = await window.API.call('/orders', {
                    method: 'POST',
                    body: JSON.stringify(orderData)
                });
                
                console.log('✅ Order created:', order.order_number);
            }

            // Refresh data
            await Promise.all([
                loadProducts(selectedLocation.id),
                loadTransactions(selectedLocation.id),
                loadAnalytics(selectedLocation.id)
            ]);

            setLastTransaction({
                ...transaction,
                items: cart,
                customer: selectedCustomer,
                discount
            });
            
            // Store the current values for the receipt before clearing cart
            setLastTransaction({
                ...transactionData,
                subtotal: subtotal,
                tax: tax,
                total: total,
                appliedVouchers: appliedVouchers,
                voucherDiscounts: voucherDiscounts
            });
            
            setShowReceipt(true);
            clearCart();
        } catch (error) {
            console.error('Failed to process payment:', error);
            window.NotificationManager.error('Payment Failed', 'Failed to process payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Loyalty system functions
    const searchCustomerByLoyalty = async (loyaltyNum) => {
        if (!loyaltyNum.trim()) return;
        
        try {
            setLoading(true);
            const customer = await window.API.customers.getByLoyalty(loyaltyNum);
            setSelectedCustomer(customer);
            setLoyaltyNumber(loyaltyNum);
            setShowLoyaltyModal(false);
        } catch (error) {
            if (error.message.includes('404')) {
                setNewCustomerForm({ ...newCustomerForm, loyaltyNumber: loyaltyNum.toUpperCase() });
                setShowNewCustomerForm(true);
            } else {
                console.error('Failed to search customer:', error);
                alert('Error searching for customer');
            }
        } finally {
            setLoading(false);
        }
    };

    const createNewCustomer = async () => {
        if (!newCustomerForm.name.trim()) {
            alert('Customer name is required');
            return;
        }

        try {
            setLoading(true);
            const customer = await window.API.loyalty.createCustomer({
                loyaltyNumber: newCustomerForm.loyaltyNumber || loyaltyNumber,
                name: newCustomerForm.name,
                email: newCustomerForm.email,
                phone: newCustomerForm.phone
            });
            
            setSelectedCustomer(customer);
            setLoyaltyNumber(customer.loyalty_number);
            setShowNewCustomerForm(false);
            setShowLoyaltyModal(false);
            setNewCustomerForm({ name: '', email: '', phone: '' });
            await loadCustomers();
            alert('New customer created successfully!');
        } catch (error) {
            console.error('Failed to create customer:', error);
            alert('Failed to create customer');
        } finally {
            setLoading(false);
        }
    };

    const searchCustomers = async (query) => {
        if (!query.trim()) {
            setCustomerSearchResults([]);
            return;
        }

        try {
            const results = await window.API.customers.search(query);
            setCustomerSearchResults(results);
        } catch (error) {
            console.error('Failed to search customers:', error);
            setCustomerSearchResults([]);
        }
    };

    const loadCustomerHistory = async (customerId) => {
        try {
            setLoading(true);
            const history = await window.API.customers.getHistory(customerId);
            setCustomerHistory(history);
            setShowCustomerHistory(true);
        } catch (error) {
            console.error('Failed to load customer history:', error);
            alert('Failed to load customer history');
        } finally {
            setLoading(false);
        }
    };

    // Product management functions
    const handleAddProduct = () => {
        setCurrentProduct(null);
        setShowProductModal(true);
    };

    const handleEditProduct = async (product) => {
        try {
            // Fetch detailed product data with features and images
            const detailedProduct = await window.API.products.getById(product.id);
            setCurrentProduct(detailedProduct);
            setShowProductModal(true);
        } catch (error) {
            console.error('Failed to load detailed product:', error);
            // Fallback to basic product data
            setCurrentProduct(product);
            setShowProductModal(true);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        try {
            setLoading(true);
            await window.API.products.delete(productId);
            await Promise.all([
                loadDetailedProducts(),
                loadProducts(selectedLocation?.id),
                loadProductFilters()
            ]);
            alert('Product deleted successfully!');
        } catch (error) {
            console.error('Failed to delete product:', error);
            alert('Failed to delete product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async (productData) => {
        try {
            setLoading(true);
            
            if (currentProduct) {
                try {
                    await window.API.products.updateEnhanced(currentProduct.id, productData);
                } catch (enhancedError) {
                    const basicData = {
                        name: productData.name, price: productData.price,
                        category: productData.category, stock: productData.stock,
                        image: productData.image
                    };
                    await window.API.products.update(currentProduct.id, basicData);
                }
            } else {
                try {
                    await window.API.products.createEnhanced(productData);
                } catch (enhancedError) {
                    const basicData = {
                        name: productData.name, price: productData.price,
                        category: productData.category, stock: productData.stock,
                        image: productData.image
                    };
                    await window.API.products.create(basicData);
                }
            }
            
            setShowProductModal(false);
            setCurrentProduct(null);
            await Promise.all([
                loadDetailedProducts(),
                loadProducts(selectedLocation?.id),
                loadProductFilters()
            ]);
            
            alert(currentProduct ? 'Product updated successfully!' : 'Product created successfully!');
        } catch (error) {
            console.error('Failed to save product:', error);
            alert('Failed to save product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpdate = async (productIds, updates) => {
        try {
            setLoading(true);
            
            try {
                await window.API.products.bulkUpdate(productIds, updates);
            } catch (bulkError) {
                for (const productId of productIds) {
                    try {
                        await window.API.products.update(productId, updates);
                    } catch (updateError) {
                        console.error(`Failed to update product ${productId}:`, updateError);
                    }
                }
            }
            
            setSelectedProducts([]);
            await Promise.all([
                loadDetailedProducts(),
                loadProducts(selectedLocation?.id),
                loadProductFilters()
            ]);
            alert(`${productIds.length} products updated successfully!`);
        } catch (error) {
            console.error('Failed to bulk update products:', error);
            alert('Failed to update some products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicateProduct = async (productId) => {
        try {
            setLoading(true);
            
            try {
                await window.API.products.duplicate(productId);
            } catch (duplicateError) {
                const originalProduct = detailedProducts.find(p => p.id === productId);
                if (originalProduct) {
                    const duplicateData = {
                        name: `${originalProduct.name} (Copy)`,
                        price: originalProduct.price,
                        category: originalProduct.category,
                        stock: 0,
                        image: originalProduct.image
                    };
                    await window.API.products.create(duplicateData);
                }
            }
            
            await Promise.all([
                loadDetailedProducts(),
                loadProducts(selectedLocation?.id),
                loadProductFilters()
            ]);
            alert('Product duplicated successfully!');
        } catch (error) {
            console.error('Failed to duplicate product:', error);
            alert('Failed to duplicate product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const searchProducts = async (filters) => {
        try {
            setLoading(true);
            try {
                const data = await window.API.products.search(filters);
                setDetailedProducts(data);
            } catch (searchError) {
                const allProducts = await window.API.products.getAll();
                const filteredProducts = allProducts.filter(product => {
                    if (filters.q && !product.name.toLowerCase().includes(filters.q.toLowerCase())) return false;
                    if (filters.category && product.category !== filters.category) return false;
                    if (filters.minPrice && product.price < parseFloat(filters.minPrice)) return false;
                    if (filters.maxPrice && product.price > parseFloat(filters.maxPrice)) return false;
                    if (filters.inStock === 'true' && product.stock <= 0) return false;
                    return true;
                });
                
                const enhancedProducts = filteredProducts.map(product => ({
                    ...product, images: [], features: [], sku: product.sku || `SKU-${product.id}`,
                    brand: product.brand || '', is_active: product.is_active !== false,
                    featured: product.featured || false
                }));
                
                setDetailedProducts(enhancedProducts);
            }
        } catch (error) {
            console.error('Failed to search products:', error);
            setDetailedProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Event handlers
    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setLoyaltyNumber(customer.loyalty_number);
        setShowLoyaltyModal(false);
        setCustomerSearchResults([]);
        setLoyaltySearchTerm('');
    };

    const handleRemoveCustomer = () => {
        setSelectedCustomer(null);
        setLoyaltyNumber('');
    };

    const handleLoyaltySearch = (query) => {
        setLoyaltySearchTerm(query);
        searchCustomers(query);
    };

    const handleProductSelect = (productId, selected) => {
        setSelectedProducts(prev => 
            selected ? [...prev, productId] : prev.filter(id => id !== productId)
        );
    };

    const handleSelectAllProducts = (selected) => {
        setSelectedProducts(selected ? detailedProducts.map(p => p.id) : []);
    };

    const handleFilterChange = (newFilters) => {
        setSearchFilters(newFilters);
        searchProducts(newFilters);
    };

    const handleViewModeChange = (mode) => {
        setProductViewMode(mode);
    };

    // Navigation Component
    const NavButton = ({ view, icon: Icon, label, active, requiredPermission, isMobile = false }) => {
        // Check if user has permission for this view
        if (requiredPermission && currentUser) {
            const [module, action] = requiredPermission.split(':');
            if (!currentUser.permissions[module] || !currentUser.permissions[module][action]) {
                return null; // Don't render button if no permission
            }
        }

        if (isMobile) {
            return React.createElement('button', {
                onClick: () => setCurrentView(view),
                className: `mobile-nav-item touch-button ${active ? 'active' : 'text-gray-600'}`
            }, [
                React.createElement(Icon, { key: 'icon', size: 24 }),
                React.createElement('span', { key: 'label', className: 'mt-1' }, label)
            ]);
        }

        return React.createElement('button', {
            onClick: () => setCurrentView(view),
            className: `flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                active 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`
        }, [
            React.createElement(Icon, { key: 'icon', size: 20 }),
            React.createElement('span', { key: 'label', className: 'font-medium' }, label)
        ]);
    };

    // Customer management functions - add these to your POSApp component

    const refreshCustomers = async () => {
        try {
            setLoading(true);
            const data = await window.API.customers.getAll();
            setCustomers(data);
        } catch (error) {
            console.error('Failed to load customers:', error);
            alert('Failed to load customers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNewCustomer = () => {
        console.log('handleAddNewCustomer -> New Customer Pushed');
        setCurrentCustomer(null);
        setShowCustomerFormModal(true);
    };

    const handleEditCustomer = (customer) => {
        console.log('handleAddNewCustomer -> Edit Customer Pushed');
        setCurrentCustomer(customer);
        setShowCustomerFormModal(true);
    };

    const handleSaveCustomer = async (customerData, avatarData = null) => {
        try {
            setLoading(true);
            
            // console.log('handleSaveCustomer called with:', {
            //     customerData,
            //     avatarData,
            //     hasAvatar: !!avatarData,
            //     isEdit: !!currentCustomer
            // });
            
            if (currentCustomer) {
                // Update existing customer
                // console.log('Updating existing customer:', currentCustomer.id);
                await window.API.customers.update(currentCustomer.id, customerData);
                
                // Handle avatar upload if provided
                if (avatarData) {
                    console.log('Uploading avatar for existing customer:', currentCustomer.id);
                    try {
                        const avatarResponse = await window.API.call(`/customers/${currentCustomer.id}/avatar`, {
                            method: 'POST',
                            body: JSON.stringify(avatarData)
                        });
                        console.log('Avatar upload response:', avatarResponse);
                    } catch (avatarError) {
                        console.error('Avatar upload failed:', avatarError);
                        window.NotificationManager.warning('Avatar Upload Failed', 'Customer saved but avatar upload failed: ' + avatarError.message);
                    }
                } else {
                    console.log('No avatar data provided for existing customer');
                }
                
                window.NotificationManager.success('Customer Updated', 'Customer information updated successfully');
            } else {
                // Create new customer
                // console.log('Creating new customer');
                const response = await window.API.customers.createEnhanced(customerData);
                // console.log('New customer response:', response);
                
                // Handle avatar upload if provided and we have a customer ID
                if (avatarData && response && response.id) {
                    // console.log('Uploading avatar for new customer:', response.id);
                    try {
                        const avatarResponse = await window.API.call(`/customers/${response.id}/avatar`, {
                            method: 'POST',
                            body: JSON.stringify(avatarData)
                        });
                        // console.log('Avatar upload response:', avatarResponse);
                    } catch (avatarError) {
                        console.error('Avatar upload failed:', avatarError);
                        window.NotificationManager.warning('Avatar Upload Failed', 'Customer created but avatar upload failed: ' + avatarError.message);
                    }
                } else {
                    console.log('No avatar data or customer ID for new customer:', { avatarData: !!avatarData, responseId: response?.id });
                }
                
                window.NotificationManager.success('Customer Created', 'New customer added successfully');
            }
            
            // Refresh customer list
            await refreshCustomers();
            
            // Close modal
            setShowCustomerFormModal(false);
            setCurrentCustomer(null);
            
        } catch (error) {
            console.error('Error saving customer:', error);
            window.NotificationManager.error('Save Failed', error.message || 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCustomer = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setCustomerToDelete(customer);
            setShowCustomerDeleteModal(true);
        }
    };

    const handleConfirmDeleteCustomer = async (customerId) => {
        try {
            setLoading(true);
            
            await window.API.customers.delete(customerId);
            
            // Refresh customer list
            await refreshCustomers();
            
            // Close modal
            setShowCustomerDeleteModal(false);
            setCustomerToDelete(null);
            
            alert('Customer deleted successfully!');
            
        } catch (error) {
            console.error('Failed to delete customer:', error);
            
            if (error.message.includes('existing transactions')) {
                alert('Cannot delete customer with existing purchase history. Consider deactivating instead.');
            } else {
                alert('Failed to delete customer. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Orders management functions
    const refreshOrders = async () => {
        try {
            setOrdersLoading(true);
            const params = new URLSearchParams();
            if (selectedLocation) {
                params.append('location_id', selectedLocation.id);
            }
            const response = await window.API.call(`/orders?${params.toString()}`);
            setOrders(response);
        } catch (error) {
            console.error('Failed to load orders:', error);
            window.NotificationManager.error('Failed to load orders', error.message);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleLoadOrderToCart = async (order) => {
        try {
            console.log('🛒 Loading order to cart:', order.order_number);
            console.log('📦 Order items:', order.items);
            
            // Clear current cart and reset all related state
            clearCart(); // Use the clearCart function to ensure everything is reset
            setCurrentOrderNumber(order.order_number);
            
            // Load order items into cart
            const cartItems = order.items.map(item => {
                console.log('📝 Mapping item:', {
                    id: item.product_id,
                    name: item.product_name,
                    price: item.unit_price,
                    quantity: item.quantity,
                    image: item.product_image_url
                });
                
                return {
                    id: item.product_id,
                    name: item.product_name,
                    price: parseFloat(item.unit_price),
                    quantity: item.quantity,
                    image: item.product_image_url,
                    main_image_url: item.product_image_url, // Add both for compatibility
                    sku: item.product_sku
                };
            });
            
            console.log('✅ Cart items to set:', cartItems);
            setCart(cartItems);
            
            // Load customer if exists - try multiple methods to find the customer
            let customerLoaded = false;
            
            // Method 1: Try to load customer by customer_id
            if (order.customer_id) {
                try {
                    const customerData = await window.API.call(`/customers/${order.customer_id}`);
                    setSelectedCustomer(customerData);
                    setLoyaltyNumber(customerData.loyalty_number || '');
                    console.log('👤 Customer loaded by ID:', customerData.name);
                    customerLoaded = true;
                } catch (err) {
                    console.error('Failed to load customer by ID:', err);
                }
            }
            
            // Method 2: If customer not loaded by ID, try to find by loyalty number
            if (!customerLoaded && order.customer_loyalty_number && order.customer_loyalty_number !== 'GUEST') {
                try {
                    console.log('🔍 Attempting to find customer by loyalty number:', order.customer_loyalty_number);
                    const customerData = await window.API.customers.getByLoyalty(order.customer_loyalty_number);
                    setSelectedCustomer(customerData);
                    setLoyaltyNumber(customerData.loyalty_number || '');
                    console.log('👤 Customer loaded by loyalty number:', customerData.name);
                    customerLoaded = true;
                } catch (err) {
                    console.error('Failed to load customer by loyalty number:', err);
                }
            }
            
            // Method 3: If still no customer but we have email, try to find by email
            if (!customerLoaded && order.customer_email && order.customer_email !== 'GUEST') {
                try {
                    console.log('🔍 Attempting to find customer by email:', order.customer_email);
                    // Search for customer by email
                    const searchResults = await window.API.call(`/customers/search?email=${encodeURIComponent(order.customer_email)}`);
                    if (searchResults && searchResults.length > 0) {
                        setSelectedCustomer(searchResults[0]);
                        setLoyaltyNumber(searchResults[0].loyalty_number || '');
                        console.log('👤 Customer loaded by email:', searchResults[0].name);
                        customerLoaded = true;
                    }
                } catch (err) {
                    console.error('Failed to load customer by email:', err);
                }
            }
            
            if (!customerLoaded) {
                console.log('⚠️ No customer could be loaded for this order');
            }
            
            // Switch to POS view
            setCurrentView('pos');
            
            window.NotificationManager.success('Order Loaded', `Order ${order.order_number} loaded to cart`);
        } catch (error) {
            console.error('❌ Failed to load order to cart:', error);
            window.NotificationManager.error('Failed to load order', error.message);
        }
    };

    const handleCloseCustomerModal = () => {
        setShowCustomerFormModal(false);
        setCurrentCustomer(null);
    };

    const handleCloseDeleteModal = () => {
        setShowCustomerDeleteModal(false);
        setCustomerToDelete(null);
    };

    // Enhanced loyalty search with customer management
    const searchCustomersByLoyalty = async (loyaltyNum) => {
        if (!loyaltyNum.trim()) {
            setCustomerSearchResults([]);
            return;
        }
        
        try {
            setLoading(true);
            
            // Try exact loyalty number match first
            try {
                const customer = await window.API.customers.getByLoyalty(loyaltyNum);
                setCustomerSearchResults([customer]);
                return;
            } catch (loyaltyError) {
                // If not found, do a general search
                if (loyaltyError.message.includes('404')) {
                    const results = await window.API.customers.search(loyaltyNum);
                    setCustomerSearchResults(results);
                    
                    if (results.length === 0) {
                        // Offer to create new customer
                        setNewCustomerForm({ 
                            ...newCustomerForm, 
                            loyalty_number: loyaltyNum.toUpperCase() 
                        });
                        setShowNewCustomerForm(true);
                    }
                } else {
                    throw loyaltyError;
                }
            }
        } catch (error) {
            console.error('Failed to search customers:', error);
            alert('Error searching for customers');
            setCustomerSearchResults([]);
        } finally {
            setLoading(false);
        }
    };



    // Optional: Add customer stats to your analytics or create a new dashboard section
    const loadCustomerStats = async () => {
        try {
            const stats = await window.API.customers.getStats();
            // You can use these stats in your dashboard or analytics view
            console.log('Customer Stats:', stats);
            return stats;
        } catch (error) {
            console.error('Failed to load customer stats:', error);
            return null;
        }
    };

    // Enhanced customer search for advanced filtering (optional)
    const performAdvancedCustomerSearch = async (filters) => {
        try {
            setLoading(true);
            const results = await window.API.customers.advancedSearch(filters);
            setCustomers(results.customers);
            return results;
        } catch (error) {
            console.error('Failed to perform advanced customer search:', error);
            alert('Failed to search customers');
            return { customers: [], total: 0 };
        } finally {
            setLoading(false);
        }
    };


    // Get icons
    const { ShoppingCart, Award, Package, BarChart3, Settings, Tag, ChevronDown, ChevronUp } = window.Icons;

    // Authentication loading screen
    if (authLoading) {
        return React.createElement('div', { 
            className: 'min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center' 
        }, [
            React.createElement('div', { key: 'loading', className: 'text-center' }, [
                React.createElement('div', { 
                    key: 'spinner',
                    className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4' 
                }),
                React.createElement('p', { 
                    key: 'text',
                    className: 'text-gray-600 dark:text-gray-300 text-lg' 
                }, 'Checking Authentication...')
            ])
        ]);
    }

    // Show setup wizard if setup is required
    if (setupRequired) {
        return React.createElement(window.Auth.SetupView, {
            onSetupComplete: () => {
                setSetupRequired(false);
                window.location.reload(); // Reload to show login
            }
        });
    }
    
    // Show login screen if not authenticated
    if (!isAuthenticated) {
        return React.createElement(window.Auth.LoginView, {
            onLoginSuccess: handleLoginSuccess
        });
    }

    // Loading screen for initial app load
    if (appLoading) {
        return React.createElement('div', { 
            className: 'min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center' 
        }, [
            React.createElement('div', { key: 'loading', className: 'text-center' }, [
                React.createElement('div', { 
                    key: 'spinner',
                    className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4' 
                }),
                React.createElement('p', { 
                    key: 'text',
                    className: 'text-gray-600 dark:text-gray-300 text-lg' 
                }, 'Loading POS System...'),
                React.createElement('p', { 
                    key: 'subtext',
                    className: 'text-gray-500 dark:text-gray-400 text-sm mt-2' 
                }, 'Initializing locations and settings')
            ])
        ]);
    }

    // First-time setup screen
    if (isFirstTimeSetup) {
        return React.createElement('div', { 
            className: 'min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center' 
        }, [
            React.createElement('div', { 
                key: 'setup',
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full mx-4' 
            }, [
                React.createElement('div', { key: 'header', className: 'text-center mb-6' }, [
                    React.createElement(Settings, { 
                        key: 'icon',
                        className: 'mx-auto mb-4 text-blue-600', 
                        size: 48 
                    }),
                    React.createElement('h2', { 
                        key: 'title',
                        className: 'text-2xl font-bold text-gray-900 dark:text-white mb-2' 
                    }, 'Welcome to POS System'),
                    React.createElement('p', { 
                        key: 'subtitle',
                        className: 'text-gray-600 dark:text-gray-300' 
                    }, 'Let\'s set up your first location to get started')
                ]),
                React.createElement('button', {
                    key: 'setup-btn',
                    onClick: () => setCurrentView('settings'),
                    className: 'w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
                }, 'Set Up Location')
            ])
        ]);
    }

    // Main render
    return React.createElement('div', { className: 'min-h-screen bg-white dark:bg-gray-900' }, [
        // Notification Container
        React.createElement(window.Components.NotificationContainer, { key: 'notification-container' }),
        // Header (hidden on mobile)
        React.createElement('header', { 
            key: 'header', 
            className: 'fixed top-0 left-0 right-0 z-[60] bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 hidden lg:block' 
        }, [
            React.createElement('div', { key: 'header-container', className: 'w-full px-6 py-4' }, [
                React.createElement('div', { key: 'header-content', className: 'flex items-center justify-between' }, [
                    React.createElement('div', { key: 'logo-section', className: 'flex items-center gap-3' }, [
                        // Location logo
                        selectedLocation?.logo_base64 && React.createElement('img', {
                            key: 'location-logo',
                            src: selectedLocation.logo_base64,
                            alt: 'Store logo',
                            className: 'h-16 w-auto object-contain'
                        }),
                        React.createElement('div', { key: 'titles' }, [
                            React.createElement('h1', { 
                                key: 'main-title',
                                className: 'text-2xl font-bold text-gray-900 dark:text-white' 
                            }, 'POS System'),
                            selectedLocation && React.createElement('p', { 
                                key: 'location-info',
                                className: 'text-sm text-gray-600 dark:text-gray-300' 
                            }, `${selectedLocation.store_name} • ${selectedLocation.store_code}`),
                            currentUser && React.createElement('p', { 
                                key: 'user-info',
                                className: 'text-xs text-gray-500 dark:text-gray-400' 
                            }, `Logged in as: ${currentUser.first_name} ${currentUser.last_name} (${currentUser.role})`)
                        ])
                    ]),
                    React.createElement('div', { key: 'nav', className: 'flex items-center gap-4' }, [
                        // POS Button
                        React.createElement(NavButton, { 
                            key: 'pos-nav',
                            view: 'pos', 
                            icon: ShoppingCart, 
                            label: 'POS', 
                            active: currentView === 'pos',
                            requiredPermission: 'pos:read'
                        }),
                        
                        // Operations Dropdown - Only show if location is selected
                        selectedLocation && React.createElement('div', {
                            key: 'operations-dropdown',
                            className: 'relative'
                        }, [
                            React.createElement('button', {
                                key: 'operations-btn',
                                onClick: () => setShowOperationsDropdown(!showOperationsDropdown),
                                className: `flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                                    ['loyalty', 'promotions', 'inventory', 'orders', 'sales', 'dashboard'].includes(currentView)
                                        ? 'bg-blue-600 text-white shadow-lg' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`
                            }, [
                                React.createElement(Package, { key: 'ops-icon', size: 20 }),
                                React.createElement('span', { key: 'ops-label', className: 'font-medium' }, 'Operations'),
                                React.createElement(ChevronDown, { key: 'ops-chevron', size: 16 })
                            ]),
                            
                            // Dropdown menu
                            showOperationsDropdown && React.createElement('div', {
                                key: 'operations-menu',
                                className: 'absolute top-full mt-2 right-0 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50'
                            }, [
                                React.createElement('button', {
                                    key: 'menu-loyalty',
                                    onClick: () => {
                                        setCurrentView('loyalty');
                                        setShowOperationsDropdown(false);
                                    },
                                    className: 'w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }, [
                                    React.createElement(Award, { key: 'loyalty-icon', size: 18 }),
                                    React.createElement('span', { key: 'loyalty-text' }, 'Loyalty')
                                ]),
                                React.createElement('button', {
                                    key: 'menu-promotions',
                                    onClick: () => {
                                        setCurrentView('promotions');
                                        setShowOperationsDropdown(false);
                                    },
                                    className: 'w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }, [
                                    React.createElement(Tag, { key: 'promotions-icon', size: 18 }),
                                    React.createElement('span', { key: 'promotions-text' }, 'Promotions')
                                ]),
                                React.createElement('button', {
                                    key: 'menu-products',
                                    onClick: () => {
                                        setCurrentView('inventory');
                                        setShowOperationsDropdown(false);
                                    },
                                    className: 'w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }, [
                                    React.createElement(Package, { key: 'products-icon', size: 18 }),
                                    React.createElement('span', { key: 'products-text' }, 'Products')
                                ]),
                                React.createElement('button', {
                                    key: 'menu-orders',
                                    onClick: () => {
                                        setCurrentView('orders');
                                        setShowOperationsDropdown(false);
                                    },
                                    className: 'w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }, [
                                    React.createElement(ShoppingCart, { key: 'orders-icon', size: 18 }),
                                    React.createElement('span', { key: 'orders-text' }, 'Orders')
                                ]),
                                React.createElement('div', {
                                    key: 'menu-divider',
                                    className: 'border-t border-gray-200 dark:border-gray-700 my-2'
                                }),
                                React.createElement('button', {
                                    key: 'menu-sales',
                                    onClick: () => {
                                        setCurrentView('sales');
                                        setShowOperationsDropdown(false);
                                    },
                                    className: 'w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }, [
                                    React.createElement(BarChart3, { key: 'sales-icon', size: 18 }),
                                    React.createElement('span', { key: 'sales-text' }, 'Sales Report')
                                ]),
                                React.createElement('button', {
                                    key: 'menu-dashboard',
                                    onClick: () => {
                                        setCurrentView('dashboard');
                                        setShowOperationsDropdown(false);
                                    },
                                    className: 'w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }, [
                                    React.createElement(BarChart3, { key: 'dashboard-icon', size: 18 }),
                                    React.createElement('span', { key: 'dashboard-text' }, 'Dashboard')
                                ])
                            ])
                        ]),
                        
                        // Settings Button
                        React.createElement(NavButton, { 
                            key: 'settings-nav',
                            view: 'settings', 
                            icon: Settings, 
                            label: 'Settings', 
                            active: currentView === 'settings',
                            requiredPermission: 'settings:read'
                        }),
                        // Theme toggle button
                        React.createElement('button', {
                            key: 'desktop-theme-toggle',
                            onClick: () => handleThemeToggle(userSettings?.theme_mode === 'dark' ? 'light' : 'dark'),
                            className: `p-2 rounded-lg transition-colors ${
                                userSettings?.theme_mode === 'dark' 
                                    ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`,
                            title: userSettings?.theme_mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'
                        }, userSettings?.theme_mode === 'dark' ? '☀️' : '🌙'),

                    ])
                ])
            ])
        ]),

        // Mobile Header
        React.createElement('header', { 
            key: 'mobile-header', 
            className: 'fixed top-0 left-0 right-0 z-[60] bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 lg:hidden safe-area-top' 
        }, [
            React.createElement('div', { key: 'mobile-header-container', className: 'w-full px-4 py-3' }, [
                React.createElement('div', { key: 'mobile-header-content', className: 'flex items-center justify-between' }, [
                    React.createElement('div', { key: 'mobile-logo-section', className: 'flex items-center gap-2' }, [
                        selectedLocation?.logo_base64 && React.createElement('img', {
                            key: 'mobile-location-logo',
                            src: selectedLocation.logo_base64,
                            alt: 'Store logo',
                            className: 'h-12 w-auto object-contain'
                        }),
                        React.createElement('div', { key: 'mobile-titles' }, [
                            React.createElement('h1', { 
                                key: 'mobile-main-title',
                                className: 'text-lg font-bold text-gray-900 dark:text-white' 
                            }, 'POS System'),
                            selectedLocation && React.createElement('p', { 
                                key: 'mobile-location-info',
                                className: 'text-xs text-gray-600 dark:text-gray-300' 
                            }, selectedLocation.store_name)
                        ])
                    ]),
                    React.createElement('div', { key: 'mobile-user-info', className: 'text-right flex items-center gap-2' }, [
                        // Theme toggle button
                        React.createElement('button', {
                            key: 'mobile-theme-toggle',
                            onClick: () => handleThemeToggle(userSettings?.theme_mode === 'dark' ? 'light' : 'dark'),
                            className: 'p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors',
                            title: userSettings?.theme_mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'
                        }, userSettings?.theme_mode === 'dark' ? '☀️' : '🌙'),
                        React.createElement('div', { key: 'mobile-user-details' }, [
                            currentUser && React.createElement('p', { 
                                key: 'mobile-user-name',
                                className: 'text-sm font-medium text-gray-900 dark:text-white' 
                            }, `${currentUser.first_name} ${currentUser.last_name}`),
                            React.createElement('p', { 
                                key: 'mobile-current-view',
                                className: 'text-xs text-gray-500 dark:text-gray-400 capitalize' 
                            }, currentView)
                        ])
                    ])
                ])
            ])
        ]),

        // Main Content
        React.createElement('main', { key: 'main', className: 'pos-container p-2 pb-20 lg:pb-6 pt-4 lg:pt-28 min-h-screen' }, [
            currentView === 'pos' && selectedLocation && React.createElement(window.Views.POSView, { 
                key: 'pos-view',
                products: filteredProducts,
                cart,
                selectedCustomer,
                currentOrderNumber,
                searchTerm, setSearchTerm,
                selectedCategory, setSelectedCategory,
                categories,
                onAddToCart: addToCart,
                onUpdateQuantity: updateQuantity,
                onRemoveFromCart: removeFromCart,
                onClearCart: clearCart,
                onShowLoyaltyModal: () => setShowLoyaltyModal(true),
                onLoadCustomerHistory: loadCustomerHistory,
                onRemoveCustomer: handleRemoveCustomer,
                subtotal: discountedSubtotal,
                tax, total,
                taxRate, setTaxRate,
                discount, discountAmount, setDiscountAmount,
                appliedVouchers, setAppliedVouchers,
                voucherDiscounts, setVoucherDiscounts,
                discountType, setDiscountType,
                paymentMethod, setPaymentMethod,
                amountReceived, setAmountReceived,
                change,
                onProcessPayment: processPayment,
                loading
            }),
            
            // currentView === 'loyalty' && React.createElement(window.Views.LoyaltyView, { 
            //     key: 'loyalty-view',
            //     loyaltyNumber, setLoyaltyNumber,
            //     onSearchByLoyalty: searchCustomerByLoyalty,
            //     loyaltySearchTerm, setLoyaltySearchTerm: handleLoyaltySearch,
            //     customerSearchResults,
            //     onLoadCustomerHistory: loadCustomerHistory,
            //     loading
            // }),
            
            currentView === 'loyalty' && window.Views.LoyaltyView && React.createElement(window.Views.LoyaltyView, { 
                key: 'loyalty-view',
                loyaltyNumber, 
                setLoyaltyNumber,
                onSearchByLoyalty: searchCustomersByLoyalty, // Updated function
                loyaltySearchTerm, 
                setLoyaltySearchTerm: handleLoyaltySearch,
                customerSearchResults,
                onLoadCustomerHistory: loadCustomerHistory,
                // New customer management props
                customers,
                onRefreshCustomers: refreshCustomers,
                onEditCustomer: handleEditCustomer,
                onDeleteCustomer: handleDeleteCustomer,
                onAddNewCustomer: handleAddNewCustomer,
                loading
            }),

            // Orders View
            currentView === 'orders' && React.createElement(window.Views.OrdersView, {
                key: 'orders-view',
                orders,
                loading: ordersLoading,
                onLoadToCart: handleLoadOrderToCart,
                onRefresh: refreshOrders,
                selectedLocation
            }),

            // Promotions View
            currentView === 'promotions' && React.createElement(window.Views.PromotionsView, {
                key: 'promotions-view'
            }),

            currentView === 'inventory' && React.createElement(window.Views.InventoryView, { 
                key: 'inventory-view',
                products: detailedProducts, filters: productFilters, loading,
                onAddProduct: handleAddProduct, onEditProduct: handleEditProduct,
                onDeleteProduct: handleDeleteProduct, onBulkUpdate: handleBulkUpdate,
                onDuplicateProduct: handleDuplicateProduct, searchFilters,
                onFilterChange: handleFilterChange, selectedProducts,
                onProductSelect: handleProductSelect, onSelectAll: handleSelectAllProducts,
                showProductModal, onShowProductModal: handleAddProduct,
                onCloseProductModal: () => setShowProductModal(false), currentProduct,
                viewMode: productViewMode, onViewModeChange: handleViewModeChange
            }),

            currentView === 'sales' && selectedLocation && React.createElement(window.Views.SalesView, { 
                key: 'sales-view',
                analytics, transactions
            }),

            currentView === 'dashboard' && selectedLocation && React.createElement(window.Views.DashboardView, { 
                key: 'dashboard-view',
                selectedLocation
            }),

            currentView === 'settings' && React.createElement(window.Views.SettingsView, { 
                key: 'settings-view',
                locations, selectedLocation, userSettings,
                onLocationChange: handleLocationChange,
                onCreateLocation: handleCreateLocation,
                onUpdateLocation: handleUpdateLocation,
                onThemeToggle: handleThemeToggle,
                onLogoUpload: handleLogoUpload,
                loading,
                currentUser,
                onLogout: handleLogout
            }),



            // Show message if no location selected for POS/Sales views
            (currentView === 'pos' || currentView === 'sales') && !selectedLocation && 
                React.createElement('div', { 
                    key: 'no-location',
                    className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-12 text-center' 
                }, [
                    React.createElement(Settings, { 
                        key: 'icon',
                        className: 'mx-auto mb-4 text-gray-400', 
                        size: 64 
                    }),
                    React.createElement('h3', { 
                        key: 'title',
                        className: 'text-xl font-semibold text-gray-900 dark:text-white mb-2' 
                    }, 'No Location Selected'),
                    React.createElement('p', { 
                        key: 'description',
                        className: 'text-gray-600 dark:text-gray-300 mb-6' 
                    }, 'Please select a location in Settings to use this feature'),
                    React.createElement('button', {
                        key: 'go-settings',
                        onClick: () => setCurrentView('settings'),
                        className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    }, 'Go to Settings')
                ])
        ]),

        // Mobile Navigation (hidden on desktop)
        React.createElement('nav', { 
            key: 'mobile-nav', 
            className: 'mobile-nav safe-area-bottom' 
        }, [
            React.createElement('div', { key: 'mobile-nav-container', className: 'flex justify-around' }, [
                React.createElement(NavButton, { 
                    key: 'mobile-pos-nav',
                    view: 'pos', 
                    icon: ShoppingCart, 
                    label: 'POS', 
                    active: currentView === 'pos',
                    requiredPermission: 'pos:read',
                    isMobile: true
                }),
                React.createElement(NavButton, { 
                    key: 'mobile-orders-nav',
                    view: 'orders', 
                    icon: Package, 
                    label: 'Orders', 
                    active: currentView === 'orders',
                    requiredPermission: 'pos:read',
                    isMobile: true
                }),
                React.createElement(NavButton, { 
                    key: 'mobile-inventory-nav',
                    view: 'inventory', 
                    icon: Package, 
                    label: 'Products', 
                    active: currentView === 'inventory',
                    requiredPermission: 'inventory:read',
                    isMobile: true
                }),
                React.createElement(NavButton, { 
                    key: 'mobile-settings-nav',
                    view: 'settings', 
                    icon: Settings, 
                    label: 'Settings', 
                    active: currentView === 'settings',
                    requiredPermission: 'settings:read',
                    isMobile: true
                })
            ])
        ]),

        // Modals
        React.createElement(window.Modals.CustomerFormModal, {
            key: 'customer-form-modal',
            show: showCustomerFormModal,
            onClose: handleCloseCustomerModal,
            customer: currentCustomer,
            onSave: handleSaveCustomer,
            loading
        }),

        React.createElement(window.Modals.CustomerDeleteModal, {
            key: 'customer-delete-modal',
            show: showCustomerDeleteModal,
            onClose: handleCloseDeleteModal,
            customer: customerToDelete,
            onConfirm: handleConfirmDeleteCustomer,
            loading
        }),

        React.createElement(window.Modals.LoyaltyModal, { 
            key: 'loyalty-modal',
            show: showLoyaltyModal, onClose: () => setShowLoyaltyModal(false),
            loyaltyNumber, setLoyaltyNumber, onSearchByLoyalty: searchCustomerByLoyalty,
            loyaltySearchTerm, setLoyaltySearchTerm, onSearchCustomers: searchCustomers,
            customerSearchResults, onSelectCustomer: handleSelectCustomer, loading
        }),
                
        React.createElement(window.Modals.CustomerHistoryModal, { 
            key: 'history-modal',
            show: showCustomerHistory, onClose: () => setShowCustomerHistory(false),
            customerHistory, loading
        }),
        
        React.createElement(window.Modals.ReceiptModal, { 
            key: 'receipt-modal',
            show: showReceipt, onClose: () => setShowReceipt(false),
            transaction: lastTransaction, 
            subtotal: lastTransaction?.subtotal || subtotal, 
            tax: lastTransaction?.tax || tax, 
            total: lastTransaction?.total || total,
            paymentMethod, amountReceived, change, discount,
            appliedVouchers: lastTransaction?.appliedVouchers || appliedVouchers, 
            voucherDiscounts: lastTransaction?.voucherDiscounts || voucherDiscounts
        }),

        React.createElement(window.Modals.ProductModal, {
            key: 'product-modal',
            show: showProductModal,
            onClose: () => {
                setShowProductModal(false);
                setCurrentProduct(null);
            },
            product: currentProduct,
            onSave: handleSaveProduct,
            loading,
            filters: productFilters
        }),

        // Loading Overlay
        loading && React.createElement('div', {
            key: 'loading-overlay',
            className: 'fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'
        }, [
            React.createElement('div', { 
                key: 'loading-content',
                className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center gap-3' 
            }, [
                React.createElement('div', { 
                    key: 'loading-spinner',
                    className: 'animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600' 
                }),
                React.createElement('span', { 
                    key: 'loading-text',
                    className: 'text-gray-700 dark:text-gray-300' 
                }, 'Loading...')
            ])
        ])
    ]);

};

// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(POSApp));
    });
} else {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(POSApp));
}