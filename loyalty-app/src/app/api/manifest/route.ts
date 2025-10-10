import { NextResponse } from 'next/server';

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  const manifest = {
    name: 'Customer Loyalty App',
    short_name: 'LoyaltyApp',
    description: 'Customer loyalty and rewards management application',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable any',
      },
      {
        src: '/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable any',
      },
    ],
    screenshots: [
      {
        src: '/screenshot-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View your loyalty dashboard',
        url: '/dashboard',
        icons: [
          {
            src: '/icon-192x192.svg',
            sizes: '192x192',
          },
        ],
      },
      {
        name: 'Rewards',
        short_name: 'Rewards',
        description: 'View available rewards',
        url: '/rewards',
        icons: [
          {
            src: '/icon-192x192.svg',
            sizes: '192x192',
          },
        ],
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
