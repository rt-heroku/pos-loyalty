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

  // If it's a public page, render children directly
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For protected pages, use AppLayout which handles authentication
  return <AppLayout>{children}</AppLayout>;
}
