'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { ProductFilter } from '@/types/product';

interface ProductFiltersProps {
  filters: ProductFilter;
  onFiltersChange: (filters: ProductFilter) => void;
  onClearFilters: () => void;
}

interface FilterSection {
  id: string;
  title: string;
  isOpen: boolean;
}

export default function ProductFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ProductFiltersProps) {
  const [filterSections, setFilterSections] = useState<FilterSection[]>([
    { id: 'category', title: 'Category', isOpen: true },
    { id: 'brand', title: 'Brand', isOpen: true },
    { id: 'price', title: 'Price Range', isOpen: true },
    { id: 'stock', title: 'Stock Status', isOpen: true },
    { id: 'features', title: 'Features', isOpen: true },
  ]);

  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // Load categories
        const categoriesResponse = await fetch('/loyalty/api/products/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories);
        }

        // Load brands
        const brandsResponse = await fetch('/loyalty/api/products/brands');
        if (brandsResponse.ok) {
          const brandsData = await brandsResponse.json();
          setBrands(brandsData.brands);
        }

        // Load price range
        const priceResponse = await fetch('/loyalty/api/products/price-range');
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          setPriceRange(priceData.priceRange);
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  const toggleSection = (sectionId: string) => {
    setFilterSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, isOpen: !section.isOpen }
          : section
      )
    );
  };

  const updateFilter = (key: keyof ProductFilter, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof ProductFilter) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Sections */}
      <div className="space-y-6">
        {/* Category Filter */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('category')}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="font-medium text-gray-900">Category</span>
            {filterSections.find(s => s.id === 'category')?.isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {filterSections.find(s => s.id === 'category')?.isOpen && (
            <div className="mt-3 space-y-2">
              {categories.map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value={category}
                    checked={filters.category === category}
                    onChange={e => updateFilter('category', e.target.value)}
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category}</span>
                </label>
              ))}
              {filters.category && (
                <button
                  onClick={() => clearFilter('category')}
                  className="mt-2 flex items-center text-xs text-primary-600 hover:text-primary-700"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear category
                </button>
              )}
            </div>
          )}
        </div>

        {/* Brand Filter */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('brand')}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="font-medium text-gray-900">Brand</span>
            {filterSections.find(s => s.id === 'brand')?.isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {filterSections.find(s => s.id === 'brand')?.isOpen && (
            <div className="mt-3 space-y-2">
              {brands.map(brand => (
                <label key={brand} className="flex items-center">
                  <input
                    type="radio"
                    name="brand"
                    value={brand}
                    checked={filters.brand === brand}
                    onChange={e => updateFilter('brand', e.target.value)}
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{brand}</span>
                </label>
              ))}
              {filters.brand && (
                <button
                  onClick={() => clearFilter('brand')}
                  className="mt-2 flex items-center text-xs text-primary-600 hover:text-primary-700"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear brand
                </button>
              )}
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('price')}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="font-medium text-gray-900">Price Range</span>
            {filterSections.find(s => s.id === 'price')?.isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {filterSections.find(s => s.id === 'price')?.isOpen && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange?.min || ''}
                  onChange={e =>
                    updateFilter('priceRange', {
                      min: Number(e.target.value),
                      max: filters.priceRange?.max || priceRange.max,
                    })
                  }
                  className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange?.max || ''}
                  onChange={e =>
                    updateFilter('priceRange', {
                      min: filters.priceRange?.min || priceRange.min,
                      max: Number(e.target.value),
                    })
                  }
                  className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              {(filters.priceRange?.min || filters.priceRange?.max) && (
                <button
                  onClick={() => clearFilter('priceRange')}
                  className="flex items-center text-xs text-primary-600 hover:text-primary-700"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear price range
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stock Status Filter */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('stock')}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="font-medium text-gray-900">Stock Status</span>
            {filterSections.find(s => s.id === 'stock')?.isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {filterSections.find(s => s.id === 'stock')?.isOpen && (
            <div className="mt-3 space-y-2">
              {['in_stock', 'low_stock', 'out_of_stock', 'pre_order'].map(
                status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      value={status}
                      checked={filters.stockStatus?.includes(status) || false}
                      onChange={e => {
                        const currentStatuses = filters.stockStatus || [];
                        if (e.target.checked) {
                          updateFilter('stockStatus', [
                            ...currentStatuses,
                            status,
                          ]);
                        } else {
                          updateFilter(
                            'stockStatus',
                            currentStatuses.filter(s => s !== status)
                          );
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm capitalize text-gray-700">
                      {status.replace('_', ' ')}
                    </span>
                  </label>
                )
              )}
              {filters.stockStatus?.length && (
                <button
                  onClick={() => clearFilter('stockStatus')}
                  className="mt-2 flex items-center text-xs text-primary-600 hover:text-primary-700"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear stock status
                </button>
              )}
            </div>
          )}
        </div>

        {/* Rating filter removed as rating field doesn't exist in database */}

        {/* Features Filter */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('features')}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="font-medium text-gray-900">Features</span>
            {filterSections.find(s => s.id === 'features')?.isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {filterSections.find(s => s.id === 'features')?.isOpen && (
            <div className="mt-3 space-y-2">
              {/* On Sale and New Arrivals filters removed as these fields don't exist in database */}
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="mb-3 text-sm font-medium text-gray-900">
            Active Filters
          </h4>
          <div className="space-y-2">
            {filters.category && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Category: {filters.category}
                </span>
                <button
                  onClick={() => clearFilter('category')}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.brand && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Brand: {filters.brand}</span>
                <button
                  onClick={() => clearFilter('brand')}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.priceRange && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Price: ${filters.priceRange.min} - ${filters.priceRange.max}
                </span>
                <button
                  onClick={() => clearFilter('priceRange')}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.stockStatus?.length && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Stock: {filters.stockStatus.join(', ')}
                </span>
                <button
                  onClick={() => clearFilter('stockStatus')}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {/* Rating filter removed as rating field doesn't exist in database */}
            {/* Features filter removed as onSale and isNew fields don't exist in database */}
          </div>
        </div>
      )}
    </div>
  );
}
