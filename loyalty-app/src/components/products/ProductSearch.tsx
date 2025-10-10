'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Product } from '@/types/product';
import { cn } from '@/lib/utils';

interface ProductSearchProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}

export default function ProductSearch({
  value,
  onChange,
  placeholder = 'Search products...',
}: ProductSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent and trending searches
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        // Load recent searches from localStorage
        const recent = JSON.parse(
          localStorage.getItem('recentSearches') || '[]'
        );
        setRecentSearches(recent.slice(0, 5));

        // Load trending searches
        const trendingResponse = await fetch('/loyalty/api/products/trending-searches');
        if (trendingResponse.ok) {
          const trendingData = await trendingResponse.json();
          setTrendingSearches(trendingData.trendingSearches);
        }
      } catch (error) {
        console.error('Error loading search data:', error);
      }
    };

    loadSearchData();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToRecentSearches = useCallback((search: string) => {
    const recent = [search, ...recentSearches.filter(s => s !== search)].slice(
      0,
      5
    );
    setRecentSearches(recent);
    localStorage.setItem('recentSearches', JSON.stringify(recent));
  }, [recentSearches]);

  const handleSuggestionSelect = useCallback((product: Product) => {
    onChange(product.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    addToRecentSearches(product.name);
    inputRef.current?.blur();
  }, [onChange, addToRecentSearches]);

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      onChange(query.trim());
      addToRecentSearches(query.trim());
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  }, [onChange, addToRecentSearches]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          } else if (value.trim()) {
            handleSearch(value.trim());
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, suggestions, selectedIndex, value, handleSearch, handleSuggestionSelect]);

  // Search suggestions
  const searchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/loyalty/api/products/search-suggestions?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value) {
        searchSuggestions(value);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleRecentSearchSelect = (search: string) => {
    onChange(search);
    setIsOpen(false);
    setSelectedIndex(-1);
    addToRecentSearches(search);
    inputRef.current?.blur();
  };

  const handleTrendingSearchSelect = (search: string) => {
    onChange(search);
    setIsOpen(false);
    setSelectedIndex(-1);
    addToRecentSearches(search);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(
      regex,
      '<mark class="bg-yellow-200 font-semibold">$1</mark>'
    );
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-10 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
        />
        {value && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 transform p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Products
              </div>
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleSuggestionSelect(product)}
                  className={cn(
                    'flex w-full items-center space-x-3 rounded-md p-2 text-left transition-colors hover:bg-gray-50',
                    selectedIndex === index &&
                      'border-primary-200 bg-primary-50'
                  )}
                >
                  <div className="h-10 w-10 flex-shrink-0 rounded-md bg-gray-100 relative">
                    {product.images[0] && (
                      <Image
                        src={product.images[0].thumbnailUrl}
                        alt={product.images[0].alt}
                        fill
                        className="rounded-md object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-sm font-medium text-gray-900"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(product.name, value),
                      }}
                    />
                    <div className="truncate text-xs text-gray-500">
                      {product.brand} • {product.category}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    ${product.price}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="border-t border-gray-100 p-2">
              <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchSelect(search)}
                  className="flex w-full items-center space-x-2 rounded-md p-2 text-left transition-colors hover:bg-gray-50"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Trending Searches */}
          {trendingSearches.length > 0 && (
            <div className="border-t border-gray-100 p-2">
              <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Trending
              </div>
              {trendingSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleTrendingSearchSelect(search)}
                  className="flex w-full items-center space-x-2 rounded-md p-2 text-left transition-colors hover:bg-gray-50"
                >
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-500">Searching...</p>
            </div>
          )}

          {/* No Results */}
          {!loading && suggestions.length === 0 && value && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">
                No products found for "{value}"
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Try different keywords or browse categories
              </p>
            </div>
          )}

          {/* Search Button */}
          {value && (
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => handleSearch(value)}
                className="flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                <Search className="mr-2 h-4 w-4" />
                Search for "{value}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}