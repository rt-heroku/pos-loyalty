import { headers } from 'next/headers';

/**
 * Get the backend URL automatically from the request host
 * This allows zero-configuration deployment - no env vars needed!
 * 
 * Works for:
 * - Heroku: https://your-app.herokuapp.com
 * - Local: http://localhost:3000
 * - Custom domains: https://yourdomain.com
 */
export function getBackendUrl(): string {
  // If explicitly set, use it (for advanced users)
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  // Auto-detect from request headers
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  return `${protocol}://${host}`;
}

/**
 * Fetch from backend API with automatic URL detection
 */
export async function fetchBackend(endpoint: string, options?: RequestInit) {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${endpoint}`;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

