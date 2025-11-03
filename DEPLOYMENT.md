# Deployment Guide - Unified POS & Loyalty System

## Overview

This unified application consists of two parts:
1. **POS App**: Express.js server serving static files from `public/`
2. **Loyalty App**: Next.js application in `loyalty-app/` subdirectory

Both apps run on the same server with the Express app acting as a reverse proxy.

## Build Process

### Local Development

```bash
# Install all dependencies (root + loyalty-app)
npm install

# Start both servers in development mode
npm run dev
```

The `postinstall` script automatically installs dependencies in `loyalty-app/` after root dependencies are installed.

### Production Build

```bash
# Build the Next.js loyalty app
npm run build

# This runs: cd loyalty-app && npm run build
```

### Heroku Deployment

The deployment process follows these steps:

1. **Install Dependencies** (Heroku runs `npm install`)
   - Installs root `package.json` dependencies
   - `postinstall` script automatically runs: `cd loyalty-app && npm install`
   - This ensures Next.js and all loyalty app dependencies are installed

2. **Build** (Heroku runs `heroku-postbuild`)
   ```bash
   npm run build                                    # Builds Next.js app
   node update-cache-version.js                    # Updates cache version
   cd loyalty-app && psql $DATABASE_URL -f db/loyalty-database-changes.sql  # Runs DB migrations
   ```

3. **Start** (Heroku runs command from `Procfile`)
   ```bash
   web: node server.js
   ```

## Scripts Explanation

| Script | Purpose |
|--------|---------|
| `postinstall` | Automatically installs loyalty-app dependencies after root install |
| `build` | Builds the Next.js loyalty app (calls `build:loyalty`) |
| `build:loyalty` | Navigates to loyalty-app and runs `npm run build` |
| `heroku-postbuild` | Full Heroku build process: build + cache update + DB migration |
| `start` | Starts Express server only (for production) |
| `start:production` | Starts both Express and Next.js servers concurrently |
| `dev` | Runs development script that starts both servers |

## Key Configuration Files

### Root `package.json`
- Contains Express server dependencies
- Defines build and deployment scripts
- `postinstall` ensures loyalty-app dependencies are installed

### `loyalty-app/package.json`
- Contains Next.js and React dependencies
- Defines Next.js build and start scripts
- Configured to run on port 3001

### `loyalty-app/next.config.js`
- `basePath: '/loyalty'` - All routes prefixed with `/loyalty`
- `assetPrefix: '/loyalty'` - All assets served from `/loyalty`
- Configured for standalone output

### `server.js`
- Express server on port 3000 (or PORT env var)
- Serves POS static files from `public/` at `/pos`
- Proxies `/loyalty` requests to Next.js on port 3001
- Serves landing page at root `/`

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string (shared by both apps)
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret for JWT tokens (loyalty app)
- `SESSION_SECRET` - Session secret (POS app)

## URL Structure

- `/` - Landing page (gateway to both apps)
- `/pos` - POS application
- `/pos/api/*` - POS API endpoints
- `/loyalty` - Loyalty application (proxied to Next.js)
- `/loyalty/api/*` - Loyalty API endpoints (handled by Next.js)

## Important: Dependencies Configuration

### Build-Time Dependencies in `dependencies` (Not `devDependencies`)

For Heroku deployment, **build-critical packages must be in `dependencies`**, not `devDependencies`:

**Why?** Heroku may skip `devDependencies` in production builds, causing build failures.

**Build-critical packages** (in `loyalty-app/package.json`):
- `tailwindcss` - Required for CSS compilation
- `typescript` - Required for TypeScript compilation
- `postcss` & `autoprefixer` - Required for CSS processing
- `@types/*` packages - Required for TypeScript builds
- `@tailwindcss/*` plugins - Required for Tailwind features

**Development-only packages** (can stay in `devDependencies`):
- `eslint` - Code linting (optional for build)
- `prettier` - Code formatting (optional for build)
- `@typescript-eslint/*` - Linting plugins (optional for build)

## Troubleshooting

### "next: not found" Error
**Problem**: Next.js dependencies not installed in `loyalty-app/`

**Solution**: The `postinstall` script should handle this automatically. If it doesn't run:
```bash
cd loyalty-app && npm install
```

### "Cannot find module 'tailwindcss'" Error
**Problem**: Build-time dependencies are in `devDependencies` and Heroku skipped them

**Solution**: Move build-critical dependencies to `dependencies` (already done in this project)

### Build Fails on Heroku
**Check**:
1. `postinstall` script is present in root `package.json`
2. `heroku-postbuild` script runs `npm run build`
3. Both `node_modules` directories exist (root and loyalty-app)
4. Build-critical packages are in `dependencies`, not `devDependencies`

### Proxy Not Working
**Check**:
1. Next.js app is running on port 3001
2. `basePath` in `next.config.js` matches proxy path
3. Express proxy middleware is configured correctly

## Production Deployment Checklist

- [ ] Environment variables are set in Heroku
- [ ] Database migrations are included in `heroku-postbuild`
- [ ] `postinstall` script installs loyalty-app dependencies
- [ ] Next.js build completes successfully
- [ ] Both apps can access the database
- [ ] Static assets load correctly for both apps
- [ ] API endpoints work for both apps

## Architecture Benefits

1. **Single Deployment**: One Heroku app, one database
2. **Shared Resources**: Common database, unified authentication (future)
3. **Independent Codebases**: POS and Loyalty apps remain separate
4. **Unified Access**: Single domain with path-based routing
5. **Cost Effective**: One dyno, one database instance

