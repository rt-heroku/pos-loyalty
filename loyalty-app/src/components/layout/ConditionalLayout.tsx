'use client';

import { usePathname } from 'next/navigation';
import AppLayout from './AppLayout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Pages that don't require authentication
  const publicPages = ['/', '/login', '/register', '/forgot-password'];
  const isPublicPage = publicPages.includes(pathname);

  // Shop pages are accessible both ways:
  // - If user is logged in, show inside app layout
  // - If user is not logged in, show as public page
  const isShopPage = pathname.startsWith('/shop');

  // If it's a public page (not shop), render children directly
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For shop pages and protected pages, use AppLayout
  // AppLayout will handle authentication redirect if needed
  return <AppLayout>{children}</AppLayout>;
}
