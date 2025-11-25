-- =============================================================================
-- SAMPLE PROMOTIONS DATA
-- =============================================================================
-- This file adds sample promotions to test the promotions feature
-- Run this after database.sql and load_sample_data.sql
-- =============================================================================

\echo 'Inserting sample promotions...'

-- Clear existing sample promotions (if any)
DELETE FROM customer_promotions WHERE promotion_id IN (SELECT id FROM promotions WHERE sf_id LIKE 'SAMPLE-%');
DELETE FROM promotions WHERE sf_id LIKE 'SAMPLE-%';

-- Insert sample promotions
INSERT INTO promotions (
    sf_id,
    name,
    display_name,
    description,
    is_active,
    is_automatic,
    is_enrollment_required,
    start_date,
    start_date_time,
    end_date,
    end_date_time,
    usage_type,
    total_reward_points,
    point_factor,
    promotion_code,
    discount_order,
    currency_iso_code,
    objective
) VALUES
-- Active Promotions
(
    'SAMPLE-001',
    'Welcome Bonus - 500 Points',
    'Welcome Bonus',
    'New members get 500 bonus points when they make their first purchase!',
    true,
    false,
    true,
    '2024-01-01',
    '2024-01-01 00:00:00',
    '2025-12-31',
    '2025-12-31 23:59:59',
    'Once',
    500,
    1.0,
    'WELCOME500',
    1,
    'USD',
    'Increase new member engagement'
),
(
    'SAMPLE-002',
    'Double Points on Backpacks',
    '2X Points - Backpacks',
    'Earn double points on all backpack purchases this month!',
    true,
    true,
    false,
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '23 days',
    CURRENT_DATE + INTERVAL '23 days' + INTERVAL '23 hours 59 minutes',
    'Unlimited',
    NULL,
    2.0,
    '2XBACKPACK',
    2,
    'USD',
    'Boost backpack sales'
),
(
    'SAMPLE-003',
    'Spend $500, Get 1000 Points',
    'Big Spender Bonus',
    'Spend $500 or more in a single transaction and receive 1000 bonus points!',
    true,
    false,
    false,
    CURRENT_DATE - INTERVAL '14 days',
    CURRENT_DATE - INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '46 days',
    CURRENT_DATE + INTERVAL '46 days' + INTERVAL '23 hours 59 minutes',
    'Unlimited',
    1000,
    1.0,
    'BIGSPEND',
    3,
    'USD',
    'Increase average transaction value'
),
(
    'SAMPLE-004',
    'Birthday Month Bonus',
    '🎂 Birthday Special',
    'Celebrate your birthday with us! Get 300 bonus points during your birthday month.',
    true,
    false,
    true,
    '2024-01-01',
    '2024-01-01 00:00:00',
    '2025-12-31',
    '2025-12-31 23:59:59',
    'Once',
    300,
    1.0,
    'BDAY300',
    4,
    'USD',
    'Celebrate customer birthdays'
),
(
    'SAMPLE-005',
    'Refer a Friend - Both Get 250 Points',
    'Referral Rewards',
    'Share the love! Refer a friend and you both get 250 points when they make their first purchase.',
    true,
    false,
    false,
    '2024-01-01',
    '2024-01-01 00:00:00',
    '2025-12-31',
    '2025-12-31 23:59:59',
    'Unlimited',
    250,
    1.0,
    'REFER250',
    5,
    'USD',
    'Grow customer base through referrals'
),
(
    'SAMPLE-006',
    'Holiday Season Triple Points',
    '3X Holiday Points',
    'Get triple points on all purchases during the holiday season!',
    true,
    true,
    false,
    CURRENT_DATE,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '60 days' + INTERVAL '23 hours 59 minutes',
    'Unlimited',
    NULL,
    3.0,
    'HOLIDAY3X',
    6,
    'USD',
    'Boost holiday sales'
),
(
    'SAMPLE-007',
    'Complete Your Profile - 100 Points',
    'Profile Completion Bonus',
    'Complete your profile with your birthday, phone number, and preferences to earn 100 points!',
    true,
    false,
    true,
    '2024-01-01',
    '2024-01-01 00:00:00',
    '2025-12-31',
    '2025-12-31 23:59:59',
    'Once',
    100,
    1.0,
    'PROFILE100',
    7,
    'USD',
    'Improve customer data quality'
),
(
    'SAMPLE-008',
    'Member Exclusive - Free Shipping',
    'Free Shipping Days',
    'Loyalty members get free shipping on all online orders this week!',
    true,
    true,
    false,
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '5 days' + INTERVAL '23 hours 59 minutes',
    'Unlimited',
    NULL,
    1.0,
    'FREESHIP',
    8,
    'USD',
    'Drive online sales'
),
(
    'SAMPLE-009',
    'Early Access Sale - Gold Tier',
    '⭐ Gold Tier Early Access',
    'Gold tier members get exclusive early access to our annual sale!',
    true,
    false,
    false,
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '14 days' + INTERVAL '23 hours 59 minutes',
    'Unlimited',
    NULL,
    1.5,
    'GOLDACCESS',
    9,
    'USD',
    'Reward top-tier members'
),
(
    'SAMPLE-010',
    'Social Media Share - 50 Points',
    'Social Share Bonus',
    'Share your favorite TUMI product on social media and tag us to earn 50 points!',
    true,
    false,
    true,
    '2024-01-01',
    '2024-01-01 00:00:00',
    '2025-12-31',
    '2025-12-31 23:59:59',
    'Limited',
    50,
    1.0,
    'SOCIAL50',
    10,
    'USD',
    'Increase social media engagement'
);

