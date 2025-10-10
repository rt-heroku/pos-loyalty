# Customer Loyalty App

A comprehensive customer-facing loyalty mobile/web application built with Next.js 14, TypeScript, and Tailwind CSS. This application enables customers to access their loyalty program information, track orders, manage rewards, and interact with AI-powered customer service.

## 🚀 Features

### Core Functionality

- **Loyalty Program Management**: View points, tier status, and benefits
- **Order Tracking**: Real-time order status and shipping information
- **Rewards System**: Redeem points for discounts and exclusive offers
- **AI Chat Support**: 24/7 customer service with AI-powered assistance
- **Mobile-First Design**: Responsive PWA with native app-like experience
- **Multi-Location Support**: Access loyalty programs across different store locations

### Technical Features

- **Progressive Web App (PWA)**: Installable on mobile devices
- **Offline Support**: Basic functionality when offline
- **Real-time Updates**: Live data synchronization
- **Social Login**: Google, Facebook, and Apple authentication
- **Push Notifications**: Order updates and promotional alerts
- **Advanced Security**: JWT authentication and data encryption

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT with social login support
- **PWA**: next-pwa with service worker
- **Deployment**: Heroku with automatic CI/CD
- **State Management**: React hooks with Zustand (optional)
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database
- Heroku account (for deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd customer-loyalty-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment example file and configure your variables:

```bash
cp env.example .env.local
```

Update the `.env.local` file with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/loyalty_app

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Customer Loyalty App

# Social Login (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
```

### 4. Database Setup

Run the database migrations to set up the schema:

```bash
# If using local PostgreSQL
psql $DATABASE_URL -f loyalty-database-changes.sql

# Or use the npm script
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📱 PWA Features

The application is built as a Progressive Web App with the following features:

- **Installable**: Users can install the app on their mobile devices
- **Offline Support**: Basic functionality works without internet connection
- **Push Notifications**: Real-time updates for orders and promotions
- **App-like Experience**: Native mobile app feel with smooth animations
- **Background Sync**: Syncs data when connection is restored

## 🗄 Database Schema

The application uses a comprehensive PostgreSQL schema that includes:

### Core Tables

- `customers` - Customer information and loyalty data
- `products` - Product catalog with enhanced metadata
- `transactions` - Purchase history and points tracking
- `locations` - Multi-store support
- `users` - Authentication and user management

### Loyalty System

- `loyalty_tiers` - Tier definitions and benefits
- `loyalty_rewards` - Available rewards for redemption
- `customer_rewards` - Individual customer reward redemptions
- `customer_referrals` - Referral program tracking

### Order Management

- `customer_addresses` - Shipping and billing addresses
- `order_tracking` - Shipping and delivery tracking
- `order_status_history` - Complete order timeline

### Customer Service

- `chat_sessions` - Customer service chat management
- `chat_messages` - Individual messages within sessions
- `customer_service_tickets` - Support ticket system

### Additional Features

- `customer_wishlists` - Product wishlist functionality
- `product_reviews` - Customer reviews and ratings
- `customer_notifications` - Notification system
- `customer_social_accounts` - Social login integration

## 🚀 Deployment

### Heroku Deployment

1. **Install Heroku CLI** (if not already installed):

   ```bash
   # macOS
   brew install heroku/brew/heroku

   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**:

   ```bash
   heroku login
   ```

3. **Deploy using the deployment script**:

   ```bash
   ./deploy.sh
   ```

   Or manually:

   ```bash
   # Create Heroku app
   heroku create your-app-name

   # Add PostgreSQL addon
   heroku addons:create heroku-postgresql:mini

   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key

   # Deploy
   git push heroku main

   # Run database migrations
   heroku pg:psql < loyalty-database-changes.sql
   ```

### Environment Variables for Production

Set these environment variables in your Heroku app:

```bash
heroku config:set DATABASE_URL=$(heroku config:get DATABASE_URL)
heroku config:set JWT_SECRET=your-production-secret
heroku config:set NEXT_PUBLIC_APP_URL=https://your-app.herokuapp.com
heroku config:set NODE_ENV=production
```

## 📁 Project Structure

```
customer-loyalty-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # Reusable components
│   │   ├── ui/                 # Base UI components
│   │   ├── layout/             # Layout components
│   │   └── features/           # Feature-specific components
│   ├── lib/                    # Utility libraries
│   │   ├── db.ts              # Database connection
│   │   ├── database-types.ts   # TypeScript types
│   │   └── utils.ts           # Utility functions
│   ├── types/                  # TypeScript type definitions
│   ├── hooks/                  # Custom React hooks
│   ├── constants/              # Application constants
│   └── styles/                 # Additional styles
├── public/                     # Static assets
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── icons/                  # App icons
├── loyalty-database-changes.sql # Database schema
├── deploy.sh                   # Deployment script
├── package.json                # Dependencies and scripts
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run start:test       # Test production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
```

### Code Style

The project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Tailwind CSS** for styling

### Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Configuration

### Tailwind CSS

The project includes a custom Tailwind configuration with:

- Custom color palette for loyalty tiers
- Responsive design utilities
- Custom animations and transitions
- PWA-specific styles

### Next.js Configuration

- PWA support with next-pwa
- Image optimization
- Security headers
- Performance optimizations

### Database Configuration

- Connection pooling for performance
- Retry logic for reliability
- Environment-based SSL configuration
- Graceful shutdown handling

## 📊 Performance

The application is optimized for:

- **Fast Loading**: Code splitting and lazy loading
- **Mobile Performance**: Optimized for mobile devices
- **SEO**: Server-side rendering and meta tags
- **Accessibility**: WCAG compliant design
- **Offline Support**: Service worker caching

## 🔒 Security

- JWT authentication with secure token handling
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- XSS protection with proper content sanitization
- HTTPS enforcement in production
- Rate limiting for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔄 Updates

Stay updated with the latest changes:

- Follow the repository for updates
- Check the changelog for version history
- Subscribe to release notifications

---

**Built with ❤️ by the Customer Loyalty Team**
