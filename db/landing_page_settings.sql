-- Landing Page System Settings
-- These settings control the content displayed on the main landing page (/)

-- Insert landing page settings
INSERT INTO system_settings (category, setting_key, setting_value, description, data_type)
VALUES 
    ('landing_page', 'landing_title1', 'Complete Business Solution', 'Main title (first line) on landing page', 'string'),
    ('landing_page', 'landing_title2', 'POS & Loyalty Platform', 'Secondary title (second line with gradient) on landing page', 'string'),
    ('landing_page', 'landing_subtitle', 'Manage your entire business with our integrated Point of Sale and Customer Loyalty system. Streamline operations, boost sales, and reward your customers all in one place.', 'Subtitle/description text on landing page', 'text')
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    data_type = EXCLUDED.data_type,
    updated_at = CURRENT_TIMESTAMP;

-- Verify the settings were created
SELECT * FROM system_settings WHERE category = 'landing_page' ORDER BY setting_key;

