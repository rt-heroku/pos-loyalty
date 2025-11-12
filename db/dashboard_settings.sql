-- Dashboard Configuration Settings
-- Add Tableau URLs to system_settings so they can be easily changed

-- Insert dashboard settings
INSERT INTO system_settings (setting_key, setting_value, category, description, is_active)
VALUES 
    ('tableau_api_url', 
     'https://10ax.online.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js', 
     'dashboard', 
     'Tableau Embedding API JavaScript URL', 
     true),
    ('tableau_dashboard_url', 
     'https://10ax.online.tableau.com/t/rcgsepulse/views/MaxMulesRestaurantView/FranchiseeExecDash', 
     'dashboard', 
     'Tableau Dashboard Visualization URL', 
     true)
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- Display the inserted/updated settings
SELECT setting_key, setting_value, category, description 
FROM system_settings 
WHERE category = 'dashboard' 
ORDER BY setting_key;

