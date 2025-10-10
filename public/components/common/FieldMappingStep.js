// Field Mapping Step Component
// Handles drag-and-drop field mapping between CSV and database fields

window.Components = window.Components || {};

// Constant Value Form Component
const ConstantValueForm = function({ dbField, onSave, onCancel }) {
    const [value, setValue] = React.useState('');
    const [type, setType] = React.useState('text');
    const [error, setError] = React.useState('');

    const fieldTypes = {
        'text': 'Text',
        'number': 'Number',
        'email': 'Email',
        'date': 'Date',
        'boolean': 'Boolean'
    };

    const validateValue = (val, fieldType) => {
        if (!val.trim()) return 'Value is required';
        
        switch (fieldType) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(val)) return 'Invalid email format';
                break;
            case 'number':
                if (isNaN(val)) return 'Must be a valid number';
                break;
            case 'date':
                const date = new Date(val);
                if (isNaN(date.getTime())) return 'Invalid date format (YYYY-MM-DD)';
                break;
            case 'boolean':
                if (!['true', 'false', '1', '0', 'yes', 'no'].includes(val.toLowerCase())) {
                    return 'Must be true/false, 1/0, or yes/no';
                }
                break;
        }
        
        return null;
    };

    const handleSave = () => {
        const validationError = validateValue(value, type);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        onSave(value, type);
    };

    return React.createElement('div', {
        className: 'space-y-4'
    }, [
        React.createElement('div', {
            key: 'field-type',
            className: 'space-y-2'
        }, [
            React.createElement('label', {
                key: 'type-label',
                className: 'block text-sm font-medium text-gray-700 dark:text-gray-300'
            }, 'Field Type'),
            React.createElement('select', {
                key: 'type-select',
                value: type,
                onChange: (e) => setType(e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }, Object.entries(fieldTypes).map(([value, label]) => 
                React.createElement('option', { key: value, value }, label)
            ))
        ]),
        
        React.createElement('div', {
            key: 'field-value',
            className: 'space-y-2'
        }, [
            React.createElement('label', {
                key: 'value-label',
                className: 'block text-sm font-medium text-gray-700 dark:text-gray-300'
            }, 'Constant Value'),
            React.createElement('input', {
                key: 'value-input',
                type: type === 'number' ? 'number' : type === 'date' ? 'date' : 'text',
                value: value,
                onChange: (e) => setValue(e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                placeholder: `Enter ${fieldTypes[type].toLowerCase()} value`
            })
        ]),
        
        error && React.createElement('div', {
            key: 'error',
            className: 'text-red-600 text-sm'
        }, error),
        
        React.createElement('div', {
            key: 'buttons',
            className: 'flex justify-end gap-3'
        }, [
            React.createElement('button', {
                key: 'cancel-btn',
                onClick: onCancel,
                className: 'px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
            }, 'Cancel'),
            React.createElement('button', {
                key: 'save-btn',
                onClick: handleSave,
                className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            }, 'Save')
        ])
    ]);
};

window.Components.FieldMappingStep = function({
    jobId,
    onMapping
}) {
    const { TrendingUp, CheckCircle, AlertCircle, RefreshCw, X } = window.Icons;

    const [csvFields, setCsvFields] = React.useState([]);
    const [dbFields, setDbFields] = React.useState([]);
    const [fieldMapping, setFieldMapping] = React.useState({}); // {csvField: [dbField1, dbField2]}
    const [constantValues, setConstantValues] = React.useState({}); // {dbField: {value, type}}
    const [autoMapped, setAutoMapped] = React.useState({});
    const [featuresConfig, setFeaturesConfig] = React.useState({
        csvField: '',
        delimiter: ';',
        enabled: false
    });
    const [loading, setLoading] = React.useState(true);
    const [draggedField, setDraggedField] = React.useState(null);
    const [showConstantModal, setShowConstantModal] = React.useState(false);
    const [selectedDbField, setSelectedDbField] = React.useState(null);

    // Load fields when component mounts
    React.useEffect(() => {
        if (jobId) {
            loadFields();
        }
    }, [jobId]);

    const loadFields = async () => {
        try {
            const response = await fetch(`/api/data-loader/fields/${jobId}`);
            if (response.ok) {
                const data = await response.json();
                setCsvFields(data.csvFields);
                setDbFields(data.dbFields);
                
                // Auto-map fields
                const autoMapping = autoMapFields(data.csvFields, data.dbFields);
                setAutoMapped(autoMapping);
                setFieldMapping(autoMapping);
                
                // Save auto-mapping to backend
                if (Object.keys(autoMapping).length > 0) {
                    saveMapping(autoMapping, {});
                }
            } else {
                const error = await response.json();
                alert(`Failed to load fields: ${error.error}`);
            }
        } catch (error) {
            console.error('Error loading fields:', error);
            alert(`Failed to load fields: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const saveMapping = async (mapping, constants, forceSave = false) => {
        // Don't save empty mappings unless explicitly clearing
        if (Object.keys(mapping).length === 0 && Object.keys(constants).length === 0 && !forceSave) {
            console.log('Skipping save of empty mapping');
            return;
        }
        
        console.log('Saving mapping:', mapping);
        console.log('Saving constants:', constants);
        
        try {
            const response = await fetch(`/api/data-loader/mapping/${jobId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fieldMapping: mapping,
                    constantValues: constants,
                    featuresConfig: featuresConfig
                })
            });
            
            if (!response.ok) {
                console.error('Failed to save mapping');
            }
        } catch (error) {
            console.error('Error saving mapping:', error);
        }
    };

    // Auto-mapping algorithm
    const autoMapFields = (csvFields, dbFields) => {
        const mapping = {};
        
        csvFields.forEach(csvField => {
            const normalizedCsv = csvField.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Find all matches (multiple DB fields per CSV field)
            const matches = dbFields.filter(dbField => {
                const normalizedDb = dbField.toLowerCase().replace(/[^a-z0-9]/g, '');
                return normalizedCsv === normalizedDb || 
                       normalizedCsv.includes(normalizedDb) || 
                       normalizedDb.includes(normalizedCsv);
            });
            
            if (matches.length > 0) {
                mapping[csvField] = matches; // Array of DB fields
            }
        });
        
        return mapping;
    };

    const handleDragStart = (e, csvField) => {
        setDraggedField(csvField);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dbField) => {
        e.preventDefault();
        if (draggedField) {
            const newMapping = { ...fieldMapping };
            
            // Add to existing mappings or create new array
            if (newMapping[draggedField]) {
                if (!newMapping[draggedField].includes(dbField)) {
                    newMapping[draggedField] = [...newMapping[draggedField], dbField];
                }
            } else {
                newMapping[draggedField] = [dbField];
            }
            
            setFieldMapping(newMapping);
            setDraggedField(null);
            
            // Remove constant value if field is now mapped
            const newConstants = { ...constantValues };
            delete newConstants[dbField];
            setConstantValues(newConstants);
            
            // Save mapping immediately
            saveMapping(newMapping, newConstants);
        }
    };

    const handleRemoveMapping = (csvField, dbField) => {
        const newMapping = { ...fieldMapping };
        
        if (newMapping[csvField]) {
            if (newMapping[csvField].length === 1) {
                // Remove entire CSV field mapping
                delete newMapping[csvField];
            } else {
                // Remove specific DB field from mapping
                newMapping[csvField] = newMapping[csvField].filter(field => field !== dbField);
            }
        }
        
        setFieldMapping(newMapping);
        
        // Save mapping immediately
        saveMapping(newMapping, constantValues);
    };

    const handleAddConstant = (dbField) => {
        setSelectedDbField(dbField);
        setShowConstantModal(true);
    };

    const handleSaveConstant = (value, type) => {
        const newConstants = { ...constantValues };
        newConstants[selectedDbField] = { value, type };
        setConstantValues(newConstants);
        
        // Remove from mapping if it was mapped
        const newMapping = { ...fieldMapping };
        Object.keys(newMapping).forEach(csvField => {
            newMapping[csvField] = newMapping[csvField].filter(field => field !== selectedDbField);
            if (newMapping[csvField].length === 0) {
                delete newMapping[csvField];
            }
        });
        setFieldMapping(newMapping);
        
        // Save mapping immediately
        saveMapping(newMapping, newConstants);
        
        setShowConstantModal(false);
        setSelectedDbField(null);
    };

    const handleRemoveConstant = (dbField) => {
        const newConstants = { ...constantValues };
        delete newConstants[dbField];
        setConstantValues(newConstants);
        
        // Save mapping immediately
        saveMapping(fieldMapping, newConstants);
    };

    const handleAutoMap = () => {
        setFieldMapping(autoMapped);
        saveMapping(autoMapped, constantValues);
    };

    const handleClearAll = () => {
        setFieldMapping({});
        setConstantValues({});
        // Explicitly clear the mapping in the backend
        saveMapping({}, {}, true);
    };

    const handleNext = () => {
        if (onMapping) {
            onMapping(fieldMapping);
        }
    };

    const getMappedDbFields = (csvField) => {
        return fieldMapping[csvField] || [];
    };

    const getUnmappedCsvFields = () => {
        return csvFields.filter(csvField => !fieldMapping[csvField] || fieldMapping[csvField].length === 0);
    };

    const getUnmappedDbFields = () => {
        const mappedFields = Object.values(fieldMapping).flat();
        const constantFields = Object.keys(constantValues);
        return dbFields.filter(dbField => !mappedFields.includes(dbField) && !constantFields.includes(dbField));
    };

    const isFieldMapped = (dbField) => {
        return Object.values(fieldMapping).flat().includes(dbField);
    };

    const isFieldConstant = (dbField) => {
        return constantValues[dbField];
    };

    if (loading) {
        return React.createElement('div', {
            className: 'flex items-center justify-center py-12'
        }, [
            React.createElement(RefreshCw, {
                key: 'loading-spinner',
                size: 32,
                className: 'animate-spin text-blue-600'
            }),
            React.createElement('span', {
                key: 'loading-text',
                className: 'ml-3 text-gray-600 dark:text-gray-400'
            }, 'Loading fields...')
        ]);
    }

    return React.createElement('div', {
        className: 'space-y-6'
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: 'text-center'
        }, [
            React.createElement('h3', {
                key: 'title',
                className: 'text-lg font-medium text-gray-900 dark:text-white mb-2'
            }, 'Map CSV Fields to Database Fields'),
            React.createElement('p', {
                key: 'description',
                className: 'text-gray-600 dark:text-gray-400'
            }, 'Drag CSV fields to database fields, or set constant values')
        ]),

        // Auto-mapping controls
        React.createElement('div', {
            key: 'controls',
            className: 'flex justify-center gap-3'
        }, [
            React.createElement('button', {
                key: 'auto-map-btn',
                onClick: handleAutoMap,
                className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
            }, [
                React.createElement(CheckCircle, { key: 'auto-icon', size: 16 }),
                React.createElement('span', { key: 'auto-text' }, 'Auto-Map Fields')
            ]),
            React.createElement('button', {
                key: 'clear-btn',
                onClick: handleClearAll,
                className: 'px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
            }, 'Clear All')
        ]),

        // Mapping area
        React.createElement('div', {
            key: 'mapping-area',
            className: 'grid grid-cols-2 gap-6'
        }, [
            // CSV Fields
            React.createElement('div', {
                key: 'csv-fields',
                className: 'space-y-3'
            }, [
                React.createElement('h4', {
                    key: 'csv-title',
                    className: 'font-medium text-gray-900 dark:text-white'
                }, 'CSV Fields'),
                React.createElement('div', {
                    key: 'csv-list',
                    className: 'space-y-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2'
                }, csvFields.map(csvField => {
                    const mappedDbFields = getMappedDbFields(csvField);
                    const isUnmapped = mappedDbFields.length === 0;
                    
                    return React.createElement('div', {
                        key: csvField,
                        draggable: true,
                        onDragStart: (e) => handleDragStart(e, csvField),
                        className: `p-3 border rounded-lg cursor-move transition-colors ${
                            isUnmapped 
                                ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800' 
                                : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        }`
                    }, [
                        React.createElement('div', {
                            key: 'field-content',
                            className: 'flex items-center justify-between'
                        }, [
                            React.createElement('span', {
                                key: 'field-name',
                                className: 'font-medium text-gray-900 dark:text-white'
                            }, csvField),
                            mappedDbFields.length > 0 && React.createElement('button', {
                                key: 'remove-btn',
                                onClick: () => handleRemoveMapping(csvField),
                                className: 'text-red-600 hover:text-red-700 transition-colors'
                            }, '×')
                        ]),
                        mappedDbFields.length > 0 && React.createElement('div', {
                            key: 'mapped-info',
                            className: 'mt-2 text-sm text-blue-600 dark:text-blue-400'
                        }, [
                            React.createElement(TrendingUp, { key: 'arrow', size: 14, className: 'inline mr-1' }),
                            React.createElement('span', { key: 'mapped-text' }, `Mapped to: ${mappedDbFields.join(', ')}`)
                        ])
                    ]);
                }))
            ]),

            // Database Fields
            React.createElement('div', {
                key: 'db-fields',
                className: 'space-y-3'
            }, [
                React.createElement('h4', {
                    key: 'db-title',
                    className: 'font-medium text-gray-900 dark:text-white'
                }, 'Database Fields'),
                React.createElement('div', {
                    key: 'db-list',
                    className: 'space-y-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2'
                }, dbFields.map(dbField => {
                    const isMapped = isFieldMapped(dbField);
                    const isConstant = isFieldConstant(dbField);
                    const mappedCsvField = Object.keys(fieldMapping).find(csvField => 
                        fieldMapping[csvField] && fieldMapping[csvField].includes(dbField)
                    );
                    
                    return React.createElement('div', {
                        key: dbField,
                        onDragOver: handleDragOver,
                        onDrop: (e) => handleDrop(e, dbField),
                        className: `p-3 border rounded-lg transition-colors ${
                            isMapped 
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                : isConstant
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400'
                        }`
                    }, [
                        React.createElement('div', {
                            key: 'field-content',
                            className: 'flex items-center justify-between'
                        }, [
                            React.createElement('span', {
                                key: 'field-name',
                                className: 'font-medium text-gray-900 dark:text-white'
                            }, dbField),
                            React.createElement('div', {
                                key: 'field-actions',
                                className: 'flex items-center gap-2'
                            }, [
                                isMapped && React.createElement('button', {
                                    key: 'remove-mapping-btn',
                                    onClick: () => handleRemoveMapping(mappedCsvField, dbField),
                                    className: 'text-red-600 hover:text-red-700 transition-colors text-sm'
                                }, '×'),
                                isConstant && React.createElement('button', {
                                    key: 'edit-constant-btn',
                                    onClick: () => handleAddConstant(dbField),
                                    className: 'text-purple-600 hover:text-purple-700 transition-colors text-sm'
                                }, '✏️'),
                                isConstant && React.createElement('button', {
                                    key: 'remove-constant-btn',
                                    onClick: () => handleRemoveConstant(dbField),
                                    className: 'text-red-600 hover:text-red-700 transition-colors text-sm'
                                }, '×'),
                                !isMapped && !isConstant && React.createElement('button', {
                                    key: 'add-constant-btn',
                                    onClick: () => handleAddConstant(dbField),
                                    className: 'text-blue-600 hover:text-blue-700 transition-colors text-sm'
                                }, '+')
                            ])
                        ]),
                        isMapped && React.createElement('div', {
                            key: 'mapped-info',
                            className: 'mt-2 text-sm text-green-600 dark:text-green-400'
                        }, `Mapped from: ${mappedCsvField}`),
                        isConstant && React.createElement('div', {
                            key: 'constant-info',
                            className: 'mt-2 text-sm text-purple-600 dark:text-purple-400'
                        }, `Value: ${constantValues[dbField].value}`)
                    ]);
                }))
            ])
        ]),

        // Features Configuration Section
        React.createElement('div', {
            key: 'features-section',
            className: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'
        }, [
            React.createElement('div', {
                key: 'features-header',
                className: 'flex items-center gap-2 mb-4'
            }, [
                React.createElement('span', {
                    key: 'features-icon',
                    className: 'text-lg'
                }, '🔧'),
                React.createElement('h3', {
                    key: 'features-title',
                    className: 'font-semibold text-blue-900 dark:text-blue-100'
                }, 'Product Features Configuration'),
                React.createElement('div', {
                    key: 'features-toggle',
                    className: 'ml-auto'
                }, [
                    React.createElement('label', {
                        key: 'toggle-label',
                        className: 'flex items-center gap-2 cursor-pointer'
                    }, [
                        React.createElement('input', {
                            key: 'toggle-input',
                            type: 'checkbox',
                            checked: featuresConfig.enabled,
                            onChange: (e) => setFeaturesConfig(prev => ({ ...prev, enabled: e.target.checked })),
                            className: 'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
                        }),
                        React.createElement('span', {
                            key: 'toggle-text',
                            className: 'text-sm text-blue-800 dark:text-blue-200'
                        }, 'Enable Features Processing')
                    ])
                ])
            ]),
            
            featuresConfig.enabled && React.createElement('div', {
                key: 'features-config',
                className: 'space-y-4'
            }, [
                React.createElement('div', {
                    key: 'csv-field-select',
                    className: 'space-y-2'
                }, [
                    React.createElement('label', {
                        key: 'csv-field-label',
                        className: 'block text-sm font-medium text-blue-900 dark:text-blue-100'
                    }, 'CSV Field for Features'),
                    React.createElement('select', {
                        key: 'csv-field-select',
                        value: featuresConfig.csvField,
                        onChange: (e) => setFeaturesConfig(prev => ({ ...prev, csvField: e.target.value })),
                        className: 'w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-blue-800 text-gray-900 dark:text-white'
                    }, [
                        React.createElement('option', { key: 'empty', value: '' }, 'Select CSV field...'),
                        ...csvFields.map(field => 
                            React.createElement('option', { key: field, value: field }, field)
                        )
                    ])
                ]),
                
                React.createElement('div', {
                    key: 'delimiter-config',
                    className: 'space-y-2'
                }, [
                    React.createElement('label', {
                        key: 'delimiter-label',
                        className: 'block text-sm font-medium text-blue-900 dark:text-blue-100'
                    }, 'Delimiter'),
                    React.createElement('input', {
                        key: 'delimiter-input',
                        type: 'text',
                        value: featuresConfig.delimiter,
                        onChange: (e) => setFeaturesConfig(prev => ({ ...prev, delimiter: e.target.value })),
                        placeholder: ';',
                        maxLength: 5,
                        className: 'w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-blue-800 text-gray-900 dark:text-white'
                    }),
                    React.createElement('p', {
                        key: 'delimiter-help',
                        className: 'text-xs text-blue-700 dark:text-blue-300'
                    }, 'Character used to separate multiple features in the CSV field')
                ]),
                
                featuresConfig.csvField && React.createElement('div', {
                    key: 'features-preview',
                    className: 'bg-white dark:bg-blue-800 rounded p-3 border border-blue-200 dark:border-blue-700'
                }, [
                    React.createElement('h4', {
                        key: 'preview-title',
                        className: 'text-sm font-medium text-blue-900 dark:text-blue-100 mb-2'
                    }, 'Preview:'),
                    React.createElement('p', {
                        key: 'preview-text',
                        className: 'text-sm text-blue-800 dark:text-blue-200'
                    }, `Features from "${featuresConfig.csvField}" will be split by "${featuresConfig.delimiter}" and stored in the product_features table`)
                ])
            ])
        ]),

        // Summary
        React.createElement('div', {
            key: 'summary',
            className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4'
        }, [
            React.createElement('div', {
                key: 'summary-header',
                className: 'flex items-center gap-2 mb-3'
            }, [
                React.createElement(AlertCircle, {
                    key: 'summary-icon',
                    size: 16,
                    className: 'text-blue-600'
                }),
                React.createElement('span', {
                    key: 'summary-title',
                    className: 'font-medium text-gray-900 dark:text-white'
                }, 'Mapping Summary')
            ]),
            React.createElement('div', {
                key: 'summary-stats',
                className: 'grid grid-cols-4 gap-4 text-sm'
            }, [
                React.createElement('div', {
                    key: 'total-csv',
                    className: 'text-center'
                }, [
                    React.createElement('div', {
                        key: 'total-csv-value',
                        className: 'font-medium text-gray-900 dark:text-white'
                    }, csvFields.length),
                    React.createElement('div', {
                        key: 'total-csv-label',
                        className: 'text-gray-500 dark:text-gray-400'
                    }, 'CSV Fields')
                ]),
                React.createElement('div', {
                    key: 'mapped',
                    className: 'text-center'
                }, [
                    React.createElement('div', {
                        key: 'mapped-value',
                        className: 'font-medium text-green-600'
                    }, Object.keys(fieldMapping).length),
                    React.createElement('div', {
                        key: 'mapped-label',
                        className: 'text-gray-500 dark:text-gray-400'
                    }, 'Mapped')
                ]),
                React.createElement('div', {
                    key: 'constants',
                    className: 'text-center'
                }, [
                    React.createElement('div', {
                        key: 'constants-value',
                        className: 'font-medium text-purple-600'
                    }, Object.keys(constantValues).length),
                    React.createElement('div', {
                        key: 'constants-label',
                        className: 'text-gray-500 dark:text-gray-400'
                    }, 'Constants')
                ]),
                React.createElement('div', {
                    key: 'unmapped',
                    className: 'text-center'
                }, [
                    React.createElement('div', {
                        key: 'unmapped-value',
                        className: 'font-medium text-orange-600'
                    }, getUnmappedCsvFields().length),
                    React.createElement('div', {
                        key: 'unmapped-label',
                        className: 'text-gray-500 dark:text-gray-400'
                    }, 'Unmapped')
                ])
            ])
        ]),

        // Constant Value Modal
        showConstantModal && React.createElement('div', {
            key: 'constant-modal',
            className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        }, [
            React.createElement('div', {
                key: 'modal-content',
                className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4'
            }, [
                React.createElement('div', {
                    key: 'modal-header',
                    className: 'flex items-center justify-between mb-4'
                }, [
                    React.createElement('h3', {
                        key: 'modal-title',
                        className: 'text-lg font-medium text-gray-900 dark:text-white'
                    }, `Set Constant Value for ${selectedDbField}`),
                    React.createElement('button', {
                        key: 'modal-close',
                        onClick: () => setShowConstantModal(false),
                        className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }, React.createElement(X, { size: 20 }))
                ]),
                React.createElement(ConstantValueForm, {
                    key: 'constant-form',
                    dbField: selectedDbField,
                    onSave: handleSaveConstant,
                    onCancel: () => setShowConstantModal(false)
                })
            ])
        ])
    ]);
};