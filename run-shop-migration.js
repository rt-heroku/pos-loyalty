#!/usr/bin/env node

/**
 * Run Shop System Database Migration
 * 
 * This script runs the shop_system.sql file to create all necessary tables
 * for the online shop feature.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🔧 Shop System Migration');
console.log('========================\n');

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'db', 'shop_system.sql');
    console.log(`📖 Reading SQL file: ${sqlPath}`);
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found: ${sqlPath}`);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`✅ SQL file loaded (${sql.length} characters)\n`);

    // Execute the SQL
    console.log('🚀 Executing migration...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'categories',
        'product_modifier_groups',
        'product_modifiers',
        'product_modifier_group_links',
        'payment_methods',
        'customer_payment_methods'
      )
      ORDER BY table_name
    `);

    console.log('\n📊 Tables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n🎉 Shop system is ready!');
    console.log('\nYou can now:');
    console.log('  1. Restart your servers');
    console.log('  2. Visit http://localhost:3000/loyalty/shop');
    console.log('  3. Browse products and test the shop\n');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    
    if (error.code) {
      console.error(`\nError code: ${error.code}`);
    }
    
    if (error.position) {
      console.error(`Position in SQL: ${error.position}`);
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();

