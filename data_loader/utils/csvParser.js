// CSV Parser Utility for Data Loader
// Handles CSV file parsing with 25MB size limit

const csv = require('csv-parser');
const { Readable } = require('stream');

class CSVParser {
    constructor() {
        this.maxFileSize = 25 * 1024 * 1024; // 25MB
    }

    /**
     * Parse CSV buffer and return array of objects
     * @param {Buffer} buffer - CSV file buffer
     * @returns {Promise<Array>} Array of parsed CSV rows
     */
    async parseCSV(buffer) {
        if (buffer.length > this.maxFileSize) {
            throw new Error(`File size exceeds 25MB limit. Current size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);
        }

        return new Promise((resolve, reject) => {
            const results = [];
            const stream = Readable.from(buffer.toString());

            stream
                .pipe(csv())
                .on('data', (data) => {
                    // Clean and validate each row
                    const cleanedData = this.cleanRowData(data);
                    if (Object.keys(cleanedData).length > 0) {
                        results.push(cleanedData);
                    }
                })
                .on('end', () => {
                    if (results.length === 0) {
                        reject(new Error('No valid data found in CSV file'));
                    } else {
                        resolve(results);
                    }
                })
                .on('error', (error) => {
                    reject(new Error(`CSV parsing error: ${error.message}`));
                });
        });
    }

    /**
     * Clean and validate row data
     * @param {Object} row - Raw CSV row
     * @returns {Object} Cleaned row data
     */
    cleanRowData(row) {
        const cleaned = {};
        
        for (const [key, value] of Object.entries(row)) {
            if (key && key.trim() !== '') {
                const cleanKey = key.trim();
                const cleanValue = value ? value.toString().trim() : '';
                
                // Only include non-empty values
                if (cleanValue !== '') {
                    cleaned[cleanKey] = cleanValue;
                }
            }
        }
        
        return cleaned;
    }

    /**
     * Get field names from CSV data
     * @param {Array} csvData - Parsed CSV data
     * @returns {Array} Array of field names
     */
    getFieldNames(csvData) {
        if (csvData.length === 0) return [];
        
        const allFields = new Set();
        csvData.forEach(row => {
            Object.keys(row).forEach(field => allFields.add(field));
        });
        
        return Array.from(allFields);
    }

    /**
     * Validate CSV structure
     * @param {Array} csvData - Parsed CSV data
     * @returns {Object} Validation result
     */
    validateCSV(csvData) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (csvData.length === 0) {
            validation.isValid = false;
            validation.errors.push('No data found in CSV file');
            return validation;
        }

        // Check for consistent field structure
        const firstRowFields = Object.keys(csvData[0]);
        const inconsistentRows = [];

        csvData.forEach((row, index) => {
            const rowFields = Object.keys(row);
            if (rowFields.length !== firstRowFields.length) {
                inconsistentRows.push(index + 1);
            }
        });

        if (inconsistentRows.length > 0) {
            validation.warnings.push(`Rows ${inconsistentRows.join(', ')} have inconsistent field structure`);
        }

        // Check for empty rows
        const emptyRows = csvData.filter(row => Object.values(row).every(value => !value || value.trim() === ''));
        if (emptyRows.length > 0) {
            validation.warnings.push(`${emptyRows.length} empty rows found`);
        }

        return validation;
    }
}

module.exports = CSVParser;
