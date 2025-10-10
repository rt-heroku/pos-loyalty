// TabButton.js - Reusable Tab Button Component
window.TabButton = ({ tab, label, icon: Icon, active, count }) => (
    React.createElement('button', {
        key: tab,
        onClick: () => setCurrentTab(tab),
        className: `flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
            active 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-700'
        }`
    }, [
        Icon && React.createElement(Icon, { key: 'icon', size: 18 }),
        React.createElement('span', { key: 'label' }, label),
        count !== undefined && React.createElement('span', {
            key: 'count',
            className: `px-2 py-1 rounded-full text-xs ${
                active ? 'bg-blue-500' : 'bg-gray-200 text-gray-600'
            }`
        }, count)
    ])
);
