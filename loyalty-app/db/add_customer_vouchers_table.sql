-- Add customer_vouchers table to the loyalty database
-- This table is required for the vouchers functionality

-- Create customer_vouchers table
CREATE TABLE IF NOT EXISTS customer_vouchers (
    id SERIAL PRIMARY KEY,
    sf_id VARCHAR(100) UNIQUE, -- Salesforce ID
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    voucher_code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Issued' CHECK (status IN ('Issued', 'Redeemed', 'Expired', 'Cancelled', 'Reserved')),
    
    voucher_type VARCHAR(50) NOT NULL CHECK (voucher_type IN ('Value', 'Discount', 'ProductSpecific')),
    face_value DECIMAL(10,2), -- Original value for value vouchers
    discount_percent DECIMAL(5,2), -- Percentage discount (0-100)
    product_id INTEGER REFERENCES products(id), -- For product-specific vouchers
    
    -- Value tracking for value vouchers
    remaining_value DECIMAL(10,2), -- Remaining balance for value vouchers
    redeemed_value DECIMAL(10,2) DEFAULT 0, -- Amount already redeemed
    reserved_value DECIMAL(10,2) DEFAULT 0, -- Amount reserved in current transaction
    
    -- Dates
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date DATE,
    use_date TIMESTAMP, -- When voucher was last used
    
    -- Metadata
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user INTEGER
);

-- Add voucher_id to transaction_items table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_items' 
        AND column_name = 'voucher_id'
    ) THEN
        ALTER TABLE transaction_items 
        ADD COLUMN voucher_id INTEGER REFERENCES customer_vouchers(id);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_customer_id ON customer_vouchers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_status ON customer_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_expiration ON customer_vouchers(expiration_date);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_type ON customer_vouchers(voucher_type);

-- Create transaction_vouchers table for tracking voucher usage in transactions
CREATE TABLE IF NOT EXISTS transaction_vouchers (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    voucher_id INTEGER REFERENCES customer_vouchers(id) ON DELETE CASCADE,
    amount_used DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(transaction_id, voucher_id)
);

-- Create indexes for transaction_vouchers
CREATE INDEX IF NOT EXISTS idx_transaction_vouchers_transaction_id ON transaction_vouchers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_vouchers_voucher_id ON transaction_vouchers(voucher_id);
