-- =====================================================
-- Customer Audit Logging System
-- =====================================================
-- This script creates a comprehensive audit logging system
-- for all customer-related actions to track sequence issues
-- and identify MuleSoft triggers.
-- =====================================================

-- =====================================================
-- 1. AUDIT TABLES
-- =====================================================

-- Customer audit log table
CREATE TABLE IF NOT EXISTS customer_audit_log (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'MULESOFT_SYNC'
    table_name VARCHAR(100) NOT NULL, -- 'customers', 'customer_vouchers', etc.
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[], -- Array of field names that changed
    changed_by VARCHAR(255) DEFAULT 'system',
    source_system VARCHAR(100) DEFAULT 'pos_system', -- 'pos_system', 'mulesoft', 'admin'
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    transaction_id INTEGER, -- Link to transaction if applicable
    sequence_calls INTEGER DEFAULT 0, -- Track how many times sequences were called
    processing_time_ms INTEGER DEFAULT 0 -- Track processing time
);

-- Customer field change log (detailed field-level changes)
CREATE TABLE IF NOT EXISTS customer_field_changes (
    id SERIAL PRIMARY KEY,
    audit_log_id INTEGER REFERENCES customer_audit_log(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_type VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer sequence tracking (to track sequence calls)
CREATE TABLE IF NOT EXISTS customer_sequence_tracking (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    sequence_name VARCHAR(100) NOT NULL, -- 'customers_id_seq', 'customer_activity_log_id_seq'
    sequence_value BIGINT NOT NULL,
    operation_type VARCHAR(50) NOT NULL, -- 'NEXTVAL', 'CURRVAL', 'SETVAL'
    trigger_function VARCHAR(255), -- Which function/trigger caused the call
    stack_trace TEXT, -- Function call stack
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer transaction audit (link customers to transactions)
CREATE TABLE IF NOT EXISTS customer_transaction_audit (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    transaction_id INTEGER,
    action_type VARCHAR(50) NOT NULL, -- 'PURCHASE', 'REFUND', 'VOID', 'LOYALTY_REDEMPTION'
    transaction_data JSONB,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_customer_audit_log_customer ON customer_audit_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_audit_log_action ON customer_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_customer_audit_log_created ON customer_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_audit_log_source ON customer_audit_log(source_system);
CREATE INDEX IF NOT EXISTS idx_customer_audit_log_table ON customer_audit_log(table_name);

CREATE INDEX IF NOT EXISTS idx_customer_field_changes_audit ON customer_field_changes(audit_log_id);
CREATE INDEX IF NOT EXISTS idx_customer_field_changes_field ON customer_field_changes(field_name);

CREATE INDEX IF NOT EXISTS idx_customer_sequence_tracking_customer ON customer_sequence_tracking(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_sequence_tracking_sequence ON customer_sequence_tracking(sequence_name);
CREATE INDEX IF NOT EXISTS idx_customer_sequence_tracking_created ON customer_sequence_tracking(created_at);

CREATE INDEX IF NOT EXISTS idx_customer_transaction_audit_customer ON customer_transaction_audit(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_transaction_audit_transaction ON customer_transaction_audit(transaction_id);

-- =====================================================
-- 3. UTILITY FUNCTIONS
-- =====================================================

-- Function to get current sequence values
CREATE OR REPLACE FUNCTION get_sequence_info(seq_name TEXT)
RETURNS TABLE(sequence_name TEXT, last_value BIGINT, is_called BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        seq_name::TEXT,
        pg_sequences.last_value,
        pg_sequences.is_called
    FROM pg_sequences 
    WHERE sequencename = seq_name;
END;
$$ LANGUAGE plpgsql;

-- Function to track sequence calls
CREATE OR REPLACE FUNCTION track_sequence_call(
    p_customer_id INTEGER,
    p_sequence_name VARCHAR(100),
    p_operation_type VARCHAR(50),
    p_trigger_function VARCHAR(255) DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_sequence_value BIGINT;
    v_stack_trace TEXT;
BEGIN
    -- Get current sequence value
    SELECT last_value INTO v_sequence_value 
    FROM pg_sequences 
    WHERE sequencename = p_sequence_name;
    
    -- Get stack trace (simplified)
    v_stack_trace := 'Function: ' || COALESCE(p_trigger_function, 'unknown');
    
    -- Insert tracking record
    INSERT INTO customer_sequence_tracking (
        customer_id, sequence_name, sequence_value, operation_type, 
        trigger_function, stack_trace
    ) VALUES (
        p_customer_id, p_sequence_name, v_sequence_value, p_operation_type,
        p_trigger_function, v_stack_trace
    );
END;
$$ LANGUAGE plpgsql;

-- Function to compare JSONB objects and get changed fields
CREATE OR REPLACE FUNCTION get_changed_fields(
    old_data JSONB,
    new_data JSONB
) RETURNS TEXT[] AS $$
DECLARE
    changed_fields TEXT[] := '{}';
    key TEXT;
    old_val TEXT;
    new_val TEXT;
BEGIN
    -- Check all keys in new_data
    FOR key IN SELECT jsonb_object_keys(new_data)
    LOOP
        old_val := old_data->>key;
        new_val := new_data->>key;
        
        -- Compare values (handle NULLs)
        IF (old_val IS NULL AND new_val IS NOT NULL) OR 
           (old_val IS NOT NULL AND new_val IS NULL) OR
           (old_val IS DISTINCT FROM new_val) THEN
            changed_fields := array_append(changed_fields, key);
        END IF;
    END LOOP;
    
    -- Check for deleted keys in old_data
    FOR key IN SELECT jsonb_object_keys(old_data)
    LOOP
        IF new_data->>key IS NULL AND old_data->>key IS NOT NULL THEN
            changed_fields := array_append(changed_fields, key);
        END IF;
    END LOOP;
    
    RETURN changed_fields;
END;
$$ LANGUAGE plpgsql;

-- Function to create detailed field change records
CREATE OR REPLACE FUNCTION create_field_change_records(
    p_audit_log_id INTEGER,
    p_old_data JSONB,
    p_new_data JSONB,
    p_action_type VARCHAR(20)
) RETURNS VOID AS $$
DECLARE
    key TEXT;
    old_val TEXT;
    new_val TEXT;
BEGIN
    -- Process all keys from both old and new data
    FOR key IN 
        SELECT DISTINCT jsonb_object_keys(COALESCE(p_old_data, '{}'::jsonb) || COALESCE(p_new_data, '{}'::jsonb))
    LOOP
        old_val := p_old_data->>key;
        new_val := p_new_data->>key;
        
        -- Only insert if there's a change
        IF (old_val IS DISTINCT FROM new_val) THEN
            INSERT INTO customer_field_changes (
                audit_log_id, field_name, old_value, new_value, change_type
            ) VALUES (
                p_audit_log_id, key, old_val, new_val, p_action_type
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. AUDIT TRIGGER FUNCTIONS
-- =====================================================

-- Main audit trigger function for customers table
CREATE OR REPLACE FUNCTION audit_customer_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_audit_id INTEGER;
    v_old_data JSONB;
    v_new_data JSONB;
    v_changed_fields TEXT[];
    v_action_type VARCHAR(20);
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_processing_time INTEGER;
BEGIN
    v_start_time := clock_timestamp();
    
    -- Track sequence calls
    PERFORM track_sequence_call(
        COALESCE(NEW.id, OLD.id),
        'customers_id_seq',
        'NEXTVAL',
        'audit_customer_changes'
    );
    
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        v_action_type := 'INSERT';
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action_type := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action_type := 'DELETE';
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    END IF;
    
    -- Get changed fields
    v_changed_fields := get_changed_fields(v_old_data, v_new_data);
    
    -- Insert main audit record
    INSERT INTO customer_audit_log (
        customer_id, action_type, table_name, old_values, new_values,
        changed_fields, changed_by, source_system, sequence_calls
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        v_action_type,
        'customers',
        v_old_data,
        v_new_data,
        v_changed_fields,
        COALESCE(current_setting('app.current_user', true), 'system'),
        COALESCE(current_setting('app.source_system', true), 'pos_system'),
        1 -- Track that sequence was called
    ) RETURNING id INTO v_audit_id;
    
    -- Create detailed field change records
    PERFORM create_field_change_records(v_audit_id, v_old_data, v_new_data, v_action_type);
    
    -- Calculate processing time
    v_end_time := clock_timestamp();
    v_processing_time := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    -- Update audit record with processing time
    UPDATE customer_audit_log 
    SET processing_time_ms = v_processing_time::INTEGER
    WHERE id = v_audit_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Audit trigger function for customer_vouchers table
CREATE OR REPLACE FUNCTION audit_customer_vouchers_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_audit_id INTEGER;
    v_old_data JSONB;
    v_new_data JSONB;
    v_changed_fields TEXT[];
    v_action_type VARCHAR(20);
BEGIN
    -- Track sequence calls
    PERFORM track_sequence_call(
        COALESCE(NEW.customer_id, OLD.customer_id),
        'customer_vouchers_id_seq',
        'NEXTVAL',
        'audit_customer_vouchers_changes'
    );
    
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        v_action_type := 'INSERT';
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action_type := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action_type := 'DELETE';
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    END IF;
    
    -- Get changed fields
    v_changed_fields := get_changed_fields(v_old_data, v_new_data);
    
    -- Insert audit record
    INSERT INTO customer_audit_log (
        customer_id, action_type, table_name, old_values, new_values,
        changed_fields, changed_by, source_system
    ) VALUES (
        COALESCE(NEW.customer_id, OLD.customer_id),
        v_action_type,
        'customer_vouchers',
        v_old_data,
        v_new_data,
        v_changed_fields,
        COALESCE(current_setting('app.current_user', true), 'system'),
        COALESCE(current_setting('app.source_system', true), 'pos_system')
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Audit trigger function for customer_activity_log table
CREATE OR REPLACE FUNCTION audit_customer_activity_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_audit_id INTEGER;
    v_old_data JSONB;
    v_new_data JSONB;
    v_changed_fields TEXT[];
    v_action_type VARCHAR(20);
BEGIN
    -- Track sequence calls
    PERFORM track_sequence_call(
        COALESCE(NEW.customer_id, OLD.customer_id),
        'customer_activity_log_id_seq',
        'NEXTVAL',
        'audit_customer_activity_changes'
    );
    
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        v_action_type := 'INSERT';
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action_type := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action_type := 'DELETE';
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    END IF;
    
    -- Get changed fields
    v_changed_fields := get_changed_fields(v_old_data, v_new_data);
    
    -- Insert audit record
    INSERT INTO customer_audit_log (
        customer_id, action_type, table_name, old_values, new_values,
        changed_fields, changed_by, source_system
    ) VALUES (
        COALESCE(NEW.customer_id, OLD.customer_id),
        v_action_type,
        'customer_activity_log',
        v_old_data,
        v_new_data,
        v_changed_fields,
        COALESCE(current_setting('app.current_user', true), 'system'),
        COALESCE(current_setting('app.source_system', true), 'pos_system')
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to audit transaction changes
CREATE OR REPLACE FUNCTION audit_transaction_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_audit_id INTEGER;
    v_old_data JSONB;
    v_new_data JSONB;
    v_changed_fields TEXT[];
    v_action_type VARCHAR(20);
BEGIN
    -- Track sequence calls
    PERFORM track_sequence_call(
        COALESCE(NEW.customer_id, OLD.customer_id),
        'transactions_id_seq',
        'NEXTVAL',
        'audit_transaction_changes'
    );
    
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        v_action_type := 'INSERT';
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action_type := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action_type := 'DELETE';
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    END IF;
    
    -- Get changed fields
    v_changed_fields := get_changed_fields(v_old_data, v_new_data);
    
    -- Insert audit record
    INSERT INTO customer_audit_log (
        customer_id, action_type, table_name, old_values, new_values,
        changed_fields, changed_by, source_system
    ) VALUES (
        COALESCE(NEW.customer_id, OLD.customer_id),
        v_action_type,
        'transactions',
        v_old_data,
        v_new_data,
        v_changed_fields,
        COALESCE(current_setting('app.current_user', true), 'system'),
        COALESCE(current_setting('app.source_system', true), 'pos_system')
    );
    
    -- Also insert into customer transaction audit
    IF TG_OP = 'INSERT' AND NEW.customer_id IS NOT NULL THEN
        INSERT INTO customer_transaction_audit (
            customer_id, transaction_id, action_type, transaction_data,
            points_earned, points_redeemed, total_amount
        ) VALUES (
            NEW.customer_id, NEW.id, 'PURCHASE', to_jsonb(NEW),
            COALESCE(NEW.points_earned, 0), COALESCE(NEW.points_redeemed, 0),
            COALESCE(NEW.total, 0.00)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_audit_customer_changes ON customers;
DROP TRIGGER IF EXISTS trigger_audit_customer_vouchers_changes ON customer_vouchers;
DROP TRIGGER IF EXISTS trigger_audit_customer_activity_changes ON customer_activity_log;
DROP TRIGGER IF EXISTS trigger_audit_transaction_changes ON transactions;

-- Create audit triggers
CREATE TRIGGER trigger_audit_customer_changes
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION audit_customer_changes();

CREATE TRIGGER trigger_audit_customer_vouchers_changes
    AFTER INSERT OR UPDATE OR DELETE ON customer_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION audit_customer_vouchers_changes();

CREATE TRIGGER trigger_audit_customer_activity_changes
    AFTER INSERT OR UPDATE OR DELETE ON customer_activity_log
    FOR EACH ROW
    EXECUTE FUNCTION audit_customer_activity_changes();

CREATE TRIGGER trigger_audit_transaction_changes
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION audit_transaction_changes();

-- =====================================================
-- 6. UTILITY FUNCTIONS FOR ANALYSIS
-- =====================================================

-- Function to get customer audit summary
CREATE OR REPLACE FUNCTION get_customer_audit_summary(p_customer_id INTEGER)
RETURNS TABLE(
    action_type VARCHAR(50),
    table_name VARCHAR(100),
    changed_fields TEXT[],
    source_system VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cal.action_type,
        cal.table_name,
        cal.changed_fields,
        cal.source_system,
        cal.created_at,
        cal.processing_time_ms
    FROM customer_audit_log cal
    WHERE cal.customer_id = p_customer_id
    ORDER BY cal.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get sequence call analysis
CREATE OR REPLACE FUNCTION get_sequence_analysis(p_customer_id INTEGER DEFAULT NULL)
RETURNS TABLE(
    sequence_name VARCHAR(100),
    call_count BIGINT,
    first_call TIMESTAMP WITH TIME ZONE,
    last_call TIMESTAMP WITH TIME ZONE,
    trigger_functions TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cst.sequence_name,
        COUNT(*) as call_count,
        MIN(cst.created_at) as first_call,
        MAX(cst.created_at) as last_call,
        ARRAY_AGG(DISTINCT cst.trigger_function) as trigger_functions
    FROM customer_sequence_tracking cst
    WHERE (p_customer_id IS NULL OR cst.customer_id = p_customer_id)
    GROUP BY cst.sequence_name
    ORDER BY call_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to detect MuleSoft activity
CREATE OR REPLACE FUNCTION detect_mulesoft_activity(p_hours INTEGER DEFAULT 24)
RETURNS TABLE(
    customer_id INTEGER,
    activity_count BIGINT,
    mulesoft_actions BIGINT,
    pos_actions BIGINT,
    suspicious_patterns TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cal.customer_id,
        COUNT(*) as activity_count,
        COUNT(*) FILTER (WHERE cal.source_system = 'mulesoft') as mulesoft_actions,
        COUNT(*) FILTER (WHERE cal.source_system = 'pos_system') as pos_actions,
        ARRAY_AGG(DISTINCT cal.action_type) as suspicious_patterns
    FROM customer_audit_log cal
    WHERE cal.created_at >= NOW() - INTERVAL '1 hour' * p_hours
    GROUP BY cal.customer_id
    HAVING COUNT(*) > 10 -- More than 10 actions in the time period
    ORDER BY activity_count DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE customer_audit_log IS 'Main audit log for all customer-related actions';
COMMENT ON TABLE customer_field_changes IS 'Detailed field-level change tracking';
COMMENT ON TABLE customer_sequence_tracking IS 'Tracks sequence calls to identify performance issues';
COMMENT ON TABLE customer_transaction_audit IS 'Links customers to their transaction activities';

COMMENT ON FUNCTION audit_customer_changes() IS 'Main audit trigger for customers table';
COMMENT ON FUNCTION track_sequence_call(INTEGER, VARCHAR, VARCHAR, VARCHAR) IS 'Tracks sequence calls for performance analysis';
COMMENT ON FUNCTION get_sequence_analysis(INTEGER) IS 'Analyzes sequence usage patterns';
COMMENT ON FUNCTION detect_mulesoft_activity(INTEGER) IS 'Detects suspicious MuleSoft activity patterns';

-- =====================================================
-- 8. DROP STATEMENTS (for removing this feature)
-- =====================================================

/*
-- DROP TRIGGERS
DROP TRIGGER IF EXISTS trigger_audit_customer_changes ON customers;
DROP TRIGGER IF EXISTS trigger_audit_customer_vouchers_changes ON customer_vouchers;
DROP TRIGGER IF EXISTS trigger_audit_customer_activity_changes ON customer_activity_log;
DROP TRIGGER IF EXISTS trigger_audit_transaction_changes ON transactions;

-- DROP FUNCTIONS
DROP FUNCTION IF EXISTS audit_customer_changes() CASCADE;
DROP FUNCTION IF EXISTS audit_customer_vouchers_changes() CASCADE;
DROP FUNCTION IF EXISTS audit_customer_activity_changes() CASCADE;
DROP FUNCTION IF EXISTS audit_transaction_changes() CASCADE;
DROP FUNCTION IF EXISTS track_sequence_call(INTEGER, VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_changed_fields(JSONB, JSONB) CASCADE;
DROP FUNCTION IF EXISTS create_field_change_records(INTEGER, JSONB, JSONB, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_sequence_info(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_customer_audit_summary(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_sequence_analysis(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS detect_mulesoft_activity(INTEGER) CASCADE;

-- DROP TABLES
DROP TABLE IF EXISTS customer_field_changes CASCADE;
DROP TABLE IF EXISTS customer_sequence_tracking CASCADE;
DROP TABLE IF EXISTS customer_transaction_audit CASCADE;
DROP TABLE IF EXISTS customer_audit_log CASCADE;

-- DROP INDEXES (they will be dropped with tables, but for completeness)
DROP INDEX IF EXISTS idx_customer_audit_log_customer;
DROP INDEX IF EXISTS idx_customer_audit_log_action;
DROP INDEX IF EXISTS idx_customer_audit_log_created;
DROP INDEX IF EXISTS idx_customer_audit_log_source;
DROP INDEX IF EXISTS idx_customer_audit_log_table;
DROP INDEX IF EXISTS idx_customer_field_changes_audit;
DROP INDEX IF EXISTS idx_customer_field_changes_field;
DROP INDEX IF EXISTS idx_customer_sequence_tracking_customer;
DROP INDEX IF EXISTS idx_customer_sequence_tracking_sequence;
DROP INDEX IF EXISTS idx_customer_sequence_tracking_created;
DROP INDEX IF EXISTS idx_customer_transaction_audit_customer;
DROP INDEX IF EXISTS idx_customer_transaction_audit_transaction;
*/
