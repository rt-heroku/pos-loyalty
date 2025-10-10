export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: ProductImage[];
  category: string;
  brand: string;
  sku: string;
  stockQuantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';
  productType: string;
  collection: string;
  material: string;
  color: string;
  dimensions: string;
  weight: number;
  warrantyInfo: string;
  careInstructions: string;
  mainImageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  sfId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  thumbnailUrl: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price: number | undefined;
  stockQuantity: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  userId: number;
  addedAt: string;
  notes?: string;
  product: Product;
}

export interface Wishlist {
  id: string;
  userId: number;
  name: string;
  isPublic: boolean;
  shareToken?: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  category?: string | undefined;
  brand?: string | undefined;
  priceRange?:
    | {
        min: number;
        max: number;
      }
    | undefined;
  stockStatus?: string[] | undefined;
  productType?: string | undefined;
  color?: string | undefined;
  material?: string | undefined;
}

export interface ProductSort {
  field: 'name' | 'price' | 'createdAt' | 'category' | 'brand';
  direction: 'asc' | 'desc';
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface RecentlyViewedProduct {
  productId: string;
  viewedAt: string;
  product: Product;
}

export interface ProductComparison {
  id: string;
  userId: number;
  products: Product[];
  createdAt: string;
  updatedAt: string;
}
