// CategoryBadge.js - Reusable Category Badge Component
window.CategoryBadge = ({ category }) => {
    const colors = {
        general: 'bg-gray-100 text-gray-800',
        pos: 'bg-blue-100 text-blue-800',
        loyalty: 'bg-green-100 text-green-800',
        inventory: 'bg-purple-100 text-purple-800',
        email: 'bg-yellow-100 text-yellow-800',
        integration: 'bg-indigo-100 text-indigo-800'
    };
    
    return React.createElement('span', {
        className: `px-2 py-1 rounded-full text-xs font-medium ${colors[category] || colors.general}`
    }, category);
};
