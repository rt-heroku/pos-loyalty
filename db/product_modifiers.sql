-- =====================================================
-- PRODUCT MODIFIERS FOR SHOP
-- =====================================================
-- This file creates modifier groups and modifiers for all shop products
-- to enhance customization and improve user experience

-- =====================================================
-- 1. BURGER MODIFIERS
-- =====================================================

-- Modifier Group: Protein Choice (Required)
INSERT INTO modifier_groups (product_id, name, min_selections, max_selections, is_required, display_order)
VALUES 
  (1, 'Select Protein', 1, 1, true, 1),
  (2, 'Select Protein', 1, 1, true, 1),
  (3, 'Select Protein', 1, 1, true, 1),
  (4, 'Select Protein', 1, 1, true, 1),
  (5, 'Select Protein', 1, 1, true, 1),
  (6, 'Select Protein', 1, 1, true, 1);

-- Get the IDs of the modifier groups we just created
DO $$
DECLARE
  protein_group_1 INTEGER;
  protein_group_2 INTEGER;
  protein_group_3 INTEGER;
  protein_group_4 INTEGER;
  protein_group_5 INTEGER;
  protein_group_6 INTEGER;
BEGIN
  -- Get modifier group IDs for each product
  SELECT id INTO protein_group_1 FROM modifier_groups WHERE product_id = 1 AND name = 'Select Protein';
  SELECT id INTO protein_group_2 FROM modifier_groups WHERE product_id = 2 AND name = 'Select Protein';
  SELECT id INTO protein_group_3 FROM modifier_groups WHERE product_id = 3 AND name = 'Select Protein';
  SELECT id INTO protein_group_4 FROM modifier_groups WHERE product_id = 4 AND name = 'Select Protein';
  SELECT id INTO protein_group_5 FROM modifier_groups WHERE product_id = 5 AND name = 'Select Protein';
  SELECT id INTO protein_group_6 FROM modifier_groups WHERE product_id = 6 AND name = 'Select Protein';

  -- Insert modifiers for Product 1 (Red Robin Gourmet Cheeseburger)
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (protein_group_1, 'Beef - No Pink', 0.00, true, 1),
    (protein_group_1, 'Beef - Some Pink', 0.00, false, 2),
    (protein_group_1, 'Grilled Chicken', 0.00, false, 3),
    (protein_group_1, 'Crispy Chicken', 2.19, false, 4),
    (protein_group_1, 'Turkey Patty', 0.00, false, 5),
    (protein_group_1, 'Veggie Patty', 0.00, false, 6),
    (protein_group_1, 'Impossible™ Burger Patty', 2.99, false, 7);

  -- Insert modifiers for Product 2 (Whiskey River® BBQ)
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (protein_group_2, 'Beef - No Pink', 0.00, true, 1),
    (protein_group_2, 'Beef - Some Pink', 0.00, false, 2),
    (protein_group_2, 'Grilled Chicken', 0.00, false, 3),
    (protein_group_2, 'Crispy Chicken', 2.19, false, 4),
    (protein_group_2, 'Turkey Patty', 0.00, false, 5);

  -- Insert modifiers for Product 3 (Banzai Burger)
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (protein_group_3, 'Beef - No Pink', 0.00, true, 1),
    (protein_group_3, 'Beef - Some Pink', 0.00, false, 2),
    (protein_group_3, 'Grilled Chicken', 0.00, false, 3),
    (protein_group_3, 'Crispy Chicken', 2.19, false, 4);

  -- Insert modifiers for Product 4 (Smoke & Pepper Burger)
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (protein_group_4, 'Beef - No Pink', 0.00, true, 1),
    (protein_group_4, 'Beef - Some Pink', 0.00, false, 2),
    (protein_group_4, 'Grilled Chicken', 0.00, false, 3);

  -- Insert modifiers for Product 5 (Sautéed 'Shroom Burger)
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (protein_group_5, 'Beef - No Pink', 0.00, true, 1),
    (protein_group_5, 'Beef - Some Pink', 0.00, false, 2),
    (protein_group_5, 'Veggie Patty', 0.00, false, 3),
    (protein_group_5, 'Impossible™ Burger Patty', 2.99, false, 4);

  -- Insert modifiers for Product 6 (Chili Chili Cheeseburger)
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    (protein_group_6, 'Beef - No Pink', 0.00, true, 1),
    (protein_group_6, 'Beef - Some Pink', 0.00, false, 2),
    (protein_group_6, 'Grilled Chicken', 0.00, false, 3);

END $$;

-- =====================================================
-- 2. SIDE CHOICE (Required for all burgers)
-- =====================================================

INSERT INTO modifier_groups (product_id, name, min_selections, max_selections, is_required, display_order)
VALUES 
  (1, 'Choose Your Side', 1, 1, true, 2),
  (2, 'Choose Your Side', 1, 1, true, 2),
  (3, 'Choose Your Side', 1, 1, true, 2),
  (4, 'Choose Your Side', 1, 1, true, 2),
  (5, 'Choose Your Side', 1, 1, true, 2),
  (6, 'Choose Your Side', 1, 1, true, 2);

DO $$
DECLARE
  side_group_1 INTEGER;
  side_group_2 INTEGER;
  side_group_3 INTEGER;
  side_group_4 INTEGER;
  side_group_5 INTEGER;
  side_group_6 INTEGER;
BEGIN
  SELECT id INTO side_group_1 FROM modifier_groups WHERE product_id = 1 AND name = 'Choose Your Side';
  SELECT id INTO side_group_2 FROM modifier_groups WHERE product_id = 2 AND name = 'Choose Your Side';
  SELECT id INTO side_group_3 FROM modifier_groups WHERE product_id = 3 AND name = 'Choose Your Side';
  SELECT id INTO side_group_4 FROM modifier_groups WHERE product_id = 4 AND name = 'Choose Your Side';
  SELECT id INTO side_group_5 FROM modifier_groups WHERE product_id = 5 AND name = 'Choose Your Side';
  SELECT id INTO side_group_6 FROM modifier_groups WHERE product_id = 6 AND name = 'Choose Your Side';

  -- Insert side options for all burger products
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    -- Product 1 sides
    (side_group_1, 'Steak Fries', 0.00, true, 1),
    (side_group_1, 'Garlic Parmesan Fries', 0.00, false, 2),
    (side_group_1, 'Sweet Potato Fries', 1.49, false, 3),
    (side_group_1, 'Onion Rings', 1.49, false, 4),
    (side_group_1, 'Coleslaw', 0.00, false, 5),
    (side_group_1, 'Side Salad', 0.00, false, 6),
    (side_group_1, 'Caesar Salad', 1.49, false, 7),
    (side_group_1, 'Steamed Broccoli', 0.00, false, 8),
    -- Product 2 sides
    (side_group_2, 'Steak Fries', 0.00, true, 1),
    (side_group_2, 'Garlic Parmesan Fries', 0.00, false, 2),
    (side_group_2, 'Sweet Potato Fries', 1.49, false, 3),
    (side_group_2, 'Onion Rings', 1.49, false, 4),
    (side_group_2, 'Coleslaw', 0.00, false, 5),
    (side_group_2, 'Side Salad', 0.00, false, 6),
    -- Product 3 sides
    (side_group_3, 'Steak Fries', 0.00, true, 1),
    (side_group_3, 'Garlic Parmesan Fries', 0.00, false, 2),
    (side_group_3, 'Sweet Potato Fries', 1.49, false, 3),
    (side_group_3, 'Onion Rings', 1.49, false, 4),
    (side_group_3, 'Side Salad', 0.00, false, 5),
    -- Product 4 sides
    (side_group_4, 'Steak Fries', 0.00, true, 1),
    (side_group_4, 'Garlic Parmesan Fries', 0.00, false, 2),
    (side_group_4, 'Sweet Potato Fries', 1.49, false, 3),
    (side_group_4, 'Onion Rings', 1.49, false, 4),
    -- Product 5 sides
    (side_group_5, 'Steak Fries', 0.00, true, 1),
    (side_group_5, 'Garlic Parmesan Fries', 0.00, false, 2),
    (side_group_5, 'Sweet Potato Fries', 1.49, false, 3),
    (side_group_5, 'Side Salad', 0.00, false, 4),
    -- Product 6 sides
    (side_group_6, 'Steak Fries', 0.00, true, 1),
    (side_group_6, 'Garlic Parmesan Fries', 0.00, false, 2),
    (side_group_6, 'Sweet Potato Fries', 1.49, false, 3),
    (side_group_6, 'Onion Rings', 1.49, false, 4);

END $$;

-- =====================================================
-- 3. TOPPINGS & ADDITIONS (Optional - Multi-select)
-- =====================================================

INSERT INTO modifier_groups (product_id, name, min_selections, max_selections, is_required, display_order)
VALUES 
  (1, 'Add Toppings', 0, NULL, false, 3),
  (2, 'Add Toppings', 0, NULL, false, 3),
  (3, 'Add Toppings', 0, NULL, false, 3),
  (4, 'Add Toppings', 0, NULL, false, 3),
  (5, 'Add Toppings', 0, NULL, false, 3),
  (6, 'Add Toppings', 0, NULL, false, 3);

DO $$
DECLARE
  topping_group_1 INTEGER;
  topping_group_2 INTEGER;
  topping_group_3 INTEGER;
  topping_group_4 INTEGER;
  topping_group_5 INTEGER;
  topping_group_6 INTEGER;
BEGIN
  SELECT id INTO topping_group_1 FROM modifier_groups WHERE product_id = 1 AND name = 'Add Toppings';
  SELECT id INTO topping_group_2 FROM modifier_groups WHERE product_id = 2 AND name = 'Add Toppings';
  SELECT id INTO topping_group_3 FROM modifier_groups WHERE product_id = 3 AND name = 'Add Toppings';
  SELECT id INTO topping_group_4 FROM modifier_groups WHERE product_id = 4 AND name = 'Add Toppings';
  SELECT id INTO topping_group_5 FROM modifier_groups WHERE product_id = 5 AND name = 'Add Toppings';
  SELECT id INTO topping_group_6 FROM modifier_groups WHERE product_id = 6 AND name = 'Add Toppings';

  -- Insert topping options
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    -- Product 1 toppings
    (topping_group_1, 'Extra Cheese', 1.29, false, 1),
    (topping_group_1, 'Bacon', 1.99, false, 2),
    (topping_group_1, 'Avocado', 1.49, false, 3),
    (topping_group_1, 'Fried Egg', 1.49, false, 4),
    (topping_group_1, 'Jalapeños', 0.79, false, 5),
    (topping_group_1, 'Sautéed Mushrooms', 1.29, false, 6),
    (topping_group_1, 'Grilled Onions', 0.79, false, 7),
    -- Product 2 toppings
    (topping_group_2, 'Extra Cheese', 1.29, false, 1),
    (topping_group_2, 'Extra Bacon', 1.99, false, 2),
    (topping_group_2, 'Avocado', 1.49, false, 3),
    (topping_group_2, 'Fried Egg', 1.49, false, 4),
    (topping_group_2, 'Jalapeños', 0.79, false, 5),
    -- Product 3 toppings
    (topping_group_3, 'Extra Cheese', 1.29, false, 1),
    (topping_group_3, 'Bacon', 1.99, false, 2),
    (topping_group_3, 'Extra Pineapple', 0.79, false, 3),
    (topping_group_3, 'Avocado', 1.49, false, 4),
    -- Product 4 toppings
    (topping_group_4, 'Extra Cheese', 1.29, false, 1),
    (topping_group_4, 'Extra Bacon', 1.99, false, 2),
    (topping_group_4, 'Avocado', 1.49, false, 3),
    (topping_group_4, 'Jalapeños', 0.79, false, 4),
    -- Product 5 toppings
    (topping_group_5, 'Extra Cheese', 1.29, false, 1),
    (topping_group_5, 'Bacon', 1.99, false, 2),
    (topping_group_5, 'Extra Mushrooms', 1.29, false, 3),
    (topping_group_5, 'Avocado', 1.49, false, 4),
    -- Product 6 toppings
    (topping_group_6, 'Extra Cheese', 1.29, false, 1),
    (topping_group_6, 'Extra Chili', 1.49, false, 2),
    (topping_group_6, 'Bacon', 1.99, false, 3),
    (topping_group_6, 'Jalapeños', 0.79, false, 4);

END $$;

-- =====================================================
-- 4. REMOVE INGREDIENTS (Optional)
-- =====================================================

INSERT INTO modifier_groups (product_id, name, min_selections, max_selections, is_required, display_order)
VALUES 
  (1, 'Remove Ingredients', 0, NULL, false, 4),
  (2, 'Remove Ingredients', 0, NULL, false, 4),
  (3, 'Remove Ingredients', 0, NULL, false, 4),
  (4, 'Remove Ingredients', 0, NULL, false, 4),
  (5, 'Remove Ingredients', 0, NULL, false, 4),
  (6, 'Remove Ingredients', 0, NULL, false, 4);

DO $$
DECLARE
  remove_group_1 INTEGER;
  remove_group_2 INTEGER;
  remove_group_3 INTEGER;
  remove_group_4 INTEGER;
  remove_group_5 INTEGER;
  remove_group_6 INTEGER;
BEGIN
  SELECT id INTO remove_group_1 FROM modifier_groups WHERE product_id = 1 AND name = 'Remove Ingredients';
  SELECT id INTO remove_group_2 FROM modifier_groups WHERE product_id = 2 AND name = 'Remove Ingredients';
  SELECT id INTO remove_group_3 FROM modifier_groups WHERE product_id = 3 AND name = 'Remove Ingredients';
  SELECT id INTO remove_group_4 FROM modifier_groups WHERE product_id = 4 AND name = 'Remove Ingredients';
  SELECT id INTO remove_group_5 FROM modifier_groups WHERE product_id = 5 AND name = 'Remove Ingredients';
  SELECT id INTO remove_group_6 FROM modifier_groups WHERE product_id = 6 AND name = 'Remove Ingredients';

  -- Insert remove options
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    -- Product 1 remove options
    (remove_group_1, 'No Lettuce', 0.00, false, 1),
    (remove_group_1, 'No Tomatoes', 0.00, false, 2),
    (remove_group_1, 'No Onions', 0.00, false, 3),
    (remove_group_1, 'No Pickles', 0.00, false, 4),
    (remove_group_1, 'No Mayo', 0.00, false, 5),
    -- Product 2 remove options
    (remove_group_2, 'No Lettuce', 0.00, false, 1),
    (remove_group_2, 'No Tomatoes', 0.00, false, 2),
    (remove_group_2, 'No Onion Straws', 0.00, false, 3),
    (remove_group_2, 'No Mayo', 0.00, false, 4),
    -- Product 3 remove options
    (remove_group_3, 'No Lettuce', 0.00, false, 1),
    (remove_group_3, 'No Tomatoes', 0.00, false, 2),
    (remove_group_3, 'No Pineapple', 0.00, false, 3),
    (remove_group_3, 'No Mayo', 0.00, false, 4),
    -- Product 4 remove options
    (remove_group_4, 'No Lettuce', 0.00, false, 1),
    (remove_group_4, 'No Tomatoes', 0.00, false, 2),
    (remove_group_4, 'No Onions', 0.00, false, 3),
    -- Product 5 remove options
    (remove_group_5, 'No Lettuce', 0.00, false, 1),
    (remove_group_5, 'No Tomatoes', 0.00, false, 2),
    (remove_group_5, 'No Onions', 0.00, false, 3),
    -- Product 6 remove options
    (remove_group_6, 'No Lettuce', 0.00, false, 1),
    (remove_group_6, 'No Tomatoes', 0.00, false, 2),
    (remove_group_6, 'No Jalapeños', 0.00, false, 3);

END $$;

-- =====================================================
-- 5. SALAD MODIFIERS
-- =====================================================

-- Assuming products 7-10 are salads
INSERT INTO modifier_groups (product_id, name, min_selections, max_selections, is_required, display_order)
VALUES 
  (7, 'Choose Dressing', 1, 1, true, 1),
  (8, 'Choose Dressing', 1, 1, true, 1),
  (9, 'Choose Dressing', 1, 1, true, 1),
  (10, 'Choose Dressing', 1, 1, true, 1);

DO $$
DECLARE
  dressing_group_7 INTEGER;
  dressing_group_8 INTEGER;
  dressing_group_9 INTEGER;
  dressing_group_10 INTEGER;
BEGIN
  SELECT id INTO dressing_group_7 FROM modifier_groups WHERE product_id = 7 AND name = 'Choose Dressing';
  SELECT id INTO dressing_group_8 FROM modifier_groups WHERE product_id = 8 AND name = 'Choose Dressing';
  SELECT id INTO dressing_group_9 FROM modifier_groups WHERE product_id = 9 AND name = 'Choose Dressing';
  SELECT id INTO dressing_group_10 FROM modifier_groups WHERE product_id = 10 AND name = 'Choose Dressing';

  -- Insert dressing options
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    -- Product 7 dressings
    (dressing_group_7, 'Ranch', 0.00, true, 1),
    (dressing_group_7, 'Caesar', 0.00, false, 2),
    (dressing_group_7, 'Balsamic Vinaigrette', 0.00, false, 3),
    (dressing_group_7, 'Blue Cheese', 0.00, false, 4),
    (dressing_group_7, 'Honey Mustard', 0.00, false, 5),
    (dressing_group_7, 'Italian', 0.00, false, 6),
    (dressing_group_7, 'Oil & Vinegar', 0.00, false, 7),
    (dressing_group_7, 'No Dressing', 0.00, false, 8),
    -- Product 8 dressings
    (dressing_group_8, 'Caesar', 0.00, true, 1),
    (dressing_group_8, 'Ranch', 0.00, false, 2),
    (dressing_group_8, 'Balsamic Vinaigrette', 0.00, false, 3),
    (dressing_group_8, 'No Dressing', 0.00, false, 4),
    -- Product 9 dressings
    (dressing_group_9, 'Ranch', 0.00, true, 1),
    (dressing_group_9, 'Caesar', 0.00, false, 2),
    (dressing_group_9, 'Balsamic Vinaigrette', 0.00, false, 3),
    (dressing_group_9, 'Honey Mustard', 0.00, false, 4),
    (dressing_group_9, 'No Dressing', 0.00, false, 5),
    -- Product 10 dressings
    (dressing_group_10, 'Ranch', 0.00, true, 1),
    (dressing_group_10, 'Caesar', 0.00, false, 2),
    (dressing_group_10, 'Italian', 0.00, false, 3),
    (dressing_group_10, 'No Dressing', 0.00, false, 4);

END $$;

-- Add protein options for salads
INSERT INTO modifier_groups (product_id, name, min_selections, max_selections, is_required, display_order)
VALUES 
  (7, 'Add Protein', 0, 1, false, 2),
  (8, 'Add Protein', 0, 1, false, 2),
  (9, 'Add Protein', 0, 1, false, 2),
  (10, 'Add Protein', 0, 1, false, 2);

DO $$
DECLARE
  protein_salad_7 INTEGER;
  protein_salad_8 INTEGER;
  protein_salad_9 INTEGER;
  protein_salad_10 INTEGER;
BEGIN
  SELECT id INTO protein_salad_7 FROM modifier_groups WHERE product_id = 7 AND name = 'Add Protein';
  SELECT id INTO protein_salad_8 FROM modifier_groups WHERE product_id = 8 AND name = 'Add Protein';
  SELECT id INTO protein_salad_9 FROM modifier_groups WHERE product_id = 9 AND name = 'Add Protein';
  SELECT id INTO protein_salad_10 FROM modifier_groups WHERE product_id = 10 AND name = 'Add Protein';

  -- Insert protein options for salads
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    -- Product 7 proteins
    (protein_salad_7, 'Grilled Chicken', 4.99, false, 1),
    (protein_salad_7, 'Crispy Chicken', 4.99, false, 2),
    (protein_salad_7, 'Grilled Salmon', 6.99, false, 3),
    (protein_salad_7, 'Grilled Shrimp', 6.99, false, 4),
    -- Product 8 proteins
    (protein_salad_8, 'Grilled Chicken', 4.99, false, 1),
    (protein_salad_8, 'Crispy Chicken', 4.99, false, 2),
    (protein_salad_8, 'Grilled Salmon', 6.99, false, 3),
    -- Product 9 proteins
    (protein_salad_9, 'Grilled Chicken', 4.99, false, 1),
    (protein_salad_9, 'Crispy Chicken', 4.99, false, 2),
    (protein_salad_9, 'Grilled Shrimp', 6.99, false, 3),
    -- Product 10 proteins
    (protein_salad_10, 'Grilled Chicken', 4.99, false, 1),
    (protein_salad_10, 'Grilled Salmon', 6.99, false, 2);

END $$;

-- =====================================================
-- 6. SANDWICH MODIFIERS
-- =====================================================

-- Assuming products 11-15 are sandwiches/wraps
INSERT INTO modifier_groups (product_id, name, min_selections, max_selections, is_required, display_order)
VALUES 
  (11, 'Choose Bread', 1, 1, true, 1),
  (12, 'Choose Bread', 1, 1, true, 1),
  (13, 'Choose Bread', 1, 1, true, 1);

DO $$
DECLARE
  bread_group_11 INTEGER;
  bread_group_12 INTEGER;
  bread_group_13 INTEGER;
BEGIN
  SELECT id INTO bread_group_11 FROM modifier_groups WHERE product_id = 11 AND name = 'Choose Bread';
  SELECT id INTO bread_group_12 FROM modifier_groups WHERE product_id = 12 AND name = 'Choose Bread';
  SELECT id INTO bread_group_13 FROM modifier_groups WHERE product_id = 13 AND name = 'Choose Bread';

  -- Insert bread options
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    -- Product 11 bread options
    (bread_group_11, 'White Bread', 0.00, true, 1),
    (bread_group_11, 'Wheat Bread', 0.00, false, 2),
    (bread_group_11, 'Sourdough', 0.49, false, 3),
    (bread_group_11, 'Ciabatta', 0.49, false, 4),
    (bread_group_11, 'Wrap', 0.00, false, 5),
    -- Product 12 bread options
    (bread_group_12, 'White Bread', 0.00, true, 1),
    (bread_group_12, 'Wheat Bread', 0.00, false, 2),
    (bread_group_12, 'Sourdough', 0.49, false, 3),
    (bread_group_12, 'Wrap', 0.00, false, 4),
    -- Product 13 bread options
    (bread_group_13, 'White Bread', 0.00, true, 1),
    (bread_group_13, 'Wheat Bread', 0.00, false, 2),
    (bread_group_13, 'Ciabatta', 0.49, false, 3);

END $$;

-- Add sides for sandwiches
INSERT INTO modifier_groups (product_id, name, min_selections, max_selections, is_required, display_order)
VALUES 
  (11, 'Choose Your Side', 1, 1, true, 2),
  (12, 'Choose Your Side', 1, 1, true, 2),
  (13, 'Choose Your Side', 1, 1, true, 2);

DO $$
DECLARE
  sandwich_side_11 INTEGER;
  sandwich_side_12 INTEGER;
  sandwich_side_13 INTEGER;
BEGIN
  SELECT id INTO sandwich_side_11 FROM modifier_groups WHERE product_id = 11 AND name = 'Choose Your Side';
  SELECT id INTO sandwich_side_12 FROM modifier_groups WHERE product_id = 12 AND name = 'Choose Your Side';
  SELECT id INTO sandwich_side_13 FROM modifier_groups WHERE product_id = 13 AND name = 'Choose Your Side';

  -- Insert side options for sandwiches
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    -- Product 11 sides
    (sandwich_side_11, 'Chips', 0.00, true, 1),
    (sandwich_side_11, 'Fries', 0.00, false, 2),
    (sandwich_side_11, 'Side Salad', 0.00, false, 3),
    (sandwich_side_11, 'Coleslaw', 0.00, false, 4),
    (sandwich_side_11, 'Fruit Cup', 1.49, false, 5),
    -- Product 12 sides
    (sandwich_side_12, 'Chips', 0.00, true, 1),
    (sandwich_side_12, 'Fries', 0.00, false, 2),
    (sandwich_side_12, 'Side Salad', 0.00, false, 3),
    (sandwich_side_12, 'Fruit Cup', 1.49, false, 4),
    -- Product 13 sides
    (sandwich_side_13, 'Chips', 0.00, true, 1),
    (sandwich_side_13, 'Fries', 0.00, false, 2),
    (sandwich_side_13, 'Side Salad', 0.00, false, 3);

END $$;

-- =====================================================
-- 7. APPETIZER MODIFIERS
-- =====================================================

-- Dipping sauces for appetizers (products 16-20)
INSERT INTO modifier_groups (product_id, name, min_selections, max_selections, is_required, display_order)
VALUES 
  (16, 'Choose Dipping Sauce', 1, 2, true, 1),
  (17, 'Choose Dipping Sauce', 1, 2, true, 1),
  (18, 'Choose Dipping Sauce', 1, 1, true, 1);

DO $$
DECLARE
  sauce_group_16 INTEGER;
  sauce_group_17 INTEGER;
  sauce_group_18 INTEGER;
BEGIN
  SELECT id INTO sauce_group_16 FROM modifier_groups WHERE product_id = 16 AND name = 'Choose Dipping Sauce';
  SELECT id INTO sauce_group_17 FROM modifier_groups WHERE product_id = 17 AND name = 'Choose Dipping Sauce';
  SELECT id INTO sauce_group_18 FROM modifier_groups WHERE product_id = 18 AND name = 'Choose Dipping Sauce';

  -- Insert sauce options
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    -- Product 16 sauces (Wings)
    (sauce_group_16, 'Ranch', 0.00, true, 1),
    (sauce_group_16, 'Blue Cheese', 0.00, false, 2),
    (sauce_group_16, 'BBQ Sauce', 0.00, false, 3),
    (sauce_group_16, 'Honey Mustard', 0.00, false, 4),
    -- Product 17 sauces (Fries)
    (sauce_group_17, 'Ketchup', 0.00, true, 1),
    (sauce_group_17, 'Ranch', 0.00, false, 2),
    (sauce_group_17, 'BBQ Sauce', 0.00, false, 3),
    (sauce_group_17, 'Honey Mustard', 0.00, false, 4),
    (sauce_group_17, 'Sriracha Mayo', 0.00, false, 5),
    -- Product 18 sauces (Mozzarella Sticks)
    (sauce_group_18, 'Marinara', 0.00, true, 1),
    (sauce_group_18, 'Ranch', 0.00, false, 2),
    (sauce_group_18, 'Honey Mustard', 0.00, false, 3);

END $$;

-- =====================================================
-- 8. BEVERAGE MODIFIERS
-- =====================================================

-- Size options for beverages (products 25-32)
INSERT INTO modifier_groups (product_id, name, min_selections, max_selections, is_required, display_order)
VALUES 
  (25, 'Choose Size', 1, 1, true, 1),
  (26, 'Choose Size', 1, 1, true, 1),
  (27, 'Choose Size', 1, 1, true, 1),
  (28, 'Choose Size', 1, 1, true, 1),
  (29, 'Choose Size', 1, 1, true, 1),
  (30, 'Choose Size', 1, 1, true, 1);

DO $$
DECLARE
  size_group_25 INTEGER;
  size_group_26 INTEGER;
  size_group_27 INTEGER;
  size_group_28 INTEGER;
  size_group_29 INTEGER;
  size_group_30 INTEGER;
BEGIN
  SELECT id INTO size_group_25 FROM modifier_groups WHERE product_id = 25 AND name = 'Choose Size';
  SELECT id INTO size_group_26 FROM modifier_groups WHERE product_id = 26 AND name = 'Choose Size';
  SELECT id INTO size_group_27 FROM modifier_groups WHERE product_id = 27 AND name = 'Choose Size';
  SELECT id INTO size_group_28 FROM modifier_groups WHERE product_id = 28 AND name = 'Choose Size';
  SELECT id INTO size_group_29 FROM modifier_groups WHERE product_id = 29 AND name = 'Choose Size';
  SELECT id INTO size_group_30 FROM modifier_groups WHERE product_id = 30 AND name = 'Choose Size';

  -- Insert size options
  INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, display_order)
  VALUES 
    -- Soft drinks
    (size_group_25, 'Small (16 oz)', 0.00, false, 1),
    (size_group_25, 'Medium (21 oz)', 0.49, true, 2),
    (size_group_25, 'Large (32 oz)', 0.99, false, 3),
    -- Iced Tea
    (size_group_26, 'Small (16 oz)', 0.00, false, 1),
    (size_group_26, 'Medium (21 oz)', 0.49, true, 2),
    (size_group_26, 'Large (32 oz)', 0.99, false, 3),
    -- Lemonade
    (size_group_27, 'Small (16 oz)', 0.00, false, 1),
    (size_group_27, 'Medium (21 oz)', 0.49, true, 2),
    (size_group_27, 'Large (32 oz)', 0.99, false, 3),
    -- Coffee
    (size_group_28, 'Regular', 0.00, true, 1),
    (size_group_28, 'Large', 0.49, false, 2),
    -- Milkshake
    (size_group_29, 'Regular', 0.00, true, 1),
    (size_group_29, 'Large', 1.49, false, 2),
    -- Beer/Wine
    (size_group_30, '12 oz', 0.00, true, 1),
    (size_group_30, '16 oz', 1.99, false, 2);

END $$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all modifiers were created successfully

SELECT 
  p.name AS product_name,
  mg.name AS modifier_group,
  mg.is_required,
  COUNT(m.id) AS modifier_count
FROM products p
LEFT JOIN modifier_groups mg ON p.id = mg.product_id
LEFT JOIN modifiers m ON mg.id = m.modifier_group_id
WHERE p.id <= 30
GROUP BY p.id, p.name, mg.id, mg.name, mg.is_required
ORDER BY p.id, mg.display_order;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Product modifiers created successfully! ✅' AS status;

