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

-- Insert default roles if they don't exist
INSERT INTO roles (name, description, permissions) VALUES 
('Admin', 'System Administrator', '{"all": true}'),
('Manager', 'Store Manager', '{"store": true, "reports": true}'),
('Employee', 'Store Employee', '{"pos": true, "inventory": true}'),
('Customer', 'Customer', '{"profile": true, "orders": true}')
ON CONFLICT (name) DO NOTHING;

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
CREATE INDEX IF NOT EXISTS idx_order_status_history_transaction ON order_status_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_timestamp ON order_status_history(timestamp);

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
    ca.country,
    -- Latest status update
    (SELECT osh.status 
     FROM order_status_history osh 
     WHERE osh.transaction_id = t.id 
     ORDER BY osh.timestamp DESC 
     LIMIT 1) as latest_status
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

-- Work orders indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_user_id ON work_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_store_id ON work_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_work_orders_type ON work_orders(type);

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
