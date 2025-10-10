// Database Types for Customer Loyalty Application
// These types are based on the PostgreSQL schema defined in loyalty-database-changes.sql

import { z } from 'zod';

// ============================================================================
// BASE TYPES
// ============================================================================

export type Timestamp = string; // ISO 8601 timestamp
export type UUID = string;
export type Decimal = string; // PostgreSQL decimal as string for precision

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

// Customer Types
export interface Customer {
  id: number;
  loyalty_number: string;
  name: string;
  email?: string;
  phone?: string;
  points: number;
  total_spent: Decimal;
  visit_count: number;
  last_visit?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
  notes?: string;
  is_active: boolean;
  preferred_contact: 'email' | 'sms' | 'phone';
  date_of_birth?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  marketing_consent: boolean;
  member_status:
    | 'Active'
    | 'Inactive'
    | 'Under Fraud Investigation'
    | 'Merged'
    | 'Fraudulent Member';
  enrollment_date: string;
  member_type: 'Individual' | 'Corporate';
  sf_id?: string;
  customer_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tier_calculation_number: Decimal;
  created_by_user?: number;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  price: Decimal;
  category: string;
  stock: number;
  image: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  sku?: string;
  product_type?: string;
  brand?: string;
  collection?: string;
  material?: string;
  color?: string;
  description?: string;
  dimensions?: string;
  weight?: number;
  warranty_info?: string;
  care_instructions?: string;
  main_image_url?: string;
  is_active: boolean;
  featured: boolean;
  sort_order: number;
  sf_id?: string;
  created_by_user?: number;
}

// Transaction Types
export interface Transaction {
  id: number;
  customer_id?: number;
  location_id?: number;
  subtotal: Decimal;
  tax: Decimal;
  total: Decimal;
  payment_method: string;
  amount_received?: Decimal;
  change_amount: Decimal;
  points_earned: number;
  points_redeemed: number;
  created_at: Timestamp;
  discount_amount: Decimal;
  discount_type?: 'percentage' | 'fixed';
  discount_reason?: string;
  card_last_four?: string;
  card_type?: string;
  payment_reference?: string;
  created_by_user?: number;
}

// Transaction Item Types
export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id?: number;
  product_name: string;
  product_price: Decimal;
  quantity: number;
  subtotal: Decimal;
}

// Location Types
export interface Location {
  id: number;
  store_code: string;
  store_name: string;
  brand: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone?: string;
  email?: string;
  tax_rate: Decimal;
  currency: string;
  timezone: string;
  logo_url?: string;
  logo_base64?: string;
  is_active: boolean;
  business_hours?: Record<string, any>;
  manager_name?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by_user?: number;
}

// User Types (for authentication)
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role_id?: number;
  is_active: boolean;
  is_locked: boolean;
  failed_login_attempts: number;
  last_login?: Timestamp;
  password_changed_at: Timestamp;
  password_expires_at?: Timestamp;
  must_change_password: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: number;
  updated_by?: number;
}

// Role Types
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Record<string, any>;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// LOYALTY PROGRAM TYPES
// ============================================================================

