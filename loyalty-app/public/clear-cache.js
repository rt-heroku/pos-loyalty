// Clear Cache Script for Customer Loyalty App
// This script helps clear browser caches that might be causing issues

(function() {
  console.log('Clearing browser caches...');
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      console.log('All caches cleared successfully');
      // Reload the page
      window.location.reload(true);
    });
  } else {
    console.log('Cache API not supported, reloading page...');
    window.location.reload(true);
  }
})();
