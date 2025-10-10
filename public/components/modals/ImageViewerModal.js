// ImageViewerModal Component
// Modal for viewing voucher images

window.Components = window.Components || {};
window.Components.ImageViewerModal = function({ imageUrl, isOpen, onClose, title = "Voucher Image" }) {
    const [imageError, setImageError] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    // Reset states when modal opens/closes
    React.useEffect(() => {
        if (isOpen) {
            setImageError(false);
            setLoading(true);
        }
    }, [isOpen, imageUrl]);

    const handleImageLoad = () => {
        setLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setLoading(false);
        setImageError(true);
    };

    const handleDownload = () => {
        if (imageUrl) {
            // Create a temporary link to download the image
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `voucher-image-${Date.now()}.jpg`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (!isOpen) return null;

    return React.createElement('div', { 
        className: 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4' 
    }, [
        React.createElement('div', { 
            key: 'modal', 
            className: 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden' 
        }, [
            // Header
            React.createElement('div', { 
                key: 'header', 
                className: 'flex items-center justify-between p-4 border-b dark:border-gray-700' 
            }, [
                React.createElement('h3', { 
                    key: 'title', 
                    className: 'text-lg font-semibold text-gray-900 dark:text-white' 
                }, title),
                React.createElement('button', {
                    key: 'close-btn',
                    onClick: onClose,
                    className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                }, [
                    React.createElement('svg', {
                        key: 'close-icon',
                        className: 'w-6 h-6',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                    }, [
                        React.createElement('path', {
                            key: 'path',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M6 18L18 6M6 6l12 12'
                        })
                    ])
                ])
            ]),

            // Content
            React.createElement('div', { 
                key: 'content', 
                className: 'p-4 flex flex-col items-center justify-center min-h-[400px]' 
            }, [
                // Loading State
                loading && React.createElement('div', { 
                    key: 'loading', 
                    className: 'flex flex-col items-center justify-center py-12' 
                }, [
                    React.createElement('div', { 
                        key: 'spinner', 
                        className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4' 
                    }),
                    React.createElement('div', { 
                        key: 'loading-text', 
                        className: 'text-gray-600 dark:text-gray-400' 
                    }, 'Loading image...')
                ]),

                // Error State
                imageError && React.createElement('div', { 
                    key: 'error', 
                    className: 'flex flex-col items-center justify-center py-12 text-center' 
                }, [
                    React.createElement('div', { 
                        key: 'error-icon', 
                        className: 'text-6xl mb-4' 
                    }, '🖼️'),
                    React.createElement('h4', { 
                        key: 'error-title', 
                        className: 'text-xl font-semibold text-gray-900 dark:text-white mb-2' 
                    }, 'Unable to Display Image'),
                    React.createElement('p', { 
                        key: 'error-message', 
                        className: 'text-gray-600 dark:text-gray-400 mb-4 max-w-md' 
                    }, 'This image cannot be displayed directly. You can download it instead.'),
                    React.createElement('button', {
                        key: 'download-btn',
                        onClick: handleDownload,
                        className: 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2'
                    }, [
                        React.createElement('span', { key: 'download-icon' }, '⬇️'),
                        'Download Image'
                    ])
                ]),

                // Image Display
                !loading && !imageError && imageUrl && React.createElement('div', { 
                    key: 'image-container', 
                    className: 'w-full flex flex-col items-center' 
                }, [
                    React.createElement('img', {
                        key: 'image',
                        src: imageUrl,
                        alt: title,
                        onLoad: handleImageLoad,
                        onError: handleImageError,
                        className: 'max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg'
                    }),
                    React.createElement('div', { 
                        key: 'image-actions', 
                        className: 'mt-4 flex gap-2' 
                    }, [
                        React.createElement('button', {
                            key: 'download-action',
                            onClick: handleDownload,
                            className: 'px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2'
                        }, [
                            React.createElement('span', { key: 'download-icon' }, '⬇️'),
                            'Download'
                        ])
                    ])
                ])
            ])
        ])
    ]);
};
