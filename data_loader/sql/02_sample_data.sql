-- Sample Data for Data Loader Testing
-- This file contains sample CSV data for testing the data loader functionality

-- Sample product data (matching the provided CSV format)
INSERT INTO data_loader_jobs (type, file_name, total_rows, status) VALUES 
('products', 'sample_products.csv', 2, 'completed');

-- Sample customer data (matching the provided CSV format)
INSERT INTO data_loader_jobs (type, file_name, total_rows, status) VALUES 
('customers', 'sample_customers.csv', 2, 'completed');

-- Sample product rows
INSERT INTO data_loader_rows (job_id, row_number, raw_data, mapped_data, status) VALUES 
(
    (SELECT job_id FROM data_loader_jobs WHERE file_name = 'sample_products.csv' LIMIT 1),
    1,
    '{"SKU":"SAM-JETSTREAM-0000","Name":"Jetstream Carry-On 22\" Silver","Category":"Carry-On","Material":"Ballistic Nylon","Color":"Silver","Size":"22\"","Price":"234.37","WeightLbs":"7.48","Dimensions":"28x20x12 in","Features":"Eco lining; USB port; Laptop sleeve; Expandable"}',
    '{"name":"Jetstream Carry-On 22\" Silver","price":234.37,"category":"Carry-On","material":"Ballistic Nylon","color":"Silver","dimensions":"28x20x12 in","description":"Eco lining; USB port; Laptop sleeve; Expandable","sku":"SAM-JETSTREAM-0000","weight":7.48}',
    'processed'
),
(
    (SELECT job_id FROM data_loader_jobs WHERE file_name = 'sample_products.csv' LIMIT 1),
    2,
    '{"SKU":"SAM-PROX-0001","Name":"ProX Checked Luggage 25\" Navy","Category":"Checked Luggage","Material":"Polycarbonate","Color":"Navy","Size":"25\"","Price":"334.27","WeightLbs":"8.65","Dimensions":"16x11x5 in","Features":"USB port; Laptop sleeve"}',
    '{"name":"ProX Checked Luggage 25\" Navy","price":334.27,"category":"Checked Luggage","material":"Polycarbonate","color":"Navy","dimensions":"16x11x5 in","description":"USB port; Laptop sleeve","sku":"SAM-PROX-0001","weight":8.65}',
    'processed'
);

-- Sample customer rows
INSERT INTO data_loader_rows (job_id, row_number, raw_data, mapped_data, status) VALUES 
(
    (SELECT job_id FROM data_loader_jobs WHERE file_name = 'sample_customers.csv' LIMIT 1),
    1,
    '{"CustomerID":"C100000","FirstName":"Noa","LastName":"Johnson","Email":"noa.johnson@example.com","Phone":"+1-892-958-9935","Region":"London","Country":"UK","PreferredLanguage":"English","LoyaltyTier":"Bronze","PointsBalance":"1945","Preferences":"Business travel; Anti-theft","EngagementSource":"Email","DateOfBirth":"1972-10-19"}',
    '{"first_name":"Noa","last_name":"Johnson","email":"noa.johnson@example.com","phone":"+1-892-958-9935","points":1945,"member_type":"Bronze","enrollment_date":"2022-05-05"}',
    'processed'
),
(
    (SELECT job_id FROM data_loader_jobs WHERE file_name = 'sample_customers.csv' LIMIT 1),
    2,
    '{"CustomerID":"C100001","FirstName":"Amelia","LastName":"Lee","Email":"amelia.lee@example.com","Phone":"+1-933-865-9928","Region":"London","Country":"UK","PreferredLanguage":"English","LoyaltyTier":"Bronze","PointsBalance":"992","Preferences":"Lightweight luggage; Premium leather","EngagementSource":"Paid Social","DateOfBirth":"2002-08-21"}',
    '{"first_name":"Amelia","last_name":"Lee","email":"amelia.lee@example.com","phone":"+1-933-865-9928","points":992,"member_type":"Bronze","enrollment_date":"2024-06-07"}',
    'processed'
);

-- Sample error data
INSERT INTO data_loader_errors (job_id, row_id, error_type, error_message, field_name, field_value) VALUES 
(
    (SELECT job_id FROM data_loader_jobs WHERE file_name = 'sample_products.csv' LIMIT 1),
    (SELECT id FROM data_loader_rows WHERE row_number = 1 AND job_id = (SELECT job_id FROM data_loader_jobs WHERE file_name = 'sample_products.csv' LIMIT 1)),
    'validation',
    'Price must be a valid number',
    'price',
    'invalid_price'
);
