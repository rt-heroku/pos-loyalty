# Port Architecture Documentation

## Overview
This document explains how ports are configured for the Unified POS & Loyalty application in both development and production environments.

## Production (Heroku) Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Heroku Dyno                                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Express Server (POS)                                   │ │
│  │ Port: $PORT (Heroku-assigned, e.g., 42797)           │ │
│  │ - Serves static POS files                            │ │
│  │ - Handles /api/* endpoints                           │ │
│  │ - Proxies /loyalty/* to Next.js                      │ │
│  └─────┬──────────────────────────────────────────────────┘ │
│        │                                                     │
│        │ Internal Proxy                                      │
│        ▼                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Next.js Server (Loyalty)                              │ │
│  │ Port: 3001 (fixed internal port)                      │ │
│  │ - Serves /loyalty/* routes                           │ │
│  │ - API routes call back to Express via                │ │
│  │   BACKEND_INTERNAL_URL=http://localhost:$PORT        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Configuration Files

#### `Procfile`
```bash
web: BACKEND_INTERNAL_URL=http://localhost:$PORT npm run start:production
```
- Sets `BACKEND_INTERNAL_URL` to the correct internal port
- `$PORT` is Heroku's dynamically assigned port

#### `package.json` (start:production)
```json
"start:production": "concurrently \"node server.js\" \"cd loyalty-app && PORT=3001 BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL} node .next/standalone/server.js\""
```
- Express runs on `$PORT` (from Heroku)
- Next.js runs on fixed port `3001`
- `BACKEND_INTERNAL_URL` is passed through to Next.js

#### `server.js`
```javascript
const port = process.env.PORT || 3000;  // Uses Heroku's $PORT

const loyaltyProxy = createProxyMiddleware({
  target: 'http://localhost:3001',  // Points to Next.js
  // ...
});
```

#### `loyalty-app/src/lib/backend.ts`
```typescript
export function getBackendUrl(): string {
  // In production, use internal backend URL
  if (process.env.BACKEND_INTERNAL_URL) {
    return process.env.BACKEND_INTERNAL_URL;  // http://localhost:$PORT
  }
  // ... fallback logic for development
}
```

## Development (Local) Architecture

```
┌──────────────────────────┐     ┌──────────────────────────┐
│ Express Server (POS)     │     │ Next.js Dev Server       │
│ Port: 3000               │◄────│ Port: 3001               │
│ - Static POS files       │     │ - Hot reload             │
│ - /api/* endpoints       │     │ - /loyalty/* routes      │
│ - Proxies /loyalty/*     │     │ - Calls Express via      │
│   to Next.js            │     │   localhost:3000         │
└──────────────────────────┘     └──────────────────────────┘
```

### Development Scripts

#### Terminal 1: Express Server
```bash
npm start  # Runs on port 3000
```

#### Terminal 2: Next.js Dev Server
```bash
cd loyalty-app && npm run dev  # Runs on port 3001
```

Or use the combined dev script:
```bash
npm run dev  # Starts both servers
```

## Port Reference Table

| Environment | Express Port | Next.js Port | Backend URL for Next.js |
|-------------|-------------|--------------|-------------------------|
| **Production (Heroku)** | `$PORT` (e.g., 42797) | `3001` | `http://localhost:$PORT` |
| **Development** | `3000` | `3001` | `http://localhost:3000` |

## Important Notes

### ✅ DO:
- Use `process.env.PORT` for Express in production
- Keep Next.js on fixed port `3001` in both environments
- Use `BACKEND_INTERNAL_URL` for internal communication
- Set `BACKEND_INTERNAL_URL=http://localhost:$PORT` in Procfile

### ❌ DON'T:
- Hardcode port `3000` for Express in production
- Try to use external URLs for internal communication
- Change Next.js port from `3001` (proxy depends on it)
- Forget to pass `BACKEND_INTERNAL_URL` to Next.js process

## Troubleshooting

### Error: "ECONNREFUSED localhost:3000"
**Problem:** Next.js trying to call Express on wrong port  
**Solution:** Ensure `BACKEND_INTERNAL_URL` is set in Procfile and passed to Next.js

### Error: "Loyalty app is not available"
**Problem:** Express proxy can't reach Next.js  
**Solution:** Verify Next.js is running on port 3001

### Setup wizard not showing database credentials
**Problem:** Next.js API routes can't reach Express backend  
**Solution:** Check that `BACKEND_INTERNAL_URL` is properly configured

## Testing

### Local Testing
```bash
# Terminal 1
npm start

# Terminal 2
cd loyalty-app && npm run dev

# Visit http://localhost:3000
```

### Production Simulation
```bash
# Set environment variable
export PORT=8080
export BACKEND_INTERNAL_URL=http://localhost:8080

# Run production mode
npm run start:production

# Visit http://localhost:8080
```

## Related Files
- `Procfile` - Heroku startup configuration
- `package.json` - NPM scripts
- `server.js` - Express server and proxy
- `loyalty-app/src/lib/backend.ts` - Backend URL detection
- `env.example` - Environment variable documentation

