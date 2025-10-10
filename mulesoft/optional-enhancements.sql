-- Optional Database Enhancements for MuleSoft Product Import
-- These are NOT required for the current implementation but provide additional functionality

-- =====================================================
-- 1. PRODUCT CATEGORIES TABLE (Optional Enhancement)
-- =====================================================

-- Create product categories table for better data normalization
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES product_categories(id),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add category_id to products table (optional)
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES product_categories(id);

-- Insert sample categories
INSERT INTO product_categories (name, description, sort_order) VALUES
('Luggage', 'Travel luggage and suitcases', 1),
('Backpacks', 'Backpacks and daypacks', 2),
('Accessories', 'Travel accessories and small items', 3),
('Business', 'Business and professional items', 4),
('Travel', 'General travel items', 5)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. PRODUCT TAGS TABLE (Optional Enhancement)
-- =====================================================

-- Create product tags table for better searchability
CREATE TABLE IF NOT EXISTS product_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product tag assignments table
CREATE TABLE IF NOT EXISTS product_tag_assignments (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES product_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, tag_id)
);

-- Insert sample tags
INSERT INTO product_tags (name, description, color) VALUES
('Premium', 'High-end premium products', '#FFD700'),
('Travel', 'Travel-focused products', '#4169E1'),
('Business', 'Business and professional use', '#2E8B57'),
('Expandable', 'Products with expansion features', '#FF6347'),
('Water Resistant', 'Water-resistant materials', '#20B2AA'),
('TSA Approved', 'TSA-approved locks and features', '#9370DB'),
('Lightweight', 'Lightweight construction', '#FFA500'),
('Durable', 'High durability materials', '#8B4513')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. PRODUCT VARIANTS TABLE (Optional Enhancement)
-- =====================================================

-- Create product variants table for products with multiple options
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL, -- e.g., 'Color', 'Size', 'Material'
    variant_value VARCHAR(100) NOT NULL, -- e.g., 'Black', 'Large', 'Leather'
    sku VARCHAR(50) UNIQUE,
    price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. PRODUCT REVIEWS TABLE (Optional Enhancement)
-- =====================================================

-- Create product reviews table for customer feedback
CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. PRODUCT INVENTORY HISTORY TABLE (Optional Enhancement)
-- =====================================================

-- Create inventory history table for tracking stock changes
CREATE TABLE IF NOT EXISTS product_inventory_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    change_type VARCHAR(20) NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason VARCHAR(255),
    reference_id INTEGER, -- Transaction ID, Work Order ID, etc.
    reference_type VARCHAR(50), -- 'TRANSACTION', 'WORK_ORDER', 'ADJUSTMENT'
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. PRODUCT PRICING HISTORY TABLE (Optional Enhancement)
-- =====================================================

-- Create pricing history table for tracking price changes
CREATE TABLE IF NOT EXISTS product_pricing_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2) NOT NULL,
    change_reason VARCHAR(255),
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE (Optional Enhancement)
-- =====================================================

