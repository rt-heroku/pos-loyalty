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

INSERT INTO payment_methods (name, code, description, requires_online_payment, display_order, icon)
VALUES 
    ('Credit Card', 'credit_card', 'Pay online with credit or debit card', true, 1, 'credit-card'),
    ('Cash on Delivery', 'cash', 'Pay with cash when order arrives', false, 2, 'dollar-sign'),
    ('Pay at Pickup', 'pay_at_pickup', 'Pay when you pick up your order', false, 3, 'store'),
    ('Apple Pay', 'apple_pay', 'Pay with Apple Pay', true, 4, 'apple'),
    ('Google Pay', 'google_pay', 'Pay with Google Pay', true, 5, 'google')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_modifiers_group ON product_modifiers(group_id);
CREATE INDEX IF NOT EXISTS idx_product_modifier_links_product ON product_modifier_group_links(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_customer ON customer_payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_time ON orders(scheduled_time);

-- =====================================================
-- SAMPLE MODIFIER DATA (for testing)
-- =====================================================

-- Size modifier group
INSERT INTO product_modifier_groups (name, description, is_required, min_selections, max_selections, display_order)
VALUES ('Size', 'Choose your size', true, 1, 1, 1)
ON CONFLICT DO NOTHING;

-- Size options
INSERT INTO product_modifiers (group_id, name, price_adjustment, display_order, is_default)
SELECT 
    (SELECT id FROM product_modifier_groups WHERE name = 'Size' LIMIT 1),
    'Small',
    -2.00,
    1,
    false
WHERE NOT EXISTS (SELECT 1 FROM product_modifiers WHERE name = 'Small');

INSERT INTO product_modifiers (group_id, name, price_adjustment, display_order, is_default)
SELECT 
    (SELECT id FROM product_modifier_groups WHERE name = 'Size' LIMIT 1),
    'Medium',
    0.00,
    2,
    true
WHERE NOT EXISTS (SELECT 1 FROM product_modifiers WHERE name = 'Medium');

INSERT INTO product_modifiers (group_id, name, price_adjustment, display_order, is_default)
SELECT 
    (SELECT id FROM product_modifier_groups WHERE name = 'Size' LIMIT 1),
    'Large',
    3.00,
    3,
    false
WHERE NOT EXISTS (SELECT 1 FROM product_modifiers WHERE name = 'Large');

-- Toppings modifier group
INSERT INTO product_modifier_groups (name, description, is_required, min_selections, max_selections, display_order)
VALUES ('Toppings', 'Add extra toppings', false, 0, NULL, 2)
ON CONFLICT DO NOTHING;

-- Topping options
INSERT INTO product_modifiers (group_id, name, price_adjustment, display_order)
SELECT 
    (SELECT id FROM product_modifier_groups WHERE name = 'Toppings' LIMIT 1),
    'Extra Cheese',
    1.50,
    1
WHERE NOT EXISTS (SELECT 1 FROM product_modifiers WHERE name = 'Extra Cheese');

INSERT INTO product_modifiers (group_id, name, price_adjustment, display_order)
SELECT 
    (SELECT id FROM product_modifier_groups WHERE name = 'Toppings' LIMIT 1),
    'Bacon',
    2.00,
    2
WHERE NOT EXISTS (SELECT 1 FROM product_modifiers WHERE name = 'Bacon');

INSERT INTO product_modifiers (group_id, name, price_adjustment, display_order)
SELECT 
    (SELECT id FROM product_modifier_groups WHERE name = 'Toppings' LIMIT 1),
    'Avocado',
    2.50,
    3
WHERE NOT EXISTS (SELECT 1 FROM product_modifiers WHERE name = 'Avocado');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Shop system tables created successfully!';
    RAISE NOTICE '📦 Product modifiers system ready';
    RAISE NOTICE '💳 Payment methods configured';
    RAISE NOTICE '🛒 Guest checkout enabled';
    RAISE NOTICE '🚚 Delivery & pickup options available';
END $$;

