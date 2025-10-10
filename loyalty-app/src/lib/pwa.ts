// PWA Service Registration and Management
export class PWAManager {
  private static instance: PWAManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = false;

  private constructor() {
    // Only run on client side
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.setupOnlineOfflineListeners();
    }
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  // Register service worker
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              this.showUpdatePrompt();
            }
          });
        }
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.registration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ) as any,
      });

      console.log('Push subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  // Show notification
  showNotification(title: string, options: NotificationOptions = {}): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (!this.registration || Notification.permission !== 'granted') {
      return;
    }

    this.registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options,
    });
  }

  // Background sync for offline requests
  async registerBackgroundSync(tag: string, _data?: any): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    if (!this.registration || !('sync' in this.registration)) {
      console.log('Background Sync not supported');
      return false;
    }

    try {
      await (this.registration as any).sync.register(tag);
      console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }

  // Cache data for offline use
  async cacheData(key: string, data: any): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (!this.registration || !this.registration.active) {
      return;
    }

    this.registration.active.postMessage({
      type: 'CACHE_DATA',
      key,
      data,
    });
  }

  // Get cached data
  async getCachedData(key: string): Promise<any> {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.registration || !this.registration.active) {
      return null;
    }

    return new Promise(resolve => {
      const channel = new MessageChannel();

      channel.port1.onmessage = event => {
        resolve(event.data.data);
      };

      this.registration!.active!.postMessage(
        {
          type: 'GET_CACHED_DATA',
          key,
        },
        [channel.port2]
      );
    });
  }

  // Check if app is online
  isAppOnline(): boolean {
    return this.isOnline;
  }

  // Install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    if (!this.registration || !this.registration.waiting) {
      return false;
    }

    try {
      await this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  // Handle offline form submission
  async handleOfflineSubmission(url: string, data: any): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.isOnline) {
      // Submit normally if online
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          this.showNotification('Success', {
            body: 'Your request has been submitted successfully',
            tag: 'form-submission',
          });
        }
      } catch (error) {
        console.error('Form submission failed:', error);
        this.showNotification('Error', {
          body: 'Failed to submit request. Will retry when online.',
          tag: 'form-submission-error',
        });
      }
    } else {
      // Store for later submission if offline
      await this.storeOfflineRequest(url, data);
      this.showNotification('Offline Mode', {
        body: "Request saved. Will submit when you're back online.",
        tag: 'offline-request',
      });
    }
  }

  // Store offline request
  private async storeOfflineRequest(url: string, data: any): Promise<void> {
    const offlineRequests = JSON.parse(
      localStorage.getItem('offlineRequests') || '[]'
    );
    offlineRequests.push({
      id: Date.now(),
      url,
      data,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('offlineRequests', JSON.stringify(offlineRequests));
  }

  // Process offline requests when back online
  async processOfflineRequests(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (!this.isOnline) return;

    const offlineRequests = JSON.parse(
      localStorage.getItem('offlineRequests') || '[]'
    );
    if (offlineRequests.length === 0) return;

    console.log('Processing offline requests:', offlineRequests.length);

    for (const request of offlineRequests) {
      try {
        const response = await fetch(request.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request.data),
        });

        if (response.ok) {
          // Remove successful request
          const updatedRequests = offlineRequests.filter(
            (r: any) => r.id !== request.id
          );
          localStorage.setItem(
            'offlineRequests',
            JSON.stringify(updatedRequests)
          );

          this.showNotification('Offline Request Processed', {
            body: 'Your offline request has been submitted successfully',
            tag: 'offline-request-processed',
          });
        }
      } catch (error) {
        console.error('Failed to process offline request:', error);
      }
    }
  }

  // Setup online/offline listeners
  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineRequests();
      this.showNotification('Back Online', {
        body: "You're back online. Processing offline requests...",
        tag: 'back-online',
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNotification('Offline Mode', {
        body: "You're offline. Some features may be limited.",
        tag: 'offline-mode',
      });
    });
  }

  // Show update prompt
  private showUpdatePrompt(): void {
    if (confirm('A new version is available. Would you like to update?')) {
      window.location.reload();
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get app installation status
  getInstallationStatus(): 'installed' | 'not-installed' | 'not-supported' {
    if (typeof window === 'undefined') {
      return 'not-supported';
    }

    if (!('standalone' in window.navigator)) {
      return 'not-supported';
    }

    return (window.navigator as any).standalone ? 'installed' : 'not-installed';
  }

  // Haptic feedback (if supported)
  hapticFeedback(pattern: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (typeof window === 'undefined') {
      return;
    }

    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20, 10, 20],
        heavy: [50, 25, 50, 25, 50],
      };
      navigator.vibrate(patterns[pattern]);
    }
  }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance();
