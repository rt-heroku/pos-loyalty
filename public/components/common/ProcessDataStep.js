// Process Data Step Component
// Handles the final data import process

window.Components = window.Components || {};

window.Components.ProcessDataStep = function({
    jobId,
    processing,
    importResult,
    onProcess,
    onClose
}) {
    const { Save, CheckCircle, AlertCircle, RefreshCw, X } = window.Icons;

    const [status, setStatus] = React.useState(null);
    const [errors, setErrors] = React.useState([]);
    const [polling, setPolling] = React.useState(false);

    // Poll for status updates
    React.useEffect(() => {
        if (processing && jobId) {
            setPolling(true);
            const interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/data-loader/status/${jobId}`);
                    if (response.ok) {
                        const statusData = await response.json();
                        setStatus(statusData);
                        
                        if (statusData.status === 'completed' || statusData.status === 'failed') {
                            setPolling(false);
                            clearInterval(interval);
                            
                            // Load errors if any
                            if (statusData.error_count > 0) {
                                loadErrors();
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error polling status:', error);
                }
            }, 2000);
            
            return () => clearInterval(interval);
        }
    }, [processing, jobId]);

    const loadErrors = async () => {
        try {
            const response = await fetch(`/api/data-loader/errors/${jobId}`);
            if (response.ok) {
                const errorData = await response.json();
                setErrors(errorData);
            }
        } catch (error) {
            console.error('Error loading errors:', error);
        }
    };

    const handleProcess = () => {
        if (onProcess) {
            onProcess();
        }
    };

    const getStatusIcon = () => {
        if (processing || polling) {
            return React.createElement(RefreshCw, {
                size: 24,
                className: 'animate-spin text-blue-600'
            });
        } else if (importResult && importResult.success) {
            return React.createElement(CheckCircle, {
                size: 24,
                className: 'text-green-600'
            });
        } else if (status && status.status === 'failed') {
            return React.createElement(AlertCircle, {
                size: 24,
                className: 'text-red-600'
            });
        } else {
            return React.createElement(Save, {
                size: 24,
                className: 'text-blue-600'
            });
        }
    };

    const getStatusMessage = () => {
        if (processing || polling) {
            return 'Processing data...';
        } else if (importResult && importResult.success) {
            return 'Import completed successfully!';
        } else if (status && status.status === 'failed') {
            return 'Import failed. Please check the errors below.';
        } else {
            return 'Ready to import data';
        }
    };

    const getStatusColor = () => {
        if (processing || polling) {
            return 'text-blue-600';
        } else if (importResult && importResult.success) {
            return 'text-green-600';
        } else if (status && status.status === 'failed') {
            return 'text-red-600';
        } else {
            return 'text-gray-600';
        }
    };

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
            }, 'Import Data'),
            React.createElement('p', {
                key: 'description',
                className: 'text-gray-600 dark:text-gray-400'
            }, 'Review the import settings and start the data import process')
        ]),

        // Import settings (only show before processing starts)
        !processing && !importResult && React.createElement('div', {
            key: 'import-settings',
            className: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'
        }, [
            React.createElement('div', {
                key: 'settings-header',
                className: 'flex items-center gap-2 mb-3'
            }, [
                React.createElement(Save, {
                    key: 'settings-icon',
                    size: 16,
                    className: 'text-blue-600'
                }),
                React.createElement('span', {
                    key: 'settings-title',
                    className: 'font-medium text-blue-900 dark:text-blue-100'
                }, 'Import Settings')
            ]),
            React.createElement('div', {
                key: 'settings-content',
                className: 'grid grid-cols-2 gap-4 text-sm'
            }, [
                React.createElement('div', {
                    key: 'job-id',
                    className: 'space-y-1'
                }, [
                    React.createElement('div', {
                        key: 'job-label',
                        className: 'text-blue-800 dark:text-blue-200'
                    }, 'Job ID:'),
                    React.createElement('div', {
                        key: 'job-value',
                        className: 'font-mono text-blue-900 dark:text-blue-100 text-xs'
                    }, jobId)
                ]),
                React.createElement('div', {
                    key: 'status-info',
                    className: 'space-y-1'
                }, [
                    React.createElement('div', {
                        key: 'status-label',
                        className: 'text-blue-800 dark:text-blue-200'
                    }, 'Status:'),
                    React.createElement('div', {
                        key: 'status-value',
                        className: 'font-medium text-blue-900 dark:text-blue-100'
                    }, 'Ready to Import')
                ])
            ])
        ]),

        // Status section
        React.createElement('div', {
            key: 'status-section',
            className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-6'
        }, [
            React.createElement('div', {
                key: 'status-content',
                className: 'flex items-center justify-center gap-4'
            }, [
                React.createElement('div', { key: 'status-icon' }, getStatusIcon()),
                React.createElement('div', {
                    key: 'status-text',
                    className: 'text-center'
                }, [
                    React.createElement('div', {
                        key: 'status-message',
                        className: `text-lg font-medium ${getStatusColor()}`
                    }, getStatusMessage()),
                    status && React.createElement('div', {
                        key: 'status-details',
                        className: 'text-sm text-gray-500 dark:text-gray-400 mt-1'
                    }, [
                        React.createElement('div', { key: 'processed' }, `Processed: ${status.processed_rows || 0} rows`),
                        React.createElement('div', { key: 'errors' }, `Errors: ${status.error_count || 0} rows`)
                    ])
                ])
            ])
        ]),

        // Import results
        importResult && React.createElement('div', {
            key: 'results',
            className: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4'
        }, [
            React.createElement('div', {
                key: 'results-header',
                className: 'flex items-center gap-2 mb-3'
            }, [
                React.createElement(CheckCircle, {
                    key: 'success-icon',
                    size: 20,
                    className: 'text-green-600'
                }),
                React.createElement('span', {
                    key: 'success-title',
                    className: 'font-medium text-green-900 dark:text-green-100'
                }, 'Import Results')
            ]),
            React.createElement('div', {
                key: 'results-content',
                className: 'grid grid-cols-2 gap-4 text-sm'
            }, [
                React.createElement('div', {
                    key: 'processed-rows',
                    className: 'text-center'
                }, [
                    React.createElement('div', {
                        key: 'processed-value',
                        className: 'text-2xl font-bold text-green-600'
                    }, importResult.processedRows || 0),
                    React.createElement('div', {
                        key: 'processed-label',
                        className: 'text-green-800 dark:text-green-200'
                    }, 'Rows Imported')
                ]),
                React.createElement('div', {
                    key: 'error-rows',
                    className: 'text-center'
                }, [
                    React.createElement('div', {
                        key: 'error-value',
                        className: 'text-2xl font-bold text-orange-600'
                    }, importResult.errorCount || 0),
                    React.createElement('div', {
                        key: 'error-label',
                        className: 'text-green-800 dark:text-green-200'
                    }, 'Errors')
                ])
            ])
        ]),

        // Errors section
        errors.length > 0 && React.createElement('div', {
            key: 'errors-section',
            className: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'
        }, [
            React.createElement('div', {
                key: 'errors-header',
                className: 'flex items-center gap-2 mb-3'
            }, [
                React.createElement(AlertCircle, {
                    key: 'error-icon',
                    size: 20,
                    className: 'text-red-600'
                }),
                React.createElement('span', {
                    key: 'error-title',
                    className: 'font-medium text-red-900 dark:text-red-100'
                }, `Import Errors (${errors.length})`)
            ]),
            React.createElement('div', {
                key: 'errors-list',
                className: 'space-y-2 max-h-64 overflow-y-auto'
            }, errors.map((error, index) => React.createElement('div', {
                key: `error-${index}`,
                className: 'bg-white dark:bg-gray-800 rounded p-3 text-sm'
            }, [
                React.createElement('div', {
                    key: 'error-header',
                    className: 'flex items-center justify-between mb-1'
                }, [
                    React.createElement('span', {
                        key: 'error-row',
                        className: 'font-medium text-gray-900 dark:text-white'
                    }, `Row ${error.row_number}`),
                    React.createElement('span', {
                        key: 'error-type',
                        className: 'px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 text-xs rounded'
                    }, error.error_type)
                ]),
                React.createElement('div', {
                    key: 'error-message',
                    className: 'text-red-700 dark:text-red-300'
                }, error.error_message),
                error.field_name && React.createElement('div', {
                    key: 'error-field',
                    className: 'text-gray-600 dark:text-gray-400 mt-1'
                }, `Field: ${error.field_name}`)
            ])))
        ]),

        // Action buttons
        !importResult && React.createElement('div', {
            key: 'actions',
            className: 'flex justify-center gap-4'
        }, [
            React.createElement('button', {
                key: 'process-btn',
                onClick: handleProcess,
                disabled: processing,
                className: `px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    processing 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`
            }, [
                processing && React.createElement(RefreshCw, {
                    key: 'processing-spinner',
                    size: 16,
                    className: 'animate-spin'
                }),
                React.createElement('span', {
                    key: 'process-text'
                }, processing ? 'Processing...' : 'Start Import')
            ])
        ]),

        // Completion actions
        importResult && React.createElement('div', {
            key: 'completion-actions',
            className: 'flex justify-center gap-4'
        }, [
            React.createElement('button', {
                key: 'close-btn',
                onClick: onClose,
                className: 'px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
            }, 'Close'),
            React.createElement('button', {
                key: 'new-import-btn',
                onClick: () => window.location.reload(),
                className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            }, 'New Import')
        ])
    ]);
};
