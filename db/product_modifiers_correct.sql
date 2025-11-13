-- =====================================================
-- PRODUCT MODIFIERS FOR SHOP (Correct Schema)
-- =====================================================
-- This file creates modifier groups, modifiers, and links them to products

BEGIN;

-- =====================================================
-- 1. CREATE MODIFIER GROUPS (Generic, reusable)
-- =====================================================

-- Protein Choice
INSERT INTO product_modifier_groups (name, description, min_selections, max_selections, is_required, display_order)
VALUES 
  ('Select Protein', 'Choose your protein preparation', 1, 1, true, 1);

-- Side Choice
INSERT INTO product_modifier_groups (name, description, min_selections, max_selections, is_required, display_order)
VALUES 
  ('Choose Your Side', 'Select one side dish', 1, 1, true, 2);

-- Toppings (Multi-select)
INSERT INTO product_modifier_groups (name, description, min_selections, max_selections, is_required, display_order)
VALUES 
  ('Add Toppings', 'Add extra toppings to your burger', 0, NULL, false, 3);

-- Remove Ingredients
INSERT INTO product_modifier_groups (name, description, min_selections, max_selections, is_required, display_order)
VALUES 
  ('Remove Ingredients', 'Customize by removing items', 0, NULL, false, 4);

-- Dressing Choice (Salads)
INSERT INTO product_modifier_groups (name, description, min_selections, max_selections, is_required, display_order)
VALUES 
  ('Choose Dressing', 'Select your salad dressing', 1, 1, true, 1);

-- Add Protein (Salads)
INSERT INTO product_modifier_groups (name, description, min_selections, max_selections, is_required, display_order)
VALUES 
  ('Add Protein', 'Add protein to your salad', 0, 1, false, 2);

-- Bread Choice (Sandwiches)
INSERT INTO product_modifier_groups (name, description, min_selections, max_selections, is_required, display_order)
VALUES 
  ('Choose Bread', 'Select your bread type', 1, 1, true, 1);

-- Dipping Sauce
INSERT INTO product_modifier_groups (name, description, min_selections, max_selections, is_required, display_order)
VALUES 
  ('Choose Dipping Sauce', 'Select your dipping sauce', 1, 2, true, 1);

-- Beverage Size
INSERT INTO product_modifier_groups (name, description, min_selections, max_selections, is_required, display_order)
VALUES 
  ('Choose Size', 'Select your drink size', 1, 1, true, 1);

-- =====================================================
-- 2. ADD MODIFIERS TO GROUPS
-- =====================================================

-- Get group IDs
DO $$
DECLARE
  protein_group_id INTEGER;
  side_group_id INTEGER;
  topping_group_id INTEGER;
  remove_group_id INTEGER;
  dressing_group_id INTEGER;
  salad_protein_group_id INTEGER;
  bread_group_id INTEGER;
  sauce_group_id INTEGER;
  size_group_id INTEGER;
