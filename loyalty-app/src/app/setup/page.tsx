'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to wizard page
export default function SetupPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/setup-wizard');
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Redirecting to setup wizard...</p>
      </div>
    </div>
  );
}
