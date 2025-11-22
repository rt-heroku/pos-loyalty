#!/bin/bash

# Load Sample Promotions Script
# This script loads sample promotions into the database

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Sample Promotions Data Loader"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it using one of these methods:"
    echo ""
    echo "1. For Heroku:"
    echo "   heroku config:get DATABASE_URL -a your-app-name"
    echo "   export DATABASE_URL='<paste-the-url-here>'"
    echo ""
    echo "2. For local development:"
    echo "   export DATABASE_URL='postgresql://username:password@localhost:5432/database'"
    echo ""
    exit 1
fi

# Extract database info from DATABASE_URL (for display only)
if [[ $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    
    echo "📊 Database Connection:"
    echo "   Host: $DB_HOST"
    echo "   Port: $DB_PORT"
    echo "   Database: $DB_NAME"
    echo "   User: $DB_USER"
    echo ""
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SQL_FILE="$SCRIPT_DIR/sample_promotions.sql"

# Check if the SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ ERROR: sample_promotions.sql not found in $SCRIPT_DIR"
    exit 1
fi

echo "📁 SQL File: sample_promotions.sql"
echo ""

# Confirm before proceeding
read -p "⚠️  This will add sample promotions to the database. Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted by user"
    exit 0
fi

echo ""
echo "🚀 Loading sample promotions..."
echo ""

# Run the SQL file
if psql "$DATABASE_URL" -f "$SQL_FILE"; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ✅ Sample promotions loaded successfully!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📍 Next Steps:"
    echo ""
    echo "1. Open POS Application:"
    echo "   - Click 'Operations' → 'Promotions'"
    echo "   - You should see 10 sample promotions"
    echo ""
    echo "2. Open Loyalty View:"
    echo "   - Search for customer: LOY001"
    echo "   - You'll see their enrolled promotions"
    echo ""
    echo "3. Test the API:"
    echo "   curl https://your-app.herokuapp.com/api/promotions"
    echo ""
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ❌ Error loading sample promotions"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Please check the error messages above."
    exit 1
fi

