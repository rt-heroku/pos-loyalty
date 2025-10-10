// Field Mapping Utility for Data Loader
// Handles auto-mapping of CSV fields to database fields

class FieldMapper {
    constructor() {
        // Define database fields for each type
        this.databaseFields = {
            products: [
                'name', 'price', 'category', 'stock', 'sku', 'product_type',
                'brand', 'collection', 'material', 'color', 'description',
                'dimensions', 'weight', 'warranty_info', 'care_instructions',
                'main_image_url', 'is_active', 'featured'
            ],
            customers: [
                'loyalty_number', 'first_name', 'last_name', 'name', 'email',
                'phone', 'points', 'total_spent', 'visit_count', 'last_visit',
                'member_type', 'member_status', 'enrollment_date', 'notes'
            ]
        };

        // Define field mapping rules for better auto-mapping
        this.mappingRules = {
            // Common field name variations
            'name': ['name', 'product_name', 'productname', 'title', 'item_name'],
            'price': ['price', 'cost', 'amount', 'value', 'unit_price'],
            'category': ['category', 'cat', 'type', 'product_type', 'producttype'],
            'stock': ['stock', 'inventory', 'quantity', 'qty', 'available'],
            'sku': ['sku', 'product_sku', 'productsku', 'item_code', 'code'],
            'brand': ['brand', 'manufacturer', 'maker', 'company'],
            'color': ['color', 'colour', 'shade', 'hue'],
            'material': ['material', 'fabric', 'textile', 'composition'],
            'weight': ['weight', 'mass', 'lbs', 'pounds', 'kg', 'kilograms'],
            'dimensions': ['dimensions', 'size', 'measurements', 'length', 'width', 'height'],
            'description': ['description', 'desc', 'details', 'info', 'notes'],
            'email': ['email', 'e_mail', 'email_address', 'mail'],
            'phone': ['phone', 'telephone', 'mobile', 'cell', 'contact'],
            'first_name': ['first_name', 'firstname', 'fname', 'given_name'],
            'last_name': ['last_name', 'lastname', 'lname', 'surname', 'family_name']
        };
    }

    /**
     * Auto-map CSV fields to database fields
     * @param {Array} csvFields - Array of CSV field names
     * @param {string} type - Type of data ('products' or 'customers')
     * @returns {Object} Mapping object with CSV field as key and DB field as value
     */
    autoMapFields(csvFields, type) {
        const mapping = {};
        const dbFields = this.databaseFields[type] || [];
        
        csvFields.forEach(csvField => {
            const dbField = this.findBestMatch(csvField, dbFields);
            if (dbField) {
                mapping[csvField] = dbField;
            }
        });
        
        return mapping;
    }

    /**
     * Find the best matching database field for a CSV field
     * @param {string} csvField - CSV field name
     * @param {Array} dbFields - Available database fields
     * @returns {string|null} Best matching database field
     */
    findBestMatch(csvField, dbFields) {
        const normalizedCsv = this.normalizeFieldName(csvField);
        
        // First, try exact match
        for (const dbField of dbFields) {
            if (normalizedCsv === this.normalizeFieldName(dbField)) {
                return dbField;
            }
        }
        
        // Then, try mapping rules
        for (const [dbField, variations] of Object.entries(this.mappingRules)) {
            if (dbFields.includes(dbField)) {
                for (const variation of variations) {
                    if (normalizedCsv === this.normalizeFieldName(variation)) {
                        return dbField;
                    }
                }
            }
        }
        
        // Finally, try partial matches
        for (const dbField of dbFields) {
            const normalizedDb = this.normalizeFieldName(dbField);
            if (normalizedCsv.includes(normalizedDb) || normalizedDb.includes(normalizedCsv)) {
                return dbField;
            }
        }
        
        return null;
    }

    /**
     * Normalize field name for comparison
     * @param {string} fieldName - Field name to normalize
     * @returns {string} Normalized field name
     */
    normalizeFieldName(fieldName) {
        return fieldName.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace(/\s+/g, '');
    }

    /**
     * Get database fields for a specific type
     * @param {string} type - Type of data ('products' or 'customers')
     * @returns {Array} Array of database field names
     */
    getDatabaseFields(type) {
        return this.databaseFields[type] || [];
    }

    /**
     * Validate field mapping
     * @param {Object} mapping - Field mapping object
     * @param {string} type - Type of data
     * @returns {Object} Validation result
     */
    validateMapping(mapping, type) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        const dbFields = this.getDatabaseFields(type);
        const mappedFields = Object.values(mapping);
        
        // Check for duplicate mappings
        const duplicates = mappedFields.filter((field, index) => 
            mappedFields.indexOf(field) !== index
        );
        
        if (duplicates.length > 0) {
            validation.isValid = false;
            validation.errors.push(`Duplicate mappings found: ${duplicates.join(', ')}`);
        }
        
        // Check for invalid database fields
        const invalidFields = mappedFields.filter(field => !dbFields.includes(field));
        if (invalidFields.length > 0) {
            validation.isValid = false;
            validation.errors.push(`Invalid database fields: ${invalidFields.join(', ')}`);
        }
        
        // Check for required fields
        const requiredFields = this.getRequiredFields(type);
        const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
        if (missingRequired.length > 0) {
            validation.warnings.push(`Missing required fields: ${missingRequired.join(', ')}`);
        }
        
        return validation;
    }

    /**
     * Get required fields for a specific type
     * @param {string} type - Type of data
     * @returns {Array} Array of required field names
     */
    getRequiredFields(type) {
        const requiredFields = {
            products: ['name', 'price', 'category'],
            customers: ['first_name', 'last_name', 'email']
        };
        
        return requiredFields[type] || [];
    }

    /**
     * Get mapping suggestions with confidence scores
     * @param {Array} csvFields - Array of CSV field names
     * @param {string} type - Type of data
     * @returns {Array} Array of mapping suggestions with confidence scores
     */
    getMappingSuggestions(csvFields, type) {
        const suggestions = [];
        const dbFields = this.getDatabaseFields(type);
        
        csvFields.forEach(csvField => {
            const matches = [];
            
            dbFields.forEach(dbField => {
                const score = this.calculateSimilarity(csvField, dbField);
                if (score > 0.3) { // Minimum similarity threshold
                    matches.push({
                        dbField,
                        score,
                        confidence: this.getConfidenceLevel(score)
                    });
                }
            });
            
            // Sort by score (highest first)
            matches.sort((a, b) => b.score - a.score);
            
            suggestions.push({
                csvField,
                matches
            });
        });
        
        return suggestions;
    }

    /**
     * Calculate similarity between two field names
     * @param {string} field1 - First field name
     * @param {string} field2 - Second field name
     * @returns {number} Similarity score (0-1)
     */
    calculateSimilarity(field1, field2) {
        const norm1 = this.normalizeFieldName(field1);
        const norm2 = this.normalizeFieldName(field2);
        
        if (norm1 === norm2) return 1.0;
        if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
        
        // Simple Levenshtein distance-based similarity
        const distance = this.levenshteinDistance(norm1, norm2);
        const maxLength = Math.max(norm1.length, norm2.length);
        
        return maxLength === 0 ? 0 : (maxLength - distance) / maxLength;
    }

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Get confidence level based on similarity score
     * @param {number} score - Similarity score
     * @returns {string} Confidence level
     */
    getConfidenceLevel(score) {
        if (score >= 0.9) return 'high';
        if (score >= 0.7) return 'medium';
        if (score >= 0.5) return 'low';
        return 'very_low';
    }
}

module.exports = FieldMapper;
