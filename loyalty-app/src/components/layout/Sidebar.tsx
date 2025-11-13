'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Crown,
  Receipt,
  User,
  ShoppingBag,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Navigation items
const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  { id: 'loyalty', label: 'Loyalty', icon: Crown, href: '/loyalty' },
  { id: 'orders', label: 'Orders', icon: Receipt, href: '/orders' },
  { id: 'shop', label: 'Shop', icon: ShoppingBag, href: '/shop' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  { id: 'help', label: 'Help', icon: HelpCircle, href: '/help' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      onClose();
    }
  }, [pathname, isOpen, onClose]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const isItemActive = (href: string): boolean => {
    return pathname === href;
  };

  const handleItemClick = (href: string) => {
    router.push(href);
    // Close mobile sidebar after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out',
          // Mobile: full sidebar width (w-64) or hidden
          'w-64',
          'lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, collapsible width
          'lg:translate-x-0',
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        {/* Collapse/Expand Toggle (Desktop only) */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'hidden lg:flex absolute -right-3 top-20 z-50 h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md hover:bg-gray-50 transition-colors',
            isCollapsed && 'rotate-180'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Close button (Mobile only) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          aria-label="Close menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.href)}
                  className={cn(
                    'group relative flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                    isCollapsed && 'lg:justify-center lg:px-2'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6 flex-shrink-0',
                      isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700',
                      !isCollapsed && 'mr-3'
                    )}
                  />
                  <span
                    className={cn(
                      'truncate transition-all duration-300',
                      isCollapsed && 'lg:hidden'
                    )}
                  >
                    {item.label}
                  </span>

                  {/* Tooltip for collapsed state (Desktop only) */}
                  {isCollapsed && (
                    <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section - Logout */}
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={logout}
            className={cn(
              'group relative flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-red-50 hover:text-red-600',
              isCollapsed && 'lg:justify-center lg:px-2'
            )}
            title={isCollapsed ? 'Sign out' : undefined}
          >
            <LogOut
              className={cn(
                'h-6 w-6 flex-shrink-0 text-gray-500 group-hover:text-red-600',
                !isCollapsed && 'mr-3'
              )}
            />
            <span
              className={cn(
                'truncate transition-all duration-300',
                isCollapsed && 'lg:hidden'
              )}
            >
              Sign out
            </span>

            {/* Tooltip for collapsed state (Desktop only) */}
            {isCollapsed && (
              <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Sign out
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