\echo 'Sample promotions inserted successfully!'

-- Display the promotions
\echo ''
\echo 'Active promotions:'
SELECT 
    id,
    name,
    usage_type,
    total_reward_points,
    is_enrollment_required,
    TO_CHAR(start_date_time, 'YYYY-MM-DD') as start_date,
    TO_CHAR(end_date_time, 'YYYY-MM-DD') as end_date
FROM promotions 
WHERE is_active = true
ORDER BY discount_order;

\echo ''
\echo 'Now enrolling sample customers in some promotions...'

-- Enroll LOY001 (John Doe) in a few promotions
DO $$
DECLARE
    customer_id_var INTEGER;
    welcome_promo_id INTEGER;
    profile_promo_id INTEGER;
    holiday_promo_id INTEGER;
BEGIN
    -- Get customer ID for LOY001
    SELECT id INTO customer_id_var FROM customers WHERE loyalty_number = 'LOY001' LIMIT 1;
    
    -- Get promotion IDs
    SELECT id INTO welcome_promo_id FROM promotions WHERE sf_id = 'SAMPLE-001';
    SELECT id INTO profile_promo_id FROM promotions WHERE sf_id = 'SAMPLE-007';
    SELECT id INTO holiday_promo_id FROM promotions WHERE sf_id = 'SAMPLE-006';
    
    IF customer_id_var IS NOT NULL THEN
        -- Enroll in Welcome Bonus (completed)
        IF welcome_promo_id IS NOT NULL THEN
            INSERT INTO customer_promotions (
                customer_id, 
                promotion_id, 
                is_enrollment_active, 
                enrolled_at,
                status,
                cumulative_usage_completed,
                cumulative_usage_target,
                cumulative_usage_complete_percent,
                completed_at
            ) VALUES (
                customer_id_var, 
                welcome_promo_id, 
                false, 
                CURRENT_DATE - INTERVAL '30 days',
                'completed',
                1,
                1,
                100,
                CURRENT_DATE - INTERVAL '25 days'
            ) ON CONFLICT (customer_id, promotion_id) DO NOTHING;
        END IF;
        
        -- Enroll in Profile Completion (completed)
        IF profile_promo_id IS NOT NULL THEN
            INSERT INTO customer_promotions (
                customer_id, 
                promotion_id, 
                is_enrollment_active, 
                enrolled_at,
                status,
                cumulative_usage_completed,
                cumulative_usage_target,
                cumulative_usage_complete_percent,
                completed_at
            ) VALUES (
                customer_id_var, 
                profile_promo_id, 
                false, 
                CURRENT_DATE - INTERVAL '35 days',
                'completed',
                1,
                1,
                100,
                CURRENT_DATE - INTERVAL '32 days'
            ) ON CONFLICT (customer_id, promotion_id) DO NOTHING;
        END IF;
        
        -- Enroll in Holiday Triple Points (active, in progress)
        IF holiday_promo_id IS NOT NULL THEN
            INSERT INTO customer_promotions (
                customer_id, 
                promotion_id, 
                is_enrollment_active, 
                enrolled_at,
                status,
                cumulative_usage_completed,
                cumulative_usage_target,
                cumulative_usage_complete_percent
            ) VALUES (
                customer_id_var, 
                holiday_promo_id, 
                true, 
                CURRENT_DATE - INTERVAL '5 days',
                'active',
                3,
                10,
                30
            ) ON CONFLICT (customer_id, promotion_id) DO NOTHING;
        END IF;
        
        RAISE NOTICE 'Customer LOY001 enrolled in 3 sample promotions';
    ELSE
        RAISE NOTICE 'Customer LOY001 not found - skipping enrollment';
    END IF;
END $$;

\echo ''
\echo '✓ Sample promotions setup complete!'
\echo ''
\echo 'You can now view promotions in:'
\echo '  - POS: Operations → Promotions'
\echo '  - Loyalty: Search for customer LOY001 to see their enrolled promotions'


