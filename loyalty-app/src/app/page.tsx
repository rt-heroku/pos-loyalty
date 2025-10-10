'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  Gift,
  Package,
  MessageCircle,
  TrendingUp,
  Shield,
  Smartphone,
} from 'lucide-react';

export default function HomePage() {
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('Loyalty');

  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        // Load company logo and name from system settings
     const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/api/locations/current`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.location) {
            setCompanyLogo(data.location.logo_base64 || data.location.logo_url);
            setCompanyName(data.location.store_name || 'Loyalty');
          }
        }
      } catch (error) {
        console.error('Error loading company info:', error);
      }
    };

    loadCompanyInfo();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-10 border-b border-gray-200 bg-white">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo Only */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {companyLogo ? (
                  <div className="relative h-12 w-24">
                    <Image
                      src={companyLogo}
                      alt="Company Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <Star className="h-7 w-7 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link 
                  href="/loyalty" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  My Points
                </Link>
                <Link 
                  href="/transactions" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Orders
                </Link>
                <Link 
                  href="/loyalty" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Rewards
                </Link>
                <Link 
                  href="/help" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Support
                </Link>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="rounded-lg border-2 border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition-all hover:bg-blue-50 hover:border-blue-300"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
              >
                Join Now
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Your Loyalty Program,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent block">Simplified</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">
              Access your points, track orders, and unlock exclusive rewards all
              in one place.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link 
                href="/register" 
                className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
              >
                Get Started
              </Link>
              <Link 
                href="/loyalty" 
                className="rounded-lg border-2 border-blue-200 bg-white px-8 py-3 text-base font-semibold text-blue-700 shadow-sm transition-all hover:bg-blue-50 hover:border-blue-300"
              >
                View Points
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">loyalty</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Points Tracking */}
            <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Points Tracking
                </h3>
              </div>
              <p className="text-gray-600">
                Monitor your loyalty points in real-time with detailed
                transaction history and earning breakdowns.
              </p>
            </div>

            {/* Order Tracking */}
            <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Order Tracking
                </h3>
              </div>
              <p className="text-gray-600">
                Track your current orders with real-time shipping updates and
                delivery notifications.
              </p>
            </div>

            {/* Exclusive Rewards */}
            <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <Gift className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Exclusive Rewards
                </h3>
              </div>
              <p className="text-gray-600">
                Unlock exclusive rewards, discounts, and special offers
                tailored to your preferences.
              </p>
            </div>

            {/* AI Support */}
            <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  AI Support
                </h3>
              </div>
              <p className="text-gray-600">
                Get instant help with our AI-powered customer service agent
                available 24/7.
              </p>
            </div>

            {/* Secure & Private */}
            <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Secure & Private
                </h3>
              </div>
              <p className="text-gray-600">
                Your data is protected with enterprise-grade security and
                privacy controls.
              </p>
            </div>

            {/* Mobile First */}
            <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Mobile First
                </h3>
              </div>
              <p className="text-gray-600">
                Optimized for mobile devices with a responsive design that
                works perfectly on any screen.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Ready to start earning{' '}
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">rewards</span>?
              </h2>
              <div className="mt-8 flex items-center justify-center gap-x-6">
                <Link
                  href="/register"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                >
                  Enroll Now
                </Link>
                <Link
                  href="/loyalty"
                  className="rounded-lg border-2 border-blue-200 bg-white px-8 py-3 font-semibold text-blue-700 transition-all hover:bg-blue-50 hover:border-blue-300"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4 flex items-center space-x-3">
                {companyLogo ? (
                  <div className="flex h-8 w-10 items-center justify-center overflow-hidden relative">
                    <Image
                      src={companyLogo}
                      alt="Company Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="text-xl font-bold text-gray-900">{companyName}</span>
              </div>
              <p className="mb-4 text-gray-600">
                Your comprehensive loyalty program platform. Track points,
                manage rewards, and stay connected with your favorite brands.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/loyalty"
                    className="text-gray-600 transition-colors hover:text-gray-900"
                  >
                    My Points
                  </Link>
                </li>
                <li>
                  <Link
                    href="/transactions"
                    className="text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Order History
                  </Link>
                </li>
                <li>
                  <Link
                    href="/loyalty"
                    className="text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Available Rewards
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="text-gray-600 transition-colors hover:text-gray-900"
                  >
                    My Profile
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/help"
                    className="text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-gray-600 transition-colors hover:text-gray-900"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <p className="text-center text-sm text-gray-500">
              © 2024 Customer Loyalty App. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}