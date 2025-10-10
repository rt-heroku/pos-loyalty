'use client';

import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Star,
  Navigation,
  Calendar,
  Wrench,
  Car,
  Wifi,
  Accessibility,
} from 'lucide-react';
import type { StoreLocation } from '@/lib/database-types';

interface StoreCardProps {
  store: StoreLocation;
  isSelected?: boolean;
  expanded?: boolean;
  onSelect: () => void;
  onServiceBooking: () => void;
  onWorkOrder: () => void;
  onCall: () => void;
  onDirections: () => void;
}

export default function StoreCard({
  store,
  isSelected = false,
  expanded = false,
  onSelect,
  onServiceBooking,
  onWorkOrder,
  onCall,
  onDirections,
}: StoreCardProps) {
  const getCurrentDayHours = () => {
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const today = days[new Date().getDay()];
    return store.hours[today as keyof typeof store.hours];
  };

  const currentHours = getCurrentDayHours();
  const isOpen = store.isOpen && !currentHours.isClosed;

  return (
    <div
      className={`cursor-pointer rounded-lg border-2 bg-white transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-primary-500 shadow-lg'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-1 text-sm font-semibold leading-tight text-gray-900">
              {store.name}
            </h3>

            <div className="mb-2 flex items-center space-x-2 text-xs text-gray-600">
              <MapPin className="h-3 w-3" />
              <span>
                {store.city}, {store.state}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 fill-current text-yellow-400" />
            <span className="text-xs font-medium text-gray-900">
              {store.rating}
            </span>
            <span className="text-xs text-gray-500">({store.reviewCount})</span>
          </div>
        </div>

        {/* Status and Distance */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isOpen ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span
              className={`text-xs font-medium ${
                isOpen ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>

          {store.distance && (
            <span className="text-xs text-gray-600">
              {store.distance.toFixed(1)} km away
            </span>
          )}
        </div>

        {/* Hours */}
        <div className="mb-3 flex items-center space-x-2 text-xs text-gray-600">
          <Clock className="h-3 w-3" />
          <span>
            {currentHours.isClosed
              ? 'Closed today'
              : `${currentHours.open} - ${currentHours.close}`}
          </span>
        </div>

        {/* Services Preview */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {store.services.slice(0, 3).map(service => (
              <span
                key={service}
                className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
              >
                {service}
              </span>
            ))}
            {store.services.length > 3 && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                +{store.services.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Amenities Icons */}
        <div className="mb-4 flex items-center space-x-3 text-xs text-gray-600">
          {store.parkingAvailable && (
            <div className="flex items-center space-x-1">
              <Car className="h-3 w-3" />
              <span>Parking</span>
            </div>
          )}

          {store.wifiAvailable && (
            <div className="flex items-center space-x-1">
              <Wifi className="h-3 w-3" />
              <span>WiFi</span>
            </div>
          )}

          {store.wheelchairAccessible && (
            <div className="flex items-center space-x-1">
              <Accessibility className="h-3 w-3" />
              <span>Accessible</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={e => {
              e.stopPropagation();
              onServiceBooking();
            }}
            className="flex items-center justify-center space-x-1 rounded-lg bg-primary-600 px-3 py-2 text-xs text-white transition-colors hover:bg-primary-700"
          >
            <Calendar className="h-3 w-3" />
            <span>Book Service</span>
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              onWorkOrder();
            }}
            className="flex items-center justify-center space-x-1 rounded-lg bg-gray-600 px-3 py-2 text-xs text-white transition-colors hover:bg-gray-700"
          >
            <Wrench className="h-3 w-3" />
            <span>Work Order</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex space-x-2">
          <button
            onClick={e => {
              e.stopPropagation();
              onCall();
            }}
            className="flex flex-1 items-center justify-center space-x-1 rounded bg-green-100 px-2 py-1 text-xs text-green-700 transition-colors hover:bg-green-200"
          >
            <Phone className="h-3 w-3" />
            <span>Call</span>
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              onDirections();
            }}
            className="flex flex-1 items-center justify-center space-x-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-200"
          >
            <Navigation className="h-3 w-3" />
            <span>Directions</span>
          </button>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
            {/* Full Address */}
            <div className="text-xs text-gray-600">
              <div className="mb-1 font-medium">Address:</div>
              <div>{store.address}</div>
              <div>
                {store.city}, {store.state} {store.zipCode}
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-xs text-gray-600">
              <div className="mb-1 font-medium">Contact:</div>
              <div className="flex items-center space-x-2">
                <Phone className="h-3 w-3" />
                <span>{store.phone}</span>
              </div>
              {store.email && (
                <div className="mt-1 flex items-center space-x-2">
                  <Mail className="h-3 w-3" />
                  <span>{store.email}</span>
                </div>
              )}
              {store.website && (
                <div className="mt-1 flex items-center space-x-2">
                  <Globe className="h-3 w-3" />
                  <span className="cursor-pointer text-blue-600 hover:underline">
                    {store.website}
                  </span>
                </div>
              )}
            </div>

            {/* All Services */}
            <div className="text-xs text-gray-600">
              <div className="mb-1 font-medium">Services:</div>
              <div className="flex flex-wrap gap-1">
                {store.services.map(service => (
                  <span
                    key={service}
                    className="rounded-full bg-gray-100 px-2 py-1 text-gray-700"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* All Amenities */}
            <div className="text-xs text-gray-600">
              <div className="mb-1 font-medium">Amenities:</div>
              <div className="flex flex-wrap gap-1">
                {store.amenities.map(amenity => (
                  <span
                    key={amenity}
                    className="rounded-full bg-gray-100 px-2 py-1 text-gray-700"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            {/* Store Description */}
            {store.description && (
              <div className="text-xs text-gray-600">
                <div className="mb-1 font-medium">About:</div>
                <p>{store.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
