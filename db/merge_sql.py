#!/usr/bin/env python3
"""
Intelligent SQL Merger
Merges all SQL files into 2 organized files:
1. database.sql - Complete schema + functions + triggers + 1 admin user
2. load_sample_data.sql - All sample data
"""

import re
import os

# File paths
DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOYALTY_DB_DIR = os.path.join(os.path.dirname(DB_DIR), 'loyalty-app', 'db')

def read_file(filepath):
    """Read SQL file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return ""

def extract_section(content, start_marker, end_marker=None):
    """Extract section between markers"""
    start = content.find(start_marker)
    if start == -1:
        return ""
    
    if end_marker:
        end = content.find(end_marker, start)
        if end == -1:
            return content[start:]
        return content[start:end]
    return content[start:]

def is_sample_data_insert(line):
    """Check if line is sample data insert"""
    line = line.strip().lower()
    if not line.startswith('insert into'):
        return False
    
    # These are configuration/essential data, not sample
    essential_tables = [
        'roles', 'system_settings', 'payment_methods', 
        'loyalty_tiers', 'customer_tier_rules', 'locations'
    ]
    
    for table in essential_tables:
        if f'insert into {table}' in line:
            return False
    
    return True

def merge_sql_files():
    """Main merge logic"""
    print("🔄 Starting SQL merge...")
    
    # Read main files
    print("📖 Reading database.sql...")
    database_sql = read_file(os.path.join(DB_DIR, 'database.sql'))
    
    print("📖 Reading loyalty-database-changes.sql...")
    loyalty_sql = read_file(os.path.join(LOYALTY_DB_DIR, 'loyalty-database-changes.sql'))
    
    print("📖 Reading other SQL files...")
    shop_system_sql = read_file(os.path.join(DB_DIR, 'shop_system.sql'))
    salesforce_sql = read_file(os.path.join(DB_DIR, 'add_salesforce_sync_columns.sql'))
    payment_icons_sql = read_file(os.path.join(DB_DIR, 'update_payment_method_icons.sql'))
    
    # ===========================================================================
    # BUILD database.sql
    # ===========================================================================
    print("\n🔨 Building database.sql...")
    
    db_output = []
    
    # Header
    db_output.append("""-- =============================================================================
-- UNIFIED POS-LOYALTY DATABASE SCHEMA
-- =============================================================================
-- Complete database schema for POS and Loyalty applications
-- This file creates a fully functional system with:
-- - Complete schema (tables, indexes, sequences)
-- - Functions and triggers
-- - Views
-- - Essential configuration data
-- - One admin user for initial access
--
-- For sample data (products, customers, transactions), run load_sample_data.sql
-- =============================================================================

""")
    
    # 1. DROP SECTION - Extract from database.sql
    print("  ↳ Extracting DROP statements...")
    drop_section = extract_section(database_sql, '-- DROP ALL EXISTING OBJECTS', '-- CREATE COMPLETE TABLES')
    db_output.append(drop_section)
    
    # 2. CREATE TABLES - Merge database.sql + loyalty-database-changes.sql + shop_system.sql
    print("  ↳ Merging CREATE TABLE statements...")
    db_output.append("""
-- =============================================================================
-- CREATE TABLES
-- =============================================================================
-- Tables from POS system, loyalty system, and shop system merged
""")
    
    # Extract tables from database.sql (but stop before SAMPLE DATA)
    tables_section = extract_section(database_sql, '-- CREATE COMPLETE TABLES', '-- INDEXES FOR PERFORMANCE')
    
    # Remove sample data inserts if any leaked into this section
    table_lines = []
    for line in tables_section.split('\n'):
        if not is_sample_data_insert(line):
            table_lines.append(line)
    
    db_output.append('\n'.join(table_lines))
    
    # Add loyalty tables
    print("  ↳ Adding loyalty tables...")
    db_output.append("""
-- =============================================================================
-- LOYALTY APPLICATION TABLES
-- =============================================================================
""")
    db_output.append(loyalty_sql)
    
    # Add shop system tables
    if 'CREATE TABLE' in shop_system_sql:
        print("  ↳ Adding shop system tables...")
        db_output.append("""
-- =============================================================================
-- SHOP SYSTEM TABLES
-- =============================================================================
""")
        db_output.append(shop_system_sql)
    
    # 3. ADD SALESFORCE COLUMNS
    print("  ↳ Adding Salesforce sync columns...")
    db_output.append("""
-- =============================================================================
-- SALESFORCE INTEGRATION
-- =============================================================================
""")
    db_output.append(salesforce_sql)
    
    # 4. INDEXES - Extract from database.sql
    print("  ↳ Extracting indexes...")
    indexes_section = extract_section(database_sql, '-- INDEXES FOR PERFORMANCE', '-- SEQUENCES')
    db_output.append("\n")
    db_output.append(indexes_section)
    
    # 5. SEQUENCES
    print("  ↳ Extracting sequences...")
    seq_section = extract_section(database_sql, '-- SEQUENCES', '-- FUNCTIONS')
    db_output.append(seq_section)
    
    # 6. FUNCTIONS
    print("  ↳ Extracting functions...")
    func_section = extract_section(database_sql, '-- FUNCTIONS', '-- TRIGGERS')
    db_output.append(func_section)
    
    # 7. TRIGGERS
    print("  ↳ Extracting triggers...")
    trigger_section = extract_section(database_sql, '-- TRIGGERS', '-- VIEWS')
    db_output.append(trigger_section)
    
    # 8. VIEWS
    print("  ↳ Extracting views...")
    views_section = extract_section(database_sql, '-- VIEWS', '-- SAMPLE DATA')
    db_output.append(views_section)
    
    # 9. ESSENTIAL DATA (not sample data)
    print("  ↳ Adding essential configuration data...")
    db_output.append("""
