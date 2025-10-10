#!/bin/bash

# Customer Loyalty App - Heroku Deployment Script
# This script handles the deployment of the customer loyalty application to Heroku

set -e  # Exit on any error

echo "🚀 Starting deployment of Customer Loyalty App to Heroku..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    print_error "Heroku CLI is not installed. Please install it first:"
    echo "https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
    else
        print_error ".env.example not found. Please create a .env file with required environment variables."
        exit 1
    fi
fi

# Check if app name is provided
APP_NAME=${1:-"customer-loyalty-app"}
print_status "Using app name: $APP_NAME"

# Check if app exists on Heroku
if heroku apps:info --app $APP_NAME &> /dev/null; then
    print_status "App $APP_NAME already exists on Heroku"
else
    print_status "Creating new Heroku app: $APP_NAME"
    heroku create $APP_NAME
fi

# Set up Heroku buildpacks
print_status "Setting up buildpacks..."
heroku buildpacks:clear --app $APP_NAME
heroku buildpacks:add heroku/nodejs --app $APP_NAME

# Add PostgreSQL addon if not already added
print_status "Checking PostgreSQL addon..."
if ! heroku addons:info heroku-postgresql --app $APP_NAME &> /dev/null; then
    print_status "Adding PostgreSQL addon..."
    heroku addons:create heroku-postgresql:mini --app $APP_NAME
else
    print_success "PostgreSQL addon already exists"
fi

# Set environment variables
print_status "Setting environment variables..."
heroku config:set NODE_ENV=production --app $APP_NAME
heroku config:set NPM_CONFIG_PRODUCTION=false --app $APP_NAME

# Set database URL from Heroku
DATABASE_URL=$(heroku config:get DATABASE_URL --app $APP_NAME)
if [ -n "$DATABASE_URL" ]; then
    print_success "Database URL configured"
else
    print_error "Failed to get database URL from Heroku"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run database migrations if they exist
if [ -f "loyalty-database-changes.sql" ]; then
    print_status "Running database migrations..."
    # Note: In production, you might want to use a proper migration tool
    # For now, we'll just note that migrations need to be run manually
    print_warning "Database migrations need to be run manually. Please run:"
    echo "heroku pg:psql --app $APP_NAME < loyalty-database-changes.sql"
fi

# Build the application
print_status "Building the application..."
npm run build

# Test the build
print_status "Testing the build..."
npm run start:test || {
    print_error "Build test failed. Please check your application."
    exit 1
}

# Deploy to Heroku
print_status "Deploying to Heroku..."
git add .
git commit -m "Deploy customer loyalty app" || {
    print_warning "No changes to commit"
}

git push heroku main || git push heroku master

# Run database migrations after deployment
print_status "Running database migrations..."
heroku pg:psql --app $APP_NAME < loyalty-database-changes.sql || {
    print_warning "Database migration failed. Please run manually:"
    echo "heroku pg:psql --app $APP_NAME < loyalty-database-changes.sql"
}

# Open the app
print_status "Opening the application..."
heroku open --app $APP_NAME

# Show app info
print_status "Application deployed successfully!"
echo ""
echo "App URL: https://$APP_NAME.herokuapp.com"
echo "Heroku Dashboard: https://dashboard.heroku.com/apps/$APP_NAME"
echo ""
echo "Useful commands:"
echo "  View logs: heroku logs --tail --app $APP_NAME"
echo "  Run database console: heroku pg:psql --app $APP_NAME"
echo "  Restart app: heroku restart --app $APP_NAME"
echo "  Scale dynos: heroku ps:scale web=1 --app $APP_NAME"

print_success "Deployment completed successfully! 🎉"