// Loyalty Tier Types
export interface LoyaltyTier {
  id: number;
  tier_name: string;
  tier_level: number;
  min_spending: Decimal;
  min_visits: number;
  min_points: number;
  points_multiplier: Decimal;
  benefits: Record<string, any>;
  tier_color: string;
  tier_icon?: string;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Loyalty Reward Types
export interface LoyaltyReward {
  id: number;
  reward_name: string;
  reward_type:
    | 'discount'
    | 'free_item'
    | 'free_shipping'
    | 'birthday'
    | 'anniversary';
  points_required: number;
  discount_percentage?: Decimal;
  discount_amount?: Decimal;
  free_item_product_id?: number;
  description?: string;
  terms_conditions?: string;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  max_redemptions?: number;
  current_redemptions: number;
  tier_restriction?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Customer Reward Types
export interface CustomerReward {
  id: number;
  customer_id: number;
  reward_id: number;
  points_spent: number;
  reward_value: Decimal;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  earned_at: Timestamp;
  expires_at?: Timestamp;
  used_at?: Timestamp;
  used_in_transaction_id?: number;
  created_at: Timestamp;
}

// Customer Referral Types
export interface CustomerReferral {
  id: number;
  referrer_id: number;
  referred_email: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'expired';
  referrer_points_earned: number;
  referred_customer_id?: number;
  completed_at?: Timestamp;
  expires_at: Timestamp;
  created_at: Timestamp;
}

// ============================================================================
// ORDER MANAGEMENT TYPES
// ============================================================================

// Customer Address Types
export interface CustomerAddress {
  id: number;
  customer_id: number;
  address_type: 'shipping' | 'billing' | 'both';
  is_default: boolean;
  first_name: string;
  last_name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Order Tracking Types
export interface OrderTracking {
  id: number;
  transaction_id: number;
  tracking_number?: string;
  carrier?: string;
  shipping_method?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  status: string;
  shipping_address_id?: number;
  tracking_url?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Order Status History Types
export interface OrderStatusHistory {
  id: number;
  transaction_id: number;
  status: string;
  status_details?: string;
  location?: string;
  timestamp: Timestamp;
  created_by: string;
}

// ============================================================================
// CUSTOMER SERVICE TYPES
// ============================================================================

// Chat Session Types
export interface ChatSession {
  id: number;
  customer_id: number;
  session_id: string;
  status: 'active' | 'closed' | 'transferred';
  agent_id?: string;
  agent_name?: string;
  subject?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: Timestamp;
  updated_at: Timestamp;
  closed_at?: Timestamp;
}

// Chat Message Types
export interface ChatMessage {
  id: number;
  session_id: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  sender_type: 'customer' | 'agent' | 'ai' | 'system';
  sender_id?: string;
  message_text: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: Timestamp;
}

// Customer Service Ticket Types
export interface CustomerServiceTicket {
  id: number;
  ticket_number: string;
  customer_id: number;
  subject: string;
  description: string;
  category: 'product_issue' | 'order_problem' | 'loyalty_question' | 'general';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  resolution?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  resolved_at?: Timestamp;
}

// ============================================================================
// PRODUCT ENGAGEMENT TYPES
// ============================================================================

// Customer Wishlist Types
export interface CustomerWishlist {
  id: number;
  customer_id: number;
  product_id: number;
  added_at: Timestamp;
  notes?: string;
  priority: number;
}

// Product Review Types
export interface ProductReview {
  id: number;
  product_id: number;
  customer_id: number;
  rating: number;
  title?: string;
  review_text?: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_votes: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Product Review Image Types
export interface ProductReviewImage {
  id: number;
  review_id: number;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  created_at: Timestamp;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

// Customer Notification Preference Types
export interface CustomerNotificationPreference {
  id: number;
  customer_id: number;
  notification_type: 'email' | 'sms' | 'push' | 'in_app';
  category: 'order_updates' | 'loyalty_rewards' | 'promotions' | 'account';
  is_enabled: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Customer Notification Types
export interface CustomerNotification {
  id: number;
  customer_id: number;
  notification_type: 'email' | 'sms' | 'push' | 'in_app';
  title: string;
  message: string;
  category: 'order_updates' | 'loyalty_rewards' | 'promotions' | 'account';
  is_read: boolean;
  action_url?: string;
  metadata: Record<string, any>;
  sent_at: Timestamp;
  read_at?: Timestamp;
}

// ============================================================================
// SOCIAL LOGIN TYPES
// ============================================================================

// Customer Social Account Types
export interface CustomerSocialAccount {
  id: number;
  customer_id: number;
  provider: 'google' | 'facebook' | 'apple';
  provider_user_id: string;
  email?: string;
  display_name?: string;
  profile_picture_url?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Timestamp;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// INVENTORY MANAGEMENT TYPES
// ============================================================================

// Location Inventory Types
export interface LocationInventory {
  id: number;
  location_id: number;
  product_id: number;
  quantity: number;
  reserved_quantity: number;
  reorder_level: number;
  last_restock_date?: string;
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// ACTIVITY LOG TYPES
// ============================================================================

// Customer Activity Log Types
export interface CustomerActivityLog {
  id: number;
  customer_id: number;
  activity_type: string;
  description?: string;
  points_change: number;
  transaction_id?: number;
  created_by: string;
  created_at: Timestamp;
}

// User Activity Log Types
export interface UserActivityLog {
  id: number;
  user_id?: number;
  activity_type: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, any>;
  created_at: Timestamp;
}

// ============================================================================
// SYSTEM TYPES
// ============================================================================

// System Settings Types
export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value?: string;
  setting_type: 'text' | 'number' | 'boolean' | 'json';
  description?: string;
  category:
    | 'general'
    | 'pos'
    | 'loyalty'
    | 'inventory'
    | 'email'
    | 'integration';
  is_encrypted: boolean;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: string;
  updated_by?: string;
}

// User Settings Types
export interface UserSetting {
  id: number;
  user_identifier: string;
  selected_location_id?: number;
  theme_mode: 'light' | 'dark';
  language: string;
  currency_format: string;
  date_format: string;
  notifications_enabled: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// STORE & SERVICE TYPES
// ============================================================================

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website?: string;
  hours: StoreHours;
  services: string[];
  amenities: string[];
  isOpen: boolean;
  distance?: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  images: string[];
  description: string;
  manager?: string;
  capacity?: number;
  parkingAvailable: boolean;
  wheelchairAccessible: boolean;
  wifiAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
  specialHours?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  isAvailable: boolean;
  storeId: string;
  requiresAppointment: boolean;
  maxCapacity?: number;
  requirements?: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  userId: number;
  storeId: string;
  serviceId: string;
  date: string;
  time: string;
  status:
    | 'scheduled'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show';
  notes?: string;
  estimatedDuration: number;
  actualDuration?: number;
  totalCost: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
  service?: Service;
  store?: StoreLocation;
}

export interface WorkOrder {
  id: string;
  userId: number;
  storeId: string;
  serviceId?: string;
  type: 'repair' | 'maintenance' | 'installation' | 'consultation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status:
    | 'submitted'
    | 'assigned'
    | 'in_progress'
    | 'waiting_parts'
    | 'completed'
    | 'cancelled';
  title: string;
  description: string;
  customerNotes?: string;
  technicianNotes?: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedCompletion?: string;
  actualCompletion?: string;
  assignedTechnician?: string;
  customerSignature?: string;
  images?: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  service?: Service;
  store?: StoreLocation;
}

export interface StoreEvent {
  id: string;
  storeId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: 'promotion' | 'workshop' | 'sale' | 'event' | 'training';
  capacity?: number;
  currentAttendees: number;
  isRegistrationRequired: boolean;
  price?: number;
  currency: string;
  images: string[];
  location?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreInventory {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  lastUpdated: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    images: string[];
  };
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface StoreSearchFilters {
  services?: string[];
  amenities?: string[];
  maxDistance?: number;
  rating?: number;
  isOpen?: boolean;
  hasParking?: boolean;
  isWheelchairAccessible?: boolean;
  hasWifi?: boolean;
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

// Customer Schema
export const CustomerSchema = z.object({
  loyalty_number: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  points: z.number().default(0),
  total_spent: z.string().default('0.00'),
  visit_count: z.number().default(0),
  member_status: z
    .enum([
      'Active',
      'Inactive',
      'Under Fraud Investigation',
      'Merged',
      'Fraudulent Member',
    ])
    .default('Active'),
  member_type: z.enum(['Individual', 'Corporate']).default('Individual'),
  customer_tier: z
    .enum(['Bronze', 'Silver', 'Gold', 'Platinum'])
    .default('Bronze'),
});

// Transaction Schema
export const TransactionSchema = z.object({
  customer_id: z.number().optional(),
  location_id: z.number().optional(),
  subtotal: z.string(),
  tax: z.string(),
  total: z.string(),
  payment_method: z.string(),
  points_earned: z.number().default(0),
  points_redeemed: z.number().default(0),
});

// Product Schema
export const ProductSchema = z.object({
  name: z.string().min(1),
  price: z.string(),
  category: z.string(),
  stock: z.number().default(0),
  sku: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

// ============================================================================
// UTILITY TYPES
// ============================================================================

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Search Types
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination: PaginationParams;
}
