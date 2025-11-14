#!/bin/bash

##############################################################################
# Password Management Script for POS & Loyalty System
##############################################################################
# 
# This script provides password management functionality for the POS system.
# It uses the database's bcrypt functions for secure password hashing.
#
# Usage:
#   ./manage-password.sh CREATE email@example.com [password]
#   ./manage-password.sh DELETE email@example.com
#   ./manage-password.sh RESET email@example.com [newPassword]
#
# Features:
#   - CREATE: Create a new admin user
#   - DELETE: Delete an existing user
#   - RESET: Reset a user's password
#   - If password is omitted, sets user to "must change password" state
#   - Works with both POS and Loyalty app
#
# Requirements:
#   - PostgreSQL client (psql) installed
#   - DATABASE_URL environment variable set
#
##############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo "Please set it first:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql (PostgreSQL client) is not installed${NC}"
    echo "Please install it first:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Function to print usage
print_usage() {
    echo -e "${BLUE}Password Management Script${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 CREATE email@example.com [password]"
    echo "  $0 DELETE email@example.com"
    echo "  $0 RESET email@example.com [newPassword]"
    echo ""
    echo "Commands:"
    echo "  CREATE  - Create a new admin user"
    echo "  DELETE  - Delete an existing user"
    echo "  RESET   - Reset a user's password"
    echo ""
    echo "Notes:"
    echo "  - If password is omitted, user will be prompted to set password on next login"
    echo "  - Passwords are hashed using bcrypt"
    echo "  - Works with both POS and Loyalty app"
    echo ""
    exit 1
}

# Function to validate email
validate_email() {
    local email=$1
    if [[ ! "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        echo -e "${RED}Error: Invalid email address${NC}"
        exit 1
    fi
}

# Function to CREATE user
create_user() {
    local email=$1
    local password=$2
    
    validate_email "$email"
    
    echo -e "${BLUE}Creating admin user: $email${NC}"
    
    # Extract username from email
    local username=$(echo "$email" | cut -d'@' -f1)
    
    # Prompt for required fields
    read -p "First Name: " first_name
    read -p "Last Name: " last_name
    read -p "Phone (optional): " phone
    
    if [ -z "$first_name" ] || [ -z "$last_name" ]; then
        echo -e "${RED}Error: First name and last name are required${NC}"
        exit 1
    fi
    
    # Check if user already exists
    user_exists=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users WHERE email = '$email' OR username = '$username';")
    if [ "$user_exists" -gt 0 ]; then
        echo -e "${RED}Error: User with email $email or username $username already exists${NC}"
        exit 1
    fi
    
    # Handle password
    if [ -z "$password" ]; then
        echo -e "${YELLOW}No password provided. User will be prompted to set password on first login.${NC}"
        must_change_password="true"
        password_hash="NULL"
    else
        must_change_password="false"
        # Hash password using database function
        password_hash=$(psql "$DATABASE_URL" -t -c "SELECT hash_password('$password');")
        password_hash=$(echo "$password_hash" | xargs) # Trim whitespace
    fi
    
    # Get admin role ID
    role_id=$(psql "$DATABASE_URL" -t -c "SELECT id FROM roles WHERE name = 'admin' OR name = 'Admin' LIMIT 1;")
    role_id=$(echo "$role_id" | xargs)
    
    if [ -z "$role_id" ]; then
        echo -e "${RED}Error: Admin role not found in database${NC}"
        exit 1
    fi
    
    # Create user
    if [ "$password_hash" = "NULL" ]; then
        psql "$DATABASE_URL" <<EOF
BEGIN;
INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role_id, role, is_active, must_change_password, created_at, updated_at)
VALUES ('$username', '$email', NULL, '$first_name', '$last_name', $([ -z "$phone" ] && echo "NULL" || echo "'$phone'"), $role_id, 'admin', true, $must_change_password, NOW(), NOW());

-- Create customer record
INSERT INTO customers (user_id, loyalty_number, first_name, last_name, name, email, phone, points, total_spent, visit_count, is_active, member_status, enrollment_date, member_type, customer_tier, tier_calculation_number, status, created_at, updated_at)
SELECT u.id, generate_loyalty_number(), '$first_name', '$last_name', '$first_name $last_name', '$email', $([ -z "$phone" ] && echo "NULL" || echo "'$phone'"), 0, 0.00, 0, true, 'Active', NOW(), 'Individual', 'Bronze', 0.00, 'Created', NOW(), NOW()
FROM users u WHERE u.email = '$email';
COMMIT;
EOF
    else
        psql "$DATABASE_URL" <<EOF
BEGIN;
INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role_id, role, is_active, must_change_password, created_at, updated_at)
VALUES ('$username', '$email', '$password_hash', '$first_name', '$last_name', $([ -z "$phone" ] && echo "NULL" || echo "'$phone'"), $role_id, 'admin', true, $must_change_password, NOW(), NOW());

-- Create customer record
INSERT INTO customers (user_id, loyalty_number, first_name, last_name, name, email, phone, points, total_spent, visit_count, is_active, member_status, enrollment_date, member_type, customer_tier, tier_calculation_number, status, created_at, updated_at)
SELECT u.id, generate_loyalty_number(), '$first_name', '$last_name', '$first_name $last_name', '$email', $([ -z "$phone" ] && echo "NULL" || echo "'$phone'"), 0, 0.00, 0, true, 'Active', NOW(), 'Individual', 'Bronze', 0.00, 'Created', NOW(), NOW()
FROM users u WHERE u.email = '$email';
COMMIT;
EOF
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ User created successfully${NC}"
        echo -e "  Email: $email"
        echo -e "  Username: $username"
        if [ "$must_change_password" = "true" ]; then
            echo -e "  ${YELLOW}⚠ Password must be set on first login${NC}"
        fi
    else
        echo -e "${RED}✗ Failed to create user${NC}"
        exit 1
    fi
}

