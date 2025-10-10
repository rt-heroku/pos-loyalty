/**
 * API Client Module
 * 
 * Provides a centralized API client for the POS system with the following capabilities:
 * - Generic API call function with authentication
 * - CRUD operations for customers, products, sales, and inventory
 * - System settings management
 * - Location management
 * - User authentication and management
 * - Error handling and response processing
 * 
 * Features:
 * - Automatic token-based authentication
 * - Request/response interceptors
 * - Error handling with user-friendly messages
 * - Support for GET, POST, PUT, DELETE operations
 * - JSON request/response handling
 * 
 * @author Rodrigo Torres
 * @version 1.0.0
 * @since 2025-01-11
 */

// public/api.js - API functions
window.API = {
    BASE_URL: '/api',

    // Generic API call function
    call: async function(endpoint, options = {}) {
        try {
            const token = localStorage.getItem('auth_token');
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers,
            };

            // Add authorization header if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                headers,
                ...options,
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid, redirect to login
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');
                    localStorage.removeItem('token_expires');
                    window.location.reload();
                    throw new Error('Authentication required');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    },

    // Products
    products: {
        // Existing functions
        getAll: () => window.API.call('/products'),
        create: (product) => window.API.call('/products', {
            method: 'POST',
            body: JSON.stringify(product)
        }),
        update: (id, product) => window.API.call(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        }),
        delete: (id) => window.API.call(`/products/${id}`, {
            method: 'DELETE'
        }),

        // Enhanced functions
        getDetailed: () => window.API.call('/products/detailed'),
        getById: (id) => window.API.call(`/products/${id}/detailed`),
        createEnhanced: (product) => window.API.call('/products/enhanced', {
            method: 'POST',
            body: JSON.stringify(product)
        }),
        updateEnhanced: (id, product) => window.API.call(`/products/${id}/enhanced`, {
            method: 'PUT',
            body: JSON.stringify(product)
        }),
        getFilters: () => window.API.call('/products/filters'),
        search: (params) => {
            const queryString = new URLSearchParams(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
            ).toString();
            return window.API.call(`/products/search?${queryString}`);
        },
        bulkUpdate: (productIds, updates) => window.API.call('/products/bulk-update', {
            method: 'PUT',
            body: JSON.stringify({ productIds, updates })
        }),
        getLowStock: (threshold = 10) => window.API.call(`/products/low-stock?threshold=${threshold}`),
        duplicate: (id) => window.API.call(`/products/${id}/duplicate`, {
            method: 'POST'
        })
    },
    // Customers
    customers: {
        getAll: () => window.API.call('/customers'),
        getByLoyalty: (loyaltyNumber) => window.API.call(`/customers/loyalty/${loyaltyNumber}`),
        search: (query) => window.API.call(`/customers/search/${query}`),
        getHistory: (id) => window.API.call(`/customers/${id}/history`),
        create: (customer) => window.API.call('/customers', {
            method: 'POST',
            body: JSON.stringify(customer)
        })
    },

    // Loyalty
    loyalty: {
        getDetails: (loyaltyNumber) => window.API.call(`/loyalty/${loyaltyNumber}`),
        createCustomer: (customerData) => window.API.call('/loyalty/create', {
            method: 'POST',
            body: JSON.stringify(customerData)
        })
    },

    // Transactions
    transactions: {
        getAll: () => window.API.call('/transactions'),
        create: (transaction) => window.API.call('/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction)
        })
    },

    // Analytics
    analytics: {
        get: () => window.API.call('/analytics')
    },

};

window.API.customers.update = (id, customerData) => window.API.call(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData)
});

window.API.customers.delete = (id) => window.API.call(`/customers/${id}`, {
    method: 'DELETE'
});

window.API.customers.createEnhanced = (customerData) => window.API.call('/customers/enhanced', {
    method: 'POST',
    body: JSON.stringify(customerData)
});

window.API.customers.getStats = () => window.API.call('/customers/stats');

window.API.customers.advancedSearch = (filters) => {
    const queryString = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
    ).toString();
    return window.API.call(`/customers/advanced-search?${queryString}`);
};

// System Settings API with encryption support
window.API.systemSettings = {
    // Get all system settings (with automatic decryption)
    getAll: async function() {
        const settings = await window.API.call('/system-settings');
        // Decrypt encrypted settings
        const decryptedSettings = await Promise.all(
            settings.map(async (setting) => {
                if (setting.is_encrypted && window.CryptoUtils) {
                    try {
                        const decryptedValue = await window.CryptoUtils.decryptIfNeeded(setting.setting_value);
                        return { ...setting, setting_value: decryptedValue };
                    } catch (error) {
                        console.error(`Failed to decrypt setting ${setting.setting_key}:`, error);
                        return setting; // Return original if decryption fails
                    }
                }
                return setting;
            })
        );
        return decryptedSettings;
    },

    // Get a specific system setting (with automatic decryption)
    get: async function(key) {
        const setting = await window.API.call(`/system-settings/${key}`);
        if (setting && setting.is_encrypted && window.CryptoUtils) {
            try {
                const decryptedValue = await window.CryptoUtils.decryptIfNeeded(setting.setting_value);
                return { ...setting, setting_value: decryptedValue };
            } catch (error) {
                console.error(`Failed to decrypt setting ${key}:`, error);
                return setting; // Return original if decryption fails
            }
        }
        return setting;
    },

    // Create or update a system setting (with optional encryption)
    set: async function(key, value, options = {}) {
        const { encrypt = false, description = '', category = 'general', setting_type = 'text' } = options;
        
        let finalValue = value;
        let isEncrypted = false;
        
        // Encrypt the value if requested
        if (encrypt && window.CryptoUtils && value) {
            try {
                finalValue = await window.CryptoUtils.encryptIfNeeded(value);
                isEncrypted = true;
            } catch (error) {
                console.error(`Failed to encrypt setting ${key}:`, error);
                throw new Error('Failed to encrypt setting value');
            }
        }
        
        const settingData = {
            setting_key: key,
            setting_value: finalValue,
            description: description,
            category: category,
            setting_type: setting_type,
            is_encrypted: isEncrypted
        };
        
        return window.API.call('/system-settings', {
            method: 'POST',
            body: JSON.stringify(settingData)
        });
    },

    // Update an existing system setting (with optional encryption)
    update: async function(key, value, options = {}) {
        const { encrypt = false, description = '', category = 'general', setting_type = 'text' } = options;
        
        let finalValue = value;
        let isEncrypted = false;
        
        // Encrypt the value if requested
        if (encrypt && window.CryptoUtils && value) {
            try {
                finalValue = await window.CryptoUtils.encryptIfNeeded(value);
                isEncrypted = true;
            } catch (error) {
                console.error(`Failed to encrypt setting ${key}:`, error);
                throw new Error('Failed to encrypt setting value');
            }
        }
        
        const settingData = {
            setting_value: finalValue,
            description: description,
            category: category,
            setting_type: setting_type,
            is_encrypted: isEncrypted
        };
        
        return window.API.call(`/system-settings/${key}`, {
            method: 'PUT',
            body: JSON.stringify(settingData)
        });
    },

    // Delete a system setting
    delete: function(key) {
        return window.API.call(`/system-settings/${key}`, {
            method: 'DELETE'
        });
    }
};
