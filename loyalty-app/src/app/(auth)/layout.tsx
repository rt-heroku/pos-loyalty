import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Auth Layout (Login/Register/Forgot Password)
 * 
 * This layout provides AuthProvider for authentication pages
 * but doesn't include SystemSettingsProvider or ChatProvider
 * to keep these pages fast and isolated.
 * 
 * Note: This is a nested layout. The root layout provides html/body tags.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
