'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import MobileBottomNav from './MobileBottomNav';
import ChatLayout from '../chat/ChatLayout';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Check if current page is shop (public access allowed)
  const isShopPage = pathname.startsWith('/shop');

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Set initial sidebar state based on screen size and page type
  useEffect(() => {
    // For shop pages, start with sidebar closed on mobile
    if (window.innerWidth < 1024 && isShopPage) {
      setIsSidebarOpen(false);
    } else if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }

    // Load collapsed state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
  }, [isShopPage]);

  // Listen for localStorage changes (sidebar collapse state)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setIsSidebarCollapsed(JSON.parse(savedState));
      }
    };

    // Poll localStorage every 100ms (since localStorage events don't fire in same window)
    const interval = setInterval(handleStorageChange, 100);
    return () => clearInterval(interval);
  }, []);

  // Redirect to login if not authenticated (except for shop pages and setup wizard)
  const isSetupWizard = pathname.includes('/setup-wizard');
  useEffect(() => {
    if (!loading && !user && !isShopPage && !isSetupWizard) {
      router.push('/login');
    }
  }, [user, loading, router, isShopPage, isSetupWizard, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For shop pages, allow access even without authentication
  if (!user && !isShopPage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content area */}
      <div className={cn(
        'transition-all duration-300',
        // On mobile: no margin (sidebar overlays)
        // On desktop: always have margin based on collapsed state (sidebar is always visible)
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        {/* Top navigation */}
        <TopNav
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isMenuOpen={isSidebarOpen}
        />

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>

      {/* Mobile bottom navigation and chat - only for authenticated pages */}
      <MobileBottomNav />
      <ChatLayout />
    </div>
  );
}
