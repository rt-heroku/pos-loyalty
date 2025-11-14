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
  const publicPages = ['/', '/login', '/register', '/forgot-password', '/setup-wizard'];
  const isPublicPage = publicPages.includes(pathname) || pathname.includes('/setup-wizard');

  // If it's a public page, render children directly
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For shop pages and protected pages, use AppLayout
  // AppLayout will handle authentication redirect if needed for protected pages
  // Shop pages are accessible both with and without authentication
  return <AppLayout>{children}</AppLayout>;
}
