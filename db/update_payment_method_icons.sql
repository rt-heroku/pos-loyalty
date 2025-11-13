-- Update payment method icons to use image paths and add PayPal

-- Update existing payment methods to use image paths
UPDATE payment_methods 
SET icon = '/payment-methods/credit-card.png' 
WHERE code = 'credit_card';

UPDATE payment_methods 
SET icon = '/payment-methods/cash.png' 
WHERE code = 'cash';

UPDATE payment_methods 
SET icon = '/payment-methods/pay-at-pickup.png' 
WHERE code = 'pay_at_pickup';

UPDATE payment_methods 
SET icon = '/payment-methods/apple-pay.png' 
WHERE code = 'apple_pay';

-- Add or update PayPal payment method
INSERT INTO payment_methods (name, code, description, requires_online_payment, display_order, icon, is_active)
VALUES ('PayPal', 'paypal', 'Pay securely with PayPal', true, 5, '/payment-methods/paypal.png', true)
ON CONFLICT (code) 
DO UPDATE SET 
  icon = EXCLUDED.icon,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requires_online_payment = EXCLUDED.requires_online_payment,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- Verify the update
SELECT id, name, code, icon, display_order, is_active 
FROM payment_methods 
ORDER BY display_order;

