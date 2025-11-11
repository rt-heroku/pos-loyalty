-- Check if products exist
SELECT COUNT(*) as total_products FROM products;

-- Check active products
SELECT COUNT(*) as active_products FROM products WHERE is_active = true;

-- Check products with stock
SELECT COUNT(*) as products_with_stock FROM products WHERE stock > 0;

-- Check products that meet both criteria
SELECT COUNT(*) as valid_products FROM products WHERE is_active = true AND stock > 0;

-- Show sample products
SELECT id, name, price, stock, is_active 
FROM products 
LIMIT 5;
