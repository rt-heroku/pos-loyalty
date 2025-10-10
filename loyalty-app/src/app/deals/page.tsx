import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Tag, Clock, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Deals & Offers',
  description: 'Discover exclusive deals and special offers',
};

export default function DealsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Deals & Offers</h1>
          <p className="text-gray-600 mt-2">Discover exclusive deals and special offers</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <Tag className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Deals Coming Soon!
            </h2>
            <p className="text-gray-600 mb-6">
              We're working on bringing you amazing deals and exclusive offers. 
              Stay tuned for exciting promotions and discounts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4">
              <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Limited Time</h3>
              <p className="text-sm text-gray-600">Exclusive time-limited offers</p>
            </div>
            <div className="text-center p-4">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Member Exclusive</h3>
              <p className="text-sm text-gray-600">Special deals for loyalty members</p>
            </div>
            <div className="text-center p-4">
              <Tag className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Best Prices</h3>
              <p className="text-sm text-gray-600">Unbeatable discounts and savings</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Get Notified
            </h3>
            <p className="text-blue-700 mb-4">
              Be the first to know when our deals go live!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/loyalty"
                className="bg-white text-blue-600 border border-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Check Loyalty Points
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
