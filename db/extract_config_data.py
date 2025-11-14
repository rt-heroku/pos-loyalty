#!/usr/bin/env python3
"""
Extract Configuration Data from Database
Generates INSERT statements for essential configuration tables
"""

import psycopg2
import sys

# Database connection string
DB_URL = "postgres://uj8pjss1ambns:pb1bb0e40627367ec997d08730017a8730498567422a36f217be37d022a12f2c5@c7b4i1efuvdata.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/df94tplcaaq52s"

def escape_value(value):
    """Escape SQL values"""
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    # String - escape single quotes
    return f"'{str(value).replace(chr(39), chr(39)+chr(39))}'"

def generate_insert_statements():
    """Generate INSERT statements for configuration tables"""
    
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    output = []
    output.append("""-- =============================================================================
-- ESSENTIAL CONFIGURATION DATA FROM PRODUCTION DATABASE
-- =============================================================================
-- Extracted configuration to ensure 1-click deployment matches production
-- Date: 2025-11-13
""")
    
    # =========================================================================
    # SYSTEM SETTINGS
    # =========================================================================
    output.append("""
-- =============================================================================
-- SYSTEM SETTINGS
-- =============================================================================
""")
    
    cur.execute("""
        SELECT setting_key, setting_value, setting_type, description, 
               category, is_encrypted, is_active, created_by, updated_by
        FROM system_settings
        ORDER BY category, setting_key
    """)
    
    output.append("-- Clear existing settings\nDELETE FROM system_settings;\n")
    output.append("\n-- Insert system settings\n")
    output.append("INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_encrypted, is_active, created_by, updated_by) VALUES\n")
    
    rows = cur.fetchall()
    for i, row in enumerate(rows):
        values = ', '.join([escape_value(v) for v in row])
        comma = ',' if i < len(rows) - 1 else ';'
        output.append(f"({values}){comma}\n")
    
    # =========================================================================
    # ROLES
    # =========================================================================
    output.append("""
-- =============================================================================
-- ROLES
-- =============================================================================
""")
    
    cur.execute("""
        SELECT name, description, permissions, is_active
        FROM roles
        ORDER BY name
    """)
    
    output.append("\n-- Insert roles (skip if exists)\n")
    
    rows = cur.fetchall()
    for row in rows:
        name, desc, perms, is_active = row
        perms_str = escape_value(str(perms) if perms else '{}')
        output.append(f"INSERT INTO roles (name, description, permissions, is_active) VALUES\n")
        output.append(f"({escape_value(name)}, {escape_value(desc)}, {perms_str}::jsonb, {escape_value(is_active)})\n")
        output.append(f"ON CONFLICT (name) DO NOTHING;\n\n")
    
    # =========================================================================
    # PAYMENT METHODS
    # =========================================================================
    output.append("""
-- =============================================================================
-- PAYMENT METHODS
-- =============================================================================
""")
    
    cur.execute("""
        SELECT name, code, description, requires_online_payment, 
               display_order, icon, is_active
        FROM payment_methods
        ORDER BY display_order
    """)
    
    output.append("\n-- Insert payment methods (skip if exists)\n")
    
    rows = cur.fetchall()
    for row in rows:
        values = ', '.join([escape_value(v) for v in row])
        output.append(f"INSERT INTO payment_methods (name, code, description, requires_online_payment, display_order, icon, is_active) VALUES\n")
        output.append(f"({values})\n")
        output.append(f"ON CONFLICT (code) DO UPDATE SET icon = EXCLUDED.icon, is_active = EXCLUDED.is_active;\n\n")
    
    # =========================================================================
    # CUSTOMER TIER RULES
    # =========================================================================
    output.append("""
-- =============================================================================
-- CUSTOMER TIER RULES
-- =============================================================================
""")
    
    cur.execute("""
        SELECT tier_name, tier_level, min_spending, min_visits, 
               min_points, points_multiplier
        FROM customer_tier_rules
        ORDER BY tier_level
    """)
    
    rows = cur.fetchall()
    if rows:
        output.append("\n-- Insert customer tier rules (skip if exists)\n")
        for row in rows:
            values = ', '.join([escape_value(v) for v in row])
            output.append(f"INSERT INTO customer_tier_rules (tier_name, tier_level, min_spending, min_visits, min_points, points_multiplier) VALUES\n")
            output.append(f"({values})\n")
            output.append(f"ON CONFLICT (tier_level) DO NOTHING;\n\n")
    else:
        output.append("\n-- No customer tier rules found in database\n")
    
    # =========================================================================
    # LOCATIONS (at least 1 default location)
    # =========================================================================
    output.append("""
-- =============================================================================
-- DEFAULT LOCATION
-- =============================================================================
""")
    
    cur.execute("""
        SELECT name, address, phone, email, is_active
        FROM locations
        LIMIT 1
    """)
    
    row = cur.fetchone()
    if row:
        values = ', '.join([escape_value(v) for v in row])
        output.append("\n-- Insert default location if none exists\n")
        output.append("INSERT INTO locations (name, address, phone, email, is_active) \n")
        output.append(f"SELECT {values}\n")
        output.append("WHERE NOT EXISTS (SELECT 1 FROM locations LIMIT 1);\n")
    
    cur.close()
    conn.close()
    
    return ''.join(output)

if __name__ == '__main__':
    try:
        print("Extracting configuration data from database...")
        sql = generate_insert_statements()
        
        # Write to file
        output_file = 'config_data_from_production.sql'
        with open(output_file, 'w') as f:
            f.write(sql)
        
        print(f"✅ Configuration data extracted to: {output_file}")
        print(f"📊 Total size: {len(sql)} bytes")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

