-- =============================================================================
-- UNIFIED POS-LOYALTY DATABASE SCHEMA
-- =============================================================================
-- Complete database schema for POS and Loyalty applications
-- This file creates a fully functional system with:
-- - Complete schema (tables, indexes, sequences)
-- - Functions and triggers
-- - Views
-- - Essential configuration data
-- - One admin user for initial access
--
-- For sample data (products, customers, transactions), run load_sample_data.sql
-- =============================================================================

-- DROP ALL EXISTING OBJECTS
-- =============================================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS enhanced_customer_dashboard CASCADE;
DROP VIEW IF EXISTS customer_management_dashboard CASCADE;
DROP VIEW IF EXISTS work_orders_summary CASCADE;
DROP VIEW IF EXISTS location_inventory_view CASCADE;
DROP VIEW IF EXISTS user_permissions CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_customer_tier_and_stats ON transactions CASCADE;
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON transactions CASCADE;
DROP TRIGGER IF EXISTS trigger_update_customer_stats_enhanced ON transactions CASCADE;
DROP TRIGGER IF EXISTS trigger_set_work_order_number ON work_orders CASCADE;
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_location_inventory ON transactions CASCADE;
DROP TRIGGER IF EXISTS trigger_log_work_order_status_change ON work_orders CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_customer_tier_summary() CASCADE;
DROP FUNCTION IF EXISTS get_customer_summary(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS recalculate_all_customer_tiers() CASCADE;
DROP FUNCTION IF EXISTS update_customer_tier_and_stats() CASCADE;
DROP FUNCTION IF EXISTS calculate_tier_number(DECIMAL, INTEGER, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS calculate_customer_tier(DECIMAL, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS log_customer_activity(INTEGER, VARCHAR, TEXT, INTEGER, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_customer_stats_enhanced() CASCADE;
DROP FUNCTION IF EXISTS update_customer_stats() CASCADE;
DROP FUNCTION IF EXISTS generate_loyalty_number() CASCADE;
DROP FUNCTION IF EXISTS log_work_order_status_change() CASCADE;
DROP FUNCTION IF EXISTS update_location_inventory() CASCADE;
DROP FUNCTION IF EXISTS set_work_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_work_order_number(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS set_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_sku(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_next_batch_number_seq() CASCADE;
DROP FUNCTION IF EXISTS get_next_batch_number() CASCADE;
DROP FUNCTION IF EXISTS check_user_permission(INTEGER, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS create_session_token() CASCADE;
DROP FUNCTION IF EXISTS log_user_activity(INTEGER, VARCHAR, TEXT, INET, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS verify_password(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS hash_password(TEXT) CASCADE;
DROP FUNCTION IF EXISTS set_system_setting(VARCHAR, TEXT, TEXT, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_system_setting_or_default(VARCHAR, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_system_setting(VARCHAR) CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS batch_number_seq CASCADE;

-- Drop extensions
DROP EXTENSION IF EXISTS pgcrypto CASCADE;

-- =============================================================================
-- CREATE EXTENSIONS
-- =============================================================================

-- Enable pgcrypto for bcrypt password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop all tables (in dependency order)
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS customer_tier_rules CASCADE;
DROP TABLE IF EXISTS customer_preferences CASCADE;
DROP TABLE IF EXISTS customer_activity_log CASCADE;
DROP TABLE IF EXISTS work_order_status_history CASCADE;
DROP TABLE IF EXISTS work_order_products CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS location_inventory CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS product_features CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS generated_products CASCADE;

-- =============================================================================

-- =============================================================================
-- CREATE TABLES
-- =============================================================================
-- Tables from POS system, loyalty system, and shop system merged
-- CREATE COMPLETE TABLES
-- =============================================================================

-- Products table with all columns
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image VARCHAR(10) DEFAULT '📦',
    sku VARCHAR(50) UNIQUE,
    product_type VARCHAR(100),
    laptop_size VARCHAR(20),
    brand VARCHAR(100),
    collection VARCHAR(100),
    material VARCHAR(100),
    gender VARCHAR(20),
    color VARCHAR(50),
    description TEXT,
    dimensions VARCHAR(100),
    weight DECIMAL(5,2),
    warranty_info TEXT,
    care_instructions TEXT,
    main_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    sf_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by_user INTEGER,
    status varchar DEFAULT 'Created' NULL
);

-- Customers table with all columns
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    loyalty_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    points INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    visit_count INTEGER DEFAULT 0,
    last_visit TIMESTAMP,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    preferred_contact VARCHAR(20) DEFAULT 'email',
    date_of_birth DATE,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    marketing_consent BOOLEAN DEFAULT false,
    member_status VARCHAR(50) DEFAULT 'Active' ,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    member_type VARCHAR(20) DEFAULT 'Individual',
    sf_id VARCHAR(100),
    customer_tier VARCHAR(20) DEFAULT 'Bronze Tier',
    tier_calculation_number DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by_user INTEGER,
    user_id INTEGER,
    status varchar DEFAULT 'Created'::character varying NULL
);
-- Transactions table with all columns
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    location_id INTEGER,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount_received DECIMAL(10,2),
    change_amount DECIMAL(10,2) DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_type VARCHAR(20),
    discount_reason VARCHAR(255),
    card_last_four VARCHAR(4),
    card_type VARCHAR(20),
    payment_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user INTEGER,
    status varchar DEFAULT 'Created' NULL
);

-- Transaction items table
CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- Generated products table
CREATE TABLE generated_products (
    id SERIAL PRIMARY KEY,
    batch INTEGER,
    brand VARCHAR(100),
    segment VARCHAR(100),
    num_of_products INTEGER,
    generated_product JSON,
    prompt TEXT,
    raw_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product images table
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.product_images ADD CONSTRAINT product_images_unique UNIQUE (product_id, image_url);

-- Product features table
CREATE TABLE product_features (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    feature_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.product_features ADD CONSTRAINT product_features_unique UNIQUE (product_id,feature_name);

-- Locations table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    store_code VARCHAR(10) UNIQUE NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'USA',
    phone VARCHAR(20),
    email VARCHAR(255),
    tax_rate DECIMAL(5,4) DEFAULT 0.0800,
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    logo_url TEXT,
    logo_base64 TEXT,
    is_active BOOLEAN DEFAULT true,
    business_hours JSONB,
    manager_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user INTEGER
);

-- User settings table
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_identifier VARCHAR(255) UNIQUE NOT NULL,
    selected_location_id INTEGER REFERENCES locations(id),
    theme_mode VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    currency_format VARCHAR(10) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Location inventory table
CREATE TABLE location_inventory (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 5,
    last_restock_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(location_id, product_id)
);

-- =============================================================================
-- ORDERS TABLES (for online/mobile ordering)
-- =============================================================================

-- Orders table for tracking customer orders across POS and online channels
CREATE TABLE IF NOT EXISTS orders(
	id serial4 NOT NULL,
	order_number varchar(50) NOT NULL,
	customer_id int4 NULL,
	location_id int4 NULL,
	order_date timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	status varchar(50) DEFAULT 'pending'::character varying NULL,
	origin varchar(50) DEFAULT 'pos'::character varying NULL,
	subtotal numeric(10, 2) DEFAULT 0.00 NULL,
	discount_amount numeric(10, 2) DEFAULT 0.00 NULL,
	tax_amount numeric(10, 2) DEFAULT 0.00 NULL,
	total_amount numeric(10, 2) DEFAULT 0.00 NULL,
	voucher_id int4 NULL,
	voucher_discount numeric(10, 2) DEFAULT 0.00 NULL,
	coupon_code varchar(50) NULL,
	coupon_discount numeric(10, 2) DEFAULT 0.00 NULL,
	payment_method varchar(50) NULL,
	transaction_id int4 NULL,
	notes text NULL,
	created_by int4 NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	completed_at timestamp NULL,
	sf_id varchar NULL,
	special_instructions text NULL,
	order_type varchar(20) DEFAULT 'pickup'::character varying NULL,
	delivery_address text NULL,
	delivery_instructions text NULL,
	estimated_time timestamp NULL,
	scheduled_time timestamp NULL,
	payment_method_id int4 NULL,
	guest_name varchar(100) NULL,
	guest_phone varchar(20) NULL,
	guest_email varchar(100) NULL,
	sync_status bool NULL,
	sync_message jsonb NULL,
	salesforce_order_id varchar(255) DEFAULT NULL::character varying NULL,
	sync_attempted_at timestamp NULL,
	CONSTRAINT orders_order_number_key UNIQUE (order_number),
	CONSTRAINT orders_order_type_check CHECK (((order_type)::text = ANY ((ARRAY['pickup'::character varying, 'delivery'::character varying])::text[]))),
	CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- Order items table for individual products in an order
CREATE TABLE IF NOT EXISTS order_items (
	id serial4 NOT NULL,
	order_id int4 NULL,
	product_id int4 NULL,
	product_name varchar(255) NOT NULL,
	product_sku varchar(100) NULL,
	product_image_url text NULL,
	quantity int4 DEFAULT 1 NOT NULL,
	unit_price numeric(10, 2) NOT NULL,
	tax_amount numeric(10, 2) DEFAULT 0.00 NULL,
	discount_amount numeric(10, 2) DEFAULT 0.00 NULL,
	voucher_discount numeric(10, 2) DEFAULT 0.00 NULL,
	total_price numeric(10, 2) NOT NULL,
	notes text NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	sf_id varchar NULL,
	modifiers jsonb DEFAULT '[]'::jsonb NULL,
	special_instructions text NULL,
	CONSTRAINT order_items_pkey PRIMARY KEY (id)
);

-- Order status history for tracking status changes
CREATE TABLE IF NOT EXISTS order_status_history (
	id serial4 NOT NULL,
	order_id int4 NULL,
	old_status varchar(50) NULL,
	new_status varchar(50) NOT NULL,
	changed_by int4 NULL,
	change_reason text NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT order_status_history_pkey PRIMARY KEY (id)
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_location_id ON orders(location_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_origin ON orders(origin);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- =============================================================================
-- WORK ORDERS TABLES (for service/repair orders)
-- =============================================================================

-- Work orders table
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    work_order_number VARCHAR(20) UNIQUE NOT NULL,
    location_id INTEGER REFERENCES locations(id) NOT NULL,
    customer_id INTEGER REFERENCES customers(id) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    work_type VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'New',
    assigned_to VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_date TIMESTAMP,
    start_date TIMESTAMP,
    estimated_completion_date DATE,
    actual_completion_date TIMESTAMP,
    labor_hours DECIMAL(5,2) DEFAULT 0.00,
    labor_rate DECIMAL(8,2) DEFAULT 0.00,
    parts_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    customer_notes TEXT,
    internal_notes TEXT,
    created_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work order products table
CREATE TABLE work_order_products (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(50),
    serial_number VARCHAR(100),
    issue_description TEXT,
    resolution TEXT,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work order status history table
CREATE TABLE work_order_status_history (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by VARCHAR(255),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer activity log table
CREATE TABLE customer_activity_log (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    points_change INTEGER DEFAULT 0,
    transaction_id INTEGER REFERENCES transactions(id),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer preferences table
CREATE TABLE customer_preferences (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, preference_key)
);

-- Customer tier rules table
CREATE TABLE customer_tier_rules (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(20) NOT NULL UNIQUE,
    min_spending DECIMAL(10,2) DEFAULT 0.00,
    min_visits INTEGER DEFAULT 0,
    min_points INTEGER DEFAULT 0,
    calculation_multiplier DECIMAL(4,2) DEFAULT 1.00,
    benefits TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_encrypted BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    last_login TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_expires_at TIMESTAMP,
    must_change_password BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Add foreign key to customers table now that users table exists
ALTER TABLE customers ADD CONSTRAINT fk_customers_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- User sessions table
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User activity log table
CREATE TABLE user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints that were missing
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_location_id FOREIGN KEY (location_id) REFERENCES locations(id);
ALTER TABLE products ADD CONSTRAINT fk_products_created_by_user FOREIGN KEY (created_by_user) REFERENCES users(id);
ALTER TABLE customers ADD CONSTRAINT fk_customers_created_by_user FOREIGN KEY (created_by_user) REFERENCES users(id);
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_created_by_user FOREIGN KEY (created_by_user) REFERENCES users(id);
ALTER TABLE locations ADD CONSTRAINT fk_locations_created_by_user FOREIGN KEY (created_by_user) REFERENCES users(id);
-- =============================================================================

-- =============================================================================
-- LOYALTY APPLICATION TABLES
-- =============================================================================
-- Loyalty Application Database Changes
-- This file contains the additional database schema changes needed for the customer-facing loyalty application
-- These changes build upon the existing POS demo database schema

-- ============================================================================
-- ROLES AND PERMISSIONS
-- ============================================================================

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LOYALTY PROGRAM ENHANCEMENTS
-- ============================================================================

-- Create loyalty tiers table for more sophisticated tier management
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(50) UNIQUE NOT NULL,
    tier_level INTEGER NOT NULL UNIQUE, -- 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
    min_spending DECIMAL(10,2) NOT NULL,
    min_visits INTEGER NOT NULL,
    min_points INTEGER NOT NULL,
    points_multiplier DECIMAL(4,2) DEFAULT 1.00,
    benefits JSONB DEFAULT '{}',
    tier_color VARCHAR(7) DEFAULT '#000000', -- Hex color for UI
    tier_icon VARCHAR(50), -- Icon identifier for UI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create loyalty rewards table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id SERIAL PRIMARY KEY,
    reward_name VARCHAR(255) NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- 'discount', 'free_item', 'free_shipping', 'birthday', 'anniversary'
    points_required INTEGER NOT NULL,
    discount_percentage DECIMAL(5,2), -- For percentage discounts
    discount_amount DECIMAL(10,2), -- For fixed amount discounts
    free_item_product_id INTEGER REFERENCES products(id),
    description TEXT,
    terms_conditions TEXT,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    max_redemptions INTEGER, -- NULL for unlimited
    current_redemptions INTEGER DEFAULT 0,
    tier_restriction VARCHAR(50), -- NULL for all tiers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customer rewards table (rewards earned by customers)
CREATE TABLE IF NOT EXISTS customer_rewards (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    reward_id INTEGER REFERENCES loyalty_rewards(id),
    points_spent INTEGER NOT NULL,
    reward_value DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'used', 'expired', 'cancelled'
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    used_at TIMESTAMP,
    used_in_transaction_id INTEGER REFERENCES transactions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create referral program table
CREATE TABLE IF NOT EXISTS customer_referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    referred_email VARCHAR(255) NOT NULL,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'expired'
    referrer_points_earned INTEGER DEFAULT 0,
    referred_customer_id INTEGER REFERENCES customers(id),
    completed_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ORDER TRACKING AND SHIPPING
-- ============================================================================

-- Create shipping addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    address_type VARCHAR(20) DEFAULT 'shipping', -- 'shipping', 'billing', 'both'
    is_default BOOLEAN DEFAULT false,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'USA',
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order tracking table
CREATE TABLE IF NOT EXISTS order_tracking (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    tracking_number VARCHAR(100),
    carrier VARCHAR(50), -- 'UPS', 'FedEx', 'USPS', 'DHL'
    shipping_method VARCHAR(50), -- 'standard', 'express', 'overnight'
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'shipped', 'delivered', 'returned'
    shipping_address_id INTEGER REFERENCES customer_addresses(id),
    tracking_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    status_details TEXT,
    location VARCHAR(100), -- For tracking package location
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- ============================================================================
-- AI CHAT AND CUSTOMER SERVICE
-- ============================================================================

-- Create chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'transferred'
    agent_id VARCHAR(100), -- For future human agent integration
    agent_name VARCHAR(100),
    subject VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
    sender_type VARCHAR(20) NOT NULL, -- 'customer', 'agent', 'ai', 'system'
    sender_id VARCHAR(100), -- customer_id or agent_id
    message_text TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- For additional message data
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customer service tickets table
CREATE TABLE IF NOT EXISTS customer_service_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'product_issue', 'order_problem', 'loyalty_question', 'general'
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    assigned_to VARCHAR(100),
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- ============================================================================
-- WISHLIST AND PRODUCT MANAGEMENT
-- ============================================================================

-- Create wishlists table for wishlist metadata
CREATE TABLE IF NOT EXISTS wishlists (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, name)
);

-- Create customer wishlists table for product-wishlist relationships
CREATE TABLE IF NOT EXISTS customer_wishlists (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    wishlist_id INTEGER REFERENCES wishlists(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    priority INTEGER DEFAULT 1, -- 1=low, 5=high
    UNIQUE(customer_id, product_id, wishlist_id)
);

-- Create product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product review images table
CREATE TABLE IF NOT EXISTS product_review_images (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES product_reviews(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NOTIFICATIONS AND COMMUNICATIONS
-- ============================================================================

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS customer_notification_preferences (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push', 'in_app'
    category VARCHAR(50) NOT NULL, -- 'order_updates', 'loyalty_rewards', 'promotions', 'account'
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, notification_type, category)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS customer_notifications (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT, -- URL to navigate to when notification is clicked
    metadata JSONB DEFAULT '{}',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- ============================================================================
-- SOCIAL LOGIN AND AUTHENTICATION
-- ============================================================================

-- Create social login accounts table
CREATE TABLE IF NOT EXISTS customer_social_accounts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL, -- 'google', 'facebook', 'apple'
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(255),
    profile_picture_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Loyalty program indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_level ON loyalty_tiers(tier_level);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_active ON loyalty_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_active ON loyalty_rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_type ON loyalty_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_customer_rewards_customer ON customer_rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_rewards_status ON customer_rewards(status);
CREATE INDEX IF NOT EXISTS idx_customer_rewards_expires ON customer_rewards(expires_at);
CREATE INDEX IF NOT EXISTS idx_customer_referrals_referrer ON customer_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_customer_referrals_code ON customer_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_customer_referrals_status ON customer_referrals(status);

-- Order tracking indexes
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_type ON customer_addresses(address_type);
CREATE INDEX IF NOT EXISTS idx_order_tracking_transaction ON order_tracking(transaction_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON order_tracking(status);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON order_status_history(created_at);

-- Chat and support indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer ON chat_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_service_tickets_customer ON customer_service_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_tickets_status ON customer_service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_customer_service_tickets_number ON customer_service_tickets(ticket_number);

-- Wishlist and reviews indexes
CREATE INDEX IF NOT EXISTS idx_customer_wishlists_customer ON customer_wishlists(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlists_product ON customer_wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer ON product_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_customer_notification_preferences_customer ON customer_notification_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_customer ON customer_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_read ON customer_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_sent ON customer_notifications(sent_at);

-- Social login indexes
CREATE INDEX IF NOT EXISTS idx_customer_social_accounts_customer ON customer_social_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_social_accounts_provider ON customer_social_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_customer_social_accounts_active ON customer_social_accounts(is_active);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars))::integer + 1, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number() RETURNS TEXT AS $$
DECLARE
    counter INTEGER;
    new_number TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)), 0) + 1 
    INTO counter 
    FROM customer_service_tickets 
    WHERE ticket_number LIKE 'TKT%';
    
    new_number := 'TKT' || LPAD(counter::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON customer_service_tickets;
CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON customer_service_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- Function to check if customer can redeem reward
CREATE OR REPLACE FUNCTION can_redeem_reward(
    p_customer_id INTEGER,
    p_reward_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    customer_points INTEGER;
    reward_points INTEGER;
    reward_max_redemptions INTEGER;
    reward_current_redemptions INTEGER;
    customer_tier VARCHAR(20);
    reward_tier_restriction VARCHAR(50);
BEGIN
    -- Get customer points and tier
    SELECT points, customer_tier INTO customer_points, customer_tier
    FROM customers WHERE id = p_customer_id;
    
    -- Get reward details
    SELECT points_required, max_redemptions, current_redemptions, tier_restriction
    INTO reward_points, reward_max_redemptions, reward_current_redemptions, reward_tier_restriction
    FROM loyalty_rewards WHERE id = p_reward_id AND is_active = true;
    
    -- Check if customer has enough points
    IF customer_points < reward_points THEN
        RETURN FALSE;
    END IF;
    
    -- Check if reward has reached max redemptions
    IF reward_max_redemptions IS NOT NULL AND reward_current_redemptions >= reward_max_redemptions THEN
        RETURN FALSE;
    END IF;
    
    -- Check tier restriction
    IF reward_tier_restriction IS NOT NULL AND customer_tier != reward_tier_restriction THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem reward
CREATE OR REPLACE FUNCTION redeem_reward(
    p_customer_id INTEGER,
    p_reward_id INTEGER,
    p_transaction_id INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    reward_record RECORD;
    customer_reward_id INTEGER;
BEGIN
    -- Check if customer can redeem
    IF NOT can_redeem_reward(p_customer_id, p_reward_id) THEN
        RAISE EXCEPTION 'Customer cannot redeem this reward';
    END IF;
    
    -- Get reward details
    SELECT * INTO reward_record
    FROM loyalty_rewards WHERE id = p_reward_id;
    
    -- Create customer reward record
    INSERT INTO customer_rewards (
        customer_id, reward_id, points_spent, reward_value, 
        expires_at, used_in_transaction_id
    ) VALUES (
        p_customer_id, p_reward_id, reward_record.points_required, 
        COALESCE(reward_record.discount_amount, 0),
        CURRENT_DATE + INTERVAL '1 year',
        p_transaction_id
    ) RETURNING id INTO customer_reward_id;
    
    -- Deduct points from customer
    UPDATE customers 
    SET points = points - reward_record.points_required
    WHERE id = p_customer_id;
    
    -- Update reward redemption count
    UPDATE loyalty_rewards 
    SET current_redemptions = current_redemptions + 1
    WHERE id = p_reward_id;
    
    -- Log activity
    PERFORM log_customer_activity(
        p_customer_id,
        'reward_redemption',
        'Redeemed reward: ' || reward_record.reward_name,
        -reward_record.points_required,
        p_transaction_id,
        'loyalty_system'
    );
    
    RETURN customer_reward_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR LOYALTY APPLICATION
-- ============================================================================

-- View for customer loyalty dashboard
CREATE OR REPLACE VIEW customer_loyalty_dashboard AS
SELECT 
    c.id,
    c.loyalty_number,
    c.name,
    c.email,
    c.points,
    c.total_spent,
    c.visit_count,
    c.customer_tier,
    c.tier_calculation_number,
    c.last_visit,
    c.enrollment_date,
    
    -- Current tier info
    lt.tier_name,
    lt.points_multiplier,
    lt.benefits as tier_benefits,
    lt.tier_color,
    lt.tier_icon,
    
    -- Next tier info
    next_tier.tier_name as next_tier_name,
    next_tier.min_spending as next_tier_min_spending,
    next_tier.min_visits as next_tier_min_visits,
    next_tier.min_points as next_tier_min_points,
    (next_tier.min_spending - c.total_spent) as amount_to_next_tier,
    (next_tier.min_visits - c.visit_count) as visits_to_next_tier,
    (next_tier.min_points - c.points) as points_to_next_tier,
    
    -- Available rewards count
    (SELECT COUNT(*) FROM loyalty_rewards lr 
     WHERE lr.is_active = true 
     AND (lr.tier_restriction IS NULL OR lr.tier_restriction = c.customer_tier)
     AND lr.points_required <= c.points) as available_rewards_count,
    
    -- Active rewards count
    (SELECT COUNT(*) FROM customer_rewards cr 
     WHERE cr.customer_id = c.id 
     AND cr.status = 'active' 
     AND (cr.expires_at IS NULL OR cr.expires_at > CURRENT_DATE)) as active_rewards_count,
    
    -- Recent activity
    (SELECT json_agg(
        json_build_object(
            'activity_type', cal.activity_type,
            'description', cal.description,
            'points_change', cal.points_change,
            'created_at', cal.created_at
        )
    )
    FROM (
        SELECT activity_type, description, points_change, created_at
        FROM customer_activity_log cal 
        WHERE cal.customer_id = c.id 
        ORDER BY cal.created_at DESC 
        LIMIT 5
    ) cal) as recent_activity

FROM customers c
LEFT JOIN loyalty_tiers lt ON c.customer_tier = lt.tier_name
LEFT JOIN loyalty_tiers next_tier ON next_tier.tier_level = lt.tier_level + 1
WHERE c.member_status = 'Active';

-- View for available rewards
CREATE OR REPLACE VIEW available_rewards_view AS
SELECT 
    lr.*,
    c.id as customer_id,
    c.points as customer_points,
    c.customer_tier as customer_tier,
    (c.points >= lr.points_required) as can_redeem,
    (lr.max_redemptions IS NULL OR lr.current_redemptions < lr.max_redemptions) as is_available
FROM loyalty_rewards lr
CROSS JOIN customers c
WHERE lr.is_active = true
AND c.member_status = 'Active'
AND (lr.tier_restriction IS NULL OR lr.tier_restriction = c.customer_tier)
AND (lr.max_redemptions IS NULL OR lr.current_redemptions < lr.max_redemptions);

-- View for order tracking
CREATE OR REPLACE VIEW order_tracking_view AS
SELECT 
    t.id as transaction_id,
    t.total,
    t.created_at as order_date,
    t.payment_method,
    c.id as customer_id,
    c.name as customer_name,
    c.email as customer_email,
    ot.tracking_number,
    ot.carrier,
    ot.shipping_method,
    ot.estimated_delivery_date,
    ot.actual_delivery_date,
    ot.status as shipping_status,
    ot.tracking_url,
    ca.address_line1,
    ca.city,
    ca.state,
    ca.zip_code,
    ca.country
FROM transactions t
JOIN customers c ON t.customer_id = c.id
LEFT JOIN order_tracking ot ON t.id = ot.transaction_id
LEFT JOIN customer_addresses ca ON ot.shipping_address_id = ca.id
WHERE t.customer_id IS NOT NULL;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE loyalty_tiers IS 'Defines loyalty program tiers with benefits and requirements';
COMMENT ON TABLE loyalty_rewards IS 'Available rewards that customers can redeem with points';
COMMENT ON TABLE customer_rewards IS 'Rewards earned by individual customers';
COMMENT ON TABLE customer_referrals IS 'Referral program tracking for customer acquisition';
COMMENT ON TABLE customer_addresses IS 'Customer shipping and billing addresses';
COMMENT ON TABLE order_tracking IS 'Shipping and delivery tracking information';
COMMENT ON TABLE order_status_history IS 'History of order status changes for tracking';
COMMENT ON TABLE chat_sessions IS 'Customer service chat sessions';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat sessions';
COMMENT ON TABLE customer_service_tickets IS 'Customer service ticket system';
COMMENT ON TABLE customer_wishlists IS 'Customer product wishlists';
COMMENT ON TABLE product_reviews IS 'Customer product reviews and ratings';
COMMENT ON TABLE customer_notification_preferences IS 'Customer notification preferences by type and category';
COMMENT ON TABLE customer_notifications IS 'Notifications sent to customers';
COMMENT ON TABLE customer_social_accounts IS 'Social login accounts linked to customer profiles';

-- ============================================================================
-- STORE LOCATION AND SERVICE MANAGEMENT
-- ============================================================================

-- Create store locations table
CREATE TABLE IF NOT EXISTS store_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'USA',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    website VARCHAR(500),
    description TEXT,
    manager VARCHAR(100),
    capacity INTEGER,
    parking_available BOOLEAN DEFAULT false,
    wheelchair_accessible BOOLEAN DEFAULT false,
    wifi_available BOOLEAN DEFAULT false,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create store hours table
CREATE TABLE IF NOT EXISTS store_hours (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES store_locations(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Monday, 7=Sunday
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    special_hours TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, day_of_week)
);

-- Create store services table
CREATE TABLE IF NOT EXISTS store_services (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES store_locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_available BOOLEAN DEFAULT true,
    requires_appointment BOOLEAN DEFAULT true,
    max_capacity INTEGER,
    requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    store_id INTEGER REFERENCES store_locations(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES store_services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    estimated_duration INTEGER NOT NULL, -- in minutes
    actual_duration INTEGER, -- in minutes
    total_cost DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create work orders table
CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    store_id INTEGER REFERENCES store_locations(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES store_services(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('repair', 'maintenance', 'installation', 'consultation', 'other')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'assigned', 'in_progress', 'waiting_parts', 'completed', 'cancelled')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    customer_notes TEXT,
    technician_notes TEXT,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    estimated_completion DATE,
    actual_completion DATE,
    assigned_technician VARCHAR(100),
    customer_signature TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create store events table
CREATE TABLE IF NOT EXISTS store_events (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES store_locations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    type VARCHAR(50) NOT NULL CHECK (type IN ('promotion', 'workshop', 'sale', 'event', 'training')),
    capacity INTEGER,
    current_attendees INTEGER DEFAULT 0,
    is_registration_required BOOLEAN DEFAULT false,
    price DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    location VARCHAR(255),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create store inventory table
CREATE TABLE IF NOT EXISTS store_inventory (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES store_locations(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    low_stock_threshold INTEGER DEFAULT 10,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, product_id)
);

-- Create appointment images table
CREATE TABLE IF NOT EXISTS appointment_images (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create work order images table
CREATE TABLE IF NOT EXISTS work_order_images (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create work order attachments table
CREATE TABLE IF NOT EXISTS work_order_attachments (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER, -- in bytes
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR STORE AND SERVICE MANAGEMENT
-- ============================================================================

-- Store location indexes
CREATE INDEX IF NOT EXISTS idx_store_locations_lat_lng ON store_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_store_locations_city_state ON store_locations(city, state);
CREATE INDEX IF NOT EXISTS idx_store_locations_featured ON store_locations(featured);
CREATE INDEX IF NOT EXISTS idx_store_locations_open ON store_locations(is_open);

-- Store hours indexes
CREATE INDEX IF NOT EXISTS idx_store_hours_store_id ON store_hours(store_id);
CREATE INDEX IF NOT EXISTS idx_store_hours_day ON store_hours(day_of_week);

-- Store services indexes
CREATE INDEX IF NOT EXISTS idx_store_services_store_id ON store_services(store_id);
CREATE INDEX IF NOT EXISTS idx_store_services_category ON store_services(category);
CREATE INDEX IF NOT EXISTS idx_store_services_available ON store_services(is_available);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_store_id ON appointments(store_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date, time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Work orders indexes (using actual column names from work_orders table)
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_location_id ON work_orders(location_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_work_orders_work_type ON work_orders(work_type);

-- Store events indexes
CREATE INDEX IF NOT EXISTS idx_store_events_store_id ON store_events(store_id);
CREATE INDEX IF NOT EXISTS idx_store_events_date_range ON store_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_store_events_type ON store_events(type);
CREATE INDEX IF NOT EXISTS idx_store_events_active ON store_events(is_active);

-- Store inventory indexes
CREATE INDEX IF NOT EXISTS idx_store_inventory_store_id ON store_inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_store_inventory_product_id ON store_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_store_inventory_quantity ON store_inventory(quantity);

-- ============================================================================
-- SAMPLE STORE DATA
-- ============================================================================


-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

/*
This schema builds upon the existing POS demo database and adds the following capabilities:

1. Enhanced Loyalty Program:
   - Sophisticated tier system with benefits
   - Reward redemption system
   - Referral program tracking

2. Order Management:
   - Shipping address management
   - Order tracking and status history
   - Delivery estimation

3. Customer Service:
   - AI chat system with session management
   - Customer service ticket system
   - Message history and tracking

4. Product Engagement:
   - Wishlist functionality
   - Product reviews and ratings
   - Review image management

5. Communication:
   - Notification preferences
   - Multi-channel notification system
   - Social login integration

6. Performance Optimizations:
   - Comprehensive indexing strategy
   - Efficient views for common queries
   - Optimized functions for business logic

The schema is designed to be scalable and supports the full range of features
outlined in the project brief while maintaining compatibility with the existing
POS system.
*/

-- Add missing columns to users table for loyalty application
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer'; -- Direct role instead of role_id for simplicity

-- Add missing columns to products table for loyalty application
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to customers table for loyalty application
ALTER TABLE customers ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS member_status VARCHAR(20) DEFAULT 'Active';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS member_type VARCHAR(20) DEFAULT 'Individual';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_tier VARCHAR(20) DEFAULT 'Bronze';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Update user_sessions table to use token_hash instead of session_token for better security
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255);
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45); -- Support for IPv6
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- If user_sessions table doesn't exist, create it
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    token_hash VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create user_activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);


-- Adding test data 

-- Insert sample store locations
INSERT INTO store_locations (name, address, city, state, zip_code, latitude, longitude, phone, email, description, parking_available, wheelchair_accessible, wifi_available, rating, review_count, featured) VALUES
('Downtown Service Center', '123 Main Street', 'New York', 'NY', '10001', 40.7589, -73.9851, '555-0101', 'downtown@company.com', 'Our flagship service center in the heart of Manhattan', true, true, true, 4.8, 156, true),
('Brooklyn Repair Shop', '456 Atlantic Avenue', 'Brooklyn', 'NY', '11201', 40.6905, -73.9965, '555-0102', 'brooklyn@company.com', 'Full-service repair shop serving Brooklyn area', true, true, false, 4.6, 89, false),
('Queens Maintenance Hub', '789 Queens Boulevard', 'Queens', 'NY', '11375', 40.7282, -73.7949, '555-0103', 'queens@company.com', 'Specialized maintenance and installation services', false, true, true, 4.4, 67, false),
('Bronx Installation Center', '321 Grand Concourse', 'Bronx', 'NY', '10451', 40.8222, -73.9244, '555-0104', 'bronx@company.com', 'Expert installation and setup services', true, false, true, 4.2, 43, false),
('Staten Island Service', '654 Victory Boulevard', 'Staten Island', 'NY', '10301', 40.6195, -74.0822, '555-0105', 'statenisland@company.com', 'Comprehensive service center for Staten Island', true, true, true, 4.7, 78, false)
ON CONFLICT DO NOTHING;

-- Insert sample store hours
INSERT INTO store_hours (store_id, day_of_week, open_time, close_time, is_closed) VALUES
(1, 1, '09:00', '17:00', false), -- Monday
(1, 2, '09:00', '17:00', false), -- Tuesday
(1, 3, '09:00', '17:00', false), -- Wednesday
(1, 4, '09:00', '17:00', false), -- Thursday
(1, 5, '09:00', '17:00', false), -- Friday
(1, 6, '10:00', '16:00', false), -- Saturday
(1, 7, NULL, NULL, true),        -- Sunday
(2, 1, '08:00', '18:00', false),
(2, 2, '08:00', '18:00', false),
(2, 3, '08:00', '18:00', false),
(2, 4, '08:00', '18:00', false),
(2, 5, '08:00', '18:00', false),
(2, 6, '09:00', '15:00', false),
(2, 7, NULL, NULL, true),
(3, 1, '09:00', '17:00', false),
(3, 2, '09:00', '17:00', false),
(3, 3, '09:00', '17:00', false),
(3, 4, '09:00', '17:00', false),
(3, 5, '09:00', '17:00', false),
(3, 6, '10:00', '16:00', false),
(3, 7, NULL, NULL, true),
(4, 1, '08:00', '18:00', false),
(4, 2, '08:00', '18:00', false),
(4, 3, '08:00', '18:00', false),
(4, 4, '08:00', '18:00', false),
(4, 5, '08:00', '18:00', false),
(4, 6, '09:00', '15:00', false),
(4, 7, NULL, NULL, true),
(5, 1, '09:00', '17:00', false),
(5, 2, '09:00', '17:00', false),
(5, 3, '09:00', '17:00', false),
(5, 4, '09:00', '17:00', false),
(5, 5, '09:00', '17:00', false),
(5, 6, '10:00', '16:00', false),
(5, 7, NULL, NULL, true)
ON CONFLICT DO NOTHING;

-- Insert sample store services
INSERT INTO store_services (store_id, name, description, category, duration, price, requires_appointment, max_capacity) VALUES
(1, 'Device Repair', 'Comprehensive repair services for all device types', 'Repair', 120, 89.99, true, 1),
(1, 'System Maintenance', 'Regular system maintenance and optimization', 'Maintenance', 60, 49.99, true, 1),
(1, 'Software Installation', 'Professional software installation and setup', 'Installation', 90, 79.99, true, 1),
(1, 'Technical Consultation', 'Expert technical advice and consultation', 'Consultation', 30, 29.99, false, 5),
(2, 'Hardware Repair', 'Specialized hardware repair services', 'Repair', 180, 129.99, true, 1),
(2, 'Network Setup', 'Complete network installation and configuration', 'Installation', 120, 99.99, true, 1),
(2, 'Data Recovery', 'Professional data recovery services', 'Repair', 240, 199.99, true, 1),
(3, 'Preventive Maintenance', 'Scheduled preventive maintenance services', 'Maintenance', 90, 69.99, true, 1),
(3, 'Equipment Installation', 'Professional equipment installation', 'Installation', 150, 149.99, true, 1),
(4, 'Smart Home Setup', 'Complete smart home system installation', 'Installation', 180, 199.99, true, 1),
(4, 'Security System Installation', 'Professional security system setup', 'Installation', 240, 299.99, true, 1),
(5, 'General Consultation', 'General technical consultation services', 'Consultation', 45, 39.99, false, 3),
(5, 'Emergency Repair', '24/7 emergency repair services', 'Repair', 120, 149.99, true, 1)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SHOP SYSTEM TABLES
-- =============================================================================
-- =====================================================
-- ONLINE SHOP / ORDERING SYSTEM
-- =====================================================
-- Tables for product modifiers, customizations, and online ordering
-- Mobile-first e-commerce experience

-- =====================================================
-- PRODUCT MODIFIERS
-- =====================================================

-- Modifier groups (e.g., "Size", "Toppings", "Extras")
CREATE TABLE IF NOT EXISTS product_modifier_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER DEFAULT 1, -- NULL means unlimited
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual modifiers (e.g., "Large", "Extra Cheese", "No Onions")
CREATE TABLE IF NOT EXISTS product_modifiers (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES product_modifier_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link products to modifier groups
CREATE TABLE IF NOT EXISTS product_modifier_group_links (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    modifier_group_id INTEGER REFERENCES product_modifier_groups(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, modifier_group_id)
);

-- Store selected modifiers in order items (JSON format)
-- Add column to order_items if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'modifiers'
    ) THEN
        ALTER TABLE order_items ADD COLUMN modifiers JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add special instructions columns
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'special_instructions'
    ) THEN
        ALTER TABLE order_items ADD COLUMN special_instructions TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'special_instructions'
    ) THEN
        ALTER TABLE orders ADD COLUMN special_instructions TEXT;
    END IF;
END $$;

-- =====================================================
-- DELIVERY & PICKUP
-- =====================================================

-- Add delivery fields to orders table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'order_type'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'pickup' CHECK (order_type IN ('pickup', 'delivery'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_address TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_instructions'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_instructions TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'estimated_time'
    ) THEN
        ALTER TABLE orders ADD COLUMN estimated_time TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'scheduled_time'
    ) THEN
        ALTER TABLE orders ADD COLUMN scheduled_time TIMESTAMP;
    END IF;
END $$;

-- =====================================================
-- PAYMENT METHODS
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    requires_online_payment BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(50), -- Icon name for UI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add payment method to orders
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_method_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_method_id INTEGER REFERENCES payment_methods(id);
    END IF;
END $$;

-- Customer saved payment methods
CREATE TABLE IF NOT EXISTS customer_payment_methods (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    payment_method_id INTEGER REFERENCES payment_methods(id),
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    payment_token TEXT, -- Encrypted token from payment processor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GUEST CHECKOUT
-- =====================================================

-- Add guest info columns to orders
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'guest_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN guest_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'guest_phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN guest_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'guest_email'
    ) THEN
        ALTER TABLE orders ADD COLUMN guest_email VARCHAR(100);
    END IF;
END $$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_modifiers_group ON product_modifiers(group_id);
CREATE INDEX IF NOT EXISTS idx_product_modifier_links_product ON product_modifier_group_links(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_customer ON customer_payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_time ON orders(scheduled_time);

-- =============================================================================
-- SALESFORCE INTEGRATION
-- =============================================================================
-- Add Salesforce sync columns to orders table

-- Add sync_status column (true/false or null if not synced)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sync_status BOOLEAN DEFAULT NULL;

-- Add sync_message column (store full JSON response or error message)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sync_message JSONB DEFAULT NULL;

-- Add salesforce_order_id column (store the Salesforce Order ID)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS salesforce_order_id VARCHAR(255) DEFAULT NULL;

-- Add sync_attempted_at timestamp
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sync_attempted_at TIMESTAMP DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN orders.sync_status IS 'Salesforce sync status - true if synced successfully, false if failed, null if not attempted';
COMMENT ON COLUMN orders.sync_message IS 'Full Salesforce sync response or error message (JSON)';
COMMENT ON COLUMN orders.salesforce_order_id IS 'Salesforce Order ID (e.g., 801Kj00000DexZEIAZ)';
COMMENT ON COLUMN orders.sync_attempted_at IS 'Timestamp when Salesforce sync was last attempted';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders(sync_status);
CREATE INDEX IF NOT EXISTS idx_orders_salesforce_id ON orders(salesforce_order_id);


-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_number ON customers(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON customers(LOWER(first_name));
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON customers(LOWER(last_name));
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit);
CREATE INDEX IF NOT EXISTS idx_customers_member_status ON customers(member_status);
CREATE INDEX IF NOT EXISTS idx_customers_member_type ON customers(member_type);
CREATE INDEX IF NOT EXISTS idx_customers_customer_tier ON customers(customer_tier);
CREATE INDEX IF NOT EXISTS idx_customers_enrollment_date ON customers(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_customers_tier_calculation_number ON customers(tier_calculation_number);
CREATE INDEX IF NOT EXISTS idx_customers_sf_id ON customers(sf_id);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_location_id ON transactions(location_id);

-- Transaction items indexes
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);

-- Generated products indexes
CREATE INDEX IF NOT EXISTS idx_generated_products_batch_id ON generated_products(batch);
CREATE INDEX IF NOT EXISTS idx_generated_products_brand_id ON generated_products(brand);
CREATE INDEX IF NOT EXISTS idx_generated_products_segment_id ON generated_products(segment);
CREATE INDEX IF NOT EXISTS idx_generated_products_created_at ON generated_products(created_at);

-- Product images and features indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_features_product_id ON product_features(product_id);

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_store_code ON locations(store_code);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_identifier ON user_settings(user_identifier);

-- Location inventory indexes
CREATE INDEX IF NOT EXISTS idx_location_inventory_location ON location_inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_location_inventory_product ON location_inventory(product_id);

-- Work orders indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_location ON work_orders(location_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_date ON work_orders(created_date);
CREATE INDEX IF NOT EXISTS idx_work_order_products_work_order ON work_order_products(work_order_id);

-- Customer activity log indexes
CREATE INDEX IF NOT EXISTS idx_customer_activity_log_customer ON customer_activity_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_log_type ON customer_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_customer_activity_log_created ON customer_activity_log(created_at);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_active ON system_settings(is_active);

-- Users and roles indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- =============================================================================
-- SEQUENCES
-- =============================================================================

CREATE SEQUENCE batch_number_seq START 1;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to get next batch number
CREATE OR REPLACE FUNCTION get_next_batch_number()
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE((SELECT MAX(batch) FROM generated_products), 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get next batch number using sequence
CREATE OR REPLACE FUNCTION get_next_batch_number_seq()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('batch_number_seq');
END;
$$ LANGUAGE plpgsql;

-- Function to generate loyalty number
CREATE OR REPLACE FUNCTION generate_loyalty_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
    max_attempts INTEGER := 100;
    attempt INTEGER := 0;
BEGIN
    LOOP
        SELECT COALESCE(MAX(CAST(SUBSTRING(loyalty_number FROM 4) AS INTEGER)), 0) + 1 
        INTO counter 
        FROM customers 
        WHERE loyalty_number LIKE 'LOY%' AND LENGTH(loyalty_number) = 6;
        
        new_number := 'LOY' || LPAD(counter::TEXT, 3, '0');
        
        IF NOT EXISTS (SELECT 1 FROM customers WHERE loyalty_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique loyalty number after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate SKU
-- CREATE OR REPLACE FUNCTION generate_sku(product_brand TEXT, product_type TEXT) RETURNS TEXT AS $$
-- DECLARE
--     brand_code TEXT;
--     type_code TEXT;
--     counter INTEGER;
--     new_sku TEXT;
-- BEGIN
--     brand_code := UPPER(SUBSTRING(COALESCE(product_brand, 'GEN'), 1, 3));
--     type_code := UPPER(SUBSTRING(COALESCE(product_type, 'PRD'), 1, 3));
    
--     SELECT COALESCE(MAX(CAST(SUBSTRING(sku FROM 7) AS INTEGER)), 0) + 1
--     INTO counter
--     FROM products 
--     WHERE sku LIKE brand_code || type_code || '%'
--     AND LENGTH(sku) = 9;
    
--     new_sku := brand_code || '-' || type_code || '-' || LPAD(counter::TEXT, 3, '0');
    
--     RETURN new_sku;
-- END;
-- $$ LANGUAGE plpgsql;

-- One global sequence
DROP SEQUENCE IF EXISTS sku_global_seq;
CREATE SEQUENCE IF NOT EXISTS sku_global_seq;

CREATE OR REPLACE FUNCTION generate_sku(product_brand TEXT, product_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
    brand_code TEXT;
    type_code  TEXT;
    seq_val    bigint;
BEGIN
    brand_code := upper(substr(coalesce(product_brand, 'GEN'), 1, 3));
    type_code  := upper(substr(coalesce(product_type, 'PRD'), 1, 3));

    seq_val := nextval('sku_global_seq'); -- concurrency-safe

    RETURN format('%s-%s-%s', brand_code, type_code, lpad(seq_val::text, 5, '0'));
END;
$$;


-- Function to generate work order number
CREATE OR REPLACE FUNCTION generate_work_order_number(loc_id INTEGER) RETURNS TEXT AS $$
DECLARE
    location_code TEXT;
    counter INTEGER;
    new_number TEXT;
BEGIN
    SELECT store_code INTO location_code FROM locations WHERE id = loc_id;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM LENGTH(location_code) + 3) AS INTEGER)), 0) + 1
    INTO counter
    FROM work_orders 
    WHERE work_order_number LIKE location_code || '-WO%';
    
    new_number := location_code || '-WO-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate customer tier
CREATE OR REPLACE FUNCTION calculate_customer_tier(
    p_total_spent DECIMAL,
    p_visit_count INTEGER,
    p_points INTEGER
) RETURNS VARCHAR(20) AS $$
DECLARE
    tier_result VARCHAR(20) := 'Bronze';
BEGIN
    IF p_total_spent >= 2000.00 AND p_visit_count >= 30 AND p_points >= 1500 THEN
        tier_result := 'Platinum';
    ELSIF p_total_spent >= 750.00 AND p_visit_count >= 15 AND p_points >= 500 THEN
        tier_result := 'Gold';
    ELSIF p_total_spent >= 250.00 AND p_visit_count >= 5 AND p_points >= 100 THEN
        tier_result := 'Silver';
    ELSE
        tier_result := 'Bronze';
    END IF;
    
    RETURN tier_result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate tier number
CREATE OR REPLACE FUNCTION calculate_tier_number(
    p_total_spent DECIMAL,
    p_visit_count INTEGER,
    p_points INTEGER,
    p_tier VARCHAR(20)
) RETURNS DECIMAL AS $$
DECLARE
    base_score DECIMAL := 0.00;
    tier_multiplier DECIMAL := 1.00;
BEGIN
    SELECT calculation_multiplier INTO tier_multiplier
    FROM customer_tier_rules
    WHERE tier_name = p_tier;
    
    base_score := (p_total_spent * 0.5) + (p_visit_count * 10) + (p_points * 0.1);
    
    RETURN ROUND(base_score * tier_multiplier, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to log customer activity
CREATE OR REPLACE FUNCTION log_customer_activity(
    p_customer_id INTEGER,
    p_activity_type VARCHAR(50),
    p_description TEXT DEFAULT NULL,
    p_points_change INTEGER DEFAULT 0,
    p_transaction_id INTEGER DEFAULT NULL,
    p_created_by VARCHAR(255) DEFAULT 'system'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO customer_activity_log 
    (customer_id, activity_type, description, points_change, transaction_id, created_by)
    VALUES 
    (p_customer_id, p_activity_type, p_description, p_points_change, p_transaction_id, p_created_by);
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate all customer tiers
CREATE OR REPLACE FUNCTION recalculate_all_customer_tiers() RETURNS INTEGER AS $$
DECLARE
    customer_record RECORD;
    updated_count INTEGER := 0;
    new_tier VARCHAR(20);
    new_calculation_number DECIMAL;
BEGIN
    FOR customer_record IN 
        SELECT id, total_spent, visit_count, points 
        FROM customers 
        WHERE member_status = 'Active'
    LOOP
        new_tier := calculate_customer_tier(
            customer_record.total_spent, 
            customer_record.visit_count, 
            customer_record.points
        );
        
        new_calculation_number := calculate_tier_number(
            customer_record.total_spent, 
            customer_record.visit_count, 
            customer_record.points,
            new_tier
        );
        
        UPDATE customers 
        SET 
            customer_tier = new_tier,
            tier_calculation_number = new_calculation_number,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = customer_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- System settings functions
CREATE OR REPLACE FUNCTION get_system_setting(p_key VARCHAR(100)) 
RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
BEGIN
    SELECT setting_value INTO v_value
    FROM system_settings
    WHERE setting_key = p_key
    AND is_active = true
    LIMIT 1;
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_system_setting_or_default(
    p_key VARCHAR(100),
    p_default TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
BEGIN
    v_value := get_system_setting(p_key);
    
    IF v_value IS NULL THEN
        RETURN p_default;
    END IF;
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_system_setting(
    p_key VARCHAR(100),
    p_value TEXT,
    p_description TEXT DEFAULT NULL,
    p_category VARCHAR(50) DEFAULT 'general',
    p_user VARCHAR(100) DEFAULT 'system'
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO system_settings (setting_key, setting_value, description, category, created_by, updated_by)
    VALUES (p_key, p_value, p_description, p_category, p_user, p_user)
    ON CONFLICT (setting_key) 
    DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        description = COALESCE(EXCLUDED.description, system_settings.description),
        category = EXCLUDED.category,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- User management functions (using bcrypt via pgcrypto)
CREATE OR REPLACE FUNCTION hash_password(password TEXT) RETURNS TEXT AS $$
BEGIN
    -- Use bcrypt with cost factor of 12 (same as bcryptjs default)
    RETURN crypt(password, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT) RETURNS BOOLEAN AS $$
BEGIN
    -- Verify password against bcrypt hash
    RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_session_token() RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id INTEGER,
    p_activity_type VARCHAR(50),
    p_description TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activity_log 
    (user_id, activity_type, description, ip_address, user_agent, metadata)
    VALUES 
    (p_user_id, p_activity_type, p_description, p_ip_address, p_user_agent, p_metadata);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id INTEGER,
    p_module VARCHAR(50),
    p_action VARCHAR(20)
) RETURNS BOOLEAN AS $$
DECLARE
    user_perms JSONB;
BEGIN
    SELECT permissions INTO user_perms
    FROM user_permissions
    WHERE user_id = p_user_id;
    
    IF user_perms IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN COALESCE(user_perms->p_module->>p_action, 'false')::BOOLEAN;
END;
$$ LANGUAGE plpgsql;
-- =============================================================================
-- TRIGGERS
-- =============================================================================
/*
-- Trigger to update customer tier and stats
CREATE OR REPLACE FUNCTION update_customer_tier_and_stats() RETURNS TRIGGER AS $$
DECLARE
    new_tier VARCHAR(20);
    new_calculation_number DECIMAL;
BEGIN
    -- Update customer statistics
    UPDATE customers 
    SET 
        points = points + NEW.points_earned - COALESCE(NEW.points_redeemed, 0),
        total_spent = total_spent + NEW.total,
        visit_count = visit_count + 1,
        last_visit = NEW.created_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.customer_id;
    
    -- Get updated customer data for tier calculation
    SELECT 
        calculate_customer_tier(total_spent + NEW.total, visit_count + 1, points + NEW.points_earned - COALESCE(NEW.points_redeemed, 0)),
        calculate_tier_number(total_spent + NEW.total, visit_count + 1, points + NEW.points_earned - COALESCE(NEW.points_redeemed, 0), 
                             calculate_customer_tier(total_spent + NEW.total, visit_count + 1, points + NEW.points_earned - COALESCE(NEW.points_redeemed, 0)))
    INTO new_tier, new_calculation_number
    FROM customers 
    WHERE id = NEW.customer_id;
    
    -- Update tier and calculation number
    UPDATE customers 
    SET 
        customer_tier = new_tier,
        tier_calculation_number = new_calculation_number
    WHERE id = NEW.customer_id;
    
    -- Log the purchase activity
    PERFORM log_customer_activity(
        NEW.customer_id,
        'purchase',
        'Purchase transaction #' || NEW.id || ' - Tier: ' || new_tier,
        NEW.points_earned - COALESCE(NEW.points_redeemed, 0),
        NEW.id,
        'pos_system'
    );
    
    -- Log tier change if applicable
    IF EXISTS (
        SELECT 1 FROM customers 
        WHERE id = NEW.customer_id 
        AND customer_tier != new_tier
    ) THEN
        PERFORM log_customer_activity(
            NEW.customer_id,
            'tier_change',
            'Customer tier updated to ' || new_tier,
            0,
            NEW.id,
            'auto_calculation'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_tier_and_stats
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_tier_and_stats();
*/
-- Trigger to auto-generate work order numbers
CREATE OR REPLACE FUNCTION set_work_order_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.work_order_number IS NULL OR NEW.work_order_number = '' THEN
        NEW.work_order_number := generate_work_order_number(NEW.location_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_work_order_number
    BEFORE INSERT ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_work_order_number();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the count of orders today
    SELECT COUNT(*) INTO counter
    FROM orders
    WHERE DATE(order_date) = CURRENT_DATE;
    
    -- Generate order number: ORD-YYYYMMDD-####
    new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- Trigger to update location inventory after transactions
CREATE OR REPLACE FUNCTION update_location_inventory() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO location_inventory (location_id, product_id, quantity)
    SELECT 
        NEW.location_id,
        ti.product_id,
        -ti.quantity
    FROM transaction_items ti
    WHERE ti.transaction_id = NEW.id
    ON CONFLICT (location_id, product_id)
    DO UPDATE SET 
        quantity = location_inventory.quantity - EXCLUDED.quantity,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location_inventory
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_location_inventory();

-- Trigger to log work order status changes
CREATE OR REPLACE FUNCTION log_work_order_status_change() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO work_order_status_history 
        (work_order_id, old_status, new_status, changed_by, change_reason)
        VALUES 
        (NEW.id, OLD.status, NEW.status, 'System', 'Status updated');
    END IF;
    
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_work_order_status_change
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION log_work_order_status_change();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Location inventory view
CREATE OR REPLACE VIEW location_inventory_view AS
SELECT 
    li.*,
    p.name as product_name,
    p.sku,
    p.price,
    p.category,
    l.store_name,
    l.store_code,
    (li.quantity <= li.reorder_level) as needs_reorder
FROM location_inventory li
JOIN products p ON li.product_id = p.id
JOIN locations l ON li.location_id = l.id
WHERE l.is_active = true;

-- Work orders summary view
CREATE OR REPLACE VIEW work_orders_summary AS
SELECT 
    wo.*,
    c.name as customer_name,
    c.loyalty_number,
    c.email as customer_email,
    l.store_name,
    l.store_code,
    COUNT(wop.id) as product_count
FROM work_orders wo
JOIN customers c ON wo.customer_id = c.id
JOIN locations l ON wo.location_id = l.id
LEFT JOIN work_order_products wop ON wo.id = wop.work_order_id
GROUP BY wo.id, c.name, c.loyalty_number, c.email, l.store_name, l.store_code;

-- Enhanced customer dashboard view
CREATE OR REPLACE VIEW enhanced_customer_dashboard AS
SELECT 
    c.id,
    c.loyalty_number,
    c.name,
    c.email,
    c.phone,
    c.points,
    c.total_spent,
    c.visit_count,
    c.last_visit,
    c.created_at,
    c.member_status,
    c.enrollment_date,
    c.member_type,
    c.customer_tier,
    c.tier_calculation_number,
    c.notes,
    
    (CURRENT_DATE - c.enrollment_date::DATE) as days_since_enrollment,
    
    CASE 
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.enrollment_date::DATE)) >= 1 THEN
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.enrollment_date::DATE))::TEXT || ' years'
        ELSE
            EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.enrollment_date::DATE))::TEXT || ' months'
    END as member_duration,
    
    CASE 
        WHEN c.member_status != 'Active' THEN c.member_status
        WHEN c.last_visit >= CURRENT_DATE - INTERVAL '30 days' THEN 'Recently Active'
        WHEN c.last_visit >= CURRENT_DATE - INTERVAL '90 days' THEN 'Moderately Active'
        WHEN c.last_visit IS NULL THEN 'Never Purchased'
        ELSE 'Dormant'
    END as activity_status,
    
    CASE 
        WHEN c.last_visit IS NOT NULL 
        THEN (CURRENT_DATE - c.last_visit::DATE)
        ELSE NULL 
    END as days_since_last_visit,
    
    CASE 
        WHEN c.visit_count > 0 
        THEN ROUND(c.total_spent / c.visit_count, 2)
        ELSE 0 
    END as avg_transaction_value,
    
    ctr.benefits as tier_benefits,
    ctr.calculation_multiplier as tier_multiplier,
    
    (
        SELECT tier_name 
        FROM customer_tier_rules 
        WHERE min_spending > c.total_spent 
        ORDER BY min_spending ASC 
        LIMIT 1
    ) as next_tier,
    
    (
        SELECT min_spending - c.total_spent 
        FROM customer_tier_rules 
        WHERE min_spending > c.total_spent 
        ORDER BY min_spending ASC 
        LIMIT 1
    ) as amount_to_next_tier

FROM customers c
LEFT JOIN customer_tier_rules ctr ON c.customer_tier = ctr.tier_name
ORDER BY c.tier_calculation_number DESC, c.total_spent DESC;

-- User permissions view
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
    u.id as user_id,
    u.email as username,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    r.permissions,
    u.is_active as user_active,
    r.is_active as role_active
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.is_active = true AND r.is_active = true;


-- Create or replace function to merge first_name and last_name into name
CREATE OR REPLACE FUNCTION merge_customer_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Merge first_name and last_name into name field
    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        NEW.name = TRIM(NEW.first_name || ' ' || NEW.last_name);
    ELSIF NEW.first_name IS NOT NULL THEN
        NEW.name = TRIM(NEW.first_name);
    ELSIF NEW.last_name IS NOT NULL THEN
        NEW.name = TRIM(NEW.last_name);
    END IF;
    
    -- Ensure name is not empty
    IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
        NEW.name = 'Unknown Customer';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically merge names
DROP TRIGGER IF EXISTS trigger_merge_customer_names ON customers;
CREATE TRIGGER trigger_merge_customer_names
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION merge_customer_names();

-- Update existing records to merge their names
UPDATE customers 
SET name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE first_name IS NOT NULL OR last_name IS NOT NULL;

-- Clean up any empty names
UPDATE customers 
SET name = 'Unknown Customer'
WHERE name IS NULL OR TRIM(name) = '';

-- Add comment to the country column
COMMENT ON COLUMN customers.country IS 'Country of residence for the customer';

-- Customer Images Table
-- Stores customer profile pictures/avatars

CREATE TABLE IF NOT EXISTS customer_images (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    image_data TEXT NOT NULL, -- Base64 encoded image
    file_size INTEGER, -- Size in bytes
    width INTEGER, -- Image width in pixels
    height INTEGER, -- Image height in pixels
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status varchar DEFAULT 'Created' NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_images_customer_id ON customer_images(customer_id);

-- Add comment
COMMENT ON TABLE customer_images IS 'Stores customer profile pictures and avatars';
COMMENT ON COLUMN customer_images.image_data IS 'Base64 encoded image data';
COMMENT ON COLUMN customer_images.filename IS 'Original filename of the uploaded image';
COMMENT ON COLUMN customer_images.file_size IS 'Size of the image data in bytes';
COMMENT ON COLUMN customer_images.width IS 'Image width in pixels';
COMMENT ON COLUMN customer_images.height IS 'Image height in pixels';



-- Voucher System Implementation
-- Database schema for customer vouchers

-- 1. Create customer_vouchers table
CREATE TABLE IF NOT EXISTS customer_vouchers (
    id SERIAL PRIMARY KEY,
    sf_id VARCHAR(100) UNIQUE, -- Salesforce ID
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    voucher_code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Issued' CHECK (status IN ('Issued', 'Redeemed', 'Expired', 'Cancelled', 'Reserved')),
    
    voucher_type VARCHAR(50) NOT NULL CHECK (voucher_type IN ('Value', 'Discount', 'ProductSpecific')),
    face_value DECIMAL(10,2), -- Original value for value vouchers
    discount_percent DECIMAL(5,2), -- Percentage discount (0-100)
    product_id INTEGER REFERENCES products(id), -- For product-specific vouchers
    
    -- Value tracking for value vouchers
    remaining_value DECIMAL(10,2), -- Remaining balance for value vouchers
    redeemed_value DECIMAL(10,2) DEFAULT 0, -- Amount already redeemed
    reserved_value DECIMAL(10,2) DEFAULT 0, -- Amount reserved in current transaction
    
    -- Dates
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date DATE,
    use_date TIMESTAMP, -- When voucher was last used
    
    -- Metadata
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user INTEGER
);

-- 2. Add voucher_id to transaction_items table
ALTER TABLE transaction_items 
ADD COLUMN IF NOT EXISTS voucher_id INTEGER REFERENCES customer_vouchers(id);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_customer_id ON customer_vouchers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_status ON customer_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_expiration ON customer_vouchers(expiration_date);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_type ON customer_vouchers(voucher_type);
CREATE INDEX IF NOT EXISTS idx_transaction_items_voucher_id ON transaction_items(voucher_id);

-- 4. Create function to check voucher validity
CREATE OR REPLACE FUNCTION is_voucher_valid(voucher_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    voucher_record RECORD;
BEGIN
    SELECT * INTO voucher_record 
    FROM customer_vouchers 
    WHERE id = voucher_id;
    
    -- Check if voucher exists and is active
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if voucher is issued and not expired
    IF voucher_record.status != 'Issued' THEN
        RETURN FALSE;
    END IF;
    
    -- Check expiration date
    IF voucher_record.expiration_date IS NOT NULL AND voucher_record.expiration_date < CURRENT_DATE THEN
        RETURN FALSE;
    END IF;
    
    -- Check if voucher is active
    IF NOT voucher_record.is_active THEN
        RETURN FALSE;
    END IF;
    
    -- For value vouchers, check if there's remaining value
    IF voucher_record.voucher_type = 'Value' AND voucher_record.remaining_value <= 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to calculate voucher discount
CREATE OR REPLACE FUNCTION calculate_voucher_discount(
    voucher_id INTEGER,
    item_price DECIMAL(10,2),
    product_id INTEGER DEFAULT NULL
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    voucher_record RECORD;
    discount_amount DECIMAL(10,2) := 0;
BEGIN
    -- Get voucher details
    SELECT * INTO voucher_record 
    FROM customer_vouchers 
    WHERE id = voucher_id;
    
    -- Check if voucher is valid
    IF NOT is_voucher_valid(voucher_id) THEN
        RETURN 0;
    END IF;
    
    -- Calculate discount based on voucher type
    CASE voucher_record.voucher_type
        WHEN 'Value' THEN
            -- For value vouchers, discount is the minimum of item price or remaining value
            discount_amount := LEAST(item_price, voucher_record.remaining_value);
            
        WHEN 'Discount' THEN
            -- For percentage discount
            discount_amount := item_price * (voucher_record.discount_percent / 100);
            
        WHEN 'ProductSpecific' THEN
            -- Only apply if product matches
            IF product_id IS NOT NULL AND voucher_record.product_id = product_id THEN
                IF voucher_record.discount_percent IS NOT NULL THEN
                    discount_amount := item_price * (voucher_record.discount_percent / 100);
                ELSIF voucher_record.face_value IS NOT NULL THEN
                    discount_amount := LEAST(item_price, voucher_record.face_value);
                END IF;
            END IF;
            
        ELSE
            discount_amount := 0;
    END CASE;
    
    RETURN discount_amount;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to update voucher when used
CREATE OR REPLACE FUNCTION update_voucher_on_use()
RETURNS TRIGGER AS $$
DECLARE
    voucher_record RECORD;
BEGIN
    -- If voucher_id is set, update the voucher
    IF NEW.voucher_id IS NOT NULL THEN
        SELECT * INTO voucher_record 
        FROM customer_vouchers 
        WHERE id = NEW.voucher_id;
        
        -- Update voucher based on type
        IF voucher_record.voucher_type = 'Value' THEN
            -- For value vouchers, reduce remaining value
            UPDATE customer_vouchers 
            SET 
                remaining_value = remaining_value - NEW.discount_amount,
                redeemed_value = redeemed_value + NEW.discount_amount,
                use_date = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.voucher_id;
            
            -- If remaining value is 0, mark as redeemed
            IF (voucher_record.remaining_value - NEW.discount_amount) <= 0 THEN
                UPDATE customer_vouchers 
                SET status = 'Redeemed'
                WHERE id = NEW.voucher_id;
            END IF;
            
        ELSE
            -- For other voucher types, mark as redeemed
            UPDATE customer_vouchers 
            SET 
                status = 'Redeemed',
                use_date = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.voucher_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_voucher_on_use
    AFTER INSERT ON transaction_items
    FOR EACH ROW
    EXECUTE FUNCTION update_voucher_on_use();

-- 7. Create view for active vouchers
CREATE OR REPLACE VIEW active_customer_vouchers AS
SELECT 
    cv.*,
    c.name as customer_name,
    c.loyalty_number,
    p.name as product_name
FROM customer_vouchers cv
JOIN customers c ON cv.customer_id = c.id
LEFT JOIN products p ON cv.product_id = p.id
WHERE cv.status = 'Issued' 
    AND cv.is_active = true
    AND (cv.expiration_date IS NULL OR cv.expiration_date >= CURRENT_DATE)
    AND (cv.voucher_type != 'Value' OR cv.remaining_value > 0);

-- Transaction Vouchers Implementation
-- This script creates the transaction_vouchers table and updates the voucher system
-- to properly track voucher usage in transactions

-- Create transaction_vouchers table
CREATE TABLE IF NOT EXISTS transaction_vouchers (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    voucher_id INTEGER NOT NULL REFERENCES customer_vouchers(id) ON DELETE CASCADE,
    applied_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_vouchers_transaction_id ON transaction_vouchers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_vouchers_voucher_id ON transaction_vouchers(voucher_id);

-- Update customer_vouchers table to add redeemed_value and use_date columns if they don't exist
DO $$ 
BEGIN
    -- Add redeemed_value column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_vouchers' AND column_name = 'redeemed_value') THEN
        ALTER TABLE customer_vouchers ADD COLUMN redeemed_value DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- Add use_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_vouchers' AND column_name = 'use_date') THEN
        ALTER TABLE customer_vouchers ADD COLUMN use_date TIMESTAMP;
    END IF;
END $$;

-- Create function to update voucher status when redeemed
CREATE OR REPLACE FUNCTION update_voucher_on_redemption()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the voucher status to 'Redeemed' and set use_date
    UPDATE customer_vouchers 
    SET 
        status = 'Redeemed',
        redeemed_value = redeemed_value + NEW.applied_amount,
        remaining_value = GREATEST(0, remaining_value - NEW.applied_amount),
        use_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.voucher_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update voucher status when transaction_vouchers is inserted
DROP TRIGGER IF EXISTS trigger_update_voucher_on_redemption ON transaction_vouchers;
CREATE TRIGGER trigger_update_voucher_on_redemption
    AFTER INSERT ON transaction_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_voucher_on_redemption();

-- Create function to calculate voucher discount amount
CREATE OR REPLACE FUNCTION calculate_voucher_discount_amount(
    p_voucher_id INTEGER,
    p_item_subtotal DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_voucher customer_vouchers%ROWTYPE;
    v_discount_amount DECIMAL(10,2) := 0.00;
BEGIN
    -- Get voucher details
    SELECT * INTO v_voucher FROM customer_vouchers WHERE id = p_voucher_id;
    
    IF NOT FOUND THEN
        RETURN 0.00;
    END IF;
    
    -- Calculate discount based on voucher type
    CASE v_voucher.voucher_type
        WHEN 'Value' THEN
            -- For value vouchers, use the applied amount
            v_discount_amount := LEAST(p_item_subtotal, v_voucher.remaining_value);
        WHEN 'Discount' THEN
            -- For discount vouchers, calculate percentage
            v_discount_amount := p_item_subtotal * (v_voucher.discount_percent / 100);
        WHEN 'ProductSpecific' THEN
            -- For product-specific vouchers
            IF v_voucher.discount_percent IS NOT NULL THEN
                v_discount_amount := p_item_subtotal * (v_voucher.discount_percent / 100);
            ELSIF v_voucher.face_value IS NOT NULL THEN
                v_discount_amount := LEAST(p_item_subtotal, v_voucher.face_value);
            END IF;
    END CASE;
    
    RETURN v_discount_amount;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate voucher eligibility
CREATE OR REPLACE FUNCTION is_voucher_eligible_for_transaction(
    p_voucher_id INTEGER,
    p_customer_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_voucher customer_vouchers%ROWTYPE;
BEGIN
    -- Get voucher details
    SELECT * INTO v_voucher FROM customer_vouchers WHERE id = p_voucher_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if voucher belongs to customer
    IF v_voucher.customer_id != p_customer_id THEN
        RETURN FALSE;
    END IF;
    
    -- Check if voucher is active and not expired
    IF v_voucher.status != 'Issued' OR NOT v_voucher.is_active THEN
        RETURN FALSE;
    END IF;
    
    -- Check expiration date
    IF v_voucher.expiration_date IS NOT NULL AND v_voucher.expiration_date < CURRENT_TIMESTAMP THEN
        RETURN FALSE;
    END IF;
    
    -- Check if voucher has remaining value (only for Value vouchers)
    IF v_voucher.voucher_type = 'Value' AND v_voucher.remaining_value IS NOT NULL AND v_voucher.remaining_value <= 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE transaction_vouchers IS 'Tracks which vouchers were applied to which transactions';
COMMENT ON COLUMN transaction_vouchers.applied_amount IS 'The amount of the voucher that was applied (for value vouchers)';
COMMENT ON COLUMN transaction_vouchers.discount_amount IS 'The actual discount amount calculated and applied';
COMMENT ON FUNCTION update_voucher_on_redemption() IS 'Updates voucher status when it is redeemed in a transaction';
COMMENT ON FUNCTION calculate_voucher_discount_amount(INTEGER, DECIMAL) IS 'Calculates the discount amount for a voucher based on item subtotal';
COMMENT ON FUNCTION is_voucher_eligible_for_transaction(INTEGER, INTEGER) IS 'Validates if a voucher is eligible for use in a transaction';

-- Product Voucher Trigger
-- Automatically sets discount_percent = 100 for ProductSpecific vouchers with null discount_percent

-- Create trigger function
CREATE OR REPLACE FUNCTION set_product_voucher_discount()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if voucher_type is 'ProductSpecific' and discount_percent is null
    IF NEW.voucher_type = 'ProductSpecific' AND NEW.discount_percent IS NULL THEN
        NEW.discount_percent = 100;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on customer_vouchers table
DROP TRIGGER IF EXISTS trigger_set_product_voucher_discount ON customer_vouchers;
CREATE TRIGGER trigger_set_product_voucher_discount
    BEFORE INSERT ON customer_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION set_product_voucher_discount();

-- =============================================================================

-- =============================================================================
-- ESSENTIAL CONFIGURATION DATA
-- =============================================================================
-- System settings, roles, payment methods, locations, etc.
-- This is NOT sample data - it's required for the system to function

-- SAMPLE DATA
-- =============================================================================

-- Insert sample locations
INSERT INTO locations (store_code, store_name, brand, address_line1, city, state, zip_code, tax_rate, manager_name) VALUES
('NYC001', 'Manhattan Flagship', 'Mule Store', '350 Madison Avenue', 'New York', 'NY', '10017', 0.08875, 'John Manager'),
('LAX001', 'Beverly Hills Store', 'Mule Store', '9570 Wilshire Boulevard', 'Beverly Hills', 'CA', '90212', 0.1025, 'Jane Store Manager'),
('CHI001', 'Michigan Avenue', 'Mule Store', '900 N Michigan Avenue', 'Chicago', 'IL', '60611', 0.1025, 'Mike Regional Manager')
ON CONFLICT (store_code) DO NOTHING;

-- Insert default user settings 

-- Insert default tier rules
INSERT INTO customer_tier_rules (tier_name, min_spending, min_visits, min_points, calculation_multiplier, benefits) VALUES
('Bronze', 0.00, 0, 0, 1.00, 'Basic loyalty benefits, 1x points earning'),
('Silver', 250.00, 5, 100, 1.25, 'Enhanced benefits, 1.25x points earning, priority support'),
('Gold', 750.00, 15, 500, 1.50, 'Premium benefits, 1.5x points earning, exclusive offers'),
('Platinum', 2000.00, 30, 1500, 2.00, 'VIP benefits, 2x points earning, personal concierge service')
ON CONFLICT (tier_name) DO UPDATE SET
    min_spending = EXCLUDED.min_spending,
    min_visits = EXCLUDED.min_visits,
    min_points = EXCLUDED.min_points,
    calculation_multiplier = EXCLUDED.calculation_multiplier,
    benefits = EXCLUDED.benefits,
    updated_at = CURRENT_TIMESTAMP;

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_encrypted, is_active, created_by, updated_by) VALUES
('company_name', 'Mule Store', 'text', 'Company name displayed on receipts and reports', 'general', false, true, 'admin', 'admin'),
('currency_symbol', '$', 'text', 'Currency symbol for displaying prices', 'general', false, true, 'admin', 'admin'),
('currency_code', 'USD', 'text', 'ISO currency code', 'general', false, true, 'admin', 'admin'),
('date_format', 'MM/DD/YYYY', 'text', 'Date format for display', 'general', false, true, 'admin', 'admin'),
('time_format', '12h', 'text', 'Time format (12h or 24h)', 'general', false, true, 'admin', 'admin'),
('tax_inclusive', 'false', 'text', 'Whether prices include tax', 'pos', false, true, 'admin', 'admin'),
('default_tax_rate', '0.08', 'text', 'Default tax rate for new locations', 'pos', false, true, 'admin', 'admin'),
('points_per_dollar', '1', 'text', 'Loyalty points earned per dollar spent', 'loyalty', false, true, 'admin', 'admin'),
('points_redemption_rate', '100', 'text', 'Points needed for $1 discount', 'loyalty', false, true, 'admin', 'admin'),
('low_stock_threshold', '5', 'text', 'Stock level to trigger low stock warning', 'inventory', false, true, 'admin', 'admin'),
('receipt_footer_text', 'Thank you for your business!', 'text', 'Text shown at bottom of receipts', 'pos', false, true, 'admin', 'admin'),
('enable_work_orders', 'true', 'text', 'Enable work order management system', 'general', false, true, 'admin', 'admin'),
('enable_multi_location', 'true', 'text', 'Enable multi-location support', 'general', false, true, 'admin', 'admin'),
('session_timeout_minutes', '30', 'text', 'Session timeout in minutes', 'general', false, true, 'admin', 'admin'),
('max_discount_percentage', '50', 'text', 'Maximum discount percentage allowed', 'pos', false, true, 'admin', 'admin'),
('require_customer_email', 'false', 'text', 'Require email for new customers', 'loyalty', false, true, 'admin', 'admin'),
('auto_generate_sku', 'true', 'text', 'Automatically generate SKUs for new products', 'inventory', false, true, 'admin', 'admin'),
('enable_barcode_scanning', 'false', 'text', 'Enable barcode scanning support', 'pos', false, true, 'admin', 'admin'),
('mulesoft_loyalty_sync_endpoint', '', 'text', 'Protocol, hostname and port where the MuleSoft API is deployed', 'integration', false, true, 'admin', 'admin'),
('use_openai', 'false', 'boolean', 'Use the provided OpenAI API key', 'ai', false, true, 'admin', 'admin'),  
('journal_subtype_id', '', 'text', 'Journal Sub-Type', 'loyalty', false, true, 'admin', 'admin'),
('journal_type_id', '', 'text', 'Journal Type', 'loyalty', false, true, 'admin', 'admin'),
('loyalty_program_id', '', 'text', 'Loyalty Program Id', 'loyalty', false, true, 'admin', 'admin'),
('enrollment_journal_subtype_id', '', 'text', NULL, 'integration', false, true, 'admin', 'admin')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (category, setting_key, setting_value, description, setting_type, is_encrypted, is_active, created_by, updated_by)
VALUES 
('landing_page', 'landing_system_name', 'POS & Loyalty System', 'System name displayed in header next to logo', 'text', false, true, 'admin', 'admin'),
('landing_page', 'landing_title1', 'Complete Business Solution', 'Main title (first line) on landing page', 'text', false, true, 'admin', 'admin'),
('landing_page', 'landing_title2', 'POS & Loyalty Platform', 'Secondary title (second line with gradient) on landing page', 'text', false, true, 'admin', 'admin'),
('landing_page', 'landing_subtitle', 'Manage your entire business with our integrated Point of Sale and Customer Loyalty system. Streamline operations, boost sales, and reward your customers all in one place.', 'Subtitle/description text on landing page', 'text', false, true, 'admin', 'admin')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- SYSTEM SETTINGS FOR SHOP
-- =====================================================

INSERT INTO system_settings (setting_key, setting_value, category, description, is_active)
VALUES 
    ('shop_hero_enabled', 'true', 'shop', 'Show hero/banner section on shop page', true),
    ('shop_hero_title', 'Order Your Favorites', 'shop', 'Hero section title', true),
    ('shop_hero_subtitle', 'Fresh, delicious, delivered to your door', 'shop', 'Hero section subtitle', true),
    ('shop_min_order_amount', '0', 'shop', 'Minimum order amount (0 for no minimum)', true),
    ('shop_delivery_fee', '5.00', 'shop', 'Delivery fee amount', true),
    ('shop_free_delivery_threshold', '50.00', 'shop', 'Free delivery over this amount', true),
    ('shop_estimated_prep_time', '30', 'shop', 'Estimated preparation time in minutes', true)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- DEFAULT PAYMENT METHODS
-- =====================================================

INSERT INTO public.payment_methods ("name",code,description,is_active,requires_online_payment,display_order,icon) VALUES
	 ('Credit Card','credit_card','Pay online with credit or debit card',true,true,1,'/loyalty/payment-methods/credit-card.png'),
	 ('Cash on Delivery','cash','Pay with cash when order arrives',true,false,2,'/loyalty/payment-methods/cash.png'),
	 ('Pay at Pickup','pay_at_pickup','Pay when you pick up your order',true,false,3,'/loyalty/payment-methods/pay-at-pickup.png'),
	 ('Apple Pay','apple_pay','Pay with Apple Pay',true,true,4,'/loyalty/payment-methods/apple-pay.png'),
	 ('PayPal','paypal','Pay securely with PayPal',true,true,5,'/loyalty/payment-methods/paypal.png'),
	 ('Google Pay','google_pay','Pay with Google Pay',true,true,5,'/loyalty/payment-methods/google.png')
ON CONFLICT (code) DO NOTHING;

-- Insert unified roles (merged from POS and Loyalty systems)
-- Admin role has both "all": true AND granular permissions for maximum compatibility
INSERT INTO roles (name, description, permissions) VALUES 
('Admin', 'System Administrator with full access to all features', 
 '{"all": true,
   "pos": {"read": true, "write": true, "delete": true},
   "users": {"read": true, "write": true, "delete": true},
   "reports": {"read": true, "write": true},
   "settings": {"read": true, "write": true, "delete": true},
   "customers": {"read": true, "write": true, "delete": true},
   "inventory": {"read": true, "write": true, "delete": true},
   "locations": {"read": true, "write": true, "delete": true},
   "transactions": {"read": true, "write": true, "delete": true}}'),
('Manager', 'Store Manager with management access',
 '{"pos": {"read": true, "write": true},
   "users": {"read": true},
   "reports": {"read": true, "write": true},
   "settings": {"read": true},
   "customers": {"read": true, "write": true},
   "inventory": {"read": true, "write": true},
   "locations": {"read": true, "write": true},
   "transactions": {"read": true, "write": true}}'),
('Employee', 'Store Employee with POS access',
 '{"pos": {"read": true, "write": true},
   "customers": {"read": true, "write": true},
   "inventory": {"read": true},
   "transactions": {"read": true, "write": true}}'),
('Customer', 'Customer account with order history access',
 '{"orders": {"read": true, "write": true},
   "profile": {"read": true, "write": true}}'),
('cashier', 'Cashier with basic POS and customer service access', 
 '{"pos": {"read": true, "write": true}, 
   "inventory": {"read": true}, 
   "customers": {"read": true, "write": true}, 
   "transactions": {"read": true, "write": true}, 
   "reports": {"read": true}, 
   "settings": {"read": true}, 
   "users": {"read": true}, 
   "locations": {"read": true}}'),
('viewer', 'Viewer with read-only access for reporting', 
 '{"pos": {"read": true}, 
   "inventory": {"read": true}, 
   "customers": {"read": true}, 
   "transactions": {"read": true}, 
   "reports": {"read": true}, 
   "settings": {"read": true}, 
   "users": {"read": true}, 
   "locations": {"read": true}}')
ON CONFLICT (name) DO NOTHING;


-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to get next batch number
CREATE OR REPLACE FUNCTION get_next_batch_number()
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE((SELECT MAX(batch) FROM generated_products), 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get next batch number using sequence
CREATE OR REPLACE FUNCTION get_next_batch_number_seq()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('batch_number_seq');
END;
$$ LANGUAGE plpgsql;

-- Function to generate loyalty number
CREATE OR REPLACE FUNCTION generate_loyalty_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
    max_attempts INTEGER := 100;
    attempt INTEGER := 0;
BEGIN
    LOOP
        SELECT COALESCE(MAX(CAST(SUBSTRING(loyalty_number FROM 4) AS INTEGER)), 0) + 1 
        INTO counter 
        FROM customers 
        WHERE loyalty_number LIKE 'LOY%' AND LENGTH(loyalty_number) = 6;
        
        new_number := 'LOY' || LPAD(counter::TEXT, 3, '0');
        
        IF NOT EXISTS (SELECT 1 FROM customers WHERE loyalty_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique loyalty number after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate SKU
-- CREATE OR REPLACE FUNCTION generate_sku(product_brand TEXT, product_type TEXT) RETURNS TEXT AS $$
-- DECLARE
--     brand_code TEXT;
--     type_code TEXT;
--     counter INTEGER;
--     new_sku TEXT;
-- BEGIN
--     brand_code := UPPER(SUBSTRING(COALESCE(product_brand, 'GEN'), 1, 3));
--     type_code := UPPER(SUBSTRING(COALESCE(product_type, 'PRD'), 1, 3));
    
--     SELECT COALESCE(MAX(CAST(SUBSTRING(sku FROM 7) AS INTEGER)), 0) + 1
--     INTO counter
--     FROM products 
--     WHERE sku LIKE brand_code || type_code || '%'
--     AND LENGTH(sku) = 9;
    
--     new_sku := brand_code || '-' || type_code || '-' || LPAD(counter::TEXT, 3, '0');
    
--     RETURN new_sku;
-- END;
-- $$ LANGUAGE plpgsql;

-- One global sequence
DROP SEQUENCE IF EXISTS sku_global_seq;
CREATE SEQUENCE IF NOT EXISTS sku_global_seq;

CREATE OR REPLACE FUNCTION generate_sku(product_brand TEXT, product_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
    brand_code TEXT;
    type_code  TEXT;
    seq_val    bigint;
BEGIN
    brand_code := upper(substr(coalesce(product_brand, 'GEN'), 1, 3));
    type_code  := upper(substr(coalesce(product_type, 'PRD'), 1, 3));

    seq_val := nextval('sku_global_seq'); -- concurrency-safe

    RETURN format('%s-%s-%s', brand_code, type_code, lpad(seq_val::text, 5, '0'));
END;
$$;


-- Function to generate work order number
CREATE OR REPLACE FUNCTION generate_work_order_number(loc_id INTEGER) RETURNS TEXT AS $$
DECLARE
    location_code TEXT;
    counter INTEGER;
    new_number TEXT;
BEGIN
    SELECT store_code INTO location_code FROM locations WHERE id = loc_id;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM LENGTH(location_code) + 3) AS INTEGER)), 0) + 1
    INTO counter
    FROM work_orders 
    WHERE work_order_number LIKE location_code || '-WO%';
    
    new_number := location_code || '-WO-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate customer tier
CREATE OR REPLACE FUNCTION calculate_customer_tier(
    p_total_spent DECIMAL,
    p_visit_count INTEGER,
    p_points INTEGER
) RETURNS VARCHAR(20) AS $$
DECLARE
    tier_result VARCHAR(20) := 'Bronze';
BEGIN
    IF p_total_spent >= 2000.00 AND p_visit_count >= 30 AND p_points >= 1500 THEN
        tier_result := 'Platinum';
    ELSIF p_total_spent >= 750.00 AND p_visit_count >= 15 AND p_points >= 500 THEN
        tier_result := 'Gold';
    ELSIF p_total_spent >= 250.00 AND p_visit_count >= 5 AND p_points >= 100 THEN
        tier_result := 'Silver';
    ELSE
        tier_result := 'Bronze';
    END IF;
    
    RETURN tier_result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate tier number
CREATE OR REPLACE FUNCTION calculate_tier_number(
    p_total_spent DECIMAL,
    p_visit_count INTEGER,
    p_points INTEGER,
    p_tier VARCHAR(20)
) RETURNS DECIMAL AS $$
DECLARE
    base_score DECIMAL := 0.00;
    tier_multiplier DECIMAL := 1.00;
BEGIN
    SELECT calculation_multiplier INTO tier_multiplier
    FROM customer_tier_rules
    WHERE tier_name = p_tier;
    
    base_score := (p_total_spent * 0.5) + (p_visit_count * 10) + (p_points * 0.1);
    
    RETURN ROUND(base_score * tier_multiplier, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to log customer activity
CREATE OR REPLACE FUNCTION log_customer_activity(
    p_customer_id INTEGER,
    p_activity_type VARCHAR(50),
    p_description TEXT DEFAULT NULL,
    p_points_change INTEGER DEFAULT 0,
    p_transaction_id INTEGER DEFAULT NULL,
    p_created_by VARCHAR(255) DEFAULT 'system'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO customer_activity_log 
    (customer_id, activity_type, description, points_change, transaction_id, created_by)
    VALUES 
    (p_customer_id, p_activity_type, p_description, p_points_change, p_transaction_id, p_created_by);
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate all customer tiers
CREATE OR REPLACE FUNCTION recalculate_all_customer_tiers() RETURNS INTEGER AS $$
DECLARE
    customer_record RECORD;
    updated_count INTEGER := 0;
    new_tier VARCHAR(20);
    new_calculation_number DECIMAL;
BEGIN
    FOR customer_record IN 
        SELECT id, total_spent, visit_count, points 
        FROM customers 
        WHERE member_status = 'Active'
    LOOP
        new_tier := calculate_customer_tier(
            customer_record.total_spent, 
            customer_record.visit_count, 
            customer_record.points
        );
        
        new_calculation_number := calculate_tier_number(
            customer_record.total_spent, 
            customer_record.visit_count, 
            customer_record.points,
            new_tier
        );
        
        UPDATE customers 
        SET 
            customer_tier = new_tier,
            tier_calculation_number = new_calculation_number,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = customer_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- System settings functions
CREATE OR REPLACE FUNCTION get_system_setting(p_key VARCHAR(100)) 
RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
BEGIN
    SELECT setting_value INTO v_value
    FROM system_settings
    WHERE setting_key = p_key
    AND is_active = true
    LIMIT 1;
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_system_setting_or_default(
    p_key VARCHAR(100),
    p_default TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
BEGIN
    v_value := get_system_setting(p_key);
    
    IF v_value IS NULL THEN
        RETURN p_default;
    END IF;
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_system_setting(
    p_key VARCHAR(100),
    p_value TEXT,
    p_description TEXT DEFAULT NULL,
    p_category VARCHAR(50) DEFAULT 'general',
    p_user VARCHAR(100) DEFAULT 'system'
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO system_settings (setting_key, setting_value, description, category, created_by, updated_by)
    VALUES (p_key, p_value, p_description, p_category, p_user, p_user)
    ON CONFLICT (setting_key) 
    DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        description = COALESCE(EXCLUDED.description, system_settings.description),
        category = EXCLUDED.category,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- User management functions
CREATE OR REPLACE FUNCTION hash_password(password TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN 'hashed_' || encode(sha256(password::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT) RETURNS BOOLEAN AS $$
BEGIN
    RETURN hash = 'hashed_' || encode(sha256(password::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_session_token() RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id INTEGER,
    p_activity_type VARCHAR(50),
    p_description TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activity_log 
    (user_id, activity_type, description, ip_address, user_agent, metadata)
    VALUES 
    (p_user_id, p_activity_type, p_description, p_ip_address, p_user_agent, p_metadata);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id INTEGER,
    p_module VARCHAR(50),
    p_action VARCHAR(20)
) RETURNS BOOLEAN AS $$
DECLARE
    user_perms JSONB;
BEGIN
    SELECT permissions INTO user_perms
    FROM user_permissions
    WHERE user_id = p_user_id;
    
    IF user_perms IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN COALESCE(user_perms->p_module->>p_action, 'false')::BOOLEAN;
END;
$$ LANGUAGE plpgsql;
-- =============================================================================
-- TRIGGERS
-- =============================================================================
/*
-- Trigger to update customer tier and stats
CREATE OR REPLACE FUNCTION update_customer_tier_and_stats() RETURNS TRIGGER AS $$
DECLARE
    new_tier VARCHAR(20);
    new_calculation_number DECIMAL;
BEGIN
    -- Update customer statistics
    UPDATE customers 
    SET 
        points = points + NEW.points_earned - COALESCE(NEW.points_redeemed, 0),
        total_spent = total_spent + NEW.total,
        visit_count = visit_count + 1,
        last_visit = NEW.created_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.customer_id;
    
    -- Get updated customer data for tier calculation
    SELECT 
        calculate_customer_tier(total_spent + NEW.total, visit_count + 1, points + NEW.points_earned - COALESCE(NEW.points_redeemed, 0)),
        calculate_tier_number(total_spent + NEW.total, visit_count + 1, points + NEW.points_earned - COALESCE(NEW.points_redeemed, 0), 
                             calculate_customer_tier(total_spent + NEW.total, visit_count + 1, points + NEW.points_earned - COALESCE(NEW.points_redeemed, 0)))
    INTO new_tier, new_calculation_number
    FROM customers 
    WHERE id = NEW.customer_id;
    
    -- Update tier and calculation number
    UPDATE customers 
    SET 
        customer_tier = new_tier,
        tier_calculation_number = new_calculation_number
    WHERE id = NEW.customer_id;
    
    -- Log the purchase activity
    PERFORM log_customer_activity(
        NEW.customer_id,
        'purchase',
        'Purchase transaction #' || NEW.id || ' - Tier: ' || new_tier,
        NEW.points_earned - COALESCE(NEW.points_redeemed, 0),
        NEW.id,
        'pos_system'
    );
    
    -- Log tier change if applicable
    IF EXISTS (
        SELECT 1 FROM customers 
        WHERE id = NEW.customer_id 
        AND customer_tier != new_tier
    ) THEN
        PERFORM log_customer_activity(
            NEW.customer_id,
            'tier_change',
            'Customer tier updated to ' || new_tier,
            0,
            NEW.id,
            'auto_calculation'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_tier_and_stats
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_tier_and_stats();
*/
-- Trigger to auto-generate work order numbers
CREATE OR REPLACE FUNCTION set_work_order_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.work_order_number IS NULL OR NEW.work_order_number = '' THEN
        NEW.work_order_number := generate_work_order_number(NEW.location_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_work_order_number ON work_orders;
CREATE TRIGGER trigger_set_work_order_number
    BEFORE INSERT ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_work_order_number();

-- Trigger to update location inventory after transactions
CREATE OR REPLACE FUNCTION update_location_inventory() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO location_inventory (location_id, product_id, quantity)
    SELECT 
        NEW.location_id,
        ti.product_id,
        -ti.quantity
    FROM transaction_items ti
    WHERE ti.transaction_id = NEW.id
    ON CONFLICT (location_id, product_id)
    DO UPDATE SET 
        quantity = location_inventory.quantity - EXCLUDED.quantity,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_location_inventory ON transactions;
CREATE TRIGGER trigger_update_location_inventory
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_location_inventory();

-- Trigger to log work order status changes
CREATE OR REPLACE FUNCTION log_work_order_status_change() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO work_order_status_history 
        (work_order_id, old_status, new_status, changed_by, change_reason)
        VALUES 
        (NEW.id, OLD.status, NEW.status, 'System', 'Status updated');
    END IF;
    
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_work_order_status_change ON work_orders;
CREATE TRIGGER trigger_log_work_order_status_change
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION log_work_order_status_change();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Location inventory view
CREATE OR REPLACE VIEW location_inventory_view AS
SELECT 
    li.*,
    p.name as product_name,
    p.sku,
    p.price,
    p.category,
    l.store_name,
    l.store_code,
    (li.quantity <= li.reorder_level) as needs_reorder
FROM location_inventory li
JOIN products p ON li.product_id = p.id
JOIN locations l ON li.location_id = l.id
WHERE l.is_active = true;

-- Work orders summary view
CREATE OR REPLACE VIEW work_orders_summary AS
SELECT 
    wo.*,
    c.name as customer_name,
    c.loyalty_number,
    c.email as customer_email,
    l.store_name,
    l.store_code,
    COUNT(wop.id) as product_count
FROM work_orders wo
JOIN customers c ON wo.customer_id = c.id
JOIN locations l ON wo.location_id = l.id
LEFT JOIN work_order_products wop ON wo.id = wop.work_order_id
GROUP BY wo.id, c.name, c.loyalty_number, c.email, l.store_name, l.store_code;

-- Enhanced customer dashboard view
CREATE OR REPLACE VIEW enhanced_customer_dashboard AS
SELECT 
    c.id,
    c.loyalty_number,
    c.name,
    c.email,
    c.phone,
    c.points,
    c.total_spent,
    c.visit_count,
    c.last_visit,
    c.created_at,
    c.member_status,
    c.enrollment_date,
    c.member_type,
    c.customer_tier,
    c.tier_calculation_number,
    c.notes,
    
    (CURRENT_DATE - c.enrollment_date::DATE) as days_since_enrollment,
    
    CASE 
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.enrollment_date::DATE)) >= 1 THEN
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.enrollment_date::DATE))::TEXT || ' years'
        ELSE
            EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.enrollment_date::DATE))::TEXT || ' months'
    END as member_duration,
    
    CASE 
        WHEN c.member_status != 'Active' THEN c.member_status
        WHEN c.last_visit >= CURRENT_DATE - INTERVAL '30 days' THEN 'Recently Active'
        WHEN c.last_visit >= CURRENT_DATE - INTERVAL '90 days' THEN 'Moderately Active'
        WHEN c.last_visit IS NULL THEN 'Never Purchased'
        ELSE 'Dormant'
    END as activity_status,
    
    CASE 
        WHEN c.last_visit IS NOT NULL 
        THEN (CURRENT_DATE - c.last_visit::DATE)
        ELSE NULL 
    END as days_since_last_visit,
    
    CASE 
        WHEN c.visit_count > 0 
        THEN ROUND(c.total_spent / c.visit_count, 2)
        ELSE 0 
    END as avg_transaction_value,
    
    ctr.benefits as tier_benefits,
    ctr.calculation_multiplier as tier_multiplier,
    
    (
        SELECT tier_name 
        FROM customer_tier_rules 
        WHERE min_spending > c.total_spent 
        ORDER BY min_spending ASC 
        LIMIT 1
    ) as next_tier,
    
    (
        SELECT min_spending - c.total_spent 
        FROM customer_tier_rules 
        WHERE min_spending > c.total_spent 
        ORDER BY min_spending ASC 
        LIMIT 1
    ) as amount_to_next_tier

FROM customers c
LEFT JOIN customer_tier_rules ctr ON c.customer_tier = ctr.tier_name
ORDER BY c.tier_calculation_number DESC, c.total_spent DESC;

-- User permissions view
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
    u.id as user_id,
    u.email as username,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    r.permissions,
    u.is_active as user_active,
    r.is_active as role_active
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.is_active = true AND r.is_active = true;


-- Create or replace function to merge first_name and last_name into name
CREATE OR REPLACE FUNCTION merge_customer_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Merge first_name and last_name into name field
    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        NEW.name = TRIM(NEW.first_name || ' ' || NEW.last_name);
    ELSIF NEW.first_name IS NOT NULL THEN
        NEW.name = TRIM(NEW.first_name);
    ELSIF NEW.last_name IS NOT NULL THEN
        NEW.name = TRIM(NEW.last_name);
    END IF;
    
    -- Ensure name is not empty
    IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
        NEW.name = 'Unknown Customer';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically merge names
DROP TRIGGER IF EXISTS trigger_merge_customer_names ON customers;
CREATE TRIGGER trigger_merge_customer_names
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION merge_customer_names();

-- Update existing records to merge their names
UPDATE customers 
SET name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE first_name IS NOT NULL OR last_name IS NOT NULL;

-- Clean up any empty names
UPDATE customers 
SET name = 'Unknown Customer'
WHERE name IS NULL OR TRIM(name) = '';

-- Add comment to the country column
COMMENT ON COLUMN customers.country IS 'Country of residence for the customer';

-- Customer Images Table
-- Stores customer profile pictures/avatars

CREATE TABLE IF NOT EXISTS customer_images (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    image_data TEXT NOT NULL, -- Base64 encoded image
    file_size INTEGER, -- Size in bytes
    width INTEGER, -- Image width in pixels
    height INTEGER, -- Image height in pixels
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status varchar DEFAULT 'Created' NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_images_customer_id ON customer_images(customer_id);

-- Add comment
COMMENT ON TABLE customer_images IS 'Stores customer profile pictures and avatars';
COMMENT ON COLUMN customer_images.image_data IS 'Base64 encoded image data';
COMMENT ON COLUMN customer_images.filename IS 'Original filename of the uploaded image';
COMMENT ON COLUMN customer_images.file_size IS 'Size of the image data in bytes';
COMMENT ON COLUMN customer_images.width IS 'Image width in pixels';
COMMENT ON COLUMN customer_images.height IS 'Image height in pixels';



-- Voucher System Implementation
-- Database schema for customer vouchers

-- 1. Create customer_vouchers table
CREATE TABLE IF NOT EXISTS customer_vouchers (
    id SERIAL PRIMARY KEY,
    sf_id VARCHAR(100) UNIQUE, -- Salesforce ID
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    voucher_code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Issued' CHECK (status IN ('Issued', 'Redeemed', 'Expired', 'Cancelled', 'Reserved')),
    
    voucher_type VARCHAR(50) NOT NULL CHECK (voucher_type IN ('Value', 'Discount', 'ProductSpecific')),
    face_value DECIMAL(10,2), -- Original value for value vouchers
    discount_percent DECIMAL(5,2), -- Percentage discount (0-100)
    product_id INTEGER REFERENCES products(id), -- For product-specific vouchers
    
    -- Value tracking for value vouchers
    remaining_value DECIMAL(10,2), -- Remaining balance for value vouchers
    redeemed_value DECIMAL(10,2) DEFAULT 0, -- Amount already redeemed
    reserved_value DECIMAL(10,2) DEFAULT 0, -- Amount reserved in current transaction
    
    -- Dates
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date DATE,
    use_date TIMESTAMP, -- When voucher was last used
    
    -- Metadata
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user INTEGER
);

-- 2. Add voucher_id to transaction_items table
ALTER TABLE transaction_items 
ADD COLUMN IF NOT EXISTS voucher_id INTEGER REFERENCES customer_vouchers(id);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_customer_id ON customer_vouchers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_status ON customer_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_expiration ON customer_vouchers(expiration_date);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_type ON customer_vouchers(voucher_type);
CREATE INDEX IF NOT EXISTS idx_transaction_items_voucher_id ON transaction_items(voucher_id);

-- 4. Create function to check voucher validity
CREATE OR REPLACE FUNCTION is_voucher_valid(voucher_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    voucher_record RECORD;
BEGIN
    SELECT * INTO voucher_record 
    FROM customer_vouchers 
    WHERE id = voucher_id;
    
    -- Check if voucher exists and is active
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if voucher is issued and not expired
    IF voucher_record.status != 'Issued' THEN
        RETURN FALSE;
    END IF;
    
    -- Check expiration date
    IF voucher_record.expiration_date IS NOT NULL AND voucher_record.expiration_date < CURRENT_DATE THEN
        RETURN FALSE;
    END IF;
    
    -- Check if voucher is active
    IF NOT voucher_record.is_active THEN
        RETURN FALSE;
    END IF;
    
    -- For value vouchers, check if there's remaining value
    IF voucher_record.voucher_type = 'Value' AND voucher_record.remaining_value <= 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to calculate voucher discount
CREATE OR REPLACE FUNCTION calculate_voucher_discount(
    voucher_id INTEGER,
    item_price DECIMAL(10,2),
    product_id INTEGER DEFAULT NULL
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    voucher_record RECORD;
    discount_amount DECIMAL(10,2) := 0;
BEGIN
    -- Get voucher details
    SELECT * INTO voucher_record 
    FROM customer_vouchers 
    WHERE id = voucher_id;
    
    -- Check if voucher is valid
    IF NOT is_voucher_valid(voucher_id) THEN
        RETURN 0;
    END IF;
    
    -- Calculate discount based on voucher type
    CASE voucher_record.voucher_type
        WHEN 'Value' THEN
            -- For value vouchers, discount is the minimum of item price or remaining value
            discount_amount := LEAST(item_price, voucher_record.remaining_value);
            
        WHEN 'Discount' THEN
            -- For percentage discount
            discount_amount := item_price * (voucher_record.discount_percent / 100);
            
        WHEN 'ProductSpecific' THEN
            -- Only apply if product matches
            IF product_id IS NOT NULL AND voucher_record.product_id = product_id THEN
                IF voucher_record.discount_percent IS NOT NULL THEN
                    discount_amount := item_price * (voucher_record.discount_percent / 100);
                ELSIF voucher_record.face_value IS NOT NULL THEN
                    discount_amount := LEAST(item_price, voucher_record.face_value);
                END IF;
            END IF;
            
        ELSE
            discount_amount := 0;
    END CASE;
    
    RETURN discount_amount;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to update voucher when used
CREATE OR REPLACE FUNCTION update_voucher_on_use()
RETURNS TRIGGER AS $$
DECLARE
    voucher_record RECORD;
BEGIN
    -- If voucher_id is set, update the voucher
    IF NEW.voucher_id IS NOT NULL THEN
        SELECT * INTO voucher_record 
        FROM customer_vouchers 
        WHERE id = NEW.voucher_id;
        
        -- Update voucher based on type
        IF voucher_record.voucher_type = 'Value' THEN
            -- For value vouchers, reduce remaining value
            UPDATE customer_vouchers 
            SET 
                remaining_value = remaining_value - NEW.discount_amount,
                redeemed_value = redeemed_value + NEW.discount_amount,
                use_date = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.voucher_id;
            
            -- If remaining value is 0, mark as redeemed
            IF (voucher_record.remaining_value - NEW.discount_amount) <= 0 THEN
                UPDATE customer_vouchers 
                SET status = 'Redeemed'
                WHERE id = NEW.voucher_id;
            END IF;
            
        ELSE
            -- For other voucher types, mark as redeemed
            UPDATE customer_vouchers 
            SET 
                status = 'Redeemed',
                use_date = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.voucher_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_voucher_on_use ON transaction_items;
CREATE TRIGGER trigger_update_voucher_on_use
    AFTER INSERT ON transaction_items
    FOR EACH ROW
    EXECUTE FUNCTION update_voucher_on_use();

-- 7. Create view for active vouchers
CREATE OR REPLACE VIEW active_customer_vouchers AS
SELECT 
    cv.*,
    c.name as customer_name,
    c.loyalty_number,
    p.name as product_name
FROM customer_vouchers cv
JOIN customers c ON cv.customer_id = c.id
LEFT JOIN products p ON cv.product_id = p.id
WHERE cv.status = 'Issued' 
    AND cv.is_active = true
    AND (cv.expiration_date IS NULL OR cv.expiration_date >= CURRENT_DATE)
    AND (cv.voucher_type != 'Value' OR cv.remaining_value > 0);

-- Transaction Vouchers Implementation
-- This script creates the transaction_vouchers table and updates the voucher system
-- to properly track voucher usage in transactions

-- Create transaction_vouchers table
CREATE TABLE IF NOT EXISTS transaction_vouchers (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    voucher_id INTEGER NOT NULL REFERENCES customer_vouchers(id) ON DELETE CASCADE,
    applied_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_vouchers_transaction_id ON transaction_vouchers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_vouchers_voucher_id ON transaction_vouchers(voucher_id);

-- Update customer_vouchers table to add redeemed_value and use_date columns if they don't exist
DO $$ 
BEGIN
    -- Add redeemed_value column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_vouchers' AND column_name = 'redeemed_value') THEN
        ALTER TABLE customer_vouchers ADD COLUMN redeemed_value DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- Add use_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_vouchers' AND column_name = 'use_date') THEN
        ALTER TABLE customer_vouchers ADD COLUMN use_date TIMESTAMP;
    END IF;
END $$;

-- Create function to update voucher status when redeemed
CREATE OR REPLACE FUNCTION update_voucher_on_redemption()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the voucher status to 'Redeemed' and set use_date
    UPDATE customer_vouchers 
    SET 
        status = 'Redeemed',
        redeemed_value = redeemed_value + NEW.applied_amount,
        remaining_value = GREATEST(0, remaining_value - NEW.applied_amount),
        use_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.voucher_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update voucher status when transaction_vouchers is inserted
DROP TRIGGER IF EXISTS trigger_update_voucher_on_redemption ON transaction_vouchers;
CREATE TRIGGER trigger_update_voucher_on_redemption
    AFTER INSERT ON transaction_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_voucher_on_redemption();

-- Create function to calculate voucher discount amount
CREATE OR REPLACE FUNCTION calculate_voucher_discount_amount(
    p_voucher_id INTEGER,
    p_item_subtotal DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_voucher customer_vouchers%ROWTYPE;
    v_discount_amount DECIMAL(10,2) := 0.00;
BEGIN
    -- Get voucher details
    SELECT * INTO v_voucher FROM customer_vouchers WHERE id = p_voucher_id;
    
    IF NOT FOUND THEN
        RETURN 0.00;
    END IF;
    
    -- Calculate discount based on voucher type
    CASE v_voucher.voucher_type
        WHEN 'Value' THEN
            -- For value vouchers, use the applied amount
            v_discount_amount := LEAST(p_item_subtotal, v_voucher.remaining_value);
        WHEN 'Discount' THEN
            -- For discount vouchers, calculate percentage
            v_discount_amount := p_item_subtotal * (v_voucher.discount_percent / 100);
        WHEN 'ProductSpecific' THEN
            -- For product-specific vouchers
            IF v_voucher.discount_percent IS NOT NULL THEN
                v_discount_amount := p_item_subtotal * (v_voucher.discount_percent / 100);
            ELSIF v_voucher.face_value IS NOT NULL THEN
                v_discount_amount := LEAST(p_item_subtotal, v_voucher.face_value);
            END IF;
    END CASE;
    
    RETURN v_discount_amount;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate voucher eligibility
CREATE OR REPLACE FUNCTION is_voucher_eligible_for_transaction(
    p_voucher_id INTEGER,
    p_customer_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_voucher customer_vouchers%ROWTYPE;
BEGIN
    -- Get voucher details
    SELECT * INTO v_voucher FROM customer_vouchers WHERE id = p_voucher_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if voucher belongs to customer
    IF v_voucher.customer_id != p_customer_id THEN
        RETURN FALSE;
    END IF;
    
    -- Check if voucher is active and not expired
    IF v_voucher.status != 'Issued' OR NOT v_voucher.is_active THEN
        RETURN FALSE;
    END IF;
    
    -- Check expiration date
    IF v_voucher.expiration_date IS NOT NULL AND v_voucher.expiration_date < CURRENT_TIMESTAMP THEN
        RETURN FALSE;
    END IF;
    
    -- Check if voucher has remaining value (only for Value vouchers)
    IF v_voucher.voucher_type = 'Value' AND v_voucher.remaining_value IS NOT NULL AND v_voucher.remaining_value <= 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE transaction_vouchers IS 'Tracks which vouchers were applied to which transactions';
COMMENT ON COLUMN transaction_vouchers.applied_amount IS 'The amount of the voucher that was applied (for value vouchers)';
COMMENT ON COLUMN transaction_vouchers.discount_amount IS 'The actual discount amount calculated and applied';
COMMENT ON FUNCTION update_voucher_on_redemption() IS 'Updates voucher status when it is redeemed in a transaction';
COMMENT ON FUNCTION calculate_voucher_discount_amount(INTEGER, DECIMAL) IS 'Calculates the discount amount for a voucher based on item subtotal';
COMMENT ON FUNCTION is_voucher_eligible_for_transaction(INTEGER, INTEGER) IS 'Validates if a voucher is eligible for use in a transaction';

-- Product Voucher Trigger
-- Automatically sets discount_percent = 100 for ProductSpecific vouchers with null discount_percent

-- Create trigger function
CREATE OR REPLACE FUNCTION set_product_voucher_discount()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if voucher_type is 'ProductSpecific' and discount_percent is null
    IF NEW.voucher_type = 'ProductSpecific' AND NEW.discount_percent IS NULL THEN
        NEW.discount_percent = 100;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on customer_vouchers table
DROP TRIGGER IF EXISTS trigger_set_product_voucher_discount ON customer_vouchers;
CREATE TRIGGER trigger_set_product_voucher_discount
    BEFORE INSERT ON customer_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION set_product_voucher_discount();

-- =============================================================================
-- SAMPLE DATA
-- =============================================================================

-- Insert sample locations
-- INSERT INTO locations (store_code, store_name, brand, address_line1, city, state, zip_code, tax_rate, manager_name) VALUES
-- ('NYC001', 'Manhattan Flagship', 'TUMI', '350 Madison Avenue', 'New York', 'NY', '10017', 0.08875, 'John Manager'),
-- ('LAX001', 'Beverly Hills Store', 'TUMI', '9570 Wilshire Boulevard', 'Beverly Hills', 'CA', '90212', 0.1025, 'Jane Store Manager'),
-- ('CHI001', 'Michigan Avenue', 'TUMI', '900 N Michigan Avenue', 'Chicago', 'IL', '60611', 0.1025, 'Mike Regional Manager')
-- ON CONFLICT (store_code) DO NOTHING;

-- Insert default user settings
INSERT INTO user_settings (user_identifier, theme_mode) VALUES ('default_user', 'light')
ON CONFLICT (user_identifier) DO NOTHING;

-- Insert default tier rules
INSERT INTO customer_tier_rules (tier_name, min_spending, min_visits, min_points, calculation_multiplier, benefits) VALUES
('Bronze', 0.00, 0, 0, 1.00, 'Basic loyalty benefits, 1x points earning'),
('Silver', 250.00, 5, 100, 1.25, 'Enhanced benefits, 1.25x points earning, priority support'),
('Gold', 750.00, 15, 500, 1.50, 'Premium benefits, 1.5x points earning, exclusive offers'),
('Platinum', 2000.00, 30, 1500, 2.00, 'VIP benefits, 2x points earning, personal concierge service')
ON CONFLICT (tier_name) DO UPDATE SET
    min_spending = EXCLUDED.min_spending,
    min_visits = EXCLUDED.min_visits,
    min_points = EXCLUDED.min_points,
    calculation_multiplier = EXCLUDED.calculation_multiplier,
    benefits = EXCLUDED.benefits,
    updated_at = CURRENT_TIMESTAMP;

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_encrypted, is_active, created_by, updated_by) VALUES
('company_name', 'FAKE Store', 'text', 'Company name displayed on receipts and reports', 'general', false, true, 'admin', 'admin'),
('currency_symbol', '$', 'text', 'Currency symbol for displaying prices', 'general', false, true, 'admin', 'admin'),
('currency_code', 'USD', 'text', 'ISO currency code', 'general', false, true, 'admin', 'admin'),
('date_format', 'MM/DD/YYYY', 'text', 'Date format for display', 'general', false, true, 'admin', 'admin'),
('time_format', '12h', 'text', 'Time format (12h or 24h)', 'general', false, true, 'admin', 'admin'),
('tax_inclusive', 'false', 'text', 'Whether prices include tax', 'pos', false, true, 'admin', 'admin'),
('default_tax_rate', '0.08', 'text', 'Default tax rate for new locations', 'pos', false, true, 'admin', 'admin'),
('points_per_dollar', '1', 'text', 'Loyalty points earned per dollar spent', 'loyalty', false, true, 'admin', 'admin'),
('points_redemption_rate', '100', 'text', 'Points needed for $1 discount', 'loyalty', false, true, 'admin', 'admin'),
('low_stock_threshold', '5', 'text', 'Stock level to trigger low stock warning', 'inventory', false, true, 'admin', 'admin'),
('receipt_footer_text', 'Thank you for your business!', 'text', 'Text shown at bottom of receipts', 'pos', false, true, 'admin', 'admin'),
('enable_work_orders', 'true', 'text', 'Enable work order management system', 'general', false, true, 'admin', 'admin'),
('enable_multi_location', 'true', 'text', 'Enable multi-location support', 'general', false, true, 'admin', 'admin'),
('session_timeout_minutes', '30', 'text', 'Session timeout in minutes', 'general', false, true, 'admin', 'admin'),
('max_discount_percentage', '50', 'text', 'Maximum discount percentage allowed', 'pos', false, true, 'admin', 'admin'),
('require_customer_email', 'false', 'text', 'Require email for new customers', 'loyalty', false, true, 'admin', 'admin'),
('auto_generate_sku', 'true', 'text', 'Automatically generate SKUs for new products', 'inventory', false, true, 'admin', 'admin'),
('enable_barcode_scanning', 'false', 'text', 'Enable barcode scanning support', 'pos', false, true, 'admin', 'admin'),
('sf_api_key', 'asdlfjherlkgncvs4xxz', 'text', NULL, 'integration', false, true, 'admin', 'admin'),
('mulesoft_loyalty_sync_endpoint', '', 'text', 'Protocol, hostname and port where the MuleSoft API is deployed', 'integration', false, true, 'admin', 'admin'),
('journal_subtype_id', '', 'text', 'Journal Sub-Type', 'loyalty', false, true, 'admin', 'admin'),
('journal_type_id', '', 'text', 'Journal Type', 'loyalty', false, true, 'admin', 'admin'),
('loyalty_program_id', '', 'text', 'Loyalty Program Id', 'loyalty', false, true, 'admin', 'admin'),
('enrollment_journal_subtype_id', '', 'text', NULL, 'integration', false, true, 'admin', 'admin')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (category, setting_key, setting_value, description, setting_type, is_encrypted, is_active, created_by, updated_by)
VALUES 
('landing_page', 'landing_system_name', 'POS & Loyalty System', 'System name displayed in header next to logo', 'text', false, true, 'admin', 'admin'),
('landing_page', 'landing_title1', 'Complete Business Solution', 'Main title (first line) on landing page', 'text', false, true, 'admin', 'admin'),
('landing_page', 'landing_title2', 'POS & Loyalty Platform', 'Secondary title (second line with gradient) on landing page', 'text', false, true, 'admin', 'admin'),
('landing_page', 'landing_subtitle', 'Manage your entire business with our integrated Point of Sale and Customer Loyalty system. Streamline operations, boost sales, and reward your customers all in one place.', 'Subtitle/description text on landing page', 'text', false, true, 'admin', 'admin')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Full system access with all permissions', 
 '{"pos": {"read": true, "write": true, "delete": true}, 
   "inventory": {"read": true, "write": true, "delete": true}, 
   "customers": {"read": true, "write": true, "delete": true}, 
   "transactions": {"read": true, "write": true, "delete": true}, 
   "reports": {"read": true, "write": true}, 
   "settings": {"read": true, "write": true, "delete": true}, 
   "users": {"read": true, "write": true, "delete": true}, 
   "locations": {"read": true, "write": true, "delete": true}}'),
('manager', 'Store management with limited admin access', 
 '{"pos": {"read": true, "write": true}, 
   "inventory": {"read": true, "write": true}, 
   "customers": {"read": true, "write": true}, 
   "transactions": {"read": true, "write": true}, 
   "reports": {"read": true, "write": true}, 
   "settings": {"read": true}, 
   "users": {"read": true}, 
   "locations": {"read": true, "write": true}}'),
('cashier', 'Basic POS operations and customer service', 
 '{"pos": {"read": true, "write": true}, 
   "inventory": {"read": true}, 
   "customers": {"read": true, "write": true}, 
   "transactions": {"read": true, "write": true}, 
   "reports": {"read": true}, 
   "settings": {"read": true}, 
   "users": {"read": true}, 
   "locations": {"read": true}}'),
('viewer', 'Read-only access for reporting and monitoring', 
 '{"pos": {"read": true}, 
   "inventory": {"read": true}, 
   "customers": {"read": true}, 
   "transactions": {"read": true}, 
   "reports": {"read": true}, 
   "settings": {"read": true}, 
   "users": {"read": true}, 
   "locations": {"read": true}}')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (password: P@$$word1)
-- INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, is_active) 
-- SELECT 
--     'admin',
--     'admin@pos.com',
--     hash_password('P@$$word1'),
--     'System',
--     'Administrator',
--     r.id,
--     true
-- FROM roles r 
-- WHERE r.name = 'admin'
-- ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- DATA LOADER TABLES (for CSV import feature)
-- =============================================================================

-- Create data_loader_jobs table for tracking import jobs
CREATE TABLE IF NOT EXISTS data_loader_jobs (
    id SERIAL PRIMARY KEY,
    job_id UUID DEFAULT gen_random_uuid() UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('products', 'customers')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'processing', 'completed', 'failed')),
    file_name VARCHAR(255),
    total_rows INTEGER,
    processed_rows INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    field_mapping JSONB,
    constant_values JSONB DEFAULT '{}'::jsonb, -- Constants to apply to all rows (e.g., brand, collection)
    features_config JSONB DEFAULT '{}'::jsonb, -- Feature flags for import (e.g., useAI, skipDuplicates)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create data_loader_rows table for storing CSV data
CREATE TABLE IF NOT EXISTS data_loader_rows (
    id SERIAL PRIMARY KEY,
    job_id UUID REFERENCES data_loader_jobs(job_id) ON DELETE CASCADE,
    row_number INTEGER,
    raw_data JSONB, -- Original CSV row data
    mapped_data JSONB, -- Mapped data after field mapping
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create data_loader_errors table for error logging
CREATE TABLE IF NOT EXISTS data_loader_errors (
    id SERIAL PRIMARY KEY,
    job_id UUID REFERENCES data_loader_jobs(job_id) ON DELETE CASCADE,
    row_id INTEGER REFERENCES data_loader_rows(id) ON DELETE CASCADE,
    error_type VARCHAR(50), -- 'validation', 'import', 'mapping'
    error_message TEXT,
    field_name VARCHAR(100),
    field_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_loader_jobs_job_id ON data_loader_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_data_loader_jobs_status ON data_loader_jobs(status);
CREATE INDEX IF NOT EXISTS idx_data_loader_jobs_type ON data_loader_jobs(type);
CREATE INDEX IF NOT EXISTS idx_data_loader_jobs_created_at ON data_loader_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_data_loader_rows_job_id ON data_loader_rows(job_id);
CREATE INDEX IF NOT EXISTS idx_data_loader_rows_status ON data_loader_rows(status);
CREATE INDEX IF NOT EXISTS idx_data_loader_rows_row_number ON data_loader_rows(job_id, row_number);

CREATE INDEX IF NOT EXISTS idx_data_loader_errors_job_id ON data_loader_errors(job_id);
CREATE INDEX IF NOT EXISTS idx_data_loader_errors_row_id ON data_loader_errors(row_id);
CREATE INDEX IF NOT EXISTS idx_data_loader_errors_type ON data_loader_errors(error_type);

-- Add comments for documentation
COMMENT ON TABLE data_loader_jobs IS 'Tracks CSV import jobs and their status';
COMMENT ON TABLE data_loader_rows IS 'Stores individual CSV rows for processing';
COMMENT ON TABLE data_loader_errors IS 'Logs errors encountered during import process';

COMMENT ON COLUMN data_loader_jobs.job_id IS 'Unique identifier for the import job';
COMMENT ON COLUMN data_loader_jobs.type IS 'Type of data being imported (products or customers)';
COMMENT ON COLUMN data_loader_jobs.status IS 'Current status of the import job';
COMMENT ON COLUMN data_loader_jobs.field_mapping IS 'JSON mapping of CSV fields to database fields';
COMMENT ON COLUMN data_loader_jobs.constant_values IS 'JSON object with constant values to apply to all rows (e.g., brand, collection)';
COMMENT ON COLUMN data_loader_jobs.features_config IS 'JSON object with feature flags for import (e.g., useAI, skipDuplicates)';

COMMENT ON COLUMN data_loader_rows.raw_data IS 'Original CSV row data as JSON';
COMMENT ON COLUMN data_loader_rows.mapped_data IS 'Transformed data after field mapping';
COMMENT ON COLUMN data_loader_rows.status IS 'Processing status of individual row';

COMMENT ON COLUMN data_loader_errors.error_type IS 'Type of error (validation, import, mapping)';
COMMENT ON COLUMN data_loader_errors.field_name IS 'Name of field that caused the error';
COMMENT ON COLUMN data_loader_errors.field_value IS 'Value that caused the error';

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- FIRST-TIME SETUP
-- =============================================================================
-- NO default admin user is created automatically
-- On first launch, the application will detect no users exist and show a
-- setup wizard where you can create your admin account with custom credentials
-- 
-- The setup wizard will create both:
-- 1. A user account in the 'users' table with admin role
-- 2. A customer record in the 'customers' table linked to the user
-- 
-- This ensures secure deployment without hardcoded credentials
-- =============================================================================


-- =============================================================================
-- SCHEMA CREATION COMPLETE
-- =============================================================================
-- Database schema is now ready
-- To load sample data, run: load_sample_data.sql
-- =============================================================================

-- =====================================================
-- LOYALTY TIERS DATA
-- =====================================================
-- Insert loyalty tier data (Bronze, Silver, Elite)
-- Based on customer_tier_rules structure with enhanced JSONB benefits
INSERT INTO loyalty_tiers (tier_name, tier_level, min_spending, min_visits, min_points, points_multiplier, benefits, tier_color, tier_icon, is_active) VALUES
('Bronze', 1, 0.00, 0, 0, 1.00, 
 '{"description": "Basic loyalty benefits, 1x points earning", "features": ["1 point per $1 spent", "Birthday rewards", "Email support", "Basic member discounts"]}'::jsonb, 
 '#CD7F32', 'bronze', true),
('Silver', 2, 1000.00, 5, 1000, 1.25, 
 '{"description": "Enhanced benefits, 1.25x points earning, priority support", "features": ["1.25 points per $1 spent", "Requires 5+ visits", "Free shipping on orders over $50", "Priority customer support", "Exclusive member events", "Double points on birthdays"]}'::jsonb, 
 '#C0C0C0', 'silver', true),
('Elite', 3, 2500.00, 15, 2500, 1.50, 
 '{"description": "Premium benefits, 1.5x points earning, exclusive offers", "features": ["1.5 points per $1 spent", "Requires 15+ visits", "Free shipping on all orders", "VIP customer support", "Early access to sales", "Exclusive product launches", "Quarterly member gifts"]}'::jsonb, 
 '#FFD700', 'elite', true)
ON CONFLICT (tier_name) DO UPDATE SET
  min_spending = EXCLUDED.min_spending,
  min_visits = EXCLUDED.min_visits,
  min_points = EXCLUDED.min_points,
  points_multiplier = EXCLUDED.points_multiplier,
  benefits = EXCLUDED.benefits,
  tier_color = EXCLUDED.tier_color,
  tier_icon = EXCLUDED.tier_icon,
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- PROMOTIONS SYSTEM
-- =====================================================
-- Tables for managing promotions from Salesforce
-- Synced via MuleSoft APIs

-- Main promotions table
CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    sf_id VARCHAR(18) UNIQUE NOT NULL, -- Salesforce ID
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_automatic BOOLEAN DEFAULT false,
    currency_iso_code VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    objective TEXT,
    discount_order INTEGER,
    
    -- Enrollment settings
    is_enrollment_required BOOLEAN DEFAULT false,
    enrollment_start_date TIMESTAMP,
    enrollment_end_date TIMESTAMP,
    
    -- Dates and times
    start_date DATE,
    start_date_time TIMESTAMP,
    end_date DATE,
    end_date_time TIMESTAMP,
    
    -- Media and branding
    image_url TEXT,
    promotion_page_url TEXT,
    
    -- Loyalty program references
    loyalty_program_id VARCHAR(18), -- Salesforce LoyaltyProgram ID
    loyalty_program_currency_id VARCHAR(18), -- Salesforce LoyaltyProgramCurrency ID
    
    -- Points and rewards
    point_factor NUMERIC(10,2),
    total_reward_points INTEGER,
    
    -- Promotion details
    promotion_code VARCHAR(50),
    usage_type VARCHAR(50), -- e.g., 'Unlimited', 'Limited', 'Once'
    transaction_journal_type VARCHAR(50),
    issued_voucher_count INTEGER DEFAULT 0,
    
    -- Legal
    terms_and_conditions TEXT,
    
    -- Sync tracking
    sync_status VARCHAR(20) DEFAULT 'active', -- active, inactive, error
    last_synced_at TIMESTAMP,
    sync_error TEXT,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT promotions_sf_id_key UNIQUE (sf_id)
);

-- Create indexes for promotions
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date_time, end_date_time);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(promotion_code);
CREATE INDEX IF NOT EXISTS idx_promotions_sf_id ON promotions(sf_id);
CREATE INDEX IF NOT EXISTS idx_promotions_loyalty_program ON promotions(loyalty_program_id);

-- Customer promotions (enrollment and progress tracking)
CREATE TABLE IF NOT EXISTS customer_promotions (
    id SERIAL PRIMARY KEY,
    sf_id VARCHAR(18) UNIQUE, -- Salesforce LoyaltyProgramMbrPromotion ID
    
    -- Relationships
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    
    -- Salesforce references
    sf_member_id VARCHAR(18), -- Salesforce LoyaltyProgramMemberId
    sf_promotion_id VARCHAR(18), -- Salesforce PromotionId
    
    -- Enrollment
    is_auto_enrolled BOOLEAN DEFAULT false,
    is_enrollment_active BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Usage tracking
    cumulative_usage_completed NUMERIC(10,2) DEFAULT 0,
    cumulative_usage_target NUMERIC(10,2) DEFAULT 0,
    cumulative_usage_complete_percent NUMERIC(5,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, completed, expired, cancelled
    completed_at TIMESTAMP,
    
    -- Sync tracking
    last_synced_at TIMESTAMP,
    sync_error TEXT,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint: one enrollment per customer per promotion
    CONSTRAINT customer_promotions_unique UNIQUE (customer_id, promotion_id)
);

-- Create indexes for customer_promotions
CREATE INDEX IF NOT EXISTS idx_customer_promotions_customer ON customer_promotions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_promotions_promotion ON customer_promotions(promotion_id);
CREATE INDEX IF NOT EXISTS idx_customer_promotions_active ON customer_promotions(is_enrollment_active);
CREATE INDEX IF NOT EXISTS idx_customer_promotions_status ON customer_promotions(status);
CREATE INDEX IF NOT EXISTS idx_customer_promotions_sf_member ON customer_promotions(sf_member_id);

-- Loyalty tier promotions (tier-specific promotions)
CREATE TABLE IF NOT EXISTS loyalty_tier_promotions (
    id SERIAL PRIMARY KEY,
    sf_id VARCHAR(18) UNIQUE, -- Salesforce LoyaltyTierPromotion ID
    
    -- Relationships
    loyalty_tier_id INTEGER NOT NULL REFERENCES loyalty_tiers(id) ON DELETE CASCADE,
    promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    
    -- Salesforce references
    sf_tier_id VARCHAR(18), -- Salesforce LoyaltyTierId
    sf_promotion_id VARCHAR(18), -- Salesforce PromotionId
    
    -- Sync tracking
    last_synced_at TIMESTAMP,
    sync_error TEXT,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint: one promotion per tier
    CONSTRAINT loyalty_tier_promotions_unique UNIQUE (loyalty_tier_id, promotion_id)
);

-- Create indexes for loyalty_tier_promotions
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_promotions_tier ON loyalty_tier_promotions(loyalty_tier_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_promotions_promotion ON loyalty_tier_promotions(promotion_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_promotions_sf_tier ON loyalty_tier_promotions(sf_tier_id);

-- Add trigger to update updated_at timestamp for promotions
CREATE OR REPLACE FUNCTION update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_promotions_updated_at
    BEFORE UPDATE ON promotions
    FOR EACH ROW
    EXECUTE FUNCTION update_promotions_updated_at();

-- Add trigger to update updated_at timestamp for customer_promotions
CREATE TRIGGER trigger_update_customer_promotions_updated_at
    BEFORE UPDATE ON customer_promotions
    FOR EACH ROW
    EXECUTE FUNCTION update_promotions_updated_at();

-- Add trigger to update updated_at timestamp for loyalty_tier_promotions
CREATE TRIGGER trigger_update_loyalty_tier_promotions_updated_at
    BEFORE UPDATE ON loyalty_tier_promotions
    FOR EACH ROW
    EXECUTE FUNCTION update_promotions_updated_at();

-- =====================================================
-- PROMOTIONS VIEWS AND HELPER FUNCTIONS
-- =====================================================

-- View: Active promotions with tier eligibility
CREATE OR REPLACE VIEW v_active_promotions AS
SELECT 
    p.*,
    COUNT(DISTINCT ltp.loyalty_tier_id) as eligible_tier_count,
    ARRAY_AGG(DISTINCT lt.tier_name) FILTER (WHERE lt.tier_name IS NOT NULL) as eligible_tiers
FROM promotions p
LEFT JOIN loyalty_tier_promotions ltp ON p.id = ltp.promotion_id
LEFT JOIN loyalty_tiers lt ON ltp.loyalty_tier_id = lt.id
WHERE p.is_active = true
    AND (p.start_date_time IS NULL OR p.start_date_time <= CURRENT_TIMESTAMP)
    AND (p.end_date_time IS NULL OR p.end_date_time >= CURRENT_TIMESTAMP)
GROUP BY p.id;

-- View: Customer promotions with progress
CREATE OR REPLACE VIEW v_customer_promotions_progress AS
SELECT 
    cp.*,
    c.first_name,
    c.last_name,
    c.email,
    c.loyalty_tier,
    p.name as promotion_name,
    p.display_name as promotion_display_name,
    p.image_url as promotion_image_url,
    p.description as promotion_description,
    p.total_reward_points,
    p.end_date_time as promotion_end_date,
    CASE 
        WHEN cp.cumulative_usage_target > 0 THEN 
            (cp.cumulative_usage_completed / cp.cumulative_usage_target * 100)
        ELSE 0 
    END as calculated_progress_percent
FROM customer_promotions cp
JOIN customers c ON cp.customer_id = c.id
JOIN promotions p ON cp.promotion_id = p.id
WHERE cp.is_enrollment_active = true
    AND p.is_active = true;

-- Function: Get available promotions for a customer based on their tier
CREATE OR REPLACE FUNCTION get_customer_available_promotions(
    p_customer_id INTEGER
)
RETURNS TABLE (
    promotion_id INTEGER,
    promotion_name VARCHAR(255),
    display_name VARCHAR(255),
    description TEXT,
    image_url TEXT,
    total_reward_points INTEGER,
    end_date_time TIMESTAMP,
    is_enrolled BOOLEAN,
    is_tier_eligible BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as promotion_id,
        p.name as promotion_name,
        p.display_name,
        p.description,
        p.image_url,
        p.total_reward_points,
        p.end_date_time,
        CASE WHEN cp.id IS NOT NULL THEN true ELSE false END as is_enrolled,
        CASE 
            WHEN ltp.id IS NOT NULL THEN true -- Tier-specific promotion
            WHEN NOT EXISTS (
                SELECT 1 FROM loyalty_tier_promotions ltp2 
                WHERE ltp2.promotion_id = p.id
            ) THEN true -- No tier restrictions (available to all)
            ELSE false 
        END as is_tier_eligible
    FROM promotions p
    LEFT JOIN customers c ON c.id = p_customer_id
    LEFT JOIN loyalty_tiers lt ON lt.tier_name = c.loyalty_tier
    LEFT JOIN loyalty_tier_promotions ltp ON ltp.promotion_id = p.id AND ltp.loyalty_tier_id = lt.id
    LEFT JOIN customer_promotions cp ON cp.promotion_id = p.id AND cp.customer_id = p_customer_id
    WHERE p.is_active = true
        AND (p.start_date_time IS NULL OR p.start_date_time <= CURRENT_TIMESTAMP)
        AND (p.end_date_time IS NULL OR p.end_date_time >= CURRENT_TIMESTAMP)
    GROUP BY p.id, cp.id, ltp.id
    ORDER BY p.start_date_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Enroll customer in promotion
CREATE OR REPLACE FUNCTION enroll_customer_in_promotion(
    p_customer_id INTEGER,
    p_promotion_id INTEGER,
    p_auto_enrolled BOOLEAN DEFAULT false
)
RETURNS INTEGER AS $$
DECLARE
    v_enrollment_id INTEGER;
BEGIN
    -- Check if customer is already enrolled
    SELECT id INTO v_enrollment_id
    FROM customer_promotions
    WHERE customer_id = p_customer_id AND promotion_id = p_promotion_id;
    
    IF v_enrollment_id IS NOT NULL THEN
        -- Already enrolled, return existing ID
        RETURN v_enrollment_id;
    END IF;
    
    -- Create new enrollment
    INSERT INTO customer_promotions (
        customer_id,
        promotion_id,
        is_auto_enrolled,
        is_enrollment_active,
        status
    ) VALUES (
        p_customer_id,
        p_promotion_id,
        p_auto_enrolled,
        true,
        'active'
    )
    RETURNING id INTO v_enrollment_id;
    
    RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PROMOTIONS SYNC LOGGING
-- =====================================================

-- Table to track promotion sync operations
CREATE TABLE IF NOT EXISTS promotion_sync_log (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL, -- 'promotions', 'customer_promotions', 'tier_promotions'
    sync_action VARCHAR(20) NOT NULL, -- 'fetch', 'upsert', 'delete'
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running', -- running, completed, failed
    error_message TEXT,
    sync_details JSONB, -- Store additional sync metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotion_sync_log_type ON promotion_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_promotion_sync_log_started ON promotion_sync_log(started_at DESC);

COMMENT ON TABLE promotions IS 'Stores promotion definitions from Salesforce Promotion object';
COMMENT ON TABLE customer_promotions IS 'Tracks customer enrollment and progress in promotions (LoyaltyProgramMbrPromotion)';
COMMENT ON TABLE loyalty_tier_promotions IS 'Maps promotions to specific loyalty tiers (LoyaltyTierPromotion)';
COMMENT ON TABLE promotion_sync_log IS 'Tracks synchronization operations from Salesforce';
