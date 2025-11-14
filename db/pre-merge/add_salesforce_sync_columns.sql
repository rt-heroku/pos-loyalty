-- Add Salesforce sync columns to orders table

-- Add sync_status column (true/false or null if not synced)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sync_status BOOLEAN DEFAULT NULL;

-- Add sync_message column (store full JSON response or error message)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sync_message JSONB DEFAULT NULL;

-- Add salesforce_order_id column (store the Salesforce Order ID)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS salesforce_order_id VARCHAR(255) DEFAULT NULL;

-- Add sync_attempted_at timestamp
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sync_attempted_at TIMESTAMP DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN orders.sync_status IS 'Salesforce sync status - true if synced successfully, false if failed, null if not attempted';
COMMENT ON COLUMN orders.sync_message IS 'Full Salesforce sync response or error message (JSON)';
COMMENT ON COLUMN orders.salesforce_order_id IS 'Salesforce Order ID (e.g., 801Kj00000DexZEIAZ)';
COMMENT ON COLUMN orders.sync_attempted_at IS 'Timestamp when Salesforce sync was last attempted';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders(sync_status);
CREATE INDEX IF NOT EXISTS idx_orders_salesforce_id ON orders(salesforce_order_id);

