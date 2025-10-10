'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { StoreSearchFilters } from '@/lib/database-types';

interface StoreFiltersProps {
  filters: StoreSearchFilters;
  onFiltersChange: (filters: StoreSearchFilters) => void;
  onClearFilters: () => void;
}

export default function StoreFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: StoreFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const serviceOptions = [
    'Repair',
    'Maintenance',
    'Installation',
    'Consultation',
    'Training',
    'Parts',
    'Warranty',
  ];

  const amenityOptions = [
    'Parking',
    'Wheelchair Accessible',
    'WiFi',
    'Restroom',
    'Waiting Area',
    'Coffee/Refreshments',
    'Child Care',
    'ATM',
  ];

  const distanceOptions = [
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 25, label: '25 km' },
    { value: 50, label: '50 km' },
    { value: 100, label: '100 km' },
  ];

  const ratingOptions = [
    { value: 4.5, label: '4.5+ stars' },
    { value: 4.0, label: '4.0+ stars' },
    { value: 3.5, label: '3.5+ stars' },
    { value: 3.0, label: '3.0+ stars' },
  ];

  const updateFilter = <K extends keyof StoreSearchFilters>(
    key: K,
    value: StoreSearchFilters[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleArrayFilter = (key: 'services' | 'amenities', value: string) => {
    const currentValues = (filters[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    updateFilter(key, newValues);
  };

  const hasActiveFilters = Object.values(filters).some(
    value =>
      value !== undefined &&
      (Array.isArray(value) ? value.length > 0 : value !== '')
  );

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 rounded-lg px-4 py-3 font-medium transition-colors ${
          hasActiveFilters
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-primary-600">
            {
              Object.values(filters).filter(
                v =>
                  v !== undefined &&
                  (Array.isArray(v) ? v.length > 0 : v !== '')
              ).length
            }
          </span>
        )}
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Services */}
            <div>
              <h4 className="mb-3 font-medium text-gray-900">Services</h4>
              <div className="space-y-2">
                {serviceOptions.map(service => (
                  <label key={service} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(filters.services || []).includes(service)}
                      onChange={() => toggleArrayFilter('services', service)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {service}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h4 className="mb-3 font-medium text-gray-900">Amenities</h4>
              <div className="space-y-2">
                {amenityOptions.map(amenity => (
                  <label key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(filters.amenities || []).includes(amenity)}
                      onChange={() => toggleArrayFilter('amenities', amenity)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {amenity}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div>
              <h4 className="mb-3 font-medium text-gray-900">
                Maximum Distance
              </h4>
              <select
                value={filters.maxDistance || ''}
                onChange={e =>
                  updateFilter(
                    'maxDistance',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No limit</option>
                {distanceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <h4 className="mb-3 font-medium text-gray-900">Minimum Rating</h4>
              <select
                value={filters.rating || ''}
                onChange={e =>
                  updateFilter(
                    'rating',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Any rating</option>
                {ratingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filters */}
            <div>
              <h4 className="mb-3 font-medium text-gray-900">Status</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.isOpen === true}
                    onChange={e =>
                      updateFilter(
                        'isOpen',
                        e.target.checked ? true : undefined
                      )
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Open now</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasParking === true}
                    onChange={e =>
                      updateFilter(
                        'hasParking',
                        e.target.checked ? true : undefined
                      )
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Has parking
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.isWheelchairAccessible === true}
                    onChange={e =>
                      updateFilter(
                        'isWheelchairAccessible',
                        e.target.checked ? true : undefined
                      )
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Wheelchair accessible
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasWifi === true}
                    onChange={e =>
                      updateFilter(
                        'hasWifi',
                        e.target.checked ? true : undefined
                      )
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Has WiFi</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-3 border-t border-gray-200 pt-4">
            <button
              onClick={onClearFilters}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
