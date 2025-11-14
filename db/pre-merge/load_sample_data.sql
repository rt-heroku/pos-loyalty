
\echo Updating existing products with enhanced data (sample data based on Tumi examples)
INSERT INTO public.products ("name",price,category,stock,image,created_at,updated_at,sku,product_type,brand,collection,material,color,description,dimensions,weight,warranty_info,care_instructions,main_image_url,is_active,featured,sort_order,sf_id) VALUES
     ('Alpha Bravo Business Backpack',395.00,'Backpacks',14,'🎒','2025-08-01 14:57:51.790811','2025-08-04 16:50:21.345291','TUM-BAG-002','Backpack','TUMI','Alpha Bravo','Ballistic Nylon','Anthracite','This compact backpack with a streamlined silhouette has smart organization for commuting and travel gear, as well as a dedicated padded laptop compartment.','17.5" x 12.5" x 7"',3.80,'','','https://tumi.scene7.com/is/image/Tumi/1426141041_main?wid=1020&hei=1238',true,true,0,'01tHo000004zTtgIAE'),
     ('Voyageur Celina Backpack',275.00,'Backpacks',16,'🎒','2025-08-01 14:57:51.790811','2025-08-04 17:56:14.077857','TUM-BAG-003','Backpack','TUMI','Voyageur','Nylon','Black','Lightweight everyday backpack with modern design','15" x 11" x 5"',2.10,'','','https://tumi.scene7.com/is/image/Tumi/146566T522_main?wid=1020&hei=1238',true,false,0,'01tHo000004zTtvIAE'),
     ('Alpha Continental Carry-On',1050.00,'Carry-On',11,'🧳','2025-08-01 14:57:51.790811','2025-08-08 14:25:17.900774','TUM-LUG-003','Luggage','TUMI','Alpha','Ballistic Nylon','Black','Versatile and compact, this case makes taking your business on the road a breeze. With the option of being carried or wheeled, it gives you flexibility wherever you need to travel.','22" x 14" x 9"',8.90,'','','https://tumi.scene7.com/is/image/Tumi/1171571041_main?wid=1020&hei=1238',true,false,0,'01tHo000004zTtWIAU'),
     ('19 Degree Extended Trip Case',950.00,'Luggage',6,'🧳','2025-08-01 14:57:51.790811','2025-08-08 14:28:36.550216','TUM-CASE-01','Luggage','TUMI','','','','','',NULL,'','','https://tumi.scene7.com/is/image/Tumi/1171611041_main?wid=1020&hei=1238',true,false,0,'01tHo000004zTtlIAE'),
     ('Harrison Nylon Portfolio',225.00,'Accessories',24,'💼','2025-08-01 14:57:51.790811','2025-08-04 17:51:04.211511','TUM-ACC-001','Portfolio','TUMI','Harrison','Nylon','Navy','Carry what you need in style for daily commutes or as a personal item when you fly. This elevated messenger includes thoughtfully placed pockets to carry and organize your laptop, work documents, and more','13" x 10" x 1"',0.80,'','','https://tumi.scene7.com/is/image/Tumi/1524241041_main?wid=1020&hei=1238',true,false,0,'01tHo000004zTtqIAE')
     ON CONFLICT (sku) DO NOTHING;