# Function to DELETE user
delete_user() {
    local email=$1
    
    validate_email "$email"
    
    echo -e "${YELLOW}WARNING: This will permanently delete the user and associated customer data${NC}"
    read -p "Are you sure you want to delete $email? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo -e "${BLUE}Operation cancelled${NC}"
        exit 0
    fi
    
    # Check if user exists
    user_exists=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users WHERE email = '$email';")
    if [ "$user_exists" -eq 0 ]; then
        echo -e "${RED}Error: User $email not found${NC}"
        exit 1
    fi
    
    # Delete user (CASCADE will handle customer record)
    psql "$DATABASE_URL" <<EOF
BEGIN;
-- Delete customer record first
DELETE FROM customers WHERE user_id = (SELECT id FROM users WHERE email = '$email');
-- Delete user
DELETE FROM users WHERE email = '$email';
COMMIT;
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ User deleted successfully${NC}"
    else
        echo -e "${RED}✗ Failed to delete user${NC}"
        exit 1
    fi
}

# Function to RESET password
reset_password() {
    local email=$1
    local new_password=$2
    
    validate_email "$email"
    
    # Check if user exists
    user_exists=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users WHERE email = '$email';")
    if [ "$user_exists" -eq 0 ]; then
        echo -e "${RED}Error: User $email not found${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Resetting password for: $email${NC}"
    
    # Handle password
    if [ -z "$new_password" ]; then
        echo -e "${YELLOW}No password provided. User will be prompted to set password on next login.${NC}"
        psql "$DATABASE_URL" <<EOF
UPDATE users 
SET password_hash = NULL, 
    must_change_password = true,
    updated_at = NOW()
WHERE email = '$email';
EOF
    else
        # Hash password using database function
        password_hash=$(psql "$DATABASE_URL" -t -c "SELECT hash_password('$new_password');")
        password_hash=$(echo "$password_hash" | xargs)
        
        psql "$DATABASE_URL" <<EOF
UPDATE users 
SET password_hash = '$password_hash', 
    must_change_password = false,
    password_changed_at = NOW(),
    updated_at = NOW()
WHERE email = '$email';
EOF
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Password reset successfully${NC}"
        if [ -z "$new_password" ]; then
            echo -e "  ${YELLOW}⚠ User must set password on next login${NC}"
        fi
    else
        echo -e "${RED}✗ Failed to reset password${NC}"
        exit 1
    fi
}

# Main script logic
if [ $# -lt 2 ]; then
    print_usage
fi

COMMAND=$1
EMAIL=$2
PASSWORD=$3

case "$COMMAND" in
    CREATE|create)
        create_user "$EMAIL" "$PASSWORD"
        ;;
    DELETE|delete)
        delete_user "$EMAIL"
        ;;
    RESET|reset)
        reset_password "$EMAIL" "$PASSWORD"
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$COMMAND'${NC}"
        print_usage
        ;;
esac

