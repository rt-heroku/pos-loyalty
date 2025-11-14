'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { SystemSettingsProvider } from '@/contexts/SystemSettingsContext';
import ConditionalLayout from '@/components/layout/ConditionalLayout';

/**
 * Layout Providers
 * 
 * Conditionally wraps children with auth and settings providers.
 * Routes that don't need authentication (setup wizard, login, register)
 * bypass the providers to prevent 401 errors before setup is complete.
 */
export default function LayoutProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Routes that don't need the full provider stack
  // - setup-wizard: No providers at all (runs before any users exist)
  // - (auth) routes: Have their own layout with just AuthProvider
  const publicRoutes = [
    '/setup-wizard',
    '/loyalty/setup-wizard', // Also check with /loyalty/ prefix
    '/login',
    '/register', 
    '/forgot-password',
  ];
  
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));
  
  // For public routes (setup, login, register), render without providers
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  // For all other routes, wrap with auth and settings providers
  return (
    <AuthProvider>
      <SystemSettingsProvider>
        <ChatProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </ChatProvider>
      </SystemSettingsProvider>
    </AuthProvider>
  );
}

