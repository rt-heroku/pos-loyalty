// Data Loader Modal Component
// Main wizard container for CSV data import

window.Modals = window.Modals || {};

window.Modals.DataLoaderModal = function({
    show,
    onClose,
    onImportComplete
}) {
    if (!show) return null;

    const { X, Upload, MapPin, Eye, Save, CheckCircle, AlertCircle } = window.Icons;

    const [step, setStep] = React.useState(1); // 1: Upload, 2: Mapping, 3: Preview, 4: Process
    const [jobId, setJobId] = React.useState(null);
    const [fileData, setFileData] = React.useState(null);
    const [fieldMapping, setFieldMapping] = React.useState({});
    const [previewData, setPreviewData] = React.useState([]);
    const [processing, setProcessing] = React.useState(false);
    const [importResult, setImportResult] = React.useState(null);
    const fileUploadRef = React.useRef(null);

    // Reset state when modal opens
    React.useEffect(() => {
        if (show) {
            setStep(1);
            setJobId(null);
            setFileData(null);
            setFieldMapping({});
            setPreviewData([]);
            setProcessing(false);
            setImportResult(null);
        }
    }, [show]);

    // Step 1: File Upload
    const handleFileUpload = async (file, type, maxRows = 0) => {
        const formData = new FormData();
        formData.append('csvFile', file);
        formData.append('type', type);
        formData.append('maxRows', maxRows.toString());
        
        try {
            const response = await fetch('/api/data-loader/upload', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                setJobId(result.jobId);
                setFileData({ fileName: file.name, type, totalRows: result.totalRows });
                setStep(2);
            } else {
                const error = await response.json();
                alert(`Upload failed: ${error.error}`);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert(`Upload failed: ${error.message}`);
        }
    };

    // Step 2: Field Mapping
    const handleFieldMapping = (mapping) => {
        setFieldMapping(mapping);
        setStep(3);
    };

    // Step 3: Preview Data
    const handlePreview = async () => {
        if (!jobId) return;
        
        try {
            const response = await fetch(`/api/data-loader/preview/${jobId}?limit=10`);
            if (response.ok) {
                const result = await response.json();
                setPreviewData(result.previewData);
                setStep(4);
            } else {
                const error = await response.json();
                console.error('Preview failed:', error);
                alert(`Preview failed: ${error.error}`);
            }
        } catch (error) {
            console.error('Error getting preview:', error);
            alert(`Preview failed: ${error.message}`);
        }
    };

    // Handle upload from step 1
    const handleUpload = async () => {
        // Trigger upload from FileUploadStep component
        if (fileUploadRef.current && fileUploadRef.current.uploadFile) {
            await fileUploadRef.current.uploadFile();
        }
    };

    // Step 4: Process Data
    const handleProcess = async () => {
        if (!jobId) return;
        
        setProcessing(true);
        try {
            // Process the data (field mapping should already be saved)
            const response = await fetch(`/api/data-loader/process/${jobId}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const result = await response.json();
                setImportResult(result);
                if (onImportComplete) {
                    onImportComplete();
                }
            } else {
                const error = await response.json();
                alert(`Import failed: ${error.error}`);
            }
        } catch (error) {
            console.error('Error processing data:', error);
            alert(`Import failed: ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setJobId(null);
        setFileData(null);
        setFieldMapping({});
        setPreviewData([]);
        setProcessing(false);
        setImportResult(null);
        onClose();
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return 'Upload CSV File';
            case 2: return 'Map Fields';
            case 3: return 'Preview Data';
            case 4: return 'Import Data';
            default: return 'Data Loader';
        }
    };

    const getStepIcon = () => {
        switch (step) {
            case 1: return React.createElement(Upload, { size: 20 });
            case 2: return React.createElement(MapPin, { size: 20 });
            case 3: return React.createElement(Eye, { size: 20 });
            case 4: return React.createElement(Save, { size: 20 });
            default: return React.createElement(Upload, { size: 20 });
        }
    };

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    }, [
        React.createElement('div', {
            key: 'modal',
            className: 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden'
        }, [
            // Header
            React.createElement('div', {
                key: 'header',
                className: 'flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'
            }, [
                React.createElement('div', {
                    key: 'title-section',
                    className: 'flex items-center gap-3'
                }, [
                    React.createElement('div', { key: 'step-icon' }, getStepIcon()),
                    React.createElement('h2', {
                        key: 'title',
                        className: 'text-xl font-semibold text-gray-900 dark:text-white'
                    }, getStepTitle()),
                    React.createElement('span', {
                        key: 'step-indicator',
                        className: 'text-sm text-gray-500 dark:text-gray-400'
                    }, `Step ${step} of 4`)
                ]),
                React.createElement('button', {
                    key: 'close-btn',
                    onClick: handleClose,
                    className: 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                }, React.createElement(X, { size: 20 }))
            ]),

            // Content
            React.createElement('div', {
                key: 'content',
                className: 'p-6 overflow-y-auto max-h-[calc(90vh-200px)]'
            }, [
                // Step 1: File Upload
                step === 1 && React.createElement(window.Components.FileUploadStep, {
                    key: 'file-upload',
                    onUpload: handleFileUpload,
                    autoUpload: false,
                    ref: fileUploadRef
                }),

                // Step 2: Field Mapping
                step === 2 && React.createElement(window.Components.FieldMappingStep, {
                    key: 'field-mapping',
                    jobId: jobId,
                    onMapping: handleFieldMapping
                }),

                // Step 3: Data Preview
                step === 3 && React.createElement(window.Components.DataPreviewStep, {
                    key: 'data-preview',
                    jobId: jobId,
                    previewData: previewData,
                    onNext: handlePreview
                }),

                // Step 4: Process Data
                step === 4 && React.createElement(window.Components.ProcessDataStep, {
                    key: 'process-data',
                    jobId: jobId,
                    processing: processing,
                    importResult: importResult,
                    onProcess: handleProcess,
                    onClose: handleClose
                })
            ]),

            // Footer
            step < 4 && React.createElement('div', {
                key: 'footer',
                className: 'flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700'
            }, [
                React.createElement('button', {
                    key: 'cancel-btn',
                    onClick: handleClose,
                    className: 'px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
                }, 'Cancel'),
                step > 1 && React.createElement('button', {
                    key: 'back-btn',
                    onClick: () => setStep(step - 1),
                    className: 'px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
                }, 'Back'),
                step < 4 && React.createElement('button', {
                    key: 'next-btn',
                    onClick: step === 1 ? handleUpload : step === 3 ? handlePreview : () => setStep(step + 1),
                    className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                }, step === 1 ? 'Upload & Next' : step === 3 ? 'Preview' : 'Next')
            ])
        ])
    ]);
};
