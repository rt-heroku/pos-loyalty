// Data Preview Step Component
// Shows preview of mapped data before import

window.Components = window.Components || {};

window.Components.DataPreviewStep = function({
    jobId,
    previewData,
    onNext
}) {
    const { Eye, AlertCircle, CheckCircle, RefreshCw } = window.Icons;

    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState(previewData || []);
    const [totalRows, setTotalRows] = React.useState(0);

    React.useEffect(() => {
        if (previewData && previewData.length > 0) {
            setData(previewData);
        } else if (jobId) {
            loadPreviewData();
        }
    }, [jobId, previewData]);

    const loadPreviewData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/data-loader/preview/${jobId}?limit=10`);
            if (response.ok) {
                const result = await response.json();
                setData(result.previewData);
                setTotalRows(result.totalRows);
            } else {
                const error = await response.json();
                alert(`Failed to load preview: ${error.error}`);
            }
        } catch (error) {
            console.error('Error loading preview:', error);
            alert(`Failed to load preview: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatValue = (value) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') return JSON.stringify(value);
        return value.toString();
    };

    const getMappedFields = () => {
        if (data.length === 0) return [];
        return Object.keys(data[0].mappedData || {});
    };

    const getSampleValues = (field) => {
        return data.slice(0, 5).map(row => formatValue(row.mappedData[field]));
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
            }, 'Loading preview...')
        ]);
    }

    if (data.length === 0) {
        return React.createElement('div', {
            className: 'text-center py-12'
        }, [
            React.createElement(AlertCircle, {
                key: 'error-icon',
                size: 48,
                className: 'mx-auto text-red-500 mb-4'
            }),
            React.createElement('h3', {
                key: 'error-title',
                className: 'text-lg font-medium text-gray-900 dark:text-white mb-2'
            }, 'No Preview Data'),
            React.createElement('p', {
                key: 'error-message',
                className: 'text-gray-600 dark:text-gray-400'
            }, 'Unable to load preview data. Please check your field mapping.')
        ]);
    }

    const mappedFields = getMappedFields();

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
            }, 'Preview Mapped Data'),
            React.createElement('p', {
                key: 'description',
                className: 'text-gray-600 dark:text-gray-400'
            }, `Showing preview of ${data.length} rows (${totalRows} total rows will be imported)`)
        ]),

        // Field mapping summary
        React.createElement('div', {
            key: 'mapping-summary',
            className: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'
        }, [
            React.createElement('div', {
                key: 'summary-header',
                className: 'flex items-center gap-2 mb-3'
            }, [
                React.createElement(CheckCircle, {
                    key: 'summary-icon',
                    size: 16,
                    className: 'text-blue-600'
                }),
                React.createElement('span', {
                    key: 'summary-title',
                    className: 'font-medium text-blue-900 dark:text-blue-100'
                }, 'Field Mapping Summary')
            ]),
            React.createElement('div', {
                key: 'summary-content',
                className: 'grid grid-cols-2 gap-4 text-sm'
            }, [
                React.createElement('div', {
                    key: 'mapped-fields',
                    className: 'space-y-1'
                }, [
                    React.createElement('div', {
                        key: 'mapped-label',
                        className: 'text-blue-800 dark:text-blue-200'
                    }, 'Mapped Fields:'),
                    React.createElement('div', {
                        key: 'mapped-count',
                        className: 'font-medium text-blue-900 dark:text-blue-100'
                    }, `${mappedFields.length} fields`)
                ]),
                React.createElement('div', {
                    key: 'total-rows',
                    className: 'space-y-1'
                }, [
                    React.createElement('div', {
                        key: 'rows-label',
                        className: 'text-blue-800 dark:text-blue-200'
                    }, 'Total Rows:'),
                    React.createElement('div', {
                        key: 'rows-count',
                        className: 'font-medium text-blue-900 dark:text-blue-100'
                    }, totalRows)
                ])
            ])
        ]),

        // Data preview table
        React.createElement('div', {
            key: 'preview-table',
            className: 'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'
        }, [
            React.createElement('div', {
                key: 'table-header',
                className: 'bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600'
            }, [
                React.createElement('div', {
                    key: 'header-content',
                    className: 'flex items-center gap-2'
                }, [
                    React.createElement(Eye, {
                        key: 'preview-icon',
                        size: 16,
                        className: 'text-gray-600 dark:text-gray-400'
                    }),
                    React.createElement('span', {
                        key: 'header-text',
                        className: 'font-medium text-gray-900 dark:text-white'
                    }, 'Data Preview (First 10 rows)')
                ])
            ]),
            React.createElement('div', {
                key: 'table-content',
                className: 'overflow-x-auto'
            }, [
                React.createElement('table', {
                    key: 'preview-table',
                    className: 'w-full'
                }, [
                    // Table header
                    React.createElement('thead', {
                        key: 'table-head',
                        className: 'bg-gray-50 dark:bg-gray-800'
                    }, [
                        React.createElement('tr', {
                            key: 'header-row'
                        }, [
                            React.createElement('th', {
                                key: 'row-header',
                                className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'
                            }, 'Row'),
                            ...mappedFields.map(field => React.createElement('th', {
                                key: `header-${field}`,
                                className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'
                            }, field)),
                            // Add features column if any row has features
                            data.some(row => row.features && row.features.length > 0) && React.createElement('th', {
                                key: 'header-features',
                                className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'
                            }, 'Features')
                        ])
                    ]),
                    // Table body
                    React.createElement('tbody', {
                        key: 'table-body',
                        className: 'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700'
                    }, data.map((row, index) => React.createElement('tr', {
                        key: `row-${index}`,
                        className: 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }, [
                        React.createElement('td', {
                            key: `row-number-${index}`,
                            className: 'px-4 py-3 text-sm text-gray-900 dark:text-white font-medium'
                        }, row.rowNumber),
                        ...mappedFields.map(field => React.createElement('td', {
                            key: `cell-${index}-${field}`,
                            className: 'px-4 py-3 text-sm text-gray-900 dark:text-white'
                        }, formatValue(row.mappedData[field]))),
                        // Add features cell if any row has features
                        data.some(row => row.features && row.features.length > 0) && React.createElement('td', {
                            key: `cell-${index}-features`,
                            className: 'px-4 py-3 text-sm text-gray-900 dark:text-white'
                        }, row.features && row.features.length > 0 ? 
                            React.createElement('div', {
                                key: `features-${index}`,
                                className: 'space-y-1'
                            }, row.features.map((feature, featureIndex) => 
                                React.createElement('div', {
                                    key: `feature-${index}-${featureIndex}`,
                                    className: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs'
                                }, feature)
                            )) : '-')
                    ])))
                ])
            ])
        ]),

        // Field details
        React.createElement('div', {
            key: 'field-details',
            className: 'space-y-4'
        }, [
            React.createElement('h4', {
                key: 'details-title',
                className: 'font-medium text-gray-900 dark:text-white'
            }, 'Field Details'),
            React.createElement('div', {
                key: 'details-grid',
                className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
            }, mappedFields.map(field => {
                const sampleValues = getSampleValues(field);
                return React.createElement('div', {
                    key: `field-${field}`,
                    className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4'
                }, [
                    React.createElement('div', {
                        key: 'field-header',
                        className: 'flex items-center justify-between mb-2'
                    }, [
                        React.createElement('span', {
                            key: 'field-name',
                            className: 'font-medium text-gray-900 dark:text-white'
                        }, field),
                        React.createElement('span', {
                            key: 'field-count',
                            className: 'text-sm text-gray-500 dark:text-gray-400'
                        }, `${sampleValues.length} samples`)
                    ]),
                    React.createElement('div', {
                        key: 'field-samples',
                        className: 'space-y-1'
                    }, sampleValues.map((value, index) => React.createElement('div', {
                        key: `sample-${index}`,
                        className: 'text-sm text-gray-600 dark:text-gray-400 truncate'
                    }, value)))
                ]);
            }))
        ]),

        // Warning message
        React.createElement('div', {
            key: 'warning',
            className: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'
        }, [
            React.createElement('div', {
                key: 'warning-content',
                className: 'flex items-start gap-3'
            }, [
                React.createElement(AlertCircle, {
                    key: 'warning-icon',
                    size: 20,
                    className: 'text-yellow-600 mt-0.5'
                }),
                React.createElement('div', {
                    key: 'warning-text',
                    className: 'flex-1'
                }, [
                    React.createElement('h4', {
                        key: 'warning-title',
                        className: 'font-medium text-yellow-900 dark:text-yellow-100 mb-1'
                    }, 'Important'),
                    React.createElement('p', {
                        key: 'warning-message',
                        className: 'text-sm text-yellow-800 dark:text-yellow-200'
                    }, 'Please review the mapped data carefully. Once you proceed, the data will be imported into the database. This action cannot be undone.')
                ])
            ])
        ])
    ]);
};
