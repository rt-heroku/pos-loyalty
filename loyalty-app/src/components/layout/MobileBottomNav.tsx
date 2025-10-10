'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  ShoppingBag,
  MapPin,
  Heart,
  User,
  Plus,
  Scan,
  Bell,
} from 'lucide-react';

import { pwaManager } from '@/lib/pwa';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: number;
  isActive?: boolean;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if device is mobile
  useEffect(() => {
    if (!isClient) return;
    
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [isClient]);

  // Handle scroll to show/hide navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Don't render on server or desktop
  if (!isClient || !isMobile) {
    return null;
  }

  // Navigation items
  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/dashboard',
      isActive: pathname === '/dashboard',
    },
    {
      id: 'products',
      label: 'Products',
      icon: ShoppingBag,
      href: '/products',
      isActive: pathname.startsWith('/products'),
    },
    {
      id: 'stores',
      label: 'Stores',
      icon: MapPin,
      href: '/stores',
      isActive: pathname.startsWith('/stores'),
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      icon: Heart,
      href: '/wishlist',
      isActive: pathname === '/wishlist',
      badge: 0,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      href: '/profile',
      isActive: pathname === '/profile',
    },
  ];

  // Quick action items
  const quickActions = [
    {
      id: 'scan',
      label: 'Scan QR',
      icon: Scan,
      action: () => router.push('/scan'),
      color: 'bg-blue-500',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      action: () => router.push('/notifications'),
      color: 'bg-orange-500',
    },
  ];

  // Handle navigation
  const handleNavigation = (href: string) => {
    router.push(href);
    pwaManager.hapticFeedback('light');
  };

  // Handle quick action
  const handleQuickAction = (action: () => void) => {
    action();
    pwaManager.hapticFeedback('medium');
    setShowQuickActions(false);
  };

  return (
    <>
      {/* Quick Actions FAB */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 right-4 z-50 space-y-3"
          >
            {quickActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleQuickAction(action.action)}
                className={`${action.color} flex h-14 w-14 transform items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110`}
                style={{ touchAction: 'manipulation' }}
              >
                <action.icon size={24} />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: isVisible ? 0 : 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-lg md:hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          touchAction: 'manipulation',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-xl transition-all duration-200 ${
                  item.isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`}
                whileTap={{ scale: 0.95 }}
                style={{ touchAction: 'manipulation' }}
              >
                <div className="relative">
                  <Icon size={24} />
                  {item.badge && item.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </motion.span>
                  )}
                </div>
                <span className="mt-1 text-xs font-medium">{item.label}</span>

                {/* Active indicator */}
                {item.isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-0 h-1 w-8 rounded-t-full bg-blue-600"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}

          {/* Quick Actions Button */}
          <motion.button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl transition-all duration-200 ${
              showQuickActions
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
            }`}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: showQuickActions ? 45 : 0 }}
            style={{ touchAction: 'manipulation' }}
          >
            <Plus size={24} />
            <span className="mt-1 text-xs font-medium">More</span>
          </motion.button>
        </div>

        {/* Safe area indicator for devices with home indicators */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
      </motion.nav>

      {/* Swipe up indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0 : 1 }}
        className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 transform md:hidden"
      >
        <div className="rounded-full bg-black bg-opacity-50 px-3 py-1 text-xs text-white">
          Swipe up for navigation
        </div>
      </motion.div>
    </>
  );
}

// Swipe gesture hook for mobile navigation
export function useSwipeGesture(
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold: number = 50
) {
  const [startY, setStartY] = useState<number | null>(null);
  const [startX, setStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length > 0 && e.touches[0]) {
      setStartY(e.touches[0].clientY);
      setStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY === null || startX === null) return;
    if (
      !e.changedTouches ||
      e.changedTouches.length === 0 ||
      !e.changedTouches[0]
    )
      return;

    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const deltaY = startY - endY;
    const deltaX = startX - endX;

    // Check if swipe is more vertical than horizontal
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && onSwipeUp) {
        onSwipeUp();
      } else if (deltaY < 0 && onSwipeDown) {
        onSwipeDown();
      }
    }

    setStartY(null);
    setStartX(null);
  };

  return { handleTouchStart, handleTouchEnd };
}
