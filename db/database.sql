-- Simplified Database Schema for POS System
-- This file creates a clean database structure without incremental changes
-- Drops all tables first, then creates complete tables with all columns
-- Finally adds indexes, functions, triggers, and sample data

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
    country VARCHAR(100);,
    marketing_consent BOOLEAN DEFAULT false,
    member_status VARCHAR(50) DEFAULT 'Active' CHECK (member_status IN ('Active', 'Inactive', 'Under Fraud Investigation', 'Merged', 'Fraudulent Member')),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    member_type VARCHAR(20) DEFAULT 'Individual' CHECK (member_type IN ('Individual', 'Corporate')),
    sf_id VARCHAR(100),
    customer_tier VARCHAR(20) DEFAULT 'Bronze' CHECK (customer_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
    tier_calculation_number DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by_user INTEGER
);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

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
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Products indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_collection ON products(collection);
CREATE INDEX idx_products_product_type ON products(product_type);
CREATE INDEX idx_products_active ON products(is_active);

-- Customers indexes
CREATE INDEX idx_customers_loyalty_number ON customers(loyalty_number);
CREATE INDEX idx_customers_name ON customers(LOWER(name));
CREATE INDEX idx_customers_first_name ON customers(LOWER(first_name));
CREATE INDEX idx_customers_last_name ON customers(LOWER(last_name));
CREATE INDEX idx_customers_email ON customers(LOWER(email));
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_customers_last_visit ON customers(last_visit);
CREATE INDEX idx_customers_member_status ON customers(member_status);
CREATE INDEX idx_customers_member_type ON customers(member_type);
CREATE INDEX idx_customers_customer_tier ON customers(customer_tier);
CREATE INDEX idx_customers_enrollment_date ON customers(enrollment_date);
CREATE INDEX idx_customers_tier_calculation_number ON customers(tier_calculation_number);
CREATE INDEX idx_customers_sf_id ON customers(sf_id);

-- Transactions indexes
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_location_id ON transactions(location_id);

-- Transaction items indexes
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);

-- Generated products indexes
CREATE INDEX idx_generated_products_batch_id ON generated_products(batch);
CREATE INDEX idx_generated_products_brand_id ON generated_products(brand);
CREATE INDEX idx_generated_products_segment_id ON generated_products(segment);
CREATE INDEX idx_generated_products_created_at ON generated_products(created_at);

-- Product images and features indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_features_product_id ON product_features(product_id);

-- Locations indexes
CREATE INDEX idx_locations_store_code ON locations(store_code);
CREATE INDEX idx_locations_active ON locations(is_active);

-- User settings indexes
CREATE INDEX idx_user_settings_identifier ON user_settings(user_identifier);

-- Location inventory indexes
CREATE INDEX idx_location_inventory_location ON location_inventory(location_id);
CREATE INDEX idx_location_inventory_product ON location_inventory(product_id);

-- Work orders indexes
CREATE INDEX idx_work_orders_location ON work_orders(location_id);
CREATE INDEX idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_created_date ON work_orders(created_date);
CREATE INDEX idx_work_order_products_work_order ON work_order_products(work_order_id);

-- Customer activity log indexes
CREATE INDEX idx_customer_activity_log_customer ON customer_activity_log(customer_id);
CREATE INDEX idx_customer_activity_log_type ON customer_activity_log(activity_type);
CREATE INDEX idx_customer_activity_log_created ON customer_activity_log(created_at);

-- System settings indexes
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_active ON system_settings(is_active);

-- Users and roles indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

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
    
    EXTRACT(DAY FROM CURRENT_DATE - c.enrollment_date::DATE) as days_since_enrollment,
    
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
        THEN EXTRACT(DAY FROM CURRENT_DATE - c.last_visit::DATE)
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
CREATE TABLE customer_vouchers (
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
ADD COLUMN voucher_id INTEGER REFERENCES customer_vouchers(id);

-- 3. Create indexes for performance
CREATE INDEX idx_customer_vouchers_customer_id ON customer_vouchers(customer_id);
CREATE INDEX idx_customer_vouchers_status ON customer_vouchers(status);
CREATE INDEX idx_customer_vouchers_expiration ON customer_vouchers(expiration_date);
CREATE INDEX idx_customer_vouchers_type ON customer_vouchers(voucher_type);
CREATE INDEX idx_transaction_items_voucher_id ON transaction_items(voucher_id);

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
CREATE VIEW active_customer_vouchers AS
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
INSERT INTO locations (store_code, store_name, brand, address_line1, city, state, zip_code, tax_rate, manager_name) VALUES
('NYC001', 'Manhattan Flagship', 'TUMI', '350 Madison Avenue', 'New York', 'NY', '10017', 0.08875, 'John Manager'),
('LAX001', 'Beverly Hills Store', 'TUMI', '9570 Wilshire Boulevard', 'Beverly Hills', 'CA', '90212', 0.1025, 'Jane Store Manager'),
('CHI001', 'Michigan Avenue', 'TUMI', '900 N Michigan Avenue', 'Chicago', 'IL', '60611', 0.1025, 'Mike Regional Manager')
ON CONFLICT (store_code) DO NOTHING;

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
INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, is_active, role) 
SELECT 
    'admin',
    'admin@pos.com',
    hash_password('P@$$word1'),
    'System',
    'Administrator',
    r.id,
    true,
    'admin'
FROM roles r 
WHERE r.name = 'admin'
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- This completes the simplified database schema
-- All tables are created with complete column definitions
-- All indexes, functions, triggers, and views are included
-- Sample data is inserted for testing
-- The database is ready for use
