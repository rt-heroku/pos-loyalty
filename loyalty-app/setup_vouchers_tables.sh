#!/bin/bash

# Script to set up vouchers tables in the database
# Uses DATABASE_URL from .env file

echo "Setting up vouchers tables..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create one with DATABASE_URL."
    exit 1
fi

# Load DATABASE_URL from .env file
export $(grep -v '^#' .env | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not found in .env file."
    echo "Please add DATABASE_URL to your .env file."
    exit 1
fi

echo "Using DATABASE_URL: ${DATABASE_URL:0:20}..."

# Run the migration
psql "$DATABASE_URL" -f db/add_customer_vouchers_table.sql

if [ $? -eq 0 ]; then
    echo "✅ Vouchers tables created successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run: ./load_sample_vouchers.sh"
    echo "2. Test the vouchers functionality in the loyalty page"
else
    echo "❌ Error creating vouchers tables."
    echo "Please check your DATABASE_URL and database connection."
fi
