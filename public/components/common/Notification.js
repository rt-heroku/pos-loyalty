// Notification System Component
window.Components = window.Components || {};

window.Components.Notification = function({ type = 'info', title, message, duration = 5000, onClose }) {
    const [isVisible, setIsVisible] = React.useState(true);
    const [isExiting, setIsExiting] = React.useState(false);

    React.useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, 300);
    };

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return 'ℹ️';
        }
    };

    const getColors = () => {
        const isDark = document.documentElement.classList.contains('dark');
        
        if (isDark) {
            switch (type) {
                case 'success':
                    return {
                        bg: 'bg-green-900/80',
                        border: 'border-green-800',
                        icon: 'text-green-400',
                        title: 'text-green-100',
                        message: 'text-green-200'
                    };
                case 'error':
                    return {
                        bg: 'bg-red-900/50',
                        border: 'border-red-800',
                        icon: 'text-red-400',
                        title: 'text-red-100',
                        message: 'text-red-200'
                    };
                case 'warning':
                    return {
                        bg: 'bg-yellow-900/20',
                        border: 'border-yellow-800',
                        icon: 'text-yellow-400',
                        title: 'text-yellow-100',
                        message: 'text-yellow-200'
                    };
                case 'info':
                default:
                    return {
                        bg: 'bg-blue-900/20',
                        border: 'border-blue-800',
                        icon: 'text-blue-400',
                        title: 'text-blue-100',
                        message: 'text-blue-200'
                    };
            }
        } else {
            switch (type) {
                case 'success':
                    return {
                        bg: 'bg-green-70',
                        border: 'border-green-200',
                        icon: 'text-green-600',
                        title: 'text-green-900',
                        message: 'text-green-800'
                    };
                case 'error':
                    return {
                        bg: 'bg-red-70',
                        border: 'border-red-200',
                        icon: 'text-red-600',
                        title: 'text-red-900',
                        message: 'text-red-800'
                    };
                case 'warning':
                    return {
                        bg: 'bg-yellow-70',
                        border: 'border-yellow-200',
                        icon: 'text-yellow-600',
                        title: 'text-yellow-900',
                        message: 'text-yellow-800'
                    };
                case 'info':
                default:
                    return {
                        bg: 'bg-blue-70',
                        border: 'border-blue-200',
                        icon: 'text-blue-600',
                        title: 'text-blue-900',
                        message: 'text-blue-800'
                    };
            }
        }
    };

    const colors = getColors();

    return React.createElement('div', {
        key: 'notification-container',
        className: `fixed top-4 right-4 z-[9999] max-w-sm w-full transform transition-all duration-300 ${
            isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`
    }, [
        React.createElement('div', {
            key: 'notification-card',
            className: `${colors.bg} ${colors.border} border rounded-lg shadow-lg p-4`
        }, [
            React.createElement('div', {
                key: 'notification-content',
                className: 'flex items-start gap-3'
            }, [
                React.createElement('div', {
                    key: 'icon-container',
                    className: `flex-shrink-0 w-6 h-6 flex items-center justify-center ${colors.icon}`
                }, [
                    React.createElement('span', { key: 'icon', className: 'text-lg' }, getIcon())
                ]),
                React.createElement('div', {
                    key: 'text-content',
                    className: 'flex-1 min-w-0'
                }, [
                    title && React.createElement('h4', {
                        key: 'title',
                        className: `font-semibold text-sm ${colors.title} mb-1`
                    }, title),
                    React.createElement('p', {
                        key: 'message',
                        className: `text-sm ${colors.message}`
                    }, message)
                ]),
                React.createElement('button', {
                    key: 'close-button',
                    onClick: handleClose,
                    className: `flex-shrink-0 ml-2 ${colors.icon} hover:opacity-70 transition-opacity`
                }, [
                    React.createElement('span', { key: 'close-icon', className: 'text-lg' }, '×')
                ])
            ])
        ])
    ]);
};

// Notification Manager
window.NotificationManager = {
    notifications: [],
    listeners: [],

    show: function(type, title, message, duration = 5000) {
        const id = Date.now() + Math.random();
        const notification = { id, type, title, message, duration };
        
        this.notifications.push(notification);
        this.notifyListeners();
        
        return id;
    },

    success: function(title, message, duration) {
        return this.show('success', title, message, duration);
    },

    error: function(title, message, duration) {
        return this.show('error', title, message, duration);
    },

    warning: function(title, message, duration) {
        return this.show('warning', title, message, duration);
    },

    info: function(title, message, duration) {
        return this.show('info', title, message, duration);
    },

    remove: function(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.notifyListeners();
    },

    clear: function() {
        this.notifications = [];
        this.notifyListeners();
    },

    addListener: function(callback) {
        this.listeners.push(callback);
    },

    removeListener: function(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    },

    notifyListeners: function() {
        this.listeners.forEach(callback => callback(this.notifications));
    }
};

// Notification Container Component
window.Components.NotificationContainer = function() {
    const [notifications, setNotifications] = React.useState([]);

    React.useEffect(() => {
        const handleNotifications = (newNotifications) => {
            setNotifications(newNotifications);
        };

        window.NotificationManager.addListener(handleNotifications);
        return () => window.NotificationManager.removeListener(handleNotifications);
    }, []);

    return React.createElement('div', {
        key: 'notification-container-wrapper',
        className: 'fixed top-4 right-4 z-[9999] space-y-2'
    }, notifications.map(notification => 
        React.createElement(window.Components.Notification, {
            key: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            duration: notification.duration,
            onClose: () => window.NotificationManager.remove(notification.id)
        })
    ));
};

// Debug Helper Functions - Available in Console
window.notification = {
    success: function(message, title = 'Success', duration = 5000) {
        return window.NotificationManager.success(title, message, duration);
    },
    
    error: function(message, title = 'Error', duration = 5000) {
        return window.NotificationManager.error(title, message, duration);
    },
    
    warning: function(message, title = 'Warning', duration = 5000) {
        return window.NotificationManager.warning(title, message, duration);
    },
    
    info: function(message, title = 'Info', duration = 5000) {
        return window.NotificationManager.info(title, message, duration);
    },
    
    clear: function() {
        window.NotificationManager.clear();
    },
    
    // Test function to show all notification types
    test: function() {
        this.success('This is a success message!');
        setTimeout(() => this.error('This is an error message!'), 1000);
        setTimeout(() => this.warning('This is a warning message!'), 2000);
        setTimeout(() => this.info('This is an info message!'), 3000);
    }
};

// Make it available globally for easier access
window.notify = window.notification;