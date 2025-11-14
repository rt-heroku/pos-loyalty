// Setup Wizard Component for First-Time POS Configuration
// Redirects to the loyalty app's setup wizard for unified setup experience
window.Auth = window.Auth || {};

window.Auth.SetupView = ({ onSetupComplete }) => {
    React.useEffect(() => {
        // Redirect to the loyalty app's multi-step setup wizard
        console.log('🔄 Redirecting to setup wizard...');
        window.location.href = '/loyalty/setup-wizard';
    }, []);

    // Show loading state while redirecting
    return React.createElement('div', {
        className: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'
    }, [
        React.createElement('div', {
            key: 'loading-container',
            className: 'text-center'
        }, [
            React.createElement('div', {
                key: 'spinner',
                className: 'mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'
            }),
            React.createElement('p', {
                key: 'text',
                className: 'text-gray-600'
            }, 'Redirecting to setup wizard...')
        ])
    ]);
};
