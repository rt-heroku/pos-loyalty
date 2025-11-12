#!/bin/bash

# Heroku Configuration Script for Shop System
# This script sets up all required environment variables for the shop system to work

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get Heroku app name
read -p "Enter your Heroku app name (e.g., pos-loyalty-ef4d7b8a3f2a): " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo -e "${RED}Error: App name is required${NC}"
    exit 1
fi

echo -e "${GREEN}Configuring Heroku app: $APP_NAME${NC}"
echo ""

# Set BACKEND_URL to point to the same Heroku app
echo -e "${YELLOW}Setting BACKEND_URL...${NC}"
heroku config:set BACKEND_URL=https://${APP_NAME}.herokuapp.com -a $APP_NAME

# Set NEXT_PUBLIC_BASE_PATH
echo -e "${YELLOW}Setting NEXT_PUBLIC_BASE_PATH...${NC}"
heroku config:set NEXT_PUBLIC_BASE_PATH=/loyalty -a $APP_NAME

# Set PORT for Next.js (if not already set)
echo -e "${YELLOW}Setting PORT for Next.js...${NC}"
heroku config:set PORT=3001 -a $APP_NAME

# Check if DATABASE_URL is set
echo -e "${YELLOW}Checking DATABASE_URL...${NC}"
DB_URL=$(heroku config:get DATABASE_URL -a $APP_NAME)
if [ -z "$DB_URL" ]; then
    echo -e "${RED}Warning: DATABASE_URL is not set!${NC}"
    echo "Please set it manually with:"
    echo "heroku config:set DATABASE_URL=postgresql://... -a $APP_NAME"
else
    echo -e "${GREEN}DATABASE_URL is configured${NC}"
fi

# Check if JWT_SECRET is set
echo -e "${YELLOW}Checking JWT_SECRET...${NC}"
JWT_SECRET=$(heroku config:get JWT_SECRET -a $APP_NAME)
if [ -z "$JWT_SECRET" ]; then
    echo -e "${YELLOW}Generating JWT_SECRET...${NC}"
    RANDOM_SECRET=$(openssl rand -base64 32)
    heroku config:set JWT_SECRET=$RANDOM_SECRET -a $APP_NAME
    echo -e "${GREEN}JWT_SECRET generated and set${NC}"
else
    echo -e "${GREEN}JWT_SECRET is already configured${NC}"
fi

echo ""
echo -e "${GREEN}Configuration complete!${NC}"
echo ""
echo "Current configuration:"
heroku config -a $APP_NAME

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy your app: git push heroku main"
echo "2. Run database migrations if needed"
echo "3. Test the shop: https://${APP_NAME}.herokuapp.com/loyalty/shop"
echo ""
echo -e "${GREEN}Done!${NC}"

