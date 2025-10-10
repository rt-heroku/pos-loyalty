// Data Validation Utility for Data Loader
// Handles validation of mapped data before import

class DataValidator {
    constructor() {
        // Define validation rules for each field type
        this.validationRules = {
            products: {
                name: { required: true, type: 'string', maxLength: 255 },
                price: { required: true, type: 'number', min: 0 },
                category: { required: true, type: 'string', maxLength: 100 },
                stock: { required: false, type: 'number', min: 0 },
                sku: { required: false, type: 'string', maxLength: 100 },
                product_type: { required: false, type: 'string', maxLength: 50 },
                brand: { required: false, type: 'string', maxLength: 100 },
                collection: { required: false, type: 'string', maxLength: 100 },
                material: { required: false, type: 'string', maxLength: 100 },
                color: { required: false, type: 'string', maxLength: 50 },
                description: { required: false, type: 'string', maxLength: 1000 },
                dimensions: { required: false, type: 'string', maxLength: 100 },
                weight: { required: false, type: 'number', min: 0 },
                warranty_info: { required: false, type: 'string', maxLength: 500 },
                care_instructions: { required: false, type: 'string', maxLength: 500 },
                main_image_url: { required: false, type: 'url' },
                is_active: { required: false, type: 'boolean' },
                featured: { required: false, type: 'boolean' }
            },
            customers: {
                loyalty_number: { required: false, type: 'string', maxLength: 50 },
                first_name: { required: true, type: 'string', maxLength: 100 },
                last_name: { required: true, type: 'string', maxLength: 100 },
                name: { required: false, type: 'string', maxLength: 200 },
                email: { required: true, type: 'email', maxLength: 255 },
                phone: { required: false, type: 'string', maxLength: 20 },
                points: { required: false, type: 'number', min: 0 },
                total_spent: { required: false, type: 'number', min: 0 },
                visit_count: { required: false, type: 'number', min: 0 },
                last_visit: { required: false, type: 'date' },
                member_type: { required: false, type: 'string', maxLength: 50 },
                member_status: { required: false, type: 'string', maxLength: 50 },
                enrollment_date: { required: false, type: 'date' },
                notes: { required: false, type: 'string', maxLength: 1000 }
            }
        };
    }

    /**
     * Validate a single row of data
     * @param {Object} rowData - Row data to validate
     * @param {string} type - Type of data ('products' or 'customers')
     * @returns {Object} Validation result
     */
    validateRow(rowData, type) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        const rules = this.validationRules[type] || {};
        
        for (const [field, value] of Object.entries(rowData)) {
            const rule = rules[field];
            if (!rule) continue;
            
            const fieldValidation = this.validateField(field, value, rule);
            if (!fieldValidation.isValid) {
                validation.isValid = false;
                validation.errors.push(...fieldValidation.errors);
            }
            if (fieldValidation.warnings.length > 0) {
                validation.warnings.push(...fieldValidation.warnings);
            }
        }
        
        // Check for required fields
        const requiredFields = Object.entries(rules)
            .filter(([_, rule]) => rule.required)
            .map(([field, _]) => field);
        
        const missingRequired = requiredFields.filter(field => 
            !rowData[field] || rowData[field].toString().trim() === ''
        );
        
        if (missingRequired.length > 0) {
            validation.isValid = false;
            validation.errors.push(`Missing required fields: ${missingRequired.join(', ')}`);
        }
        
