-- =====================================================
-- FIX PRODUCT MODIFIERS - Remove Wrong Ones & Add Correct Ones
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Clear ALL existing links (we'll rebuild correctly)
-- =====================================================
DELETE FROM product_modifier_group_links;

-- =====================================================
-- STEP 2: Create proper modifier groups for drinks
-- =====================================================

-- Ice Options for Drinks
INSERT INTO product_modifier_groups (name, description, min_selections, max_selections, is_required, display_order)
VALUES ('Ice Options', 'Choose your ice preference', 1, 1, true, 1)
ON CONFLICT DO NOTHING;

-- Get the ice group ID and add modifiers
DO $$
DECLARE
  ice_group_id INTEGER;
BEGIN
  SELECT id INTO ice_group_id FROM product_modifier_groups WHERE name = 'Ice Options' LIMIT 1;
  
  -- Clear existing modifiers for this group
  DELETE FROM product_modifiers WHERE group_id = ice_group_id;
  
  INSERT INTO product_modifiers (group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (ice_group_id, 'Regular Ice', 0.00, true, 1),
    (ice_group_id, 'Light Ice', 0.00, false, 2),
    (ice_group_id, 'No Ice', 0.00, false, 3),
    (ice_group_id, 'Extra Ice', 0.00, false, 4);
END $$;

-- =====================================================
-- STEP 3: Create sundae/dessert toppings
-- =====================================================

INSERT INTO product_modifier_groups (name, description, min_selections, max_selections, is_required, display_order)
VALUES ('Add Toppings', 'Add extra toppings', 0, NULL, false, 2)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  dessert_topping_group_id INTEGER;
BEGIN
  SELECT id INTO dessert_topping_group_id FROM product_modifier_groups WHERE name = 'Add Toppings' LIMIT 1;
  
  -- Only add dessert-specific toppings if they don't exist
  INSERT INTO product_modifiers (group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (dessert_topping_group_id, 'Extra Whipped Cream', 0.79, false, 10),
    (dessert_topping_group_id, 'Cherry', 0.49, false, 11),
    (dessert_topping_group_id, 'Hot Fudge', 0.99, false, 12),
    (dessert_topping_group_id, 'Caramel Drizzle', 0.99, false, 13),
    (dessert_topping_group_id, 'Rainbow Sprinkles', 0.49, false, 14),
    (dessert_topping_group_id, 'Chocolate Chips', 0.79, false, 15),
    (dessert_topping_group_id, 'Peanut Butter', 0.99, false, 16)
  ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- STEP 4: Link modifiers to products by category
-- =====================================================

DO $$
DECLARE
  protein_group_id INTEGER;
  side_group_id INTEGER;
  topping_group_id INTEGER;
  remove_group_id INTEGER;
  sauce_group_id INTEGER;
  size_group_id INTEGER;
  ice_group_id INTEGER;
BEGIN
  -- Get all group IDs
  SELECT id INTO protein_group_id FROM product_modifier_groups WHERE name = 'Select Protein' LIMIT 1;
  SELECT id INTO side_group_id FROM product_modifier_groups WHERE name = 'Choose Your Side' LIMIT 1;
  SELECT id INTO topping_group_id FROM product_modifier_groups WHERE name = 'Add Toppings' LIMIT 1;
  SELECT id INTO remove_group_id FROM product_modifier_groups WHERE name = 'Remove Ingredients' LIMIT 1;
  SELECT id INTO sauce_group_id FROM product_modifier_groups WHERE name = 'Choose Dipping Sauce' LIMIT 1;
  SELECT id INTO size_group_id FROM product_modifier_groups WHERE name = 'Choose Size' LIMIT 1;
  SELECT id INTO ice_group_id FROM product_modifier_groups WHERE name = 'Ice Options' LIMIT 1;

  -- ==========================================
  -- DRINKS & FLOATS (1, 12, 17)
  -- ==========================================
  INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
  VALUES 
    (1, size_group_id, 1),    -- Root Beer
    (1, ice_group_id, 2),
    (12, size_group_id, 1),   -- Zero Sugar Root Beer
    (12, ice_group_id, 2),
    (17, size_group_id, 1),   -- Pepsi Products
    (17, ice_group_id, 2)
  ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

  -- ==========================================
  -- SWEETS & TREATS (sundaes, shakes, floats)
  -- Products: 3, 6, 7, 9, 11, 16, 24, 29, 30
  -- ==========================================
  INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
  VALUES 
    (3, size_group_id, 1),    -- Chocolate Sundae
    (3, topping_group_id, 2),
    (6, size_group_id, 1),    -- Root Beer Float
    (6, topping_group_id, 2),
    (7, size_group_id, 1),    -- M&M Polar Swirl
    (9, size_group_id, 1),    -- Vanilla Ice
    (9, topping_group_id, 2),
    (11, size_group_id, 1),   -- Strawberry Sundae
    (11, topping_group_id, 2),
    (16, size_group_id, 1),   -- Pumpkin Pie Shake
    (24, size_group_id, 1),   -- Oreo Polar Swirl
    (29, size_group_id, 1),   -- Cookie Dough Swirl
    (30, size_group_id, 1),   -- Root Beer Float
    (30, topping_group_id, 2)
  ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

  -- ==========================================
  -- BURGERS (4, 10, 15, 21, 31)
  -- ==========================================
  INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
  VALUES 
    (4, protein_group_id, 1),    -- Mushroom Onion Melt
    (4, side_group_id, 2),
    (4, topping_group_id, 3),
    (4, remove_group_id, 4),
    (10, protein_group_id, 1),   -- Kids Burger
    (10, side_group_id, 2),
    (10, topping_group_id, 3),
    (10, remove_group_id, 4),
    (15, protein_group_id, 1),   -- Spicy Papa Burger
    (15, side_group_id, 2),
    (15, topping_group_id, 3),
    (15, remove_group_id, 4),
    (21, protein_group_id, 1),   -- Cheeseburger
    (21, side_group_id, 2),
    (21, topping_group_id, 3),
    (21, remove_group_id, 4),
    (31, protein_group_id, 1),   -- Papa Burger
    (31, side_group_id, 2),
    (31, topping_group_id, 3),
    (31, remove_group_id, 4)
  ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

  -- ==========================================
  -- CHICKEN (8, 14)
  -- ==========================================
  INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
  VALUES 
    (8, side_group_id, 1),       -- 2 Chicken Burgers
    (8, sauce_group_id, 2),
    (14, side_group_id, 1),      -- Chicken Strips
    (14, sauce_group_id, 2)
  ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

  -- ==========================================
  -- HOT DOGS (19, 27)
  -- ==========================================
  INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
  VALUES 
    (19, topping_group_id, 1),   -- Coney Cheese Dog
    (19, side_group_id, 2),
    (27, topping_group_id, 1),   -- Hot Dog
    (27, side_group_id, 2)
  ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

  -- ==========================================
  -- SIDES (5, 22, 28, 32) - Sauce options
  -- ==========================================
  INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
  VALUES 
    (5, sauce_group_id, 1),      -- Chili Cheese Fries
    (22, sauce_group_id, 1),     -- French Fries
    (28, sauce_group_id, 1),     -- Cheese Curds
    (32, sauce_group_id, 1)      -- Onion Rings
  ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

  -- ==========================================
  -- COMBOS (2, 18, 20, 23, 26)
  -- ==========================================
  INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
  VALUES 
    (2, side_group_id, 1),       -- Coney Cheese hot Dog Kids Combo
    (2, size_group_id, 2),       -- Drink size
    (18, side_group_id, 1),      -- 5 Chicken Tenders Combo
    (18, sauce_group_id, 2),
    (18, size_group_id, 3),      -- Drink size
    (20, side_group_id, 1),      -- Chicken and Waffle Combo
    (20, size_group_id, 2),      -- Drink size
    (23, protein_group_id, 1),   -- Papa Burger Combo
    (23, side_group_id, 2),
    (23, topping_group_id, 3),
    (23, size_group_id, 4),      -- Drink size
    (26, side_group_id, 1),      -- Coney Cheese Dog Combo
    (26, size_group_id, 2)       -- Drink size
  ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

  -- ==========================================
  -- KIDS MEALS (13)
  -- ==========================================
  INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
  VALUES 
    (13, side_group_id, 1),      -- 2pc Chicken Tenders Kids Meal
    (13, sauce_group_id, 2),
    (13, size_group_id, 3)       -- Drink size (kids)
  ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

SELECT 
  p.id,
  p.name AS product_name,
  p.category,
  pmg.name AS modifier_group,
  pmg.is_required,
  COUNT(pm.id) AS modifier_count
FROM products p
LEFT JOIN product_modifier_group_links pmgl ON p.id = pmgl.product_id
LEFT JOIN product_modifier_groups pmg ON pmgl.modifier_group_id = pmg.id
LEFT JOIN product_modifiers pm ON pmg.id = pm.group_id
WHERE p.id <= 32
GROUP BY p.id, p.name, p.category, pmg.id, pmg.name, pmg.is_required, pmgl.display_order
ORDER BY p.id, pmgl.display_order;

SELECT 'Product modifiers fixed! ✅' AS status;

