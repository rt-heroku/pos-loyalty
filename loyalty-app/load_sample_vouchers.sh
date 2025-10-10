#!/bin/bash

# Script to load sample voucher data into the database
# Uses DATABASE_URL from .env file

echo "Loading sample voucher data..."

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

# Load sample voucher data
psql "$DATABASE_URL" -f db/sample_vouchers.sql

if [ $? -eq 0 ]; then
    echo "✅ Sample voucher data loaded successfully!"
    echo "You can now test the vouchers functionality in the loyalty page."
else
    echo "❌ Error loading sample data. Please check your database connection."
    echo "Make sure your database is running and accessible."
fi
