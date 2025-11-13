-- Add PayPal payment method

INSERT INTO payment_methods (name, code, description, requires_online_payment, display_order, icon)
VALUES ('PayPal', 'paypal', 'Pay securely with PayPal', true, 5, '💳')
ON CONFLICT (code) DO NOTHING;

