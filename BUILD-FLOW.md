# Build Flow Diagram

## Heroku Deployment Process

```
┌─────────────────────────────────────────────────────────────────┐
│                     HEROKU DEPLOYMENT START                      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: npm install (Root Package)                             │
│  ─────────────────────────────────────────────────────────────  │
│  • Installs Express dependencies (cors, pg, etc.)               │
│  • Installs http-proxy-middleware                               │
│  • Installs concurrently                                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: postinstall Hook (Automatic)                           │
│  ─────────────────────────────────────────────────────────────  │
│  Script: cd loyalty-app && npm install                          │
│  • Installs Next.js                                             │
│  • Installs React & React DOM                                   │
│  • Installs Tailwind CSS                                        │
│  • Installs all loyalty-app dependencies                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: heroku-postbuild (Build Phase)                         │
│  ─────────────────────────────────────────────────────────────  │
│  Script: npm run build && node update-cache-version.js &&      │
│          cd loyalty-app && psql $DATABASE_URL -f db/...         │
│                                                                  │
│  3a. npm run build                                              │
│      └─> npm run build:loyalty                                  │
│          └─> cd loyalty-app && npm run build                    │
│              └─> next build                                     │
│                  • Compiles TypeScript                          │
│                  • Optimizes React components                   │
│                  • Generates static pages                       │
│                  • Creates production bundle                    │
│                  • Outputs to .next/ directory                  │
│                                                                  │
│  3b. node update-cache-version.js                               │
│      • Updates cache version for POS app                        │
│                                                                  │
│  3c. Database Migration                                         │
│      • Runs loyalty-database-changes.sql                        │
│      • Creates/updates loyalty tables                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Start Application (Procfile)                           │
│  ─────────────────────────────────────────────────────────────  │
│  Script: npm run start:production                               │
│  └─> concurrently "node server.js" "cd loyalty-app && npm start"│
│                                                                  │
│  ┌───────────────────────────┐  ┌────────────────────────────┐ │
│  │   Express Server (POS)    │  │  Next.js Server (Loyalty)  │ │
│  │   Port: 3000              │  │  Port: 3001                │ │
│  │   ─────────────────────   │  │  ──────────────────────    │ │
│  │   • Serves /pos           │  │  • Serves /loyalty         │ │
│  │   • Serves / (landing)    │  │  • Handles /loyalty/api/*  │ │
│  │   • Handles /api/*        │  │  • Renders React pages     │ │
│  │   • Proxies /loyalty      │◄─┤  • Standalone mode         │ │
│  │     to port 3001          │  │                            │ │
│  └───────────────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION RUNNING                          │
│  ─────────────────────────────────────────────────────────────  │
│  User Access:                                                    │
│  • http://your-app.herokuapp.com/         → Landing Page        │
│  • http://your-app.herokuapp.com/pos      → POS App             │
│  • http://your-app.herokuapp.com/loyalty  → Loyalty App         │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure After Build

```
unified-pos-loyalty/
├── node_modules/              # Root dependencies (Express, etc.)
├── public/                    # POS static files
│   ├── index.html
│   ├── app.js
│   ├── api.js
│   └── ...
├── loyalty-app/
│   ├── node_modules/          # Loyalty dependencies (Next.js, React, etc.)
│   ├── .next/                 # Built Next.js app (generated during build)
│   │   ├── standalone/        # Standalone server files
│   │   ├── static/            # Static assets
│   │   └── server/            # Server-side code
│   ├── src/
│   ├── public/
│   └── package.json
├── server.js                  # Express server with proxy
├── package.json               # Root package with scripts
├── Procfile                   # Heroku start command
└── ...
```

## Key Points

### Why Two `npm install` Commands?

1. **Root Install** (`npm install`):
   - Installs Express server dependencies
   - Required for `server.js` to run
   - Triggers `postinstall` hook

2. **Loyalty Install** (`cd loyalty-app && npm install`):
   - Installs Next.js and React
   - Required for `next build` to work
   - Happens automatically via `postinstall`

### Why `postinstall` Hook?

- Heroku runs `npm install` only once at the root
- `postinstall` ensures loyalty-app dependencies are installed
- Prevents "next: not found" error during build

### Build Script Simplification

**Before** (Redundant):
```json
"build": "npm install && cd loyalty-app && npm install && npm run build"
```

**After** (Clean):
```json
"postinstall": "cd loyalty-app && npm install",
"build": "npm run build:loyalty"
```

The `postinstall` hook handles dependency installation automatically, so the build script only needs to focus on building.

## Troubleshooting

### Error: "next: not found"
**Cause**: Next.js not installed in loyalty-app/
**Fix**: Check that `postinstall` script exists and runs

### Error: Build fails with module errors
**Cause**: Dependencies not installed in correct directory
**Fix**: Verify both `node_modules` directories exist

### Error: Proxy not working
**Cause**: Next.js server not running
**Fix**: Check Procfile uses `start:production` which starts both servers