-- Create indexes for better performance on new tables
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_product_tags_active ON product_tags(is_active);
CREATE INDEX IF NOT EXISTS idx_product_tag_assignments_product ON product_tag_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tag_assignments_tag ON product_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer ON product_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_product_inventory_history_product ON product_inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_history_location ON product_inventory_history(location_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_history_created ON product_inventory_history(created_at);
CREATE INDEX IF NOT EXISTS idx_product_pricing_history_product ON product_pricing_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_history_effective ON product_pricing_history(effective_date);

-- =====================================================
-- 8. FUNCTIONS FOR NEW FEATURES (Optional Enhancement)
-- =====================================================

-- Function to get product with all related data
CREATE OR REPLACE FUNCTION get_product_with_details(p_product_id INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'product', row_to_json(p),
        'images', (
            SELECT json_agg(
                json_build_object(
                    'id', pi.id,
                    'image_url', pi.image_url,
                    'alt_text', pi.alt_text,
                    'is_primary', pi.is_primary,
                    'sort_order', pi.sort_order
                )
            )
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.sort_order
        ),
        'features', (
            SELECT json_agg(
                json_build_object(
                    'id', pf.id,
                    'feature_name', pf.feature_name,
                    'feature_value', pf.feature_value
                )
            )
            FROM product_features pf
            WHERE pf.product_id = p.id
        ),
        'tags', (
            SELECT json_agg(
                json_build_object(
                    'id', pt.id,
                    'name', pt.name,
                    'color', pt.color
                )
            )
            FROM product_tag_assignments pta
            JOIN product_tags pt ON pta.tag_id = pt.id
            WHERE pta.product_id = p.id
        ),
        'variants', (
            SELECT json_agg(
                json_build_object(
                    'id', pv.id,
                    'variant_name', pv.variant_name,
                    'variant_value', pv.variant_value,
                    'sku', pv.sku,
                    'price', pv.price,
                    'stock', pv.stock
                )
            )
            FROM product_variants pv
            WHERE pv.product_id = p.id AND pv.is_active = true
            ORDER BY pv.sort_order
        )
    ) INTO result
    FROM products p
    WHERE p.id = p_product_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to search products with filters
CREATE OR REPLACE FUNCTION search_products(
    p_search_term TEXT DEFAULT NULL,
    p_brand TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    product_id INTEGER,
    product_name VARCHAR,
    brand VARCHAR,
    price DECIMAL,
    main_image_url TEXT,
    match_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.brand,
        p.price,
        p.main_image_url,
        CASE 
            WHEN p_search_term IS NOT NULL THEN
                ts_rank(
                    to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.brand),
                    plainto_tsquery('english', p_search_term)
                )
            ELSE 1.0
        END as match_score
    FROM products p
    LEFT JOIN product_tag_assignments pta ON p.id = pta.product_id
    LEFT JOIN product_tags pt ON pta.tag_id = pt.id
    WHERE p.is_active = true
        AND (p_search_term IS NULL OR to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.brand) @@ plainto_tsquery('english', p_search_term))
        AND (p_brand IS NULL OR p.brand ILIKE '%' || p_brand || '%')
        AND (p_category IS NULL OR p.category ILIKE '%' || p_category || '%')
        AND (p_min_price IS NULL OR p.price >= p_min_price)
        AND (p_max_price IS NULL OR p.price <= p_max_price)
        AND (p_tags IS NULL OR pt.name = ANY(p_tags))
    GROUP BY p.id, p.name, p.brand, p.price, p.main_image_url
    ORDER BY match_score DESC, p.name
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. TRIGGERS FOR AUDIT TRAIL (Optional Enhancement)
-- =====================================================

-- Trigger to log price changes
CREATE OR REPLACE FUNCTION log_price_change() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO product_pricing_history (product_id, old_price, new_price, change_reason, created_by)
        VALUES (NEW.id, OLD.price, NEW.price, 'Price updated', 1); -- Default to admin user
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for price changes
DROP TRIGGER IF EXISTS trigger_log_price_change ON products;
CREATE TRIGGER trigger_log_price_change
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION log_price_change();

-- =====================================================
-- 10. SAMPLE DATA FOR TESTING (Optional Enhancement)
-- =====================================================

-- Add some sample tags to existing products
INSERT INTO product_tag_assignments (product_id, tag_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_tags pt
WHERE (p.brand = 'TUMI' AND pt.name = 'Premium')
   OR (p.category ILIKE '%backpack%' AND pt.name = 'Travel')
   OR (p.category ILIKE '%luggage%' AND pt.name = 'Travel')
   OR (p.description ILIKE '%expandable%' AND pt.name = 'Expandable')
   OR (p.description ILIKE '%water%' AND pt.name = 'Water Resistant')
ON CONFLICT (product_id, tag_id) DO NOTHING;

-- Add some sample variants to existing products
INSERT INTO product_variants (product_id, variant_name, variant_value, sku, price, stock)
SELECT 
    p.id,
    'Color',
    'Black',
    p.sku || '-BLK',
    p.price,
    p.stock
FROM products p
WHERE p.brand = 'TUMI'
ON CONFLICT (sku) DO NOTHING;

-- =====================================================
-- END OF OPTIONAL ENHANCEMENTS
-- =====================================================

-- Note: These enhancements are completely optional and not required for the MuleSoft integration
-- The current database schema is fully compatible with the product import flow
-- These enhancements provide additional functionality for future use cases
