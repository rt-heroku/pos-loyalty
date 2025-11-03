# Unified POS & Loyalty App

A unified deployment combining a Point of Sale (POS) system with a customer loyalty application. Built with Express.js and Next.js, served through a reverse proxy architecture.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Express Server (Port 3000)              │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │   POS App       │  │      Reverse Proxy             │   │
│  │   /pos/*        │  │      /loyalty/* → :3001        │   │
│  │   Static Files  │  │      Next.js App               │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────────────┐
                    │  Next.js App    │
                    │  Port 3001      │
                    │  /loyalty/*     │
                    └─────────────────┘
```

## 🚀 Features

### POS System (`/pos`)
- Complete point-of-sale functionality
- Inventory management
- Customer management
- Sales tracking
- Multi-location support
- MuleSoft integration

### Loyalty App (`/loyalty`)
- Customer-facing loyalty program
- Points tracking and redemption
- Mobile-responsive PWA
- Social login integration
- AI chat support
- Push notifications

## 📁 Project Structure

```
unified-pos-loyalty/
├── server.js                 # Express server with reverse proxy
├── package.json             # Unified dependencies and scripts
├── Procfile                 # Heroku deployment configuration
├── app.json                 # Heroku app configuration
├── env.example              # Environment variables template
├── public/                  # POS app static files
│   ├── index.html
│   ├── app.js
│   └── components/
└── loyalty-app/             # Next.js loyalty application
    ├── package.json
    ├── next.config.js       # Configured with basePath: '/loyalty'
    ├── src/app/             # Next.js app directory
    └── public/              # Loyalty app assets
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18.x
- npm 9.x
- PostgreSQL database


## 🛠️ Local Setup
1. **Clone and setup:**
   ```bash
   cd unified-pos-loyalty
   npm install
   cd loyalty-app && npm install && cd ..
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your database and configuration
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Access applications:**
   - POS App: http://localhost:3000/pos
   - Loyalty App: http://localhost:3000/loyalty

### Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production servers:**
   ```bash
   npm run start:production
   ```

## 🚀 Heroku Deployment

### One-Click Deploy
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Manual Deployment

1. **Create Heroku app:**
   ```bash
   heroku create your-unified-app
   heroku addons:create heroku-postgresql:hobby-dev
   ```

2. **Configure environment variables:**
   ```bash
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set DATABASE_URL=$(heroku config:get DATABASE_URL)
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `PORT` | Express server port | 3000 |
| `NODE_ENV` | Environment mode | development |

### Next.js Configuration

The loyalty app is configured with:
- `basePath: '/loyalty'` - All routes prefixed with /loyalty
- `assetPrefix: '/loyalty'` - Static assets served from /loyalty
- `output: 'standalone'` - Optimized for production

### Express Proxy Configuration

- `/pos/*` → Serves POS static files
- `/loyalty/*` → Proxies to Next.js app on port 3001
- `/` → Redirects to `/pos`

## 📊 API Endpoints

### POS API (`/pos/api/*`)
- Authentication: `/pos/api/auth/*`
- Customers: `/pos/api/customers/*`
- Products: `/pos/api/products/*`
- Sales: `/pos/api/sales/*`
- Inventory: `/pos/api/inventory/*`

### Loyalty API (`/loyalty/api/*`)
- Authentication: `/loyalty/api/auth/*`
- Profile: `/loyalty/api/profile/*`
- Loyalty: `/loyalty/api/loyalty/*`
- Products: `/loyalty/api/products/*`

## 🧪 Testing

Run the setup test to verify configuration:
```bash
node test-setup.js
```

## 📝 Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both servers in development mode |
| `npm run build` | Build the Next.js loyalty app |
| `npm run start:production` | Start both servers in production mode |
| `npm run loyalty:dev` | Start only the loyalty app |
| `npm run loyalty:build` | Build only the loyalty app |

## 🔒 Security

- CORS configured for both apps
- JWT authentication for API endpoints
- Rate limiting on API routes
- Secure headers configured in Next.js

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Ensure port 3000 is available for Express
   - Ensure port 3001 is available for Next.js

2. **Proxy errors:**
   - Check that Next.js app is running on port 3001
   - Verify basePath configuration in next.config.js

3. **Static file issues:**
   - Verify /pos path configuration in server.js
   - Check that public directory exists

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the test-setup.js output

---

**Built with ❤️ using Express.js, Next.js, and PostgreSQL**