/**
 * Crypto Utils - Encryption/Decryption Utilities
 * 
 * Provides encryption and decryption functionality for sensitive system settings.
 * Uses AES-256-GCM encryption for secure storage of API keys, passwords, and other sensitive data.
 * 
 * Features:
 * - AES-256-GCM encryption with random IVs
 * - Base64 encoding for database storage
 * - Automatic key derivation from master key
 * - Secure random number generation
 * - Error handling for decryption failures
 * 
 * Security Notes:
 * - Each encrypted value uses a unique random IV
 * - Master key should be stored securely (environment variable)
 * - Encrypted values are base64 encoded for database storage
 * - Decryption automatically handles authentication tag verification
 * 
 * @author Rodrigo Torres
 * @version 1.0.0
 * @since 2025-01-11
 */

// Crypto utilities for encryption/decryption
window.CryptoUtils = {
    /**
     * Get the master encryption key from environment or generate a default
     * In production, this should come from a secure environment variable
     */
    getMasterKey: function() {
        // In production, use: process.env.ENCRYPTION_KEY
        // For demo purposes, using a fixed key (NOT recommended for production)
        const defaultKey = 'pos-system-encryption-key-2025-demo';
        return window.btoa(defaultKey).substring(0, 32); // Ensure 32 bytes
    },

    /**
     * Generate a random IV (Initialization Vector) for encryption
     * @returns {Uint8Array} Random 12-byte IV
     */
    generateIV: function() {
        return crypto.getRandomValues(new Uint8Array(12));
    },

    /**
     * Encrypt a string value using AES-256-GCM
     * @param {string} plaintext - The text to encrypt
     * @returns {string} Base64 encoded encrypted data with IV
     */
    encrypt: function(plaintext) {
        if (!plaintext || plaintext.trim() === '') {
            return '';
        }

        try {
            const key = this.getMasterKey();
            const iv = this.generateIV();
            
            // Convert key to CryptoKey
            const encoder = new TextEncoder();
            const keyData = encoder.encode(key);
            
            return crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            ).then(cryptoKey => {
                // Encrypt the data
                return crypto.subtle.encrypt(
                    {
                        name: 'AES-GCM',
                        iv: iv
                    },
                    cryptoKey,
                    encoder.encode(plaintext)
                );
            }).then(encrypted => {
                // Combine IV and encrypted data
                const combined = new Uint8Array(iv.length + encrypted.byteLength);
                combined.set(iv);
                combined.set(new Uint8Array(encrypted), iv.length);
                
                // Return base64 encoded result
                return btoa(String.fromCharCode(...combined));
            });
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    },

    /**
     * Decrypt a base64 encoded encrypted string
     * @param {string} encryptedData - Base64 encoded encrypted data with IV
     * @returns {Promise<string>} Decrypted plaintext
     */
    decrypt: function(encryptedData) {
        if (!encryptedData || encryptedData.trim() === '') {
            return Promise.resolve('');
        }

        try {
            const key = this.getMasterKey();
            
            // Decode base64 data
            const combined = new Uint8Array(
                atob(encryptedData).split('').map(char => char.charCodeAt(0))
            );
            
            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);
            
            // Convert key to CryptoKey
            const encoder = new TextEncoder();
            const keyData = encoder.encode(key);
            
            return crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            ).then(cryptoKey => {
                // Decrypt the data
                return crypto.subtle.decrypt(
                    {
                        name: 'AES-GCM',
                        iv: iv
                    },
                    cryptoKey,
                    encrypted
                );
            }).then(decrypted => {
                // Convert back to string
                const decoder = new TextDecoder();
                return decoder.decode(decrypted);
            });
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    },

    /**
     * Check if a string appears to be encrypted (base64 with proper length)
     * @param {string} value - The value to check
     * @returns {boolean} True if the value appears to be encrypted
     */
    isEncrypted: function(value) {
        if (!value || typeof value !== 'string') {
            return false;
        }
        
        try {
            // Check if it's valid base64
            const decoded = atob(value);
            // Encrypted data should be at least 12 bytes (IV) + some encrypted content
            return decoded.length >= 12;
        } catch (error) {
            return false;
        }
    },

    /**
     * Encrypt a value if it's not already encrypted
     * @param {string} value - The value to encrypt
     * @returns {Promise<string>} Encrypted value
     */
    encryptIfNeeded: function(value) {
        if (!value || this.isEncrypted(value)) {
            return Promise.resolve(value);
        }
        return this.encrypt(value);
    },

    /**
     * Decrypt a value if it appears to be encrypted
     * @param {string} value - The value to decrypt
     * @returns {Promise<string>} Decrypted value
     */
    decryptIfNeeded: function(value) {
        if (!value || !this.isEncrypted(value)) {
            return Promise.resolve(value);
        }
        return this.decrypt(value);
    }
};

// Fallback for browsers that don't support Web Crypto API
if (!window.crypto || !window.crypto.subtle) {
    console.warn('Web Crypto API not supported. Encryption features will be limited.');
    
    // Simple base64 encoding as fallback (NOT SECURE - for demo only)
    window.CryptoUtils = {
        encrypt: function(plaintext) {
            if (!plaintext) return '';
            return btoa(plaintext);
        },
        
        decrypt: function(encryptedData) {
            if (!encryptedData) return '';
            try {
                return atob(encryptedData);
            } catch (error) {
                return encryptedData; // Return as-is if not base64
            }
        },
        
        isEncrypted: function(value) {
            if (!value) return false;
            try {
                atob(value);
                return true;
            } catch (error) {
                return false;
            }
        },
        
        encryptIfNeeded: function(value) {
            if (!value || this.isEncrypted(value)) {
                return Promise.resolve(value);
            }
            return Promise.resolve(this.encrypt(value));
        },
        
        decryptIfNeeded: function(value) {
            if (!value || !this.isEncrypted(value)) {
                return Promise.resolve(value);
            }
            return Promise.resolve(this.decrypt(value));
        }
    };
}

