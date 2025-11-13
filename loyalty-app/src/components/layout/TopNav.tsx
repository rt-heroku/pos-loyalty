'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopNavProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export default function TopNav({ onMenuToggle, isMenuOpen }: TopNavProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [customerImage, setCustomerImage] = useState<string | null>(null);
  const [locationLogo, setLocationLogo] = useState<string | null>(null);

  // Load customer image
  useEffect(() => {
    const loadCustomerImage = async () => {
      if (!user || !user.id) {
        console.log('TopNav: No user or user.id, skipping profile image load');
        return;
      }

      console.log('TopNav: Loading customer image for user:', user.id);
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const response = await fetch(`${basePath}/api/customers/profile`, {
          credentials: 'include', // Ensure cookies are sent
        });
        console.log('TopNav: Profile API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('TopNav: Profile data received:', data);
          
          if (data.customer.avatar?.image_data) {
            // Check if the image data is already a data URL
            const imageData = data.customer.avatar.image_data;
            let dataUrl;
            
            if (imageData.startsWith('data:')) {
              // Already a data URL, use as is
              dataUrl = imageData;
              console.log('TopNav: Image data is already a data URL');
            } else {
              // Format the image data as a data URL
              const mimeType = data.customer.avatar.filename?.endsWith('.png') ? 'image/png' : 'image/jpeg';
              dataUrl = `data:${mimeType};base64,${imageData}`;
              console.log('TopNav: Formatted image data as data URL');
            }
            
            console.log('TopNav: Setting customer image:', dataUrl.substring(0, 50) + '...');
            setCustomerImage(dataUrl);
          } else {
            console.log('TopNav: No avatar data found');
            setCustomerImage(null);
          }
        } else {
          console.log('TopNav: Profile API failed with status:', response.status);
          const errorText = await response.text();
          console.log('TopNav: Error response:', errorText);
          setCustomerImage(null);
        }
      } catch (error) {
        console.error('TopNav: Error loading customer image:', error);
        setCustomerImage(null);
      }
    };

    // Add a delay to ensure authentication is complete
    const timeoutId = setTimeout(() => {
      if (user && user.id) {
        loadCustomerImage();
      }
    }, 500); // Increased delay to ensure auth is complete

    return () => clearTimeout(timeoutId);
  }, [user]);

  // Debug logging
  useEffect(() => {
    console.log('TopNav isMenuOpen state:', isMenuOpen);
  }, [isMenuOpen]);

  // Debug user changes
  useEffect(() => {
    console.log('TopNav user changed:', user);
  }, [user]);

  // Load location logo
  useEffect(() => {
    const loadLocationLogo = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const locationResponse = await fetch(`${basePath}/api/locations/current`);
        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          if (locationData.success && locationData.location) {
            setLocationLogo(locationData.location.logo_base64 || locationData.location.logo_url);
          }
        }
      } catch (error) {
        console.error('TopNav: Error loading location logo:', error);
      }
    };

    loadLocationLogo();
  }, []);

  if (!user) return null;

  const handleMenuToggle = () => {
    console.log('TopNav: Menu toggle clicked, current state:', isMenuOpen);
    onMenuToggle();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side - Menu button and Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleMenuToggle}
            className={cn(
              'rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900',
              isMenuOpen && 'bg-primary-50 text-primary-600'
            )}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          {locationLogo && (
            <div className="flex h-10 w-24 items-center justify-center overflow-hidden relative">
              <Image
                src={locationLogo}
                alt="Company Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
        </div>

        {/* Center - Search bar */}
        <div className="hidden md:block flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-xl border border-gray-300 py-2.5 pl-11 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right side - Notifications and User */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <Bell className="h-5 w-5" />
              {/* Notification badge */}
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                <div className="border-b border-gray-200 px-4 py-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="cursor-pointer px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-primary-500"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          Welcome to the Loyalty Program!
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          You've earned 100 bonus points for joining.
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          2 hours ago
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="cursor-pointer px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-green-500"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          New reward available!
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Redeem your points for a free coffee.
                        </p>
                        <p className="mt-1 text-xs text-gray-400">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-2">
                  <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center rounded-lg p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white overflow-hidden">
                {customerImage ? (
                  <Image
                    src={customerImage}
                    alt="Profile"
                    width={36}
                    height={36}
                    className="object-cover rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                <div className="border-b border-gray-200 px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  {user.tier && (
                    <div className="mt-1 text-xs font-medium text-primary-600">
                      {user.tier} Member
                    </div>
                  )}
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/profile');
                    }}
                    className="flex w-full items-center space-x-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/settings');
                    }}
                    className="flex w-full items-center space-x-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/chat');
                    }}
                    className="flex w-full items-center space-x-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Bot className="h-4 w-4" />
                    <span>AI Assistant</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/help');
                    }}
                    className="flex w-full items-center space-x-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Help</span>
                  </button>
                </div>

                <div className="border-t border-gray-200 py-1">
                  <button
                    onClick={logout}
                    className="flex w-full items-center space-x-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