-- =============================================================================
-- ESSENTIAL CONFIGURATION DATA
-- =============================================================================
-- System settings, roles, payment methods, locations, etc.
-- This is NOT sample data - it's required for the system to function

""")
    
    # Extract essential data from database.sql
    # Look for inserts into system_settings, roles, payment_methods, etc.
    essential_data_section = extract_section(database_sql, '-- SAMPLE DATA', '-- ORDERS SYSTEM')
    if essential_data_section:
        essential_lines = []
        in_essential = False
        for line in essential_data_section.split('\n'):
            line_lower = line.strip().lower()
            
            # Check if this is an essential table insert
            if line_lower.startswith('insert into'):
                in_essential = any(table in line_lower for table in [
                    'system_settings', 'roles', 'payment_methods', 
                    'loyalty_tiers', 'customer_tier_rules', 'locations'
                ])
            
            # Include essential data and structure comments
            if in_essential or line.startswith('--') or not line.strip():
                essential_lines.append(line)
            elif line_lower.startswith('insert into'):
                in_essential = False
        
        db_output.append('\n'.join(essential_lines))
    
    # Update payment method icons
    db_output.append("""
-- =============================================================================
-- PAYMENT METHOD ICONS
-- =============================================================================
""")
    db_output.append(payment_icons_sql)
    
    # 10. CREATE ONLY 1 ADMIN USER
    print("  ↳ Adding admin user...")
    db_output.append("""
-- =============================================================================
-- DEFAULT ADMIN USER
-- =============================================================================
-- Create default admin user for initial system access
-- Username: admin@pos.com
-- Password: Admin123!

DO $$ 
BEGIN
    -- Create admin user if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@pos.com') THEN
        INSERT INTO users (email, first_name, last_name, role, is_active, created_at, updated_at)
        VALUES ('admin@pos.com', 'Admin', 'User', 'Admin', true, NOW(), NOW());
        
        RAISE NOTICE 'Admin user created: admin@pos.com / Admin123!';
    END IF;
END $$;

""")
    
    # 11. COMPLETION
    db_output.append("""
-- =============================================================================
-- SCHEMA CREATION COMPLETE
-- =============================================================================
-- Database schema is now ready
-- To load sample data, run: load_sample_data.sql
-- =============================================================================
""")
    
    # Write database.sql
    output_path = os.path.join(DB_DIR, 'temp', 'database.sql')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(''.join(db_output))
    print(f"✅ Created: {output_path}")
    
    # ===========================================================================
    # BUILD load_sample_data.sql
    # ===========================================================================
    print("\n🔨 Building load_sample_data.sql...")
    
    sample_output = []
    
    # Header
    sample_output.append("""-- =============================================================================
-- SAMPLE DATA FOR POS-LOYALTY SYSTEM
-- =============================================================================
-- This file contains sample data for testing and demonstration
-- Run this AFTER database.sql has been executed
--
-- Includes:
-- - Sample products
-- - Sample customers
-- - Sample transactions
-- - Sample orders
-- - Sample loyalty data
-- =============================================================================

""")
    
    # Extract sample data from database.sql
    print("  ↳ Extracting sample data...")
    sample_data_section = extract_section(database_sql, '-- SAMPLE DATA', '-- COMPLETION MESSAGE')
    
    if sample_data_section:
        sample_lines = []
        for line in sample_data_section.split('\n'):
            # Exclude essential data, only include true sample data
            if is_sample_data_insert(line) or not line.strip() or line.startswith('--'):
                sample_lines.append(line)
        
        sample_output.append('\n'.join(sample_lines))
    
    # Add sample data from load_sample_data.sql if it exists
    existing_sample = read_file(os.path.join(DB_DIR, 'load_sample_data.sql'))
    if existing_sample:
        print("  ↳ Adding existing sample data...")
        sample_output.append("""
-- =============================================================================
-- ADDITIONAL SAMPLE DATA
-- =============================================================================
""")
        sample_output.append(existing_sample)
    
    # Completion
    sample_output.append("""
-- =============================================================================
-- SAMPLE DATA LOADING COMPLETE
-- =============================================================================
-- Your system now has sample data for testing and demonstration
-- =============================================================================
""")
    
    # Write load_sample_data.sql
    sample_path = os.path.join(DB_DIR, 'temp', 'load_sample_data.sql')
    with open(sample_path, 'w', encoding='utf-8') as f:
        f.write(''.join(sample_output))
    print(f"✅ Created: {sample_path}")
    
    print("\n🎉 Merge complete!")
    print(f"\n📁 Output files:")
    print(f"  • database.sql ({len(''.join(db_output))} bytes)")
    print(f"  • load_sample_data.sql ({len(''.join(sample_output))} bytes)")

if __name__ == '__main__':
    merge_sql_files()