\echo Inserting sample customers with loyalty numbers
INSERT INTO customers (loyalty_number, first_name, last_name, name, email, phone, points, total_spent, visit_count, last_visit, member_type, member_status, enrollment_date, notes) VALUES
('LOY001', 'John', 'Doe', 'John Doe', 'john@email.com', '555-0123', 150, 75.50, 12, '2025-07-25 14:30:00', 'Individual', 'Active', CURRENT_DATE - INTERVAL '1 year', 'Frequent visitor, prefers email communication'),
('LOY002', 'Jane', 'Smith', 'Jane Smith', 'jane@email.com', '555-0456', 220, 110.25, 18, '2025-07-28 10:15:00', 'Individual', 'Active', CURRENT_DATE - INTERVAL '1 year', 'VIP customer, birthday is in December'),
('LOY003', 'Mike', 'Johnson', 'Mike Johnson', 'mike@email.com', '555-0789', 80, 40.00, 6, '2025-07-20 16:45:00', 'Individual', 'Inactive', CURRENT_DATE - INTERVAL '1 year', 'New customer, interested in backpack collection'),
('LOY004', 'Sarah', 'Wilson', 'Sarah Wilson', 'sarah@email.com', '555-0321', 350, 175.75, 25, '2025-07-29 12:00:00', 'Individual', 'Under Fraud Investigation', CURRENT_DATE - INTERVAL '1 year', 'Large enterprise customer, quarterly orders')
ON CONFLICT (loyalty_number) DO NOTHING;
/*
\echo Creating some sample corporate customers
INSERT INTO customers (loyalty_number, first_name, last_name, name, email, phone, member_type, member_status, enrollment_date, notes) VALUES
('CRP001', 'TechCorp', 'Solutions', 'TechCorp Solutions', 'purchasing@techcorp.com', '(555) 987-6543', 'Corporate', 'Active', CURRENT_DATE - INTERVAL '6 months', 'Corporate account for bulk purchases'),
('CRP002', 'Global', 'Industries', 'Global Industries LLC', 'admin@globalindustries.com', '(555) 876-5432', 'Corporate', 'Active', CURRENT_DATE - INTERVAL '1 year', 'Large enterprise customer, quarterly orders')
ON CONFLICT (loyalty_number) DO NOTHING;
*/

\echo Inserting sample transactions
INSERT INTO public.transactions (customer_id,subtotal,tax,total,payment_method,amount_received,change_amount,points_earned,points_redeemed,created_at) VALUES
     ((SELECT id FROM customers WHERE loyalty_number = 'LOY001'),1445.00,115.60,1560.60,'cash',1560.60,NULL,1560,0,'2025-08-05 15:33:37.880566'),
     ((SELECT id FROM customers WHERE loyalty_number = 'LOY002'),1450.00,116.00,1566.00,'cash',1566.00,NULL,1566,0,'2025-08-05 15:07:48.454387'),
     ((SELECT id FROM customers WHERE loyalty_number = 'LOY003'),950.00,76.00,1026.00,'cash',1026.00,NULL,1026,0,'2025-08-05 19:12:52.504183'),
     ((SELECT id FROM customers WHERE loyalty_number = 'LOY004'),825.00,66.00,891.00,'cash',891.00,NULL,891,0,'2025-08-05 19:13:14.823182');

\echo Inserting sample product features
INSERT INTO product_features (product_id, feature_name, feature_value) VALUES
((SELECT id FROM products WHERE sku = 'TUM-LUG-002'), 'Expandable', 'Yes'),
((SELECT id FROM products WHERE sku = 'TUM-LUG-002'), 'Lock Type', 'TSA Combination Lock'),
((SELECT id FROM products WHERE sku = 'TUM-LUG-002'), 'Wheel Type', '4 Dual Spinner Wheels'),
((SELECT id FROM products WHERE sku = 'TUM-LUG-002'), 'Handle Type', 'Telescoping Handle'),
((SELECT id FROM products WHERE sku = 'TUM-LUG-002'), 'Interior Organization', 'Compression Straps'),
((SELECT id FROM products WHERE sku = 'TUM-BAG-003'), 'Laptop Compartment', 'Padded 15" compartment'),
((SELECT id FROM products WHERE sku = 'TUM-BAG-003'), 'USB Port', 'Integrated charging port'),
((SELECT id FROM products WHERE sku = 'TUM-BAG-003'), 'Organizational Pockets', 'Multiple interior pockets'),
((SELECT id FROM products WHERE sku = 'TUM-BAG-003'), 'Water Resistant', 'Weather-resistant exterior');

