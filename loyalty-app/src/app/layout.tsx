import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import LayoutProviders from '@/components/layout/LayoutProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Customer Loyalty App',
  description:
    'Manage your loyalty program, track points, and access exclusive rewards',
  manifest: '/loyalty/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Customer Loyalty App',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/loyalty/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/loyalty/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/loyalty/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Customer Loyalty App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="apple-mobile-web-app-title"
          content="Customer Loyalty App"
        />
        <meta
          name="description"
          content="Manage your loyalty program, track points, and access exclusive rewards"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/loyalty/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="grammarly-disable-extension" content="true" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/loyalty/icon-192x192.svg" />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/loyalty/icon-192x192.svg"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/loyalty/icon-192x192.svg"
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href="/loyalty/icon-192x192.svg"
        />

        {/* Splash Screens */}
        <link
          rel="apple-touch-startup-image"
          href="/loyalty/splash/apple-splash-2048-2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/loyalty/splash/apple-splash-1668-2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/loyalty/splash/apple-splash-1536-2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/loyalty/splash/apple-splash-1125-2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/loyalty/splash/apple-splash-1242-2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/loyalty/splash/apple-splash-750-1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/loyalty/splash/apple-splash-640-1136.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={inter.className}>
        <LayoutProviders>{children}</LayoutProviders>

        {/* PWA Installation Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // PWA Installation and Service Worker Registration
              (function() {
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    // Only register in production or when explicitly enabled
                    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
                    const enableSW = window.location.search.includes('sw=true') || isProduction;
                    
                    if (enableSW) {
                      // Clear any existing service workers first
                      navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        for(let registration of registrations) {
                          registration.unregister();
                        }
                      }).then(function() {
                        // Register new service worker
                        return navigator.serviceWorker.register('/sw.js', {
                          scope: '/',
                          updateViaCache: 'none'
                        });
                      }).then(function(registration) {
                          console.log('SW registered: ', registration);
                          
                          // Handle updates
                          registration.addEventListener('updatefound', function() {
                            const newWorker = registration.installing;
                            if (newWorker) {
                              newWorker.addEventListener('statechange', function() {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                  // New version available
                                  if (confirm('A new version is available. Would you like to update?')) {
                                    window.location.reload();
                                  }
                                }
                              });
                            }
                          });
                        }).catch(function(registrationError) {
                          console.log('SW registration failed: ', registrationError);
                          // Don't show error if it's just a 404 (SW file doesn't exist)
                          if (!registrationError.message.includes('404') && !registrationError.message.includes('500')) {
                            console.warn('Service Worker registration failed, continuing without SW');
                          }
                        });
                    } else {
                      console.log('Service Worker disabled in development mode');
                    }
                  });
                }

                // PWA Install Prompt
                let deferredPrompt;
                window.addEventListener('beforeinstallprompt', function(e) {
                  // Don't prevent default immediately - let the browser handle it naturally
                  deferredPrompt = e;
                  
                  // Show install button or notification
                  const installButton = document.getElementById('installApp');
                  if (installButton) {
                    installButton.style.display = 'block';
                    installButton.addEventListener('click', function() {
                      if (deferredPrompt) {
                        deferredPrompt.prompt();
                        deferredPrompt.userChoice.then(function(choiceResult) {
                          if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the install prompt');
                          } else {
                            console.log('User dismissed the install prompt');
                          }
                          deferredPrompt = null;
                        });
                      }
                    });
                  }
                });

                // Handle app installed
                window.addEventListener('appinstalled', function(evt) {
                  console.log('App was installed');
                  // Hide install button
                  const installButton = document.getElementById('installApp');
                  if (installButton) {
                    installButton.style.display = 'none';
                  }
                });

                // Online/Offline detection
                function updateOnlineStatus() {
                  const status = document.getElementById('onlineStatus');
                  if (status) {
                    if (navigator.onLine) {
                      status.textContent = 'Online';
                      status.className = 'online';
                    } else {
                      status.textContent = 'Offline';
                      status.className = 'offline';
                    }
                  }
                }

                window.addEventListener('online', updateOnlineStatus);
                window.addEventListener('offline', updateOnlineStatus);
                updateOnlineStatus();

                // Haptic feedback support
                if ('vibrate' in navigator) {
                  window.hapticFeedback = function(pattern) {
                    navigator.vibrate(pattern);
                  };
                }

                // Touch action optimization
                document.addEventListener('touchstart', function() {}, {passive: true});
                document.addEventListener('touchmove', function() {}, {passive: true});
                document.addEventListener('touchend', function() {}, {passive: true});

                // Performance monitoring
                if ('performance' in window) {
                  window.addEventListener('load', function() {
                    setTimeout(function() {
                      const perfData = performance.getEntriesByType('navigation')[0];
                      if (perfData) {
                        console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                      }
                    }, 0);
                  });
                }

                // Cache clearing utility
                window.clearAppCache = function() {
                  if ('caches' in window) {
                    caches.keys().then(function(cacheNames) {
                      return Promise.all(
                        cacheNames.map(function(cacheName) {
                          console.log('Clearing cache:', cacheName);
                          return caches.delete(cacheName);
                        })
                      );
                    }).then(function() {
                      console.log('All caches cleared, reloading...');
                      window.location.reload(true);
                    });
                  } else {
                    window.location.reload(true);
                  }
                };
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