BEGIN
  SELECT id INTO protein_group_id FROM product_modifier_groups WHERE name = 'Select Protein' LIMIT 1;
  SELECT id INTO side_group_id FROM product_modifier_groups WHERE name = 'Choose Your Side' LIMIT 1;
  SELECT id INTO topping_group_id FROM product_modifier_groups WHERE name = 'Add Toppings' LIMIT 1;
  SELECT id INTO remove_group_id FROM product_modifier_groups WHERE name = 'Remove Ingredients' LIMIT 1;
  SELECT id INTO dressing_group_id FROM product_modifier_groups WHERE name = 'Choose Dressing' LIMIT 1;
  SELECT id INTO salad_protein_group_id FROM product_modifier_groups WHERE name = 'Add Protein' LIMIT 1;
  SELECT id INTO bread_group_id FROM product_modifier_groups WHERE name = 'Choose Bread' LIMIT 1;
  SELECT id INTO sauce_group_id FROM product_modifier_groups WHERE name = 'Choose Dipping Sauce' LIMIT 1;
  SELECT id INTO size_group_id FROM product_modifier_groups WHERE name = 'Choose Size' LIMIT 1;

  -- PROTEIN OPTIONS
  INSERT INTO product_modifiers (group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (protein_group_id, 'Beef - No Pink', 0.00, true, 1),
    (protein_group_id, 'Beef - Some Pink', 0.00, false, 2),
    (protein_group_id, 'Grilled Chicken', 0.00, false, 3),
    (protein_group_id, 'Crispy Chicken', 2.19, false, 4),
    (protein_group_id, 'Turkey Patty', 0.00, false, 5),
    (protein_group_id, 'Veggie Patty', 0.00, false, 6),
    (protein_group_id, 'Impossible™ Burger Patty', 2.99, false, 7);

  -- SIDE OPTIONS
  INSERT INTO product_modifiers (group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (side_group_id, 'Steak Fries', 0.00, true, 1),
    (side_group_id, 'Garlic Parmesan Fries', 0.00, false, 2),
    (side_group_id, 'Sweet Potato Fries', 1.49, false, 3),
    (side_group_id, 'Onion Rings', 1.49, false, 4),
    (side_group_id, 'Coleslaw', 0.00, false, 5),
    (side_group_id, 'Side Salad', 0.00, false, 6),
    (side_group_id, 'Caesar Salad', 1.49, false, 7),
    (side_group_id, 'Steamed Broccoli', 0.00, false, 8);

  -- TOPPING OPTIONS
  INSERT INTO product_modifiers (group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (topping_group_id, 'Extra Cheese', 1.29, false, 1),
    (topping_group_id, 'Bacon', 1.99, false, 2),
    (topping_group_id, 'Avocado', 1.49, false, 3),
    (topping_group_id, 'Fried Egg', 1.49, false, 4),
    (topping_group_id, 'Jalapeños', 0.79, false, 5),
    (topping_group_id, 'Sautéed Mushrooms', 1.29, false, 6),
    (topping_group_id, 'Grilled Onions', 0.79, false, 7);

  -- REMOVE OPTIONS
  INSERT INTO product_modifiers (group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (remove_group_id, 'No Lettuce', 0.00, false, 1),
    (remove_group_id, 'No Tomatoes', 0.00, false, 2),
    (remove_group_id, 'No Onions', 0.00, false, 3),
    (remove_group_id, 'No Pickles', 0.00, false, 4),
    (remove_group_id, 'No Mayo', 0.00, false, 5);

  -- DRESSING OPTIONS
  INSERT INTO product_modifiers (group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (dressing_group_id, 'Ranch', 0.00, true, 1),
    (dressing_group_id, 'Caesar', 0.00, false, 2),
    (dressing_group_id, 'Balsamic Vinaigrette', 0.00, false, 3),
    (dressing_group_id, 'Blue Cheese', 0.00, false, 4),
    (dressing_group_id, 'Honey Mustard', 0.00, false, 5),
    (dressing_group_id, 'Italian', 0.00, false, 6),
    (dressing_group_id, 'Oil & Vinegar', 0.00, false, 7),
    (dressing_group_id, 'No Dressing', 0.00, false, 8);

  -- SALAD PROTEIN OPTIONS
  INSERT INTO product_modifiers (group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (salad_protein_group_id, 'Grilled Chicken', 4.99, false, 1),
    (salad_protein_group_id, 'Crispy Chicken', 4.99, false, 2),
    (salad_protein_group_id, 'Grilled Salmon', 6.99, false, 3),
    (salad_protein_group_id, 'Grilled Shrimp', 6.99, false, 4);

  -- BREAD OPTIONS
  INSERT INTO product_modifiers (group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (bread_group_id, 'White Bread', 0.00, true, 1),
    (bread_group_id, 'Wheat Bread', 0.00, false, 2),
    (bread_group_id, 'Sourdough', 0.49, false, 3),
    (bread_group_id, 'Ciabatta', 0.49, false, 4),
    (bread_group_id, 'Wrap', 0.00, false, 5);

  -- DIPPING SAUCE OPTIONS
  INSERT INTO product_modifiers (group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (sauce_group_id, 'Ranch', 0.00, true, 1),
    (sauce_group_id, 'Blue Cheese', 0.00, false, 2),
    (sauce_group_id, 'BBQ Sauce', 0.00, false, 3),
    (sauce_group_id, 'Honey Mustard', 0.00, false, 4),
    (sauce_group_id, 'Ketchup', 0.00, false, 5),
    (sauce_group_id, 'Marinara', 0.00, false, 6),
    (sauce_group_id, 'Sriracha Mayo', 0.00, false, 7);

  -- BEVERAGE SIZE OPTIONS
  INSERT INTO product_modifiers (group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (size_group_id, 'Small (16 oz)', 0.00, false, 1),
    (size_group_id, 'Medium (21 oz)', 0.49, true, 2),
    (size_group_id, 'Large (32 oz)', 0.99, false, 3);

END $$;

-- =====================================================
-- 3. LINK MODIFIER GROUPS TO PRODUCTS
-- =====================================================

DO $$
DECLARE
  protein_group_id INTEGER;
  side_group_id INTEGER;
  topping_group_id INTEGER;
  remove_group_id INTEGER;
  dressing_group_id INTEGER;
  salad_protein_group_id INTEGER;
  bread_group_id INTEGER;
  sauce_group_id INTEGER;
  size_group_id INTEGER;
BEGIN
  SELECT id INTO protein_group_id FROM product_modifier_groups WHERE name = 'Select Protein' LIMIT 1;
  SELECT id INTO side_group_id FROM product_modifier_groups WHERE name = 'Choose Your Side' LIMIT 1;
  SELECT id INTO topping_group_id FROM product_modifier_groups WHERE name = 'Add Toppings' LIMIT 1;
  SELECT id INTO remove_group_id FROM product_modifier_groups WHERE name = 'Remove Ingredients' LIMIT 1;
  SELECT id INTO dressing_group_id FROM product_modifier_groups WHERE name = 'Choose Dressing' LIMIT 1;
  SELECT id INTO salad_protein_group_id FROM product_modifier_groups WHERE name = 'Add Protein' LIMIT 1;
  SELECT id INTO bread_group_id FROM product_modifier_groups WHERE name = 'Choose Bread' LIMIT 1;
  SELECT id INTO sauce_group_id FROM product_modifier_groups WHERE name = 'Choose Dipping Sauce' LIMIT 1;
  SELECT id INTO size_group_id FROM product_modifier_groups WHERE name = 'Choose Size' LIMIT 1;

  -- BURGERS (Products 1-6) - Protein, Side, Toppings, Remove
  FOR i IN 1..6 LOOP
    INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
    VALUES 
      (i, protein_group_id, 1),
      (i, side_group_id, 2),
      (i, topping_group_id, 3),
      (i, remove_group_id, 4)
    ON CONFLICT (product_id, modifier_group_id) DO NOTHING;
  END LOOP;

  -- SALADS (Products 7-10) - Dressing, Protein
  FOR i IN 7..10 LOOP
    IF EXISTS (SELECT 1 FROM products WHERE id = i) THEN
      INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
      VALUES 
        (i, dressing_group_id, 1),
        (i, salad_protein_group_id, 2)
      ON CONFLICT (product_id, modifier_group_id) DO NOTHING;
    END IF;
  END LOOP;

  -- SANDWICHES (Products 11-15) - Bread, Side
  FOR i IN 11..15 LOOP
    IF EXISTS (SELECT 1 FROM products WHERE id = i) THEN
      INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
      VALUES 
        (i, bread_group_id, 1),
        (i, side_group_id, 2)
      ON CONFLICT (product_id, modifier_group_id) DO NOTHING;
    END IF;
  END LOOP;

  -- APPETIZERS (Products 16-20) - Dipping Sauce
  FOR i IN 16..20 LOOP
    IF EXISTS (SELECT 1 FROM products WHERE id = i) THEN
      INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
      VALUES 
        (i, sauce_group_id, 1)
      ON CONFLICT (product_id, modifier_group_id) DO NOTHING;
    END IF;
  END LOOP;

  -- BEVERAGES (Products 25-32) - Size
  FOR i IN 25..32 LOOP
    IF EXISTS (SELECT 1 FROM products WHERE id = i) THEN
      INSERT INTO product_modifier_group_links (product_id, modifier_group_id, display_order)
      VALUES 
        (i, size_group_id, 1)
      ON CONFLICT (product_id, modifier_group_id) DO NOTHING;
    END IF;
  END LOOP;

END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

SELECT 
  p.id,
  p.name AS product_name,
  pmg.name AS modifier_group,
  pmg.is_required,
  COUNT(pm.id) AS modifier_count
FROM products p
LEFT JOIN product_modifier_group_links pmgl ON p.id = pmgl.product_id
LEFT JOIN product_modifier_groups pmg ON pmgl.modifier_group_id = pmg.id
LEFT JOIN product_modifiers pm ON pmg.id = pm.group_id
WHERE p.id <= 32
GROUP BY p.id, p.name, pmg.id, pmg.name, pmg.is_required, pmgl.display_order
ORDER BY p.id, pmgl.display_order;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Product modifiers created and linked successfully! ✅' AS status,
       COUNT(DISTINCT pmg.id) AS modifier_groups_created,
       COUNT(DISTINCT pm.id) AS modifiers_created,
       COUNT(DISTINCT pmgl.id) AS product_links_created
FROM product_modifier_groups pmg
CROSS JOIN product_modifiers pm
CROSS JOIN product_modifier_group_links pmgl;

