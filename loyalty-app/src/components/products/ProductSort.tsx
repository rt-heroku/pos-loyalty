'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ArrowUpDown,
  DollarSign,
  Calendar,
  Tag,
  Building2,
} from 'lucide-react';
import type { ProductSort } from '@/types/product';

interface ProductSortProps {
  value: ProductSort;
  onChange: (sort: ProductSort) => void;
}

export default function ProductSort({ value, onChange }: ProductSortProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    {
      field: 'name' as const,
      label: 'Name',
      icon: ArrowUpDown,
      description: 'Sort alphabetically',
    },
    {
      field: 'price' as const,
      label: 'Price',
      icon: DollarSign,
      description: 'Sort by price',
    },
    {
      field: 'createdAt' as const,
      label: 'Newest',
      icon: Calendar,
      description: 'Sort by arrival date',
    },
    {
      field: 'category' as const,
      label: 'Category',
      icon: Tag,
      description: 'Sort by category',
    },
    {
      field: 'brand' as const,
      label: 'Brand',
      icon: Building2,
      description: 'Sort by brand',
    },
  ];

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.field === value.field);
    return option ? option.label : 'Sort by';
  };

  const getCurrentSortIcon = () => {
    const option = sortOptions.find(opt => opt.field === value.field);
    return option ? option.icon : ArrowUpDown;
  };

  const handleSortChange = (field: ProductSort['field']) => {
    const newDirection =
      value.field === field && value.direction === 'asc' ? 'desc' : 'asc';
    onChange({ field, direction: newDirection });
    setIsOpen(false);
  };

  const toggleDirection = () => {
    onChange({
      ...value,
      direction: value.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="relative">
      <div className="flex">
        {/* Sort Field Selector */}
        <div className="relative flex-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center justify-between rounded-l-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <div className="flex items-center">
              {(() => {
                const Icon = getCurrentSortIcon();
                return <Icon className="mr-2 h-4 w-4 text-gray-400" />;
              })()}
              <span>{getCurrentSortLabel()}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-gray-200 bg-white shadow-lg">
              {sortOptions.map(option => (
                <button
                  key={option.field}
                  onClick={() => handleSortChange(option.field)}
                  className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                    value.field === option.field
                      ? 'bg-primary-50 text-primary-700'
                      : ''
                  }`}
                >
                  {(() => {
                    const Icon = option.icon;
                    return <Icon className="mr-2 h-4 w-4 text-gray-400" />;
                  })()}
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Direction Toggle */}
        <button
          onClick={toggleDirection}
          className="rounded-r-md border border-l-0 border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          title={value.direction === 'asc' ? 'Ascending' : 'Descending'}
        >
          {value.direction === 'asc' ? (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Active Sort Indicator */}
      <div className="mt-1 text-xs text-gray-500">
        {value.field === 'name' && (
          <span>
            Sorting by name {value.direction === 'asc' ? 'A to Z' : 'Z to A'}
          </span>
        )}
        {value.field === 'price' && (
          <span>
            Sorting by price{' '}
            {value.direction === 'asc' ? 'low to high' : 'high to low'}
          </span>
        )}
        {value.field === 'createdAt' && (
          <span>
            Sorting by date{' '}
            {value.direction === 'asc' ? 'oldest first' : 'newest first'}
          </span>
        )}
        {value.field === 'category' && (
          <span>
            Sorting by category{' '}
            {value.direction === 'asc' ? 'A to Z' : 'Z to A'}
          </span>
        )}
        {value.field === 'brand' && (
          <span>
            Sorting by brand{' '}
            {value.direction === 'asc' ? 'A to Z' : 'Z to A'}
          </span>
        )}
      </div>
    </div>
  );
}
