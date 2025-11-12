-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
-- This table stores product categories for organizing products

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Add category_id column to products table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
        CREATE INDEX idx_products_category_id ON products(category_id);
    END IF;
END $$;

-- Insert default categories
INSERT INTO categories (name, description, display_order, is_active) VALUES
    ('Food & Beverages', 'Food items and drinks', 1, true),
    ('Electronics', 'Electronic devices and accessories', 2, true),
    ('Clothing', 'Apparel and fashion items', 3, true),
    ('Home & Garden', 'Home improvement and garden supplies', 4, true),
    ('Sports & Outdoors', 'Sports equipment and outdoor gear', 5, true),
    ('Books & Media', 'Books, movies, music, and games', 6, true),
    ('Health & Beauty', 'Health products and beauty items', 7, true),
    ('Toys & Games', 'Toys and gaming products', 8, true)
ON CONFLICT (name) DO NOTHING;

-- Update existing products to have a category (assign to first category if null)
UPDATE products 
SET category_id = (SELECT id FROM categories LIMIT 1)
WHERE category_id IS NULL;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_categories_updated_at ON categories;
CREATE TRIGGER trigger_update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- Add category column to products view if needed
CREATE OR REPLACE VIEW product_catalog AS
SELECT 
    p.*,
    c.name as category,
    c.id as category_id
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

COMMENT ON TABLE categories IS 'Product categories for organizing and filtering products';
COMMENT ON COLUMN categories.parent_id IS 'Reference to parent category for hierarchical structure';
COMMENT ON COLUMN categories.display_order IS 'Order in which categories should be displayed';