\echo Inserting sample location inventory (migrate existing product stock)
INSERT INTO location_inventory (location_id, product_id, quantity)
SELECT 1 as location_id, id, stock FROM products WHERE stock > 0
ON CONFLICT (location_id, product_id) DO NOTHING;

\echo Updating existing transactions to have location_id (assign to first location)
UPDATE transactions SET location_id = 1 WHERE location_id IS NULL;

\echo Inserting sample work orders
INSERT INTO work_orders (location_id, customer_id, subject, work_type, priority, status, description) VALUES
(1, (SELECT id FROM customers WHERE loyalty_number = 'LOY001'), 'Zipper Repair on Alpha Backpack', 'Repair', 'Medium', 'New', 'Customer reports zipper is stuck and needs professional repair'),
(1, (SELECT id FROM customers WHERE loyalty_number = 'LOY002'), 'Wheel Replacement on 19 Degree Luggage', 'Repair', 'High', 'Scheduled', 'One wheel is damaged and needs replacement'),
(2, (SELECT id FROM customers WHERE loyalty_number = 'LOY003'), 'Leather Conditioning Service', 'Maintenance', 'Low', 'In Progress', 'Annual leather conditioning for briefcase'),
(2, (SELECT id FROM customers WHERE loyalty_number = 'LOY004'), 'Custom Monogram Addition', 'Customization', 'Medium', 'Completed', 'Add customer initials to new purchase')
ON CONFLICT (work_order_number) DO NOTHING;

\echo Inserting work order products
INSERT INTO work_order_products (work_order_id, product_id, product_name, product_sku, issue_description) VALUES
(1, (SELECT id FROM products WHERE sku = 'TUM-BAG-002'), 'Alpha Bravo Business Backpack', 'TUM-BAG-002', 'Main zipper stuck, requires replacement'),
(2, (SELECT id FROM products WHERE sku = 'TUM-LUG-004'), '19 Degree Extended Trip Case', 'TUM-LUG-004', 'Front right wheel damaged, wobbles when rolling'),
(3, (SELECT id FROM products WHERE sku = 'TUM-ACC-001'), 'Harrison Nylon Portfolio', 'TUM-ACC-001', 'Leather shows wear, needs conditioning'),
(4, (SELECT id FROM products WHERE sku = 'TUM-LUG-003'), 'Alpha Continental Carry-On', 'TUM-LUG-003', 'New purchase, add monogram to front panel');

\echo Inserting sample transaction items
INSERT INTO public.transaction_items (transaction_id,product_id,product_name,product_price,quantity,subtotal) VALUES
     (34, (SELECT id FROM products WHERE sku = 'TUM-LUG-004'), '19 Degree Extended Trip Case',950.00,1,950.00),
     (34, (SELECT id FROM products WHERE sku = 'TUM-BAG-003'), 'Voyageur Celina Backpack',275.00,1,275.00),
     (34, (SELECT id FROM products WHERE sku = 'TUM-ACC-001'), 'Harrison Nylon Portfolio',225.00,1,225.00),
     (35, (SELECT id FROM products WHERE sku = 'TUM-BAG-002'), 'Alpha Bravo Business Backpack',395.00,1,395.00),
     (35, (SELECT id FROM products WHERE sku = 'TUM-LUG-003'), 'Alpha Continental Carry-On',1050.00,1,1050.00),
     (36, (SELECT id FROM products WHERE sku = 'TUM-LUG-004'), '19 Degree Extended Trip Case',950.00,1,950.00),
     (37, (SELECT id FROM products WHERE sku = 'TUM-BAG-003'), 'Voyageur Celina Backpack',275.00,3,825.00);

