import { headers } from 'next/headers';

/**
 * Get the backend URL automatically from the request host
 * This allows zero-configuration deployment - no env vars needed!
 * 
 * Works for:
 * - Heroku: Uses BACKEND_INTERNAL_URL env var for internal communication
 * - Local: http://localhost:3000
 * - Custom domains: https://yourdomain.com
 * 
 * Note: This returns the Express backend URL (port 3000), not the Next.js URL (port 3001)
 */
export function getBackendUrl(): string {
  // In production (Heroku), use internal backend URL if set
  // This avoids external HTTP calls and uses internal process communication
  if (process.env.BACKEND_INTERNAL_URL) {
    return process.env.BACKEND_INTERNAL_URL;
  }
  
  // If explicitly set, use it (for advanced users)
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  // Auto-detect from request headers
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  
  // On Heroku, both Express and Next.js are on the same host
  // Express serves the root and Next.js is proxied at /loyalty
  // So we use the same host for backend calls
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  // For localhost development, Express is on 3000, Next.js on 3001
  // For production (Heroku), they're on the same domain
  if (host.includes('localhost:3001')) {
    return 'http://localhost:3000';
  }
  
  return `${protocol}://${host}`;
}

/**
 * Fetch from backend API with automatic URL detection
 * 
 * Important: This calls the Express backend API, not Next.js API routes
 * Express API is at: https://your-app.herokuapp.com/api/*
 * Next.js API routes are at: https://your-app.herokuapp.com/loyalty/api/*
 */
export async function fetchBackend(endpoint: string, options?: RequestInit) {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${endpoint}`;
  
  console.log('[fetchBackend] Calling Express backend:', url);
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

