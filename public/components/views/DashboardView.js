// DashboardView.js - Tableau Dashboard View Component
if (!window.Views) {
    window.Views = {};
}

window.Views.DashboardView = ({ selectedLocation }) => {
    const [scriptLoaded, setScriptLoaded] = React.useState(false);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        // Load Tableau Embedding API script
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://10ax.online.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js';
        script.onload = () => {
            console.log('✅ Tableau Embedding API loaded');
            setScriptLoaded(true);
        };
        script.onerror = () => {
            console.error('❌ Failed to load Tableau Embedding API');
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup: remove script when component unmounts
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    React.useEffect(() => {
        if (scriptLoaded && containerRef.current) {
            console.log('📊 Initializing Tableau visualization');
            
            // Clear any existing content
            containerRef.current.innerHTML = '';
            
            // Create tableau-viz element
            const tableauViz = document.createElement('tableau-viz');
            tableauViz.id = 'tableau-viz';
            tableauViz.setAttribute('src', 'https://10ax.online.tableau.com/t/rcgsepulse/views/ScottsRestaurantBar/FranchiseeExecDash');
            // tableauViz.setAttribute('width', '100%');
            // tableauViz.setAttribute('height', '100%');
            tableauViz.setAttribute('toolbar', 'bottom');
            
            containerRef.current.appendChild(tableauViz);
        }
    }, [scriptLoaded]);

    return React.createElement('div', { 
        className: 'h-full flex flex-col bg-white dark:bg-gray-900'
    }, [
        // Header
        React.createElement('div', {
            key: 'dashboard-header',
            className: 'p-6 border-b border-gray-200 dark:border-gray-700'
        }, [
            React.createElement('div', {
                key: 'header-content',
                className: 'flex items-center justify-between'
            }, [
                React.createElement('div', { key: 'title-section' }, [
                    React.createElement('h1', {
                        key: 'title',
                        className: 'text-2xl font-bold text-gray-900 dark:text-white'
                    }, 'Executive Dashboard'),
                    React.createElement('p', {
                        key: 'subtitle',
                        className: 'text-sm text-gray-600 dark:text-gray-400 mt-1'
                    }, 'Real-time business intelligence and analytics')
                ]),
                selectedLocation && React.createElement('div', {
                    key: 'location-badge',
                    className: 'px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg'
                }, [
                    React.createElement('span', {
                        key: 'location-label',
                        className: 'text-sm font-medium'
                    }, `${selectedLocation.store_name} • ${selectedLocation.store_code}`)
                ])
            ])
        ]),

        // Dashboard Container
        React.createElement('div', {
            key: 'dashboard-container',
            ref: containerRef,
            className: 'flex-1 p-6 overflow-hidden'
        }, [
            !scriptLoaded && React.createElement('div', {
                key: 'loading',
                className: 'flex items-center justify-center h-full'
            }, [
                React.createElement('div', {
                    key: 'loading-content',
                    className: 'text-center'
                }, [
                    React.createElement('div', {
                        key: 'spinner',
                        className: 'inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4'
                    }),
                    React.createElement('p', {
                        key: 'loading-text',
                        className: 'text-gray-600 dark:text-gray-400'
                    }, 'Loading Tableau Dashboard...')
                ])
            ])
        ])
    ]);
};

