// File Upload Step Component
// Handles CSV file upload with drag-and-drop functionality

window.Components = window.Components || {};

window.Components.FileUploadStep = React.forwardRef(function({
    onUpload,
    autoUpload = false
}, ref) {
    const { Upload, FileText, AlertCircle } = window.Icons;

    const [dragActive, setDragActive] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState(null);
    const [selectedType, setSelectedType] = React.useState('products');
    const [maxRows, setMaxRows] = React.useState(0);
    const [uploading, setUploading] = React.useState(false);

    const fileInputRef = React.useRef(null);

    // Expose uploadFile method to parent component
    React.useImperativeHandle(ref, () => ({
        uploadFile: handleUpload
    }));

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFile = (file) => {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert('Please select a CSV file');
            return;
        }

        // Validate file size (25MB limit)
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (file.size > maxSize) {
            alert(`File size exceeds 25MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            return;
        }

        setSelectedFile(file);
        
        // Auto-upload if enabled
        if (autoUpload) {
            handleUpload();
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        
        setUploading(true);
        try {
            await onUpload(selectedFile, selectedType, maxRows);
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return React.createElement('div', {
        className: 'space-y-6'
    }, [
        // Instructions
        React.createElement('div', {
            key: 'instructions',
            className: 'text-center'
        }, [
            React.createElement('h3', {
                key: 'title',
                className: 'text-lg font-medium text-gray-900 dark:text-white mb-2'
            }, 'Upload CSV File'),
            React.createElement('p', {
                key: 'description',
                className: 'text-gray-600 dark:text-gray-400'
            }, 'Select a CSV file containing product or customer data. Maximum file size: 25MB')
        ]),

        // Type Selection
        React.createElement('div', {
            key: 'type-selection',
            className: 'space-y-3'
        }, [
            React.createElement('label', {
                key: 'type-label',
                className: 'block text-sm font-medium text-gray-700 dark:text-gray-300'
            }, 'Data Type'),
            React.createElement('div', {
                key: 'type-options',
                className: 'grid grid-cols-2 gap-3'
            }, [
                React.createElement('label', {
                    key: 'products-option',
                    className: `flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedType === 'products' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`
                }, [
                    React.createElement('input', {
                        key: 'products-radio',
                        type: 'radio',
                        name: 'dataType',
                        value: 'products',
                        checked: selectedType === 'products',
                        onChange: (e) => setSelectedType(e.target.value),
                        className: 'mr-3'
                    }),
                    React.createElement('div', {
                        key: 'products-content',
                        className: 'flex-1'
                    }, [
                        React.createElement('div', {
                            key: 'products-title',
                            className: 'font-medium text-gray-900 dark:text-white'
                        }, 'Products'),
                        React.createElement('div', {
                            key: 'products-desc',
                            className: 'text-sm text-gray-500 dark:text-gray-400'
                        }, 'Import product inventory data')
                    ])
                ]),
                React.createElement('label', {
                    key: 'customers-option',
                    className: `flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedType === 'customers' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`
                }, [
                    React.createElement('input', {
                        key: 'customers-radio',
                        type: 'radio',
                        name: 'dataType',
                        value: 'customers',
                        checked: selectedType === 'customers',
                        onChange: (e) => setSelectedType(e.target.value),
                        className: 'mr-3'
                    }),
                    React.createElement('div', {
                        key: 'customers-content',
                        className: 'flex-1'
                    }, [
                        React.createElement('div', {
                            key: 'customers-title',
                            className: 'font-medium text-gray-900 dark:text-white'
                        }, 'Customers'),
                        React.createElement('div', {
                            key: 'customers-desc',
                            className: 'text-sm text-gray-500 dark:text-gray-400'
                        }, 'Import customer/loyalty data')
                    ])
                ])
            ])
        ]),

        // Max Rows Input
        React.createElement('div', {
            key: 'max-rows',
            className: 'space-y-2'
        }, [
            React.createElement('label', {
                key: 'max-rows-label',
                className: 'block text-sm font-medium text-gray-700 dark:text-gray-300'
            }, 'Max Rows to Import'),
            React.createElement('input', {
                key: 'max-rows-input',
                type: 'number',
                min: '0',
                value: maxRows,
                onChange: (e) => setMaxRows(parseInt(e.target.value) || 0),
                placeholder: '0 = all rows',
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }),
            React.createElement('p', {
                key: 'max-rows-help',
                className: 'text-sm text-gray-500 dark:text-gray-400'
            }, 'Enter 0 to import all rows, or specify a number to limit the import')
        ]),

        // File Upload Area
        React.createElement('div', {
            key: 'upload-area',
            className: 'space-y-4'
        }, [
            React.createElement('div', {
                key: 'drop-zone',
                className: `relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`,
                onDragEnter: handleDrag,
                onDragLeave: handleDrag,
                onDragOver: handleDrag,
                onDrop: handleDrop
            }, [
                React.createElement('div', {
                    key: 'drop-content',
                    className: 'space-y-4'
                }, [
                    React.createElement(Upload, {
                        key: 'upload-icon',
                        size: 48,
                        className: 'mx-auto text-gray-400'
                    }),
                    React.createElement('div', {
                        key: 'drop-text',
                        className: 'space-y-2'
                    }, [
                        React.createElement('p', {
                            key: 'drop-title',
                            className: 'text-lg font-medium text-gray-900 dark:text-white'
                        }, 'Drop your CSV file here'),
                        React.createElement('p', {
                            key: 'drop-subtitle',
                            className: 'text-gray-500 dark:text-gray-400'
                        }, 'or click to browse files')
                    ]),
                    React.createElement('button', {
                        key: 'browse-btn',
                        onClick: () => fileInputRef.current?.click(),
                        className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    }, 'Browse Files')
                ])
            ]),

            // Hidden file input
            React.createElement('input', {
                key: 'file-input',
                ref: fileInputRef,
                type: 'file',
                accept: '.csv',
                onChange: handleFileInput,
                className: 'hidden'
            }),

            // Selected file info
            selectedFile && React.createElement('div', {
                key: 'file-info',
                className: 'p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'
            }, [
                React.createElement('div', {
                    key: 'file-header',
                    className: 'flex items-center gap-3 mb-2'
                }, [
                    React.createElement(FileText, {
                        key: 'file-icon',
                        size: 20,
                        className: 'text-blue-600'
                    }),
                    React.createElement('div', {
                        key: 'file-details',
                        className: 'flex-1'
                    }, [
                        React.createElement('div', {
                            key: 'file-name',
                            className: 'font-medium text-gray-900 dark:text-white'
                        }, selectedFile.name),
                        React.createElement('div', {
                            key: 'file-size',
                            className: 'text-sm text-gray-500 dark:text-gray-400'
                        }, formatFileSize(selectedFile.size))
                    ])
                ]),
                React.createElement('div', {
                    key: 'file-actions',
                    className: 'flex gap-2'
                }, [
                    React.createElement('button', {
                        key: 'change-btn',
                        onClick: () => fileInputRef.current?.click(),
                        className: 'px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors'
                    }, 'Change'),
                    React.createElement('button', {
                        key: 'remove-btn',
                        onClick: () => setSelectedFile(null),
                        className: 'px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors'
                    }, 'Remove')
                ])
            ])
        ]),

        // Upload button
        selectedFile && React.createElement('div', {
            key: 'upload-actions',
            className: 'flex justify-center'
        }, [
            React.createElement('button', {
                key: 'upload-btn',
                onClick: handleUpload,
                disabled: uploading,
                className: `px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    uploading 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`
            }, [
                uploading && React.createElement('div', {
                    key: 'loading-spinner',
                    className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white'
                }),
                React.createElement('span', {
                    key: 'upload-text'
                }, uploading ? 'Uploading...' : 'Upload File')
            ])
        ]),

        // File format help
        React.createElement('div', {
            key: 'help',
            className: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'
        }, [
            React.createElement('div', {
                key: 'help-header',
                className: 'flex items-start gap-3'
            }, [
                React.createElement(AlertCircle, {
                    key: 'help-icon',
                    size: 20,
                    className: 'text-blue-600 mt-0.5'
                }),
                React.createElement('div', {
                    key: 'help-content',
                    className: 'flex-1'
                }, [
                    React.createElement('h4', {
                        key: 'help-title',
                        className: 'font-medium text-blue-900 dark:text-blue-100 mb-2'
                    }, 'CSV Format Requirements'),
                    React.createElement('ul', {
                        key: 'help-list',
                        className: 'text-sm text-blue-800 dark:text-blue-200 space-y-1'
                    }, [
                        React.createElement('li', { key: 'req1' }, '• First row must contain column headers'),
                        React.createElement('li', { key: 'req2' }, '• Use commas to separate values'),
                        React.createElement('li', { key: 'req3' }, '• Enclose text with commas in quotes'),
                        React.createElement('li', { key: 'req4' }, '• Maximum file size: 25MB'),
                        React.createElement('li', { key: 'req5' }, '• UTF-8 encoding recommended')
                    ])
                ])
            ])
        ])
    ]);
});
