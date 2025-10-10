'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Crown,
  Receipt,
  User,
  MessageCircle,
  ShoppingBag,
  Settings,
  HelpCircle,
  ChevronDown,
  LogOut,
  Bell,
  Search,
  Truck,
  Ticket,
  Heart,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import navigationConfig from '@/config/navigation.json';
import { NavigationItem, SidebarProps } from '@/types/navigation';

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  Home,
  Crown,
  Receipt,
  User,
  MessageCircle,
  ShoppingBag,
  Settings,
  HelpCircle,
  Truck,
  Ticket,
  Heart,
  Tag,
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [customerImage, setCustomerImage] = useState<string | null>(null);
  const [locationLogo, setLocationLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('Loyalty App');

  // Load customer image
  useEffect(() => {
    const loadCustomerImage = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const response = await fetch(`${basePath}/api/customers/profile`);
        if (response.ok) {
          const data = await response.json();
          setCustomerImage(data.customer.avatar?.image_data || null);
        }
      } catch (error) {
        console.error('Error loading customer image:', error);
      }
    };

    if (user) {
      loadCustomerImage();
    }
  }, [user]);

  // Load location logo and company name
  useEffect(() => {
    const loadLocationData = async () => {
      try {
        // Load company name from system settings
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const companyResponse = await fetch(`${basePath}/api/system-settings?key=company_name`);
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          if (companyData.success && companyData.value) {
            setCompanyName(companyData.value);
          }
        }

        // Load location logo
        const locationResponse = await fetch(`${basePath}/api/locations/current`);
        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          if (locationData.success && locationData.location) {
            setLocationLogo(locationData.location.logo_base64 || locationData.location.logo_url);
          }
        }
      } catch (error) {
        console.error('Error loading location data:', error);
      }
    };

    loadLocationData();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('Sidebar isOpen prop:', isOpen);
  }, [isOpen]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      onClose();
    }
  }, [pathname, isOpen, onClose]);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.href && pathname === item.href) return true;
    if (item.submenu) {
      return item.submenu.some(
        subItem => subItem.href && pathname === subItem.href
      );
    }
    return false;
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.submenu) {
      toggleExpanded(item.id);
    } else if (item.href) {
      router.push(item.href);
    }
  };

  const filteredMainMenu = navigationConfig.mainMenu.filter(
    item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.submenu?.some(subItem =>
        subItem.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const filteredBottomMenu = navigationConfig.bottomMenu.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMenuItem = (item: NavigationItem, level: number = 0) => {
    const Icon = iconMap[item.icon] || Home;
    const isActive = isItemActive(item);
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <div key={item.id}>
        <button
          onClick={() => handleItemClick(item)}
          className={cn(
            'group flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-all duration-200',
            'hover:bg-primary-50 hover:text-primary-700',
            isActive &&
              'border border-primary-200 bg-primary-100 text-primary-700',
            level > 0 && 'ml-4 text-sm',
            !item.href && hasSubmenu && 'cursor-pointer'
          )}
        >
          <div className="flex min-w-0 flex-1 items-center space-x-3">
            <Icon
              className={cn(
                'h-5 w-5 flex-shrink-0',
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 group-hover:text-primary-600'
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{item.label}</div>
              {item.description && (
                <div className="hidden truncate text-xs text-gray-500 lg:block">
                  {item.description}
                </div>
              )}
            </div>
          </div>

          {hasSubmenu && (
            <ChevronDown
              className={cn(
                'h-4 w-4 flex-shrink-0 transition-transform duration-200',
                isExpanded ? 'rotate-180' : 'rotate-0',
                isActive ? 'text-primary-600' : 'text-gray-400'
              )}
            />
          )}

          {item.badge && (
            <span className="ml-2 rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700">
              {item.badge}
            </span>
          )}
        </button>

        {hasSubmenu && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.submenu!.map(subItem => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
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

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-in-out',
          // Mobile: slide in/out, hidden on desktop
          'lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            {locationLogo && (
              <div className="flex h-12 w-16 items-center justify-center overflow-hidden relative">
                <Image
                  src={locationLogo}
                  alt="Company Logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
              <p className="text-sm text-gray-500">Customer Portal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6L18 18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* User Profile */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-lg font-bold text-white overflow-hidden">
              {customerImage ? (
                <Image
                  src={customerImage}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </div>
              <div className="truncate text-sm text-gray-500">{user.email}</div>
              {user.tier && (
                <div className="text-xs font-medium text-primary-600">
                  {user.tier} Member
                </div>
              )}
            </div>
            <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-2 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Main Menu
            </div>
            {filteredMainMenu.map(item => renderMenuItem(item))}
          </nav>

          <nav className="space-y-2 border-t border-gray-200 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              More
            </div>
            {filteredBottomMenu.map(item => renderMenuItem(item))}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center space-x-2 rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-80 lg:border-r lg:border-gray-200 lg:bg-white lg:shadow-none',
          isOpen ? 'lg:block' : 'lg:hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            {locationLogo && (
              <div className="flex h-12 w-16 items-center justify-center overflow-hidden relative">
                <Image
                  src={locationLogo}
                  alt="Company Logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
              <p className="text-sm text-gray-500">Customer Portal</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {/* Main Menu */}
          <div className="space-y-1">
            {filteredMainMenu.map((item) => {
              const Icon = iconMap[item.icon] || Home;
              const isActive = isItemActive(item);
              const isExpanded = expandedItems.has(item.id);

              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.submenu && (
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {item.submenu && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = iconMap[subItem.icon] || Home;
                        const isSubActive = pathname === subItem.href;

                        return (
                          <button
                            key={subItem.id}
                            onClick={() => router.push(subItem.href!)}
                            className={cn(
                              'flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors',
                              isSubActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                          >
                            <SubIcon className="h-4 w-4" />
                            <span>{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* User Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-3 rounded-lg px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 overflow-hidden relative">
                {customerImage ? (
                  <Image
                    src={customerImage}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
