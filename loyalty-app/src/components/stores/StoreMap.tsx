'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Phone, Clock, Star } from 'lucide-react';
import type { StoreLocation, UserLocation } from '@/lib/database-types';

interface StoreMapProps {
  stores: StoreLocation[];
  userLocation: UserLocation | null;
  selectedStore: StoreLocation | null;
  onStoreSelect: (store: StoreLocation) => void;
}

export default function StoreMap({
  stores,
  userLocation,
  selectedStore,
  onStoreSelect,
}: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (mapRef.current && !mapLoaded) {
      initializeMap();
    }
  }, [mapRef, mapLoaded]);

  useEffect(() => {
    if (mapLoaded && stores.length > 0) {
      updateMapMarkers();
    }
  }, [stores, selectedStore, mapLoaded]);

  const initializeMap = () => {
    // For now, we'll create a simple map representation
    // In a real implementation, you would integrate with Google Maps or Mapbox
    setMapLoaded(true);
  };

  const updateMapMarkers = () => {
    // This would update map markers in a real map implementation
  };

  const getMapCenter = () => {
    if (userLocation) {
      return { lat: userLocation.latitude, lng: userLocation.longitude };
    }

    if (stores.length > 0) {
      const avgLat =
        stores.reduce((sum, store) => sum + store.latitude, 0) / stores.length;
      const avgLng =
        stores.reduce((sum, store) => sum + store.longitude, 0) / stores.length;
      return { lat: avgLat, lng: avgLng };
    }

    return { lat: 40.7128, lng: -74.006 }; // Default to NYC
  };

  const center = getMapCenter();

  return (
    <div className="relative">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="relative h-96 w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)
          `,
        }}
      >
        {/* User Location Marker */}
        {userLocation && (
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transform"
            style={{
              left: '50%',
              top: '50%',
            }}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-blue-600 shadow-lg">
              <div className="h-2 w-2 rounded-full bg-white"></div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 transform whitespace-nowrap rounded bg-blue-600 px-2 py-1 text-xs text-white">
              You are here
            </div>
          </div>
        )}

        {/* Store Markers */}
        {stores.map(store => {
          const isSelected = selectedStore?.id === store.id;
          const distance = store.distance;

          // Calculate position based on store coordinates relative to center
          const latDiff = store.latitude - center.lat;
          const lngDiff = store.longitude - center.lng;

          // Convert to pixel positions (simplified)
          const x = 50 + ((lngDiff * 1000) % 80); // Keep within bounds
          const y = 50 + ((latDiff * 1000) % 80);

          return (
            <div
              key={store.id}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 transform cursor-pointer transition-all duration-200 ${
                isSelected ? 'z-30' : ''
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
              onClick={() => onStoreSelect(store)}
            >
              {/* Store Marker */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-4 shadow-lg transition-all duration-200 ${
                  isSelected
                    ? 'scale-125 border-white bg-primary-600'
                    : 'border-primary-600 bg-white hover:scale-110'
                }`}
              >
                <MapPin
                  className={`h-4 w-4 ${
                    isSelected ? 'text-white' : 'text-primary-600'
                  }`}
                />
              </div>

              {/* Store Info Popup */}
              {isSelected && (
                <div className="absolute bottom-full left-1/2 z-40 mb-2 w-64 -translate-x-1/2 transform rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <h3 className="mb-1 text-sm font-semibold text-gray-900">
                        {store.name}
                      </h3>

                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-3 w-3" />
                          <span>{store.address}</span>
                        </div>

                        {distance && (
                          <div className="flex items-center">
                            <Navigation className="mr-1 h-3 w-3" />
                            <span>{distance.toFixed(1)} km away</span>
                          </div>
                        )}

                        <div className="flex items-center">
                          <Star className="mr-1 h-3 w-3 text-yellow-400" />
                          <span>
                            {store.rating} ({store.reviewCount} reviews)
                          </span>
                        </div>

                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          <span
                            className={
                              store.isOpen ? 'text-green-600' : 'text-red-600'
                            }
                          >
                            {store.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            window.location.href = `tel:${store.phone}`;
                          }}
                          className="flex-1 rounded bg-primary-600 px-2 py-1 text-xs text-white transition-colors hover:bg-primary-700"
                        >
                          <Phone className="mr-1 inline h-3 w-3" />
                          Call
                        </button>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`,
                              '_blank'
                            );
                          }}
                          className="flex-1 rounded bg-gray-600 px-2 py-1 text-xs text-white transition-colors hover:bg-gray-700"
                        >
                          <Navigation className="mr-1 inline h-3 w-3" />
                          Directions
                        </button>
                      </div>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onStoreSelect(store);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Map Controls */}
        <div className="absolute right-4 top-4 space-y-2">
          <button
            onClick={() => {
              if (userLocation) {
                // Center map on user location
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md transition-colors hover:bg-gray-50"
            title="Center on my location"
          >
            <Navigation className="h-5 w-5 text-gray-600" />
          </button>

          <button
            onClick={() => {
              // Zoom in
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md transition-colors hover:bg-gray-50"
            title="Zoom in"
          >
            <span className="text-lg font-bold text-gray-600">+</span>
          </button>

          <button
            onClick={() => {
              // Zoom out
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md transition-colors hover:bg-gray-50"
            title="Zoom out"
          >
            <span className="text-lg font-bold text-gray-600">−</span>
          </button>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 rounded-lg bg-white p-3 text-xs shadow-md">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-600"></div>
              <span>Your location</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded-full border-2 border-primary-600 bg-white"></div>
              <span>Store</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded-full border-2 border-white bg-primary-600"></div>
              <span>Selected store</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Loading State */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Integration Notice */}
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
              <span className="text-xs font-bold text-white">i</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900">
              Map Integration
            </h4>
            <p className="mt-1 text-sm text-blue-700">
              This is a simplified map view. For production use, integrate with
              Google Maps or Mapbox API for full interactive mapping
              capabilities, real-time traffic, and turn-by-turn navigation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
