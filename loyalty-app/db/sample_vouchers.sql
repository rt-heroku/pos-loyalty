-- Sample voucher data for testing
-- This file contains sample customer vouchers for testing the loyalty system

-- Insert sample vouchers for existing customers
INSERT INTO customer_vouchers (
    customer_id,
    voucher_code,
    name,
    description,
    status,
    voucher_type,
    face_value,
    discount_percent,
    remaining_value,
    created_date,
    expiration_date,
    image_url,
    is_active
) VALUES
-- Vouchers for customer 1 (John Doe)
(1, 'WELCOME10', 'Welcome Discount', '10% off your first purchase', 'Issued', 'Discount', NULL, 10.00, NULL, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', NULL, true),
(1, 'BIRTHDAY25', 'Birthday Special', '$25 off any purchase over $100', 'Issued', 'Value', 25.00, NULL, 25.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', NULL, true),
(1, 'BACKPACK20', 'Backpack Discount', '20% off any backpack', 'Redeemed', 'Discount', NULL, 20.00, NULL, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', NULL, true),

-- Vouchers for customer 2 (Jane Smith)
(2, 'VIP50', 'VIP Member Discount', '$50 off any purchase', 'Issued', 'Value', 50.00, NULL, 50.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', NULL, true),
(2, 'SUMMER15', 'Summer Sale', '15% off summer collection', 'Issued', 'Discount', NULL, 15.00, NULL, CURRENT_DATE, CURRENT_DATE + INTERVAL '45 days', NULL, true),
(2, 'EXPIRED10', 'Expired Voucher', '10% off (expired)', 'Expired', 'Discount', NULL, 10.00, NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '5 days', NULL, false),

-- Vouchers for customer 3 (Mike Johnson)
(3, 'NEWUSER20', 'New User Bonus', '20% off first order', 'Issued', 'Discount', NULL, 20.00, NULL, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', NULL, true),

-- Vouchers for customer 4 (Sarah Wilson)
(4, 'CORP100', 'Corporate Discount', '$100 off bulk order', 'Issued', 'Value', 100.00, NULL, 100.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '120 days', NULL, true),
(4, 'LOYALTY30', 'Loyalty Reward', '30% off any item', 'Redeemed', 'Discount', NULL, 30.00, NULL, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', NULL, true);

-- Update redeemed vouchers with use_date
UPDATE customer_vouchers 
SET use_date = CURRENT_DATE - INTERVAL '5 days', 
    redeemed_value = 20.00,
    remaining_value = 0.00
WHERE voucher_code = 'BACKPACK20';

UPDATE customer_vouchers 
SET use_date = CURRENT_DATE - INTERVAL '2 days', 
    redeemed_value = 30.00,
    remaining_value = 0.00
WHERE voucher_code = 'LOYALTY30';