        return validation;
    }

    /**
     * Validate a single field
     * @param {string} fieldName - Field name
     * @param {any} value - Field value
     * @param {Object} rule - Validation rule
     * @returns {Object} Field validation result
     */
    validateField(fieldName, value, rule) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Check if required
        if (rule.required && (!value || value.toString().trim() === '')) {
            validation.isValid = false;
            validation.errors.push(`${fieldName} is required`);
            return validation;
        }

        // Skip validation if value is empty and not required
        if (!value || value.toString().trim() === '') {
            return validation;
        }

        // Type validation
        if (rule.type) {
            const typeValidation = this.validateType(value, rule.type);
            if (!typeValidation.isValid) {
                validation.isValid = false;
                validation.errors.push(`${fieldName}: ${typeValidation.error}`);
            }
        }

        // Length validation
        if (rule.maxLength && value.toString().length > rule.maxLength) {
            validation.isValid = false;
            validation.errors.push(`${fieldName} exceeds maximum length of ${rule.maxLength}`);
        }

        // Numeric validation
        if (rule.type === 'number') {
            const numValue = this.parseNumber(value);
            if (numValue !== null) {
                if (rule.min !== undefined && numValue < rule.min) {
                    validation.isValid = false;
                    validation.errors.push(`${fieldName} must be at least ${rule.min}`);
                }
                if (rule.max !== undefined && numValue > rule.max) {
                    validation.isValid = false;
                    validation.errors.push(`${fieldName} must be at most ${rule.max}`);
                }
            }
        }

        return validation;
    }

    /**
     * Validate data type
     * @param {any} value - Value to validate
     * @param {string} type - Expected type
     * @returns {Object} Type validation result
     */
    validateType(value, type) {
        const validation = {
            isValid: true,
            error: null
        };

        switch (type) {
            case 'string':
                if (typeof value !== 'string') {
                    validation.isValid = false;
                    validation.error = 'Must be a string';
                }
                break;
                
            case 'number':
                if (this.parseNumber(value) === null) {
                    validation.isValid = false;
                    validation.error = 'Must be a valid number';
                }
                break;
                
            case 'email':
                if (!this.isValidEmail(value)) {
                    validation.isValid = false;
                    validation.error = 'Must be a valid email address';
                }
                break;
                
            case 'url':
                if (!this.isValidUrl(value)) {
                    validation.isValid = false;
                    validation.error = 'Must be a valid URL';
                }
                break;
                
            case 'date':
                if (!this.isValidDate(value)) {
                    validation.isValid = false;
                    validation.error = 'Must be a valid date';
                }
                break;
                
            case 'boolean':
                if (!this.isValidBoolean(value)) {
                    validation.isValid = false;
                    validation.error = 'Must be a boolean value (true/false)';
                }
                break;
        }

        return validation;
    }

    /**
     * Parse number from string
     * @param {any} value - Value to parse
     * @returns {number|null} Parsed number or null
     */
    parseNumber(value) {
        if (typeof value === 'number') return value;
        
        const str = value.toString().trim();
        if (str === '') return null;
        
        // Remove currency symbols and commas
        const cleaned = str.replace(/[$,\s]/g, '');
        const parsed = parseFloat(cleaned);
        
        return isNaN(parsed) ? null : parsed;
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} Is valid URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate date format
     * @param {string} date - Date to validate
     * @returns {boolean} Is valid date
     */
    isValidDate(date) {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
    }

    /**
     * Validate boolean value
     * @param {any} value - Value to validate
     * @returns {boolean} Is valid boolean
     */
    isValidBoolean(value) {
        const str = value.toString().toLowerCase();
        return ['true', 'false', '1', '0', 'yes', 'no'].includes(str);
    }

    /**
     * Transform data according to type
     * @param {Object} rowData - Row data to transform
     * @param {string} type - Type of data
     * @returns {Object} Transformed data
     */
    transformData(rowData, type) {
        const transformed = {};
        const rules = this.validationRules[type] || {};
        
        for (const [field, value] of Object.entries(rowData)) {
            const rule = rules[field];
            if (!rule) {
                transformed[field] = value;
                continue;
            }
            
            // Transform based on type
            switch (rule.type) {
                case 'number':
                    const numValue = this.parseNumber(value);
                    transformed[field] = numValue !== null ? numValue : value;
                    break;
                    
                case 'boolean':
                    transformed[field] = this.parseBoolean(value);
                    break;
                    
                case 'date':
                    transformed[field] = this.parseDate(value);
                    break;
                    
                default:
                    transformed[field] = value;
            }
        }
        
        return transformed;
    }

    /**
     * Parse boolean value
     * @param {any} value - Value to parse
     * @returns {boolean} Parsed boolean
     */
    parseBoolean(value) {
        const str = value.toString().toLowerCase();
        return ['true', '1', 'yes'].includes(str);
    }

    /**
     * Parse date value
     * @param {string} value - Date string to parse
     * @returns {string} ISO date string
     */
    parseDate(value) {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toISOString().split('T')[0];
    }
}

module.exports = DataValidator;