-- \echo Inserting sample product images
-- INSERT INTO public.product_images (product_id,image_url,alt_text,is_primary,sort_order,created_at) VALUES
-- 	 (89,'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=600&fit=crop&crop=center','WhiteSocks Aristocat crew socks with distinguished cat design',true,0,'2025-09-17 18:50:20.761202'),
-- 	 (90,'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&h=600&fit=crop&crop=center','WhiteSocks Executive Llama no-show socks with business suit design',true,0,'2025-09-17 18:50:21.079147'),
-- 	 (89,'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop&crop=center','Close-up detail of monocle cat pattern on luxury socks',false,1,'2025-09-17 18:50:21.181523'),
-- 	 (90,'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800&h=600&fit=crop&crop=center','Side view showing low profile fit of executive llama socks',false,1,'2025-09-17 18:50:21.274172');

\echo Adding features for new products
INSERT INTO product_features (product_id, feature_name, feature_value) VALUES
-- Alpha Bravo Backpack features
((SELECT id FROM products WHERE sku = 'TUM-BAG-002'), 'Water Resistant', 'Yes'),
((SELECT id FROM products WHERE sku = 'TUM-BAG-002'), 'Organizational Pockets', '15+ pockets'),
((SELECT id FROM products WHERE sku = 'TUM-BAG-002'), 'Laptop Protection', 'Padded compartment'),
((SELECT id FROM products WHERE sku = 'TUM-BAG-002'), 'Durability', 'Military-spec ballistic nylon'),

\echo Voyageur Carson features
((SELECT id FROM products WHERE sku = 'TUM-BAG-003'), 'Weight', 'Ultra-lightweight'),
((SELECT id FROM products WHERE sku = 'TUM-BAG-003'), 'Style', 'Feminine design'),
((SELECT id FROM products WHERE sku = 'TUM-BAG-003'), 'Comfort', 'Padded shoulder straps'),

\echo 19 Degree Extended Trip features
((SELECT id FROM products WHERE sku = 'TUM-LUG-002'), 'Capacity', '120 Liters'),
((SELECT id FROM products WHERE sku = 'TUM-LUG-002'), 'Expandable', 'Up to 25% more space'),
((SELECT id FROM products WHERE sku = 'TUM-LUG-002'), 'Security', 'Integrated TSA lock'),
((SELECT id FROM products WHERE sku = 'TUM-LUG-002'), 'Wheels', '4 dual spinner wheels'),

\echo Alpha Continental features
((SELECT id FROM products WHERE sku = 'TUM-LUG-003'), 'Access', 'Dual-sided access'),
((SELECT id FROM products WHERE sku = 'TUM-LUG-003'), 'Organization', 'Garment compartment'),
((SELECT id FROM products WHERE sku = 'TUM-LUG-003'), 'Durability', 'FXT ballistic nylon'),

\echo Harrison Portfolio features
((SELECT id FROM products WHERE sku = 'TUM-ACC-001'), 'Slim Profile', 'Ultra-thin design'),
((SELECT id FROM products WHERE sku = 'TUM-ACC-001'), 'Protection', 'Padded tablet sleeve'),
((SELECT id FROM products WHERE sku = 'TUM-ACC-001'), 'Organization', 'Document compartments');

\echo Creating some sample customer activity logs for existing transactions
INSERT INTO customer_activity_log (customer_id, activity_type, description, points_change, transaction_id, created_by)
SELECT 
    t.customer_id,
    'purchase',
    'Historical purchase transaction #' || t.id,
    COALESCE(t.points_earned, 0) - COALESCE(t.points_redeemed, 0),
    t.id,
    'data_migration'
FROM transactions t
WHERE t.customer_id IS NOT NULL
ON CONFLICT DO NOTHING;

\echo Creating some sample customer preferences
INSERT INTO customer_preferences (customer_id, preference_key, preference_value)
SELECT 
    c.id,
    'notification_method',
    CASE 
        WHEN c.email IS NOT NULL THEN 'email'
        WHEN c.phone IS NOT NULL THEN 'sms'
        ELSE 'none'
    END
FROM customers c
WHERE c.is_active = true
ON CONFLICT (customer_id, preference_key) DO NOTHING;

\echo Recalculating all customer tiers for existing customers
SELECT recalculate_all_customer_tiers() as updated_customers;
