/**
 * Image Utilities for POS System
 * Provides image resizing and processing capabilities
 */

window.ImageUtils = {
    /**
     * Resize an image file while maintaining aspect ratio
     * @param {File} file - The image file to resize
     * @param {number} maxWidth - Maximum width (default: 2048)
     * @param {number} maxHeight - Maximum height (default: 2048)
     * @param {number} quality - JPEG quality 0-1 (default: 0.8)
     * @returns {Promise<Object>} - Result object with base64, dimensions, and resize info
     */
    resizeImage: (file, maxWidth = 2048, maxHeight = 2048, quality = 0.8) => {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                try {
                    // Calculate new dimensions while maintaining aspect ratio
                    let { width, height } = img;
                    
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.floor(width * ratio);
                        height = Math.floor(height * ratio);
                    }
                    
                    // Set canvas dimensions
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw resized image on canvas
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to base64 with specified quality
                    const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
                    
                    resolve({
                        base64: resizedBase64,
                        originalWidth: img.width,
                        originalHeight: img.height,
                        newWidth: width,
                        newHeight: height,
                        wasResized: img.width > maxWidth || img.height > maxHeight,
                        fileSize: resizedBase64.length,
                        originalFileSize: file.size
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    },

    /**
     * Validate image file before processing
     * @param {File} file - The file to validate
     * @param {number} maxSizeMB - Maximum file size in MB (default: 10)
     * @returns {Object} - Validation result
     */
    validateImage: (file, maxSizeMB = 10) => {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        
        return {
            isValid: file.type.startsWith('image/') && file.size <= maxSizeBytes,
            isImage: file.type.startsWith('image/'),
            sizeOK: file.size <= maxSizeBytes,
            sizeMB: sizeMB,
            maxSizeMB: maxSizeMB,
            error: !file.type.startsWith('image/') ? 'Invalid file type' : 
                   file.size > maxSizeBytes ? `File too large (${sizeMB}MB > ${maxSizeMB}MB)` : null
        };
    },

    /**
     * Process and resize an image with validation
     * @param {File} file - The image file to process
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - Processing result
     */
    processImage: async (file, options = {}) => {
        const {
            maxWidth = 2048,
            maxHeight = 2048,
            quality = 0.85,
            maxSizeMB = 10
        } = options;

        // Validate the file
        const validation = window.ImageUtils.validateImage(file, maxSizeMB);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        // Resize the image
        const result = await window.ImageUtils.resizeImage(file, maxWidth, maxHeight, quality);
        
        return {
            ...result,
            validation,
            processingOptions: { maxWidth, maxHeight, quality, maxSizeMB }
        };
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.ImageUtils = window.ImageUtils;
}
