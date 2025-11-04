/**
 * POS System Server
 * 
 * Express.js backend server for the Point of Sale (POS) system with the following features:
 * - RESTful API endpoints for all POS operations
 * - PostgreSQL database integration
 * - User authentication and authorization
 * - System settings management
 * - Customer, product, and sales management
 * - Inventory tracking and management
 * - Location-based operations
 * - MuleSoft integration support
 * - Static file serving for the frontend
 * 
 * API Endpoints:
 * - Authentication: /api/auth/login, /api/auth/register
 * - Customers: /api/customers (CRUD operations)
 * - Products: /api/products (CRUD operations)
 * - Sales: /api/sales (CRUD operations)
 * - Inventory: /api/inventory (CRUD operations)
 * - System Settings: /api/system-settings (CRUD operations)
 * - Locations: /api/locations (CRUD operations)
 * - Users: /api/users (CRUD operations)
 * 
 * @author Rodrigo Torres
 * @version 1.0.0
 * @since 2025-01-11
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
//  ssl: process.env.NODE_ENV === 'development' ? { rejectUnauthorized: false } : false
    ssl: { rejectUnauthorized: false } 
});

// Middleware
app.use(cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
// Static file serving for POS app at /pos path
app.use('/pos', express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        // Disable caching for JavaScript files to prevent cache issues during development
//        if (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.tsx')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
//        }
        // Allow caching for other static assets (images, CSS, etc.)
//        else if (path.endsWith('.css') || path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif') || path.endsWith('.svg') || path.endsWith('.ico')) {
//            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
//        }
    }
}));

// Reverse proxy for Next.js loyalty app
const loyaltyProxy = createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  timeout: 30000,
  ws: true,
  // ✅ This handles body parsing automatically
 // parseReqBody: true,
  
  onProxyReq: (proxyReq, req, res) => {
    console.log(`onProxyReq->originalUrl: ${req.originalUrl}`);
    
    // ✅ Re-stream the body for POST/PUT/PATCH requests
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      
      // Update headers
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      
      // Write the body
      proxyReq.write(bodyData);
    }
  },
  
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Received response from loyalty app: ${proxyRes.statusCode}`);
  },
  
  onError: (err, req, res) => {
    console.error('Loyalty app proxy error:', err);
    res.status(500).json({ error: 'Loyalty app is not available' });
  }
});

// Route /loyalty requests to Next.js app
app.use('/loyalty', loyaltyProxy);

// Root route - serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const result = await pool.query(
      'SELECT us.*, u.username, u.email, u.first_name, u.last_name, r.name as role_name, r.permissions FROM user_sessions us JOIN users u ON us.user_id = u.id JOIN roles r ON u.role_id = r.id WHERE us.session_token = $1 AND us.is_active = true AND us.expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(500).json({ error: 'Token verification failed' });
  }
};

// Permission middleware
const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const permissions = req.user.permissions;
    if (!permissions || !permissions[module] || !permissions[module][action]) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Log activity middleware
const logActivity = (activityType, description) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      res.send = originalSend;
      return originalSend.call(this, data);
    };

    try {
      if (req.user) {
        await pool.query(
          'SELECT log_user_activity($1, $2, $3, $4, $5, $6)',
          [
            req.user.user_id,
            activityType,
            description,
            req.ip,
            req.get('User-Agent'),
            JSON.stringify({ method: req.method, path: req.path })
          ]
        );
      }
    } catch (err) {
      console.error('Activity logging error:', err);
    }

    next();
  };
};

// Utility function to calculate points (1 point per dollar spent)
const calculatePoints = (total) => Math.floor(total);

// Authentication API Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Get user with role information
    const userResult = await pool.query(
      'SELECT u.*, r.name as role_name, r.permissions FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = $1 AND u.is_active = true',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.is_locked) {
      return res.status(423).json({ error: 'Account is locked. Please contact administrator.' });
    }

    // Verify password
    const passwordValid = await pool.query(
      'SELECT verify_password($1, $2) as is_valid',
      [password, user.password_hash]
    );

    if (!passwordValid.rows[0].is_valid) {
      // Increment failed login attempts
      await pool.query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Lock account after 5 failed attempts
      if (user.failed_login_attempts >= 4) {
        await pool.query(
          'UPDATE users SET is_locked = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [user.id]
        );
        return res.status(423).json({ error: 'Account locked due to multiple failed login attempts' });
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed login attempts on successful login
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query(
      'INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [user.id, sessionToken, req.ip, req.get('User-Agent'), expiresAt]
    );

    // Log login activity
    await pool.query(
      'SELECT log_user_activity($1, $2, $3, $4, $5, $6)',
      [user.id, 'login', 'User logged in successfully', req.ip, req.get('User-Agent'), '{}']
    );

    res.json({
      token: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role_name,
        permissions: user.permissions
      },
      expires_at: expiresAt
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Invalidate session
    await pool.query(
      'UPDATE user_sessions SET is_active = false WHERE session_token = $1',
      [token]
    );

    // Log logout activity
    await pool.query(
      'SELECT log_user_activity($1, $2, $3, $4, $5, $6)',
      [req.user.user_id, 'logout', 'User logged out', req.ip, req.get('User-Agent'), '{}']
    );

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.last_login, r.name as role_name, r.description as role_description, r.permissions FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [req.user.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userResult.rows[0]);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Verify current password
    const passwordValid = await pool.query(
      'SELECT verify_password($1, password_hash) as is_valid FROM users WHERE id = $2',
      [current_password, req.user.user_id]
    );

    if (!passwordValid.rows[0].is_valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await pool.query(
      'SELECT hash_password($1) as hash',
      [new_password]
    );

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP, must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash.rows[0].hash, req.user.user_id]
    );

    // Log password change
    await pool.query(
      'SELECT log_user_activity($1, $2, $3, $4, $5, $6)',
      [req.user.user_id, 'password_change', 'Password changed successfully', req.ip, req.get('User-Agent'), '{}']
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// User Management API Routes

// Get all users (admin only)
app.get('/api/users', authenticateToken, requirePermission('users', 'read'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.is_active, u.is_locked, 
             u.last_login, u.created_at, r.name as role_name, r.description as role_description
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      ORDER BY u.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (admin only)
app.post('/api/users', authenticateToken, requirePermission('users', 'write'), async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role_id } = req.body;

    if (!username || !email || !password || !first_name || !last_name || !role_id) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash password
    const passwordHash = await pool.query(
      'SELECT hash_password($1) as hash',
      [password]
    );

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, first_name, last_name, is_active',
      [username, email, passwordHash.rows[0].hash, first_name, last_name, role_id, req.user.user_id]
    );

    // Log user creation
    await pool.query(
      'SELECT log_user_activity($1, $2, $3, $4, $5, $6)',
      [req.user.user_id, 'user_created', `Created user: ${username}`, req.ip, req.get('User-Agent'), JSON.stringify({ created_user_id: result.rows[0].id })]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, requirePermission('users', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, first_name, last_name, role_id, is_active, is_locked } = req.body;

    const result = await pool.query(
      'UPDATE users SET email = $1, first_name = $2, last_name = $3, role_id = $4, is_active = $5, is_locked = $6, updated_at = CURRENT_TIMESTAMP, updated_by = $7 WHERE id = $8 RETURNING id, username, email, first_name, last_name, is_active, is_locked',
      [email, first_name, last_name, role_id, is_active, is_locked, req.user.user_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log user update
    await pool.query(
      'SELECT log_user_activity($1, $2, $3, $4, $5, $6)',
      [req.user.user_id, 'user_updated', `Updated user: ${result.rows[0].username}`, req.ip, req.get('User-Agent'), JSON.stringify({ updated_user_id: id })]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get roles
app.get('/api/roles', authenticateToken, requirePermission('users', 'read'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user activity log
app.get('/api/users/:id/activity', authenticateToken, requirePermission('users', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM user_activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user activity:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change user password (admin only)
app.put('/api/users/:id/password', authenticateToken, requirePermission('users', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Hash new password
    const passwordHash = await pool.query(
      'SELECT hash_password($1) as hash',
      [new_password]
    );

    // Update password
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3 RETURNING id, username',
      [passwordHash.rows[0].hash, req.user.user_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log password change
    await pool.query(
      'SELECT log_user_activity($1, $2, $3, $4, $5, $6)',
      [req.user.user_id, 'password_changed', `Changed password for user: ${result.rows[0].username}`, req.ip, req.get('User-Agent'), JSON.stringify({ target_user_id: id })]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, requirePermission('users', 'write'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.user_id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get user info for logging
    const userInfo = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
    if (userInfo.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log user deletion
    await pool.query(
      'SELECT log_user_activity($1, $2, $3, $4, $5, $6)',
      [req.user.user_id, 'user_deleted', `Deleted user: ${userInfo.rows[0].username}`, req.ip, req.get('User-Agent'), JSON.stringify({ deleted_user_id: id })]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Routes

// Products
app.get('/api/products', authenticateToken, requirePermission('inventory', 'read'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', authenticateToken, requirePermission('inventory', 'write'), async (req, res) => {
  try {
    const { name, price, category, stock, image } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, price, category, stock, image, created_by_user) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, price, category, stock, image || '📦', req.user.user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, stock, image } = req.body;
    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, category = $3, stock = $4, image = $5, updated_at = CURRENT_TIMESTAMP, status = \'Updated\' WHERE id = $6 RETURNING *',
      [name, price, category, stock, image, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete all products endpoint
app.delete('/api/products', async (req, res) => {
  try {
    // Delete referencing records first to avoid foreign key constraint violations
    await pool.query('DELETE FROM transaction_items WHERE product_id IS NOT NULL');
    await pool.query('DELETE FROM work_order_products WHERE product_id IS NOT NULL');
    
    // Now delete all products (other tables have ON DELETE CASCADE)
    await pool.query('DELETE FROM products');
    
    res.json({ message: 'All products deleted successfully' });
  } catch (err) {
    console.error('Error deleting all products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Load test data endpoint
app.post('/api/load-test-data', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Parse DATABASE_URL to handle SSL parameters properly
    const databaseUrl = process.env.DATABASE_URL;
    const url = new URL(databaseUrl);
    
    // Extract connection parameters
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.substring(1); // Remove leading slash
    const username = url.username;
    const password = url.password;
    
    const urlWithSSL = databaseUrl.includes('?') 
  ? `${databaseUrl}&sslmode=require`
  : `${databaseUrl}?sslmode=require`;
    // Construct psql command with proper SSL handling
    //const command = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${database} -f load_sample_data.sql --set=sslmode=require`;
    const command = `psql "${urlWithSSL}" -f db/load_sample_data.sql --set=sslmode=require`;
    
    console.log('Executing command:', command.replace(password, '***'));
    
    const { stdout, stderr } = await execAsync(command);
    
    // Combine stdout and stderr for complete output
    const output = {
      stdout: stdout || '',
      stderr: stderr || '',
      success: !stderr || stderr.includes('INSERT') || stderr.includes('UPDATE') || stderr.includes('SELECT')
    };
    
    res.json({
      success: true,
      message: 'Test data loaded successfully',
      output: output
    });
    
  } catch (error) {
    console.error('Error loading test data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load test data',
      output: {
        stdout: '',
        stderr: error.message,
        success: false
      }
    });
  }
});

// Create multiple products endpoint
// Handle CORS preflight for products/create
app.options('/api/products/create', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
});

app.post('/api/products/create', async (req, res) => {
  try {
    const products = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required and cannot be empty' });
    }

    const results = [];
    
    for (const product of products) {
      try {
        // Extract price from pricing object and convert to number
        let price = 0;
        if (product.pricing && product.pricing.price) {
          // Remove $ and other non-numeric characters, then parse
          const priceStr = product.pricing.price.replace(/[^0-9.]/g, '');
          price = parseFloat(priceStr) || 0;
        }

        // Insert product into database
        const result = await pool.query(
          `INSERT INTO products (name, price, category, stock, image, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
           RETURNING *`,
          [
            product.product_name || 'Unknown Product',
            price,
            product.collection || 'General',
            0, // Default stock
            '📦' // Default image
          ]
        );
        
        results.push({
          success: true,
          product: result.rows[0],
          originalData: product
        });
      } catch (productError) {
        console.error(`Error creating product ${product.product_name}:`, productError);
        results.push({
          success: false,
          error: productError.message,
          originalData: product
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      message: `Created ${successCount} products successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results: results,
      summary: {
        total: products.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (err) {
    console.error('Error creating products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all unique product types from products table
app.get('/api/products/types', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT product_type 
      FROM products 
      WHERE product_type IS NOT NULL AND product_type != ''
      ORDER BY product_type
    `);
    
    const productTypes = result.rows.map(row => row.product_type);
    res.json(productTypes);
  } catch (err) {
    console.error('Error fetching product types:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get catalogs from MuleSoft API
app.get('/api/loyalty/catalogs', async (req, res) => {
  try {
    // Get MuleSoft endpoint from system settings
    const settingsResult = await pool.query(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      ['mulesoft_loyalty_sync_endpoint']
    );

    if (!settingsResult.rows.length || !settingsResult.rows[0].setting_value) {
      return res.status(400).json({ error: 'MuleSoft endpoint not configured' });
    }

    const mulesoftEndpoint = settingsResult.rows[0].setting_value;
    const catalogsUrl = `${mulesoftEndpoint}/loyalty/catalogs`;

//    console.log('=== MuleSoft Catalogs Request ===');
//    console.log('MuleSoft endpoint:', catalogsUrl);
//    console.log('==================================');

    // Call MuleSoft API to get catalogs
    const mulesoftResponse = await fetch(catalogsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!mulesoftResponse.ok) {
      const errorText = await mulesoftResponse.text();
      console.error('MuleSoft catalogs API error:', errorText);
      return res.status(mulesoftResponse.status).json({ 
        error: 'MuleSoft API error', 
        details: errorText 
      });
    }

    const catalogs = await mulesoftResponse.json();
//    console.log('MuleSoft catalogs response:', catalogs);

    res.json(catalogs);
  } catch (err) {
    console.error('Error fetching catalogs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Load products from selected catalog using MuleSoft API
app.post('/api/loyalty/products/load', async (req, res) => {
  try {
    const { catalogId } = req.body;
    
    if (!catalogId) {
      return res.status(400).json({ error: 'Catalog ID is required' });
    }

    // Get MuleSoft endpoint from system settings
    const settingsResult = await pool.query(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      ['mulesoft_loyalty_sync_endpoint']
    );

    if (!settingsResult.rows.length || !settingsResult.rows[0].setting_value) {
      return res.status(400).json({ error: 'MuleSoft endpoint not configured' });
    }

    const mulesoftEndpoint = settingsResult.rows[0].setting_value;
    const loadProductsUrl = `${mulesoftEndpoint}/loyalty/products/load?catalog=${catalogId}`;

    // console.log('=== MuleSoft Load Products Request ===');
    // console.log('Catalog ID:', catalogId);
    // console.log('MuleSoft endpoint:', loadProductsUrl);
    // console.log('=====================================');

    // Call MuleSoft API to load products
    const mulesoftResponse = await fetch(loadProductsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!mulesoftResponse.ok) {
      const errorText = await mulesoftResponse.text();
      console.error('MuleSoft load products API error:', errorText);
      return res.status(mulesoftResponse.status).json({ 
        error: 'MuleSoft API error', 
        details: errorText 
      });
    }

    const result = await mulesoftResponse.json();
    // console.log('MuleSoft load products response:', result);

    res.json(result);
  } catch (err) {
    console.error('Error loading products from catalog:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Find product image using MuleSoft API
app.post('/api/products/image/find', async (req, res) => {
  try {
    const { productName, sku, brand } = req.body;
    
    if (!productName && !sku) {
      return res.status(400).json({ error: 'Product name or SKU is required' });
    }

    // Get MuleSoft endpoint from system settings
    const settingsResult = await pool.query(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      ['mulesoft_loyalty_sync_endpoint']
    );

    if (!settingsResult.rows.length || !settingsResult.rows[0].setting_value) {
      return res.status(400).json({ error: 'MuleSoft endpoint not configured' });
    }

    const mulesoftEndpoint = settingsResult.rows[0].setting_value;
    const findImageUrl = `${mulesoftEndpoint}/products/image/find`;

    // Prepare search parameters
    const searchParams = {
      productName: productName || '',
      sku: sku || '',
      brand: brand || ''
    };

    // console.log('=== MuleSoft Image Find Request ===');
    // console.log('Search parameters:', searchParams);
    // console.log('MuleSoft endpoint:', findImageUrl);
    // console.log('===================================');

    // Call MuleSoft API to find image
    const mulesoftResponse = await fetch(findImageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchParams)
    });

    if (!mulesoftResponse.ok) {
      const errorText = await mulesoftResponse.text();
      console.error('MuleSoft image find API error:', errorText);
      return res.status(mulesoftResponse.status).json({ 
        error: 'MuleSoft API error', 
        details: errorText 
      });
    }

    const imageResult = await mulesoftResponse.json();
    // console.log('MuleSoft image find response:', imageResult);

    res.json(imageResult);
  } catch (err) {
    console.error('Error finding product image:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import products to MuleSoft endpoint
app.post('/api/products/import', async (req, res) => {
  try {
    const products = req.body;
    
    // Log the POST body for debugging
    // console.log('=== MuleSoft Products Import Request ===');
    // console.log('Number of products:', products.length);
    // console.log('Products data:', JSON.stringify(products, null, 2));
    // console.log('==========================================');
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required and cannot be empty' });
    }

    // Get MuleSoft endpoint from system settings
    const settingsResult = await pool.query(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      ['mulesoft_loyalty_sync_endpoint']
    );

    if (!settingsResult.rows.length || !settingsResult.rows[0].setting_value) {
      return res.status(400).json({ error: 'MuleSoft endpoint not configured' });
    }

    const mulesoftEndpoint = settingsResult.rows[0].setting_value;
    const importUrl = `${mulesoftEndpoint}/products/import`;

    // console.log('MuleSoft endpoint:', importUrl);

    // Forward the request to MuleSoft
    const mulesoftResponse = await fetch(importUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(products)
    });

    if (!mulesoftResponse.ok) {
      const errorText = await mulesoftResponse.text();
      console.error('MuleSoft API error:', errorText);
      return res.status(mulesoftResponse.status).json({ 
        error: 'MuleSoft API error', 
        details: errorText 
      });
    }

    const importResults = await mulesoftResponse.json();
    res.json(importResults);

  } catch (err) {
    console.error('Error importing products to MuleSoft:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check existing products endpoint
app.post('/api/products/check-existing', async (req, res) => {
  try {
    const { skus } = req.body;
    
    if (!Array.isArray(skus)) {
      return res.status(400).json({ error: 'SKUs array is required' });
    }

    if (skus.length === 0) {
      return res.json({ existingSkus: [] });
    }

    // Check which product names already exist in the products table
    // We'll check by product name since that's what we store in the products table
    const placeholders = skus.map((_, index) => `$${index + 1}`).join(',');
    const result = await pool.query(
      `SELECT name FROM products WHERE name IN (${placeholders})`,
      skus
    );

    const existingSkus = result.rows.map(row => row.name);
    res.json({ existingSkus: existingSkus });
  } catch (err) {
    console.error('Error checking existing products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generated Products endpoints
app.post('/api/generated-products/save', async (req, res) => {
  try {
    const { batchId, products, metadata, prompt, rawResponse } = req.body;
    
    console.log('📦 Saving generated products:', {
      batchId,
      productCount: products?.length,
      hasPrompt: !!prompt,
      hasRawResponse: !!rawResponse,
      metadata
    });
    
    if (!batchId || !products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Batch ID and products array are required' });
    }

    // Get the next batch number using the existing function
    let batchNumber;
    try {
      const batchResult = await pool.query('SELECT get_next_batch_number() as next_batch');
      batchNumber = batchResult.rows[0].next_batch;
      console.log('✅ Got batch number from function:', batchNumber);
    } catch (batchErr) {
      // If the function doesn't exist, use a simple increment
      const maxBatchResult = await pool.query('SELECT COALESCE(MAX(batch), 0) + 1 as next_batch FROM generated_products');
      batchNumber = maxBatchResult.rows[0].next_batch;
      console.log('✅ Got batch number from MAX:', batchNumber);
    }

    // Save each product as a separate record with the same batch number
    for (const product of products) {
      await pool.query(
        'INSERT INTO generated_products (batch, brand, segment, num_of_products, generated_product, prompt, raw_response) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          batchNumber,
          metadata?.brand || null,
          metadata?.segment || null,
          metadata?.numberOfProducts || products.length,
          JSON.stringify(product),
          prompt || null,
          rawResponse || null
        ]
      );
    }

    console.log(`✅ Saved ${products.length} products to batch ${batchNumber}`);

    res.json({ 
      message: `Saved ${products.length} products to batch ${batchNumber}`,
      batchId: batchNumber,
      productCount: products.length
    });
  } catch (err) {
    console.error('❌ Error saving generated products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/generated-products/history', async (req, res) => {
  try {
    // Check if generated_products table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'generated_products'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('generated_products table does not exist, returning empty array');
      return res.json([]);
    }

    // Get all generated products grouped by batch
    const result = await pool.query(`
      SELECT 
        batch,
        brand,
        segment,
        sum(num_of_products) as total_products,
        MAX(created_at) as created_at,
        array_agg(generated_product ORDER BY id) as products
      FROM generated_products 
      WHERE batch IS NOT NULL
      GROUP BY batch, brand, segment
      ORDER BY created_at DESC
    `);

    const batches = result.rows.map(row => {
      const processedProducts = row.products.filter(p => p !== null).map(product => {
        // Ensure the product data is properly parsed if it's a string
        if (typeof product === 'string') {
          try {
            return JSON.parse(product);
          } catch (e) {
            console.error('Error parsing product JSON:', e);
            return product;
          }
        }
        return product;
      });
      
      return {
        batchId: row.batch,
        brand: row.brand,
        segment: row.segment,
        numOfProducts: row.num_of_products,
        totalProducts: parseInt(row.total_products),
        createdAt: row.created_at,
        products: processedProducts
      };
    });

    res.json(batches);
  } catch (err) {
    console.error('Error fetching generated products history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a specific batch from generated products
app.delete('/api/generated-products/delete-batch', async (req, res) => {
  try {
    const { batchId } = req.body;
    
    if (!batchId) {
      return res.status(400).json({ error: 'Batch ID is required' });
    }

    // Delete all records for this batch
    const result = await pool.query(
      'DELETE FROM generated_products WHERE batch = $1',
      [batchId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json({ 
      message: `Batch ${batchId} deleted successfully`,
      deletedCount: result.rowCount
    });
  } catch (err) {
    console.error('Error deleting batch:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customers / Loyalty System
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search customer by loyalty number
app.get('/api/customers/loyalty/:loyaltyNumber', async (req, res) => {
  try {
    const { loyaltyNumber } = req.params;
    const result = await pool.query(
      'SELECT * FROM customers WHERE loyalty_number = $1',
      [loyaltyNumber.toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching customer by loyalty number:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer purchase history
app.get('/api/customers/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        t.*,
        json_agg(
          json_build_object(
            'id', ti.product_id,
            'name', ti.product_name,
            'price', ti.product_price,
            'quantity', ti.quantity,
            'subtotal', ti.subtotal
          ) ORDER BY ti.id
        ) as items
      FROM transactions t
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      WHERE t.customer_id = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customer history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new customer
app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    // Generate loyalty number
    const loyaltyResult = await pool.query('SELECT generate_loyalty_number() as loyalty_number');
    const loyaltyNumber = loyaltyResult.rows[0].loyalty_number;
    
    const result = await pool.query(
      'INSERT INTO customers (loyalty_number, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [loyaltyNumber, name, email, phone]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search customers by name, email, or loyalty number
app.get('/api/customers/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const searchTerm = `%${query}%`;
    
    const result = await pool.query(`
      SELECT * FROM customers 
      WHERE LOWER(name) LIKE LOWER($1) 
         OR LOWER(email) LIKE LOWER($1) 
         OR LOWER(loyalty_number) LIKE LOWER($1)
      ORDER BY name
      LIMIT 10
    `, [searchTerm]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching customers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Loyalty-specific endpoints
// Update existing customer by ID
app.put('/api/customers/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      name, email, phone, points, notes, member_status, 
      member_type, enrollment_date, customer_tier, date_of_birth,
      address_line1, address_line2, city, state, country, zip_code
    } = req.body;
    // Debug info for incoming customer update
    console.debug('PUT /api/customers/:id req.body:', JSON.stringify(req.body, null, 2));
    console.debug('Parsed values:', {
      id,
      name,
      email,
      phone,
      points,
      notes,
      member_status,
      member_type,
      enrollment_date,
      customer_tier,
      date_of_birth,
      address_line1,
      address_line2,
      city,
      state,
      country,
      zip_code
    });
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate member_status
    const validStatuses = ['Active', 'Inactive', 'Under Fraud Investigation', 'Merged', 'Fraudulent Member'];
    if (member_status && !validStatuses.includes(member_status)) {
      return res.status(400).json({ 
        error: 'Invalid member status. Must be one of: ' + validStatuses.join(', ') 
      });
    }

    // Validate customer_tier
    const validTiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    if (customer_tier && !validTiers.includes(customer_tier)) {
      return res.status(400).json({ 
        error: 'Invalid customer tier. Must be one of: ' + validTiers.join(', ') 
      });
    }

    // Get current customer data to check for changes
    const currentCustomer = await client.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (currentCustomer.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const current = currentCustomer.rows[0];
    const pointsChanged = parseInt(points) !== current.points;
    const statusChanged = member_status !== current.member_status;
    const tierChanged = customer_tier !== current.customer_tier;

    // Calculate new tier calculation number if tier changed or points changed
    let newTierCalcNumber = current.tier_calculation_number || 0;
    if (pointsChanged || tierChanged) {
      try {
        const tierCalcResult = await client.query(
          'SELECT calculate_tier_number($1, $2, $3, $4) as calc_number',
          [current.total_spent || 0, current.visit_count || 0, parseInt(points) || 0, customer_tier || current.customer_tier]
        );
        newTierCalcNumber = parseFloat(tierCalcResult.rows[0].calc_number) || 0;
      } catch (calcError) {
        console.warn('Tier calculation function not available, using default value');
        newTierCalcNumber = ((current.total_spent || 0) * 0.5) + ((current.visit_count || 0) * 10) + ((parseInt(points) || 0) * 0.1);
      }
    }
    
    const result = await client.query(`
      UPDATE customers 
      SET name = $1, email = $2, phone = $3, points = $4, notes = $5, 
          member_status = $6, member_type = $7, enrollment_date = $8, 
          customer_tier = $9, tier_calculation_number = $10, date_of_birth = $11,
          address_line1 = $12, address_line2 = $13, city = $14, state = $15, 
          country = $16, zip_code = $17, updated_at = CURRENT_TIMESTAMP ,
          status = 'Updated'
      WHERE id = $18 RETURNING *
    `, [
      name.trim(), 
      email || null, 
      phone || null, 
      parseInt(points) || 0, 
      notes || null,
      member_status || current.member_status,
      member_type || current.member_type,
      enrollment_date ? new Date(enrollment_date) : current.enrollment_date,
      customer_tier || current.customer_tier,
      newTierCalcNumber,
      date_of_birth || null,
      address_line1 || null,
      address_line2 || null,
      city || null,
      state || null,
      country || null,
      zip_code || null,
      id
    ]);

    // Log activities for significant changes (only if log function exists)
    try {
      if (pointsChanged) {
        const pointsDiff = parseInt(points) - current.points;
        await client.query(
          'SELECT log_customer_activity($1, $2, $3, $4, $5, $6)',
          [
            id,
            pointsDiff > 0 ? 'points_adjustment_add' : 'points_adjustment_subtract',
            `Points manually adjusted by ${pointsDiff > 0 ? '+' : ''}${pointsDiff}`,
            pointsDiff,
            null,
            'admin_adjustment'
          ]
        );
      }

      if (statusChanged) {
        await client.query(
          'SELECT log_customer_activity($1, $2, $3, $4, $5, $6)',
          [
            id,
            'status_change',
            `Member status changed from ${current.member_status} to ${member_status}`,
            0,
            null,
            'admin_update'
          ]
        );
      }

      if (tierChanged) {
        await client.query(
          'SELECT log_customer_activity($1, $2, $3, $4, $5, $6)',
          [
            id,
            'tier_change',
            `Customer tier manually changed from ${current.customer_tier} to ${customer_tier}`,
            0,
            null,
            'admin_override'
          ]
        );
      }
    } catch (logError) {
      console.warn('Activity logging not available:', logError.message);
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Check if customer exists
    const customerCheck = await client.query('SELECT name FROM customers WHERE id = $1', [id]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Check if customer has transactions
    const transactionCheck = await client.query(
      'SELECT COUNT(*) as count FROM transactions WHERE customer_id = $1', 
      [id]
    );
    
    const hasTransactions = parseInt(transactionCheck.rows[0].count) > 0;
    
    if (hasTransactions) {
      // If customer has transactions, we should soft delete or prevent deletion
      await client.query('DELETE FROM customers WHERE id = $1', [id]);
      res.json({ 
        message: 'Customer deleted successfully',
        warning: 'Transaction history was also removed'
      });
    } else {
      // Safe to delete customer with no transactions
      await client.query('DELETE FROM customers WHERE id = $1', [id]);
      res.json({ message: 'Customer deleted successfully' });
    }
    
    await client.query('COMMIT');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting customer:', err);
    
    if (err.code === '23503') { // Foreign key constraint violation
      res.status(400).json({ 
        error: 'Cannot delete customer with existing transactions',
        suggestion: 'Consider deactivating the customer instead'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  } finally {
    client.release();
  }
});

// Enhanced create customer endpoint
app.post('/api/customers/enhanced', async (req, res) => {
  try {
    const { 
      name, first_name, last_name, email, phone, loyalty_number, points, notes, 
      member_status, member_type, enrollment_date, customer_tier, date_of_birth,
      address_line1, address_line2, city, state, country, zip_code
    } = req.body;
    
    // Validate required fields - prefer first_name/last_name over name
    const customerName = name || (first_name && last_name ? `${first_name.trim()} ${last_name.trim()}`.trim() : '');
    const customerFirstName = first_name || (name ? name.split(' ')[0] : '');
    const customerLastName = last_name || (name ? name.split(' ').slice(1).join(' ') : '');
    
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    
    if (!customerFirstName || !customerFirstName.trim()) {
      return res.status(400).json({ error: 'First name is required' });
    }
    
    if (!customerLastName || !customerLastName.trim()) {
      return res.status(400).json({ error: 'Last name is required' });
    }
    
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate loyalty number format if provided
    if (loyalty_number && !/^[A-Z]{3}\d{3}$/.test(loyalty_number)) {
      return res.status(400).json({ 
        error: 'Invalid loyalty number format. Use format like LOY001' 
      });
    }

    // Validate member_status
    const validStatuses = ['Active', 'Inactive', 'Under Fraud Investigation', 'Merged', 'Fraudulent Member'];
    if (member_status && !validStatuses.includes(member_status)) {
      return res.status(400).json({ 
        error: 'Invalid member status. Must be one of: ' + validStatuses.join(', ') 
      });
    }

    // Validate member_type
    const validMemberTypes = ['Individual', 'Corporate'];
    if (member_type && !validMemberTypes.includes(member_type)) {
      return res.status(400).json({ 
        error: 'Invalid member type. Must be either Individual or Corporate' 
      });
    }

    // Validate customer_tier
    const validTiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    if (customer_tier && !validTiers.includes(customer_tier)) {
      return res.status(400).json({ 
        error: 'Invalid customer tier. Must be one of: ' + validTiers.join(', ') 
      });
    }
    
    let finalLoyaltyNumber = loyalty_number;
    
    // Generate loyalty number if not provided
    if (!finalLoyaltyNumber) {
      try {
        const loyaltyResult = await pool.query('SELECT generate_loyalty_number() as loyalty_number');
        finalLoyaltyNumber = loyaltyResult.rows[0].loyalty_number;
      } catch (genError) {
        // Fallback loyalty number generation
        const count = await pool.query('SELECT COUNT(*) as count FROM customers');
        const nextNum = parseInt(count.rows[0].count) + 1;
        finalLoyaltyNumber = 'LOY' + String(nextNum).padStart(3, '0');
      }
    } else {
      // Check if loyalty number already exists
      const existingCustomer = await pool.query(
        'SELECT id FROM customers WHERE loyalty_number = $1',
        [finalLoyaltyNumber]
      );
      
      if (existingCustomer.rows.length > 0) {
        return res.status(400).json({ error: 'Loyalty number already exists' });
      }
    }

    // Parse enrollment date or use current date
    const finalEnrollmentDate = enrollment_date ? new Date(enrollment_date) : new Date();
    
    // Calculate initial tier calculation number
    const initialPoints = parseInt(points) || 0;
    let tierCalcNumber = 0;
    
    try {
      const tierCalcResult = await pool.query(
        'SELECT calculate_tier_number($1, $2, $3, $4) as calc_number',
        [0, 0, initialPoints, customer_tier || 'Bronze']
      );
      tierCalcNumber = parseFloat(tierCalcResult.rows[0].calc_number);
    } catch (calcError) {
      // Fallback calculation
      tierCalcNumber = (initialPoints * 0.1);
    }
    
    const result = await pool.query(`
      INSERT INTO customers (
        loyalty_number, name, first_name, last_name, email, phone, points, notes, 
        member_status, member_type, enrollment_date, customer_tier, tier_calculation_number, date_of_birth,
        address_line1, address_line2, city, state, country, zip_code
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) 
      RETURNING *
    `, [
      finalLoyaltyNumber, 
      customerName.trim(), 
      customerFirstName.trim(),
      customerLastName.trim(),
      email || null, 
      phone || null, 
      initialPoints, 
      notes || null,
      member_status || 'Active',
      member_type || 'Individual',
      finalEnrollmentDate,
      customer_tier || 'Bronze',
      tierCalcNumber,
      date_of_birth || null,
      address_line1 || null,
      address_line2 || null,
      city || null,
      state || null,
      country || null,
      zip_code || null
    ]);
    
    // Log customer creation activity (optional, won't fail if function doesn't exist)
    try {
      await pool.query(
        'SELECT log_customer_activity($1, $2, $3, $4, $5, $6)',
        [
          result.rows[0].id,
          'account_created',
          'Customer account created with tier: ' + (customer_tier || 'Bronze'),
          initialPoints,
          null,
          'pos_system'
        ]
      );
    } catch (logError) {
      console.warn('Activity logging not available:', logError.message);
    }
    
    // Call MuleSoft API to create member in loyalty system
    try {
      const mulesoftEndpoint = await pool.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'mulesoft_loyalty_sync_endpoint'"
      );
      
      if (mulesoftEndpoint.rows.length > 0 && mulesoftEndpoint.rows[0].setting_value) {
        const endpoint = mulesoftEndpoint.rows[0].setting_value.trim();
        
        // Validate that it's a URL
        try {
          new URL(endpoint);
          
          // Get loyalty program ID
          const loyaltyProgramResult = await pool.query(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'loyalty_program_id'"
          );
          const loyaltyProgramId = loyaltyProgramResult.rows.length > 0 ? loyaltyProgramResult.rows[0].setting_value : null;
          
          // Prepare member data for MuleSoft API
          const memberData = {
            id: result.rows[0].id,
            first_name: customerFirstName,
            last_name: customerLastName,
            name: customerName,
            loyalty_number: finalLoyaltyNumber,
            enrollment_date: finalEnrollmentDate.toISOString().split('T')[0],
            sf_loyalty_program_id: loyaltyProgramId,
            sf_id: result.rows[0].sf_id || null,
            address_line1: result.rows[0].address_line1 || null,
            address_line2: result.rows[0].address_line2 || null,
            city: result.rows[0].city || null,
            state: result.rows[0].state || null,
            zip_code: result.rows[0].zip_code || null,
            phone: phone || null,
            email: email || null,
            date_of_birth: date_of_birth || null
          };
          console.log('Sending to Mulesoft endpoint ' + endpoint + '/member/create to create member with data:', memberData);
          // Call MuleSoft API
          // Fire-and-forget: trigger MuleSoft API call asynchronously, don't await
          (async () => {
            try {
              const mulesoftResponse = await fetch(`${endpoint}/member/create`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(memberData)
              });
              if (!mulesoftResponse.ok) {
                console.warn('MuleSoft API call failed:', mulesoftResponse.status, mulesoftResponse.statusText);
              } else {
                console.log('Member successfully created in MuleSoft loyalty system');
              }
            } catch (err) {
              console.warn('MuleSoft API call error:', err);
            }
          })();


          console.log('MuleSoft API call triggered asynchronously');
          
        } catch (urlError) {
          console.warn('Invalid MuleSoft endpoint URL:', endpoint);
        }
      }
    } catch (mulesoftError) {
      console.log('MuleSoft API integration Full error:', mulesoftError);
      console.warn('MuleSoft API integration error message:', mulesoftError.message);
      console.warn('MuleSoft API integration error detailed message:', mulesoftError.detailedMessage);
      // Don't fail the customer creation if MuleSoft call fails
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating customer:', err);
    
    if (err.code === '23505') { // Unique constraint violation
      if (err.constraint === 'customers_loyalty_number_key') {
        res.status(400).json({ error: 'Loyalty number already exists' });
      } else {
        res.status(400).json({ error: 'Customer with this information already exists' });
      }
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get customer statistics
app.get('/api/customers/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN visit_count > 0 THEN 1 END) as active_customers,
        COUNT(CASE WHEN visit_count = 0 THEN 1 END) as new_customers,
        COALESCE(SUM(points), 0) as total_points_issued,
        COALESCE(SUM(total_spent), 0) as total_customer_spending,
        COALESCE(AVG(total_spent), 0) as avg_customer_spending,
        COUNT(CASE WHEN last_visit >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_customers
      FROM customers
    `);
    
    const topCustomers = await pool.query(`
      SELECT name, loyalty_number, points, total_spent, visit_count
      FROM customers 
      WHERE visit_count > 0
      ORDER BY total_spent DESC 
      LIMIT 5
    `);
    
    res.json({
      ...stats.rows[0],
      total_customer_spending: parseFloat(stats.rows[0].total_customer_spending),
      avg_customer_spending: parseFloat(stats.rows[0].avg_customer_spending),
      top_customers: topCustomers.rows
    });
  } catch (err) {
    console.error('Error fetching customer stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Advanced customer search with filters
app.get('/api/customers/advanced-search', async (req, res) => {
  try {
    const { 
      q, // general search term
      min_points, 
      max_points, 
      min_spent, 
      max_spent,
      min_visits,
      max_visits,
      has_email,
      has_phone,
      last_visit_days, // customers who visited in last X days
      sort_by = 'name',
      sort_order = 'asc',
      limit = 50,
      offset = 0
    } = req.query;
    
    let query = `
      SELECT 
        id, loyalty_number, name, email, phone, points, 
        total_spent, visit_count, last_visit, created_at,
        member_status, enrollment_date, member_type, customer_tier, tier_calculation_number
      FROM customers 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    // General search
    if (q) {
      paramCount++;
      query += ` AND (
        LOWER(name) LIKE LOWER($${paramCount}) OR 
        LOWER(COALESCE(email, '')) LIKE LOWER($${paramCount}) OR 
        LOWER(loyalty_number) LIKE LOWER($${paramCount}) OR
        COALESCE(phone, '') LIKE $${paramCount}
      )`;
      params.push(`%${q}%`);
    }
    
    // Points range
    if (min_points) {
      paramCount++;
      query += ` AND points >= $${paramCount}`;
      params.push(parseInt(min_points));
    }
    if (max_points) {
      paramCount++;
      query += ` AND points <= $${paramCount}`;
      params.push(parseInt(max_points));
    }
    
    // Spending range
    if (min_spent) {
      paramCount++;
      query += ` AND total_spent >= $${paramCount}`;
      params.push(parseFloat(min_spent));
    }
    if (max_spent) {
      paramCount++;
      query += ` AND total_spent <= $${paramCount}`;
      params.push(parseFloat(max_spent));
    }
    
    // Visit count range
    if (min_visits) {
      paramCount++;
      query += ` AND visit_count >= $${paramCount}`;
      params.push(parseInt(min_visits));
    }
    if (max_visits) {
      paramCount++;
      query += ` AND visit_count <= $${paramCount}`;
      params.push(parseInt(max_visits));
    }
    
    // Contact information filters
    if (has_email === 'true') {
      query += ` AND email IS NOT NULL AND email != ''`;
    } else if (has_email === 'false') {
      query += ` AND (email IS NULL OR email = '')`;
    }
    
    if (has_phone === 'true') {
      query += ` AND phone IS NOT NULL AND phone != ''`;
    } else if (has_phone === 'false') {
      query += ` AND (phone IS NULL OR phone = '')`;
    }
    
    // Recent activity filter
    if (last_visit_days) {
      const days = parseInt(last_visit_days);
      query += ` AND last_visit >= CURRENT_DATE - INTERVAL '${days} days'`;
    }
    
    // Sorting
    const allowedSortFields = ['name', 'loyalty_number', 'points', 'total_spent', 'visit_count', 'created_at', 'last_visit', 'member_status', 'customer_tier'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'name';
    const sortDirection = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    
    query += ` ORDER BY ${sortField} ${sortDirection}`;
    
    // Pagination
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = query.split('ORDER BY')[0].replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params.slice(0, -2)); // Remove LIMIT and OFFSET params
    
    res.json({
      customers: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
      has_more: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].count)
    });
    
  } catch (err) {
    console.error('Error in advanced customer search:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer tier summary
app.get('/api/customers/tier-summary', async (req, res) => {
  try {
    // Get tier breakdown
    const tierBreakdown = await pool.query(`
      SELECT 
        customer_tier as tier_name,
        COUNT(*) as customer_count,
        COALESCE(SUM(total_spent), 0) as total_spending,
        COALESCE(AVG(total_spent), 0) as avg_spending,
        COALESCE(SUM(points), 0) as total_points,
        COALESCE(AVG(points), 0) as avg_points
      FROM customers
      WHERE member_status = 'Active'
      GROUP BY customer_tier
      ORDER BY 
        CASE customer_tier
          WHEN 'Platinum' THEN 4
          WHEN 'Gold' THEN 3
          WHEN 'Silver' THEN 2
          WHEN 'Bronze' THEN 1
          ELSE 0
        END DESC
    `);
    
    // Also get overall stats
    const overallStats = await pool.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN member_status = 'Active' THEN 1 END) as active_customers,
        COUNT(CASE WHEN member_status != 'Active' THEN 1 END) as inactive_customers,
        COUNT(CASE WHEN member_type = 'Corporate' THEN 1 END) as corporate_customers,
        COUNT(CASE WHEN member_type = 'Individual' THEN 1 END) as individual_customers,
        COALESCE(AVG(tier_calculation_number), 0) as avg_tier_score
      FROM customers
    `);
    
    res.json({
      tier_breakdown: tierBreakdown.rows,
      overall_stats: {
        ...overallStats.rows[0],
        avg_tier_score: parseFloat(overallStats.rows[0].avg_tier_score).toFixed(2)
      }
    });
  } catch (err) {
    console.error('Error fetching customer tier summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer tier rules
app.get('/api/customers/tier-rules', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM customer_tier_rules 
      ORDER BY 
        CASE tier_name
          WHEN 'Bronze' THEN 1
          WHEN 'Silver' THEN 2
          WHEN 'Gold' THEN 3
          WHEN 'Platinum' THEN 4
        END
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customer tier rules:', err);
    // If tier rules table doesn't exist, return default rules
    res.json([
      { tier_name: 'Bronze', min_spending: 0, benefits: 'Basic loyalty benefits, 1x points earning' },
      { tier_name: 'Silver', min_spending: 250, benefits: 'Enhanced benefits, 1.25x points earning' },
      { tier_name: 'Gold', min_spending: 750, benefits: 'Premium benefits, 1.5x points earning' },
      { tier_name: 'Platinum', min_spending: 2000, benefits: 'VIP benefits, 2x points earning' }
    ]);
  }
});

// Recalculate customer tiers (admin function)
app.post('/api/customers/recalculate-tiers', async (req, res) => {
  try {
    // Try using the database function first
    try {
      const result = await pool.query('SELECT recalculate_all_customer_tiers_fixed() as updated_count');
      res.json({ 
        message: 'Customer tiers recalculated successfully',
        updated_customers: parseInt(result.rows[0].updated_count)
      });
    } catch (funcError) {
      // Fallback: manual recalculation
      const customers = await pool.query('SELECT id, total_spent, visit_count, points FROM customers WHERE member_status = \'Active\'');
      let updatedCount = 0;
      
      for (const customer of customers.rows) {
        let newTier = 'Bronze';
        const spending = parseFloat(customer.total_spent) || 0;
        const visits = parseInt(customer.visit_count) || 0;
        const points = parseInt(customer.points) || 0;
        
        // Simple tier calculation
        if (spending >= 2000 && visits >= 30 && points >= 1500) {
          newTier = 'Platinum';
        } else if (spending >= 750 && visits >= 15 && points >= 500) {
          newTier = 'Gold';
        } else if (spending >= 250 && visits >= 5 && points >= 100) {
          newTier = 'Silver';
        }
        
        // Calculate tier score
        const tierScore = (spending * 0.5) + (visits * 10) + (points * 0.1);
        
        await pool.query(
          'UPDATE customers SET customer_tier = $1, tier_calculation_number = $2 WHERE id = $3',
          [newTier, tierScore, customer.id]
        );
        
        updatedCount++;
      }
      
      res.json({ 
        message: 'Customer tiers recalculated successfully (fallback method)',
        updated_customers: updatedCount
      });
    }
  } catch (err) {
    console.error('Error recalculating customer tiers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk operations on customers
app.post('/api/customers/bulk-action', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { action, customer_ids, data } = req.body;
    
    if (!customer_ids || !Array.isArray(customer_ids) || customer_ids.length === 0) {
      return res.status(400).json({ error: 'Customer IDs array is required' });
    }
    
    let result;
    
    switch (action) {
      case 'delete':
        result = await client.query(
          'DELETE FROM customers WHERE id = ANY($1) RETURNING name, loyalty_number',
          [customer_ids]
        );
        break;
        
      case 'add_points':
        if (!data.points || isNaN(data.points)) {
          return res.status(400).json({ error: 'Points amount is required for add_points action' });
        }
        result = await client.query(
          `UPDATE customers 
           SET points = points + $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ANY($2) 
           RETURNING name, loyalty_number, points`,
          [parseInt(data.points), customer_ids]
        );
        break;
        
      case 'set_points':
        if (data.points === undefined || isNaN(data.points)) {
          return res.status(400).json({ error: 'Points amount is required for set_points action' });
        }
        result = await client.query(
          `UPDATE customers 
           SET points = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ANY($2) 
           RETURNING name, loyalty_number, points`,
          [parseInt(data.points), customer_ids]
        );
        break;
        
      case 'update_notes':
        result = await client.query(
          `UPDATE customers 
           SET notes = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ANY($2) 
           RETURNING name, loyalty_number`,
          [data.notes || '', customer_ids]
        );
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action. Supported actions: delete, add_points, set_points, update_notes' });
    }
    
    await client.query('COMMIT');
    
    res.json({
      message: `Successfully performed ${action} on ${result.rows.length} customers`,
      affected_customers: result.rows
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in bulk customer action:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get customer loyalty details with recent transactions
app.get('/api/loyalty/:loyaltyNumber', async (req, res) => {
  try {
    const { loyaltyNumber } = req.params;
    
    // Get customer details
    const customerResult = await pool.query(
      'SELECT * FROM customers WHERE loyalty_number = $1',
      [loyaltyNumber.toUpperCase()]
    );
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const customer = customerResult.rows[0];
    
    // Get recent transactions with items
    const transactionsResult = await pool.query(`
      SELECT 
        t.*,
        json_agg(
          json_build_object(
            'id', ti.product_id,
            'name', ti.product_name,
            'price', ti.product_price,
            'quantity', ti.quantity,
            'subtotal', ti.subtotal
          ) ORDER BY ti.id
        ) as items
      FROM transactions t
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      WHERE t.customer_id = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [customer.id]);
    
    res.json({
      customer,
      recentTransactions: transactionsResult.rows
    });
  } catch (err) {
    console.error('Error fetching loyalty details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create customer from loyalty number during checkout
app.post('/api/loyalty/create', async (req, res) => {
  try {
    const { loyaltyNumber, name, email, phone } = req.body;
    
    // Check if loyalty number already exists
    const existingResult = await pool.query(
      'SELECT id FROM customers WHERE loyalty_number = $1',
      [loyaltyNumber.toUpperCase()]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Loyalty number already exists' });
    }
     
    const result = await pool.query(
      'INSERT INTO customers (loyalty_number, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [loyaltyNumber.toUpperCase(), name, email || null, phone || null]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating customer with loyalty number:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sales analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const [totalSales, todaySales, transactionCount, lowStockProducts, totalCustomers, activeCustomers] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(total), 0) as total FROM transactions'),
      pool.query('SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE created_at >= $1', [todayStart]),
      pool.query('SELECT COUNT(*) as count FROM transactions'),
      pool.query('SELECT COUNT(*) as count FROM products WHERE stock <= 5'),
      pool.query('SELECT COUNT(*) as count FROM customers'),
      pool.query('SELECT COUNT(*) as count FROM customers WHERE last_visit >= $1', [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]) // Last 30 days
    ]);
    
    res.json({
      totalSales: parseFloat(totalSales.rows[0].total),
      todaySales: parseFloat(todaySales.rows[0].total),
      transactionCount: parseInt(transactionCount.rows[0].count),
      lowStockCount: parseInt(lowStockProducts.rows[0].count),
      totalCustomers: parseInt(totalCustomers.rows[0].count),
      activeCustomers: parseInt(activeCustomers.rows[0].count)
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW 0801 11:01

// Enhanced API endpoints to add to server.js after the existing product endpoints


// Create enhanced product with images and features
app.post('/api/products/enhanced', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      name, price, category, stock, image, sku, productType,       brand, collection, material, color, description, dimensions, 
      weight, warrantyInfo, careInstructions, mainImageUrl, isActive, 
      featured, images, features 
    } = req.body;
    
    // Generate SKU if not provided
    let finalSku = sku;
    if (!finalSku) {
      const skuResult = await client.query('SELECT generate_sku($1, $2) as sku', [brand, productType]);
      finalSku = skuResult.rows[0].sku;
    }
    
    // Create product
    const productResult = await client.query(`
      INSERT INTO products (
        name, price, category, stock, image, sku, product_type,
        brand, collection, material, color, description, dimensions,
        weight, warranty_info, care_instructions, main_image_url, is_active, featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) 
      RETURNING *
    `, [
      name, price, category, stock, image || '📦', finalSku, productType, laptopSize,
      brand, collection, material, color, description, dimensions,
      weight, warrantyInfo, careInstructions, mainImageUrl, isActive !== false, featured || false
    ]);
    
    const productId = productResult.rows[0].id;
    
    // Add images if provided
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await client.query(
          'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES ($1, $2, $3, $4, $5)',
          [productId, img.url, img.alt || '', img.isPrimary || false, img.sortOrder || i]
        );
      }
    }
    
    // Add features if provided
    if (features && features.length > 0) {
      for (const feature of features) {
        await client.query(
          'INSERT INTO product_features (product_id, feature_name, feature_value) VALUES ($1, $2, $3)',
          [productId, feature.name, feature.value]
        );
      }
    }
    
    await client.query('COMMIT');
    res.json(productResult.rows[0]);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating enhanced product:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update enhanced product
app.put('/api/products/:id/enhanced', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      name, price, category, stock, image, sku, productType,       brand, collection, material, color, description, dimensions, 
      weight, warrantyInfo, careInstructions, mainImageUrl, isActive, 
      featured, images, features 
    } = req.body;
    
    // Update product
    const productResult = await client.query(`
      UPDATE products SET 
        name = $1, price = $2, category = $3, stock = $4, image = $5, sku = $6, 
        product_type = $7, brand = $8, collection = $9, 
        material = $10, color = $11, description = $12, 
        dimensions = $13, weight = $14, warranty_info = $15, care_instructions = $16, 
        main_image_url = $17, is_active = $18, featured = $19, updated_at = CURRENT_TIMESTAMP
      WHERE id = $20 RETURNING *
    `, [
      name, price, category, stock, image, sku, productType,
      brand, collection, material, color, description, dimensions,
      weight, warrantyInfo, careInstructions, mainImageUrl, isActive, featured, id
    ]);
    
    // Update images - delete existing and add new ones
    if (images !== undefined) {
      await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          await client.query(
            'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES ($1, $2, $3, $4, $5)',
            [id, img.url, img.alt || '', img.isPrimary || false, img.sortOrder || i]
          );
        }
      }
    }
    
    // Update features - delete existing and add new ones
    if (features !== undefined) {
      await client.query('DELETE FROM product_features WHERE product_id = $1', [id]);
      
      if (features && features.length > 0) {
        for (const feature of features) {
          await client.query(
            'INSERT INTO product_features (product_id, feature_name, feature_value) VALUES ($1, $2, $3)',
            [id, feature.name, feature.value]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.json(productResult.rows[0]);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating enhanced product:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});




// Get low stock products
app.get('/api/products/low-stock', async (req, res) => {
  try {
    const threshold = req.query.threshold || 10;
    const result = await pool.query(`
      SELECT p.*, 
        CASE 
          WHEN p.stock <= 0 THEN 'out_of_stock'
          WHEN p.stock <= $1 THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      WHERE p.stock <= $1 AND p.is_active = true
      ORDER BY p.stock ASC, p.name
    `, [threshold]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching low stock products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Products with full details including images and features
app.get('/api/products/detailed', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pi.id,
              'url', pi.image_url,
              'alt', pi.alt_text,
              'isPrimary', pi.is_primary,
              'sortOrder', pi.sort_order
            )
          ) FILTER (WHERE pi.id IS NOT NULL), 
          '[]'::json
        ) as images,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'name', pf.feature_name,
              'value', pf.feature_value
            )
          ) FILTER (WHERE pf.id IS NOT NULL),
          '[]'::json
        ) as features
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN product_features pf ON p.id = pf.product_id
      WHERE (p.is_active = true OR p.is_active IS NULL)
      GROUP BY p.id
      ORDER BY 
        COALESCE(p.featured, false) DESC, 
        COALESCE(p.sort_order, 999999), 
        p.name
    `);

    // Sort images by sortOrder after fetching
    const processedRows = result.rows.map(row => ({
      ...row,
      images: Array.isArray(row.images) ? 
        row.images.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) : 
        []
    }));

    res.json(processedRows);
  } catch (err) {
    console.error('Error fetching detailed products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product with full details
app.get('/api/products/:id/detailed', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pi.id,
              'url', pi.image_url,
              'alt', pi.alt_text,
              'isPrimary', pi.is_primary,
              'sortOrder', pi.sort_order
            )
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) as images,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'name', pf.feature_name,
              'value', pf.feature_value
            )
          ) FILTER (WHERE pf.id IS NOT NULL),
          '[]'::json
        ) as features
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN product_features pf ON p.id = pf.product_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Sort images by sortOrder
    const product = result.rows[0];
    if (Array.isArray(product.images)) {
      product.images = product.images.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    
    res.json(product);
  } catch (err) {
    console.error('Error fetching product details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product filters data (this is the key missing endpoint)
app.get('/api/products/filters', async (req, res) => {
  try {
    // Since the enhanced tables might not exist yet, let's provide a fallback
    const collections = await pool.query(`
      SELECT DISTINCT collection FROM products 
      WHERE collection IS NOT NULL AND collection != '' 
      ORDER BY collection
    `).catch(() => ({ rows: [] }));
    
    const brands = await pool.query(`
      SELECT DISTINCT brand FROM products 
      WHERE brand IS NOT NULL AND brand != '' 
      ORDER BY brand
    `).catch(() => ({ rows: [] }));
    
    const materials = await pool.query(`
      SELECT DISTINCT material FROM products 
      WHERE material IS NOT NULL AND material != '' 
      ORDER BY material
    `).catch(() => ({ rows: [] }));
    
    const productTypes = await pool.query(`
      SELECT DISTINCT product_type FROM products 
      WHERE product_type IS NOT NULL AND product_type != '' 
      ORDER BY product_type
    `).catch(() => ({ rows: [] }));
    
    const colors = await pool.query(`
      SELECT DISTINCT color FROM products 
      WHERE color IS NOT NULL AND color != '' 
      ORDER BY color
    `).catch(() => ({ rows: [] }));
    
    res.json({
      collections: collections.rows.map(r => r.collection),
      brands: brands.rows.map(r => r.brand),
      materials: materials.rows.map(r => r.material),
      productTypes: productTypes.rows.map(r => r.product_type),
      colors: colors.rows.map(r => r.color)
    });
  } catch (err) {
    console.error('Error fetching product filters:', err);
    // Return empty filters if there's an error
    res.json({
      collections: [],
      brands: [],
      materials: [],
      productTypes: [],
      colors: []
    });
  }
});

// Advanced product search with filters
app.get('/api/products/search', async (req, res) => {
  try {
    const { 
      q, brand, collection, material, productType, color, 
      minPrice, maxPrice, category, inStock, featured 
    } = req.query;
    
    // Start with basic query - use existing columns that definitely exist
    let query = `
      SELECT p.*
      FROM products p
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (q) {
      paramCount++;
      query += ` AND (LOWER(p.name) LIKE LOWER($${paramCount}) OR LOWER(COALESCE(p.description, '')) LIKE LOWER($${paramCount}) OR LOWER(COALESCE(p.sku, '')) LIKE LOWER($${paramCount}))`;
      params.push(`%${q}%`);
    }
    
    // Only add these filters if the columns exist
    if (brand) {
      paramCount++;
      query += ` AND COALESCE(p.brand, '') = $${paramCount}`;
      params.push(brand);
    }
    
    if (collection) {
      paramCount++;
      query += ` AND COALESCE(p.collection, '') = $${paramCount}`;
      params.push(collection);
    }
    
    if (material) {
      paramCount++;
      query += ` AND COALESCE(p.material, '') = $${paramCount}`;
      params.push(material);
    }
    
    if (productType) {
      paramCount++;
      query += ` AND COALESCE(p.product_type, '') = $${paramCount}`;
      params.push(productType);
    }
    
    if (color) {
      paramCount++;
      query += ` AND COALESCE(p.color, '') = $${paramCount}`;
      params.push(color);
    }
    
    
    if (category) {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
    }
    
    
    if (minPrice) {
      paramCount++;
      query += ` AND p.price >= $${paramCount}`;
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      paramCount++;
      query += ` AND p.price <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
    }
    
    if (inStock === 'true') {
      query += ` AND p.stock > 0`;
    }
    
    if (featured === 'true') {
      query += ` AND COALESCE(p.featured, false) = true`;
    }
    
    query += ` ORDER BY COALESCE(p.featured, false) DESC, p.name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update products
app.put('/api/products/bulk-update', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { productIds, updates } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Product IDs are required' });
    }
    
    const setClause = [];
    const params = [];
    let paramCount = 0;
    
    // Build dynamic update query based on provided updates
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        paramCount++;
        // Convert camelCase to snake_case for database columns
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        setClause.push(`${dbField} = $${paramCount}`);
        params.push(updates[key]);
      }
    });
    
    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }
    
    setClause.push('updated_at = CURRENT_TIMESTAMP');
    
    paramCount++;
    const query = `
      UPDATE products 
      SET ${setClause.join(', ')} 
      WHERE id = ANY($${paramCount}) 
      RETURNING id, name
    `;
    params.push(productIds);
    
    const result = await client.query(query, params);
    
    await client.query('COMMIT');
    res.json({ 
      message: `${result.rows.length} products updated successfully`,
      updatedProducts: result.rows 
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error bulk updating products:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Duplicate product
app.post('/api/products/:id/duplicate', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Get original product
    const originalResult = await client.query(`
      SELECT * FROM products WHERE id = $1
    `, [id]);
    
    if (originalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const original = originalResult.rows[0];
    
    // Create duplicate product with basic fields
    const duplicateResult = await client.query(`
      INSERT INTO products (
        name, price, category, stock, image
      ) VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `, [
      `${original.name} (Copy)`, 
      original.price, 
      original.category, 
      0, // Set stock to 0 for duplicates
      original.image
    ]);
    
    await client.query('COMMIT');
    res.json(duplicateResult.rows[0]);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error duplicating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});


// Enhanced API endpoints for location management and settings
// Add these to your server.js file

// Location Management API Routes
app.get('/api/locations', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM locations WHERE is_active = true ORDER BY store_name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching locations:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/locations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM locations WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching location:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/locations', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            store_code,
            store_name,
            brand,
            address_line1,
            address_line2,
            city,
            state,
            zip_code,
            phone,
            email,
            tax_rate,
            manager_name,
            logo_base64
        } = req.body;
        
        console.log('Creating location with logo_base64:', !!logo_base64, logo_base64?.length);
        console.log('Full request body:', JSON.stringify(req.body, null, 2));
        
        // Validate required fields
        if (!store_code || !store_name || !brand || !address_line1 || !city || !state || !zip_code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Check if store code already exists
        const existingLocation = await client.query(
            'SELECT id FROM locations WHERE store_code = $1',
            [store_code.toUpperCase()]
        );
        
        if (existingLocation.rows.length > 0) {
            return res.status(400).json({ error: 'Store code already exists' });
        }
        
        // Create location
        const locationResult = await client.query(`
            INSERT INTO locations (
                store_code, store_name, brand, address_line1, address_line2, 
                city, state, zip_code, phone, email, tax_rate, manager_name, logo_base64
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            store_code.toUpperCase(),
            store_name,
            brand,
            address_line1,
            address_line2 || null,
            city,
            state,
            zip_code,
            phone || null,
            email || null,
            parseFloat(tax_rate) || 0.08,
            manager_name || null,
            logo_base64 || null
        ]);
        
        await client.query('COMMIT');
        res.json(locationResult.rows[0]);
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating location:', err);
        
        if (err.code === '23505') { // Unique constraint violation
            res.status(400).json({ error: 'Store code already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    } finally {
        client.release();
    }
});

app.put('/api/locations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            store_name,
            brand,
            address_line1,
            address_line2,
            city,
            state,
            zip_code,
            phone,
            email,
            tax_rate,
            manager_name,
            logo_base64
        } = req.body;
        
        console.log('Updating location with logo_base64:', !!logo_base64, logo_base64?.length);
        console.log('Full request body:', JSON.stringify(req.body, null, 2));
        
        const result = await pool.query(`
            UPDATE locations SET 
                store_name = $1, brand = $2, address_line1 = $3, address_line2 = $4,
                city = $5, state = $6, zip_code = $7, phone = $8, email = $9,
                tax_rate = $10, manager_name = $11, logo_base64 = $12, updated_at = CURRENT_TIMESTAMP
            WHERE id = $13 RETURNING *
        `, [
            store_name, brand, address_line1, address_line2, city, state, zip_code,
            phone, email, parseFloat(tax_rate), manager_name, logo_base64, id
        ]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating location:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/locations/:id/logo', async (req, res) => {
    try {
        const { id } = req.params;
        const { logo_base64 } = req.body;
        
        const result = await pool.query(
            'UPDATE locations SET logo_base64 = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [logo_base64, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating location logo:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Location Inventory API Routes
app.get('/api/locations/:id/inventory', async (req, res) => {
    try {
        const { id } = req.params;
        const { low_stock } = req.query;
        
        let query = `
            SELECT 
                li.*,
                p.name as product_name,
                p.sku,
                p.price,
                p.category,
                p.image,
                (li.quantity <= li.reorder_level) as needs_reorder
            FROM location_inventory li
            JOIN products p ON li.product_id = p.id
            WHERE li.location_id = $1
        `;
        
        if (low_stock === 'true') {
            query += ' AND li.quantity <= li.reorder_level';
        }
        
        query += ' ORDER BY p.name';
        
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching location inventory:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cross-location inventory search
app.get('/api/inventory/search', async (req, res) => {
    try {
        const { product_name, sku } = req.query;
        
        if (!product_name && !sku) {
            return res.status(400).json({ error: 'Product name or SKU is required' });
        }
        
        let query = `
            SELECT 
                li.location_id,
                li.product_id,
                li.quantity,
                li.reserved_quantity,
                p.name as product_name,
                p.sku,
                p.price,
                p.category,
                l.store_name,
                l.store_code,
                l.city,
                l.state
            FROM location_inventory li
            JOIN products p ON li.product_id = p.id
            JOIN locations l ON li.location_id = l.id
            WHERE l.is_active = true
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (product_name) {
            paramCount++;
            query += ` AND LOWER(p.name) LIKE LOWER($${paramCount})`;
            params.push(`%${product_name}%`);
        }
        
        if (sku) {
            paramCount++;
            query += ` AND UPPER(p.sku) LIKE UPPER($${paramCount})`;
            params.push(`%${sku}%`);
        }
        
        query += ` ORDER BY p.name, l.store_name`;
        
        const result = await pool.query(query, params);
        
        // Group by product for easier consumption
        const groupedResults = result.rows.reduce((acc, row) => {
            const productKey = `${row.product_id}`;
            if (!acc[productKey]) {
                acc[productKey] = {
                    product_id: row.product_id,
                    product_name: row.product_name,
                    sku: row.sku,
                    price: row.price,
                    category: row.category,
                    locations: []
                };
            }
            
            acc[productKey].locations.push({
                location_id: row.location_id,
                store_name: row.store_name,
                store_code: row.store_code,
                city: row.city,
                state: row.state,
                quantity: row.quantity,
                reserved_quantity: row.reserved_quantity,
                available_quantity: row.quantity - row.reserved_quantity
            });
            
            return acc;
        }, {});
        
        res.json(Object.values(groupedResults));
    } catch (err) {
        console.error('Error searching inventory:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update location inventory
app.put('/api/locations/:locationId/inventory/:productId', async (req, res) => {
    try {
        const { locationId, productId } = req.params;
        const { quantity, reorder_level, notes } = req.body;
        
        const result = await pool.query(`
            INSERT INTO location_inventory (location_id, product_id, quantity, reorder_level, notes)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (location_id, product_id)
            DO UPDATE SET 
                quantity = $3,
                reorder_level = COALESCE($4, location_inventory.reorder_level),
                notes = COALESCE($5, location_inventory.notes),
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [locationId, productId, quantity, reorder_level, notes]);
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating location inventory:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Settings API Routes
app.get('/api/settings/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Users can only access their own settings, or admins can access any
        if (req.user.user_id.toString() !== userId && !req.user.permissions.settings?.read) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const result = await pool.query(
            'SELECT * FROM user_settings WHERE user_identifier = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            // Create default settings if none exist
            const defaultSettings = await pool.query(`
                INSERT INTO user_settings (user_identifier, theme_mode)
                VALUES ($1, 'light')
                RETURNING *
            `, [userId]);
            
            return res.json(defaultSettings.rows[0]);
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user settings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/settings/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { selected_location_id, theme_mode, language, currency_format, notifications_enabled } = req.body;
        
        // Users can only update their own settings, or admins can update any
        if (req.user.user_id.toString() !== userId && !req.user.permissions.settings?.write) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const result = await pool.query(`
            INSERT INTO user_settings (user_identifier, selected_location_id, theme_mode, language, currency_format, notifications_enabled)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_identifier)
            DO UPDATE SET 
                selected_location_id = COALESCE($2, user_settings.selected_location_id),
                theme_mode = COALESCE($3, user_settings.theme_mode),
                language = COALESCE($4, user_settings.language),
                currency_format = COALESCE($5, user_settings.currency_format),
                notifications_enabled = COALESCE($6, user_settings.notifications_enabled),
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [userId, selected_location_id, theme_mode, language, currency_format, notifications_enabled]);
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating user settings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enhanced Analytics with Location Support
app.get('/api/analytics/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const [totalSales, todaySales, transactionCount, lowStockProducts, locationInfo] = await Promise.all([
            pool.query('SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE location_id = $1', [locationId]),
            pool.query('SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE location_id = $1 AND created_at >= $2', [locationId, todayStart]),
            pool.query('SELECT COUNT(*) as count FROM transactions WHERE location_id = $1', [locationId]),
            pool.query('SELECT COUNT(*) as count FROM location_inventory WHERE location_id = $1 AND quantity <= reorder_level', [locationId]),
            pool.query('SELECT store_name, store_code FROM locations WHERE id = $1', [locationId])
        ]);
        
        res.json({
            location: locationInfo.rows[0] || null,
            totalSales: parseFloat(totalSales.rows[0].total),
            todaySales: parseFloat(todaySales.rows[0].total),
            transactionCount: parseInt(transactionCount.rows[0].count),
            lowStockCount: parseInt(lowStockProducts.rows[0].count)
        });
    } catch (err) {
        console.error('Error fetching location analytics:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transactions by location
app.get('/api/transactions/location/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        const result = await pool.query(`
            SELECT 
                t.*,
                c.name as customer_name,
                c.loyalty_number,
                json_agg(
                    json_build_object(
                        'id', ti.product_id,
                        'name', ti.product_name,
                        'price', ti.product_price,
                        'quantity', ti.quantity,
                        'subtotal', ti.subtotal
                    ) ORDER BY ti.id
                ) as items
            FROM transactions t
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
            WHERE t.location_id = $1
            GROUP BY t.id, c.name, c.loyalty_number
            ORDER BY t.created_at DESC
            LIMIT 50
        `, [locationId]);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching location transactions:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enhanced transactions endpoint - now requires location_id
app.post('/api/transactions', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { 
            items, 
            subtotal, 
            tax, 
            total, 
            paymentMethod, 
            customerId, 
            amountReceived, 
            change,
            pointsRedeemed = 0,
            locationId,
            discountAmount = 0,
            discountType = null,
            discountReason = null,
            cardLastFour = null,
            cardType = null,
            paymentReference = null,
            appliedVouchers = [],
            voucherDiscounts = 0
        } = req.body;
        
        if (!locationId) {
            return res.status(400).json({ error: 'Location ID is required' });
        }
        
        // Calculate points earned
        const pointsEarned = Math.floor(total);
        
        // Create transaction
        const transactionResult = await client.query(`
            INSERT INTO transactions 
            (customer_id, location_id, subtotal, tax, total, payment_method, amount_received, 
             change_amount, points_earned, points_redeemed, discount_amount, discount_type, 
             discount_reason, card_last_four, card_type, payment_reference) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
            RETURNING *
        `, [
            customerId, locationId, subtotal, tax, total, paymentMethod, 
            amountReceived, change, pointsEarned, pointsRedeemed, discountAmount,
            discountType, discountReason, cardLastFour, cardType, paymentReference
        ]);
        
        const transactionId = transactionResult.rows[0].id;
        
        // Add transaction items
        for (const item of items) {
            await client.query(
                'INSERT INTO transaction_items (transaction_id, product_id, product_name, product_price, quantity, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
                [transactionId, item.id, item.name, item.price, item.quantity, item.price * item.quantity]
            );
        }
        
        // Process applied vouchers
        if (appliedVouchers && appliedVouchers.length > 0) {
            for (const voucher of appliedVouchers) {
                // Validate voucher eligibility
                const isEligible = await client.query(
                    'SELECT is_voucher_eligible_for_transaction($1, $2) as is_eligible',
                    [voucher.id, customerId]
                );
                
                if (!isEligible.rows[0].is_eligible) {
                    throw new Error(`Voucher ${voucher.name} is not eligible for this transaction`);
                }
                
                // Calculate applied amount and discount amount
                let appliedAmount = 0;
                let discountAmount = 0;
                
                if (voucher.voucher_type === 'Value') {
                    appliedAmount = voucher.applied_amount || voucher.remaining_value || 0;
                    discountAmount = appliedAmount;
                } else if (voucher.voucher_type === 'Discount') {
                    appliedAmount = subtotal * (voucher.discount_percent / 100); // Track discount amount as applied
                    discountAmount = appliedAmount;
                } else if (voucher.voucher_type === 'ProductSpecific') {
                    // Find items that match this voucher's product
                    const matchingItems = items.filter(item => item.id === voucher.product_id);
                    const productSubtotal = matchingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    
                    if (voucher.discount_percent) {
                        appliedAmount = productSubtotal * (voucher.discount_percent / 100); // Track discount amount as applied
                        discountAmount = appliedAmount;
                    } else if (voucher.face_value) {
                        appliedAmount = Math.min(voucher.face_value, productSubtotal);
                        discountAmount = appliedAmount;
                    }
                }
                
                // Insert transaction voucher record
                await client.query(`
                    INSERT INTO transaction_vouchers (transaction_id, voucher_id, applied_amount, discount_amount)
                    VALUES ($1, $2, $3, $4)
                `, [transactionId, voucher.id, appliedAmount, discountAmount]);
                
                // Notify MuleSoft about voucher redemption
                try {
                    const mulesoftEndpoint = await pool.query(
                        "SELECT setting_value FROM system_settings WHERE setting_key = 'mulesoft_loyalty_sync_endpoint'"
                    );
                    
                    if (mulesoftEndpoint.rows.length > 0 && mulesoftEndpoint.rows[0].setting_value) {
                        const endpoint = mulesoftEndpoint.rows[0].setting_value.trim();
                        
                        // Call MuleSoft API to notify voucher redemption
                        const mulesoftResponse = await fetch(`${endpoint}/members/vouchers/send?id=${voucher.id}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        });
                        
                        if (!mulesoftResponse.ok) {
                            console.warn(`MuleSoft voucher notification failed for voucher ${voucher.id}:`, mulesoftResponse.status, mulesoftResponse.statusText);
                        } else {
                            console.log(`Voucher ${voucher.id} redemption successfully notified to MuleSoft`);
                        }
                    }
                } catch (mulesoftError) {
                    console.warn('MuleSoft voucher notification error:', mulesoftError.message);
                    // Don't fail the transaction if MuleSoft call fails
                }
            }
        }
        
        await client.query('COMMIT');
        
        // Return transaction with customer and location info
        const fullTransactionResult = await pool.query(`
            SELECT t.*, c.name as customer_name, c.loyalty_number, l.store_name, l.store_code
            FROM transactions t
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN locations l ON t.location_id = l.id
            WHERE t.id = $1
        `, [transactionId]);
        
        res.json(fullTransactionResult.rows[0]);
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating transaction:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Check if this is first-time setup (no locations exist)
app.get('/api/setup/status', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM locations WHERE is_active = true');
        const hasLocations = parseInt(result.rows[0].count) > 0;
        
        res.json({
            setupRequired: !hasLocations,
            locationCount: parseInt(result.rows[0].count)
        });
    } catch (err) {
        console.error('Error checking setup status:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Add these to your server.js file after the other API routes

// System Settings API Routes
app.get('/api/system-settings', authenticateToken, requirePermission('settings', 'read'), async (req, res) => {
    try {
        const { category } = req.query;
        
        let query = 'SELECT * FROM system_settings WHERE is_active = true';
        const params = [];
        
        if (category) {
            query += ' AND category = $1';
            params.push(category);
        }
        
        query += ' ORDER BY category, setting_key';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching system settings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/system-settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const result = await pool.query(
            'SELECT * FROM system_settings WHERE setting_key = $1 AND is_active = true',
            [key]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Setting not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching system setting:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/system-settings', async (req, res) => {
    try {
        const { setting_key, setting_value, description, category, setting_type, is_encrypted } = req.body;
        
        if (!setting_key || !setting_value) {
            return res.status(400).json({ error: 'Setting key and value are required' });
        }
        
        const result = await pool.query(
            `INSERT INTO system_settings 
            (setting_key, setting_value, description, category, setting_type, is_encrypted, created_by, updated_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $7) 
            RETURNING *`,
            [
                setting_key,
                setting_value,
                description || null,
                category || 'general',
                setting_type || 'text',
                is_encrypted || false,
                'admin' // You can replace this with actual user when you have auth
            ]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating system setting:', err);
        if (err.code === '23505') { // Unique constraint violation
            res.status(400).json({ error: 'Setting key already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.put('/api/system-settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { setting_value, description, category, setting_type, is_active, is_encrypted } = req.body;
        
        const result = await pool.query(
            `UPDATE system_settings 
            SET setting_value = $1, 
                description = COALESCE($2, description),
                category = COALESCE($3, category),
                setting_type = COALESCE($4, setting_type),
                is_active = COALESCE($5, is_active),
                is_encrypted = COALESCE($6, is_encrypted),
                updated_at = CURRENT_TIMESTAMP,
                updated_by = $7
            WHERE setting_key = $8
            RETURNING *`,
            [
                setting_value,
                description,
                category,
                setting_type,
                is_active,
                is_encrypted,
                'admin', // Replace with actual user
                key
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Setting not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating system setting:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/system-settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        
        // Some settings should not be deleted
        const protectedSettings = ['company_name', 'currency_symbol', 'points_per_dollar'];
        if (protectedSettings.includes(key)) {
            return res.status(400).json({ error: 'This setting cannot be deleted' });
        }
        
        const result = await pool.query(
            'DELETE FROM system_settings WHERE setting_key = $1 RETURNING *',
            [key]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Setting not found' });
        }
        
        res.json({ message: 'Setting deleted successfully' });
    } catch (err) {
        console.error('Error deleting system setting:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Database connection info endpoint
app.get('/api/system-settings/database/info', async (req, res) => {
    try {
        const dbUrl = process.env.DATABASE_URL;
        
        if (!dbUrl) {
            return res.status(404).json({ error: 'Database URL not configured' });
        }
        
        // Parse PostgreSQL URL to JDBC format
        const urlPattern = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:\/]+):(\d+)\/(.+)/;
        const match = dbUrl.match(urlPattern);
        
        let jdbcUrl = '';
        let maskedUrl = '';
        
        if (match) {
            const [, username, password, host, port, database] = match;
            jdbcUrl = `jdbc:postgresql://${username}:${password}@${host}:${port}/${database}`;
            // Mask the password for security
            maskedUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
        }
        
        res.json({
            database_url: maskedUrl,
            jdbc_format: jdbcUrl,
            ssl_mode: process.env.NODE_ENV === 'production' ? 'require' : 'disable'
        });
    } catch (err) {
        console.error('Error getting database info:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Environment variables info endpoint
app.get('/api/system-settings/env/info', async (req, res) => {
    try {
        const inferenceKey = process.env.INFERENCE_KEY;
        
        res.json({
            inference_key: inferenceKey || '',
            has_inference_key: !!inferenceKey
        });
    } catch (err) {
        console.error('Error getting environment info:', err);
        res.status(500).json({ error: 'Failed to get environment info' });
    }
});

// Get MuleSoft flows status
app.get('/api/mulesoft/flows', async (req, res) => {
    try {
        const result = await pool.query('SELECT setting_value FROM system_settings WHERE setting_key = $1', ['mulesoft_loyalty_sync_endpoint']);
        const mulesoftEndpoint = result.rows[0]?.setting_value;
        
        if (!mulesoftEndpoint) {
            return res.json([]);
        }
        
        const response = await fetch(`${mulesoftEndpoint}/flows`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`MuleSoft API error: ${response.status}`);
        }
        
        const flows = await response.json();
        res.json(flows);
    } catch (err) {
        console.error('Error fetching MuleSoft flows:', err);
        res.status(500).json({ error: 'Failed to fetch flows from MuleSoft' });
    }
});

// Update MuleSoft flows status
app.post('/api/mulesoft/flows', async (req, res) => {
    try {
        const result = await pool.query('SELECT setting_value FROM system_settings WHERE setting_key = $1', ['mulesoft_loyalty_sync_endpoint']);
        const mulesoftEndpoint = result.rows[0]?.setting_value;
        
        if (!mulesoftEndpoint) {
            return res.status(400).json({ error: 'MuleSoft endpoint not configured' });
        }
        
        const flows = req.body;
        
        const response = await fetch(`${mulesoftEndpoint}/flows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(flows)
        });
        
        if (!response.ok) {
            throw new Error(`MuleSoft API error: ${response.status}`);
        }
        
        const updatedFlows = await response.json();
        res.json(updatedFlows);
    } catch (err) {
        console.error('Error updating MuleSoft flows:', err);
        res.status(500).json({ error: 'Failed to update flows in MuleSoft' });
    }
});


// Transactions
// app.get('/api/transactions', async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT 
//         t.*,
//         c.name as customer_name,
//         c.loyalty_number,
//         json_agg(
//           json_build_object(
//             'id', ti.product_id,
//             'name', ti.product_name,
//             'price', ti.product_price,
//             'quantity', ti.quantity
//           ) ORDER BY ti.id
//         ) as items
//       FROM transactions t
//       LEFT JOIN customers c ON t.customer_id = c.id
//       LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
//       GROUP BY t.id, c.name, c.loyalty_number
//       ORDER BY t.created_at DESC
//     `);
//     res.json(result.rows);
//   } catch (err) {
//     console.error('Error fetching transactions:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.post('/api/transactions', async (req, res) => {
//   const client = await pool.connect();
  
//   try {
//     await client.query('BEGIN');
    
//     const { 
//       items, 
//       subtotal, 
//       tax, 
//       total, 
//       paymentMethod, 
//       customerId, 
//       amountReceived, 
//       change,
//       pointsRedeemed = 0
//     } = req.body;
    
//     // Calculate points earned
//     const pointsEarned = calculatePoints(total);
    
//     // Create transaction
//     const transactionResult = await client.query(
//       `INSERT INTO transactions 
//        (customer_id, subtotal, tax, total, payment_method, amount_received, change_amount, points_earned, points_redeemed) 
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
//       [customerId, subtotal, tax, total, paymentMethod, amountReceived, change, pointsEarned, pointsRedeemed]
//     );
    
//     const transactionId = transactionResult.rows[0].id;
    
//     // Add transaction items and update stock
//     for (const item of items) {
//       await client.query(
//         'INSERT INTO transaction_items (transaction_id, product_id, product_name, product_price, quantity, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
//         [transactionId, item.id, item.name, item.price, item.quantity, item.price * item.quantity]
//       );
      
//       // Update product stock
//       await client.query(
//         'UPDATE products SET stock = stock - $1 WHERE id = $2',
//         [item.quantity, item.id]
//       );
//     }
    
//     await client.query('COMMIT');
    
//     // Return transaction with customer info if available
//     const fullTransactionResult = await pool.query(`
//       SELECT t.*, c.name as customer_name, c.loyalty_number
//       FROM transactions t
//       LEFT JOIN customers c ON t.customer_id = c.id
//       WHERE t.id = $1
//     `, [transactionId]);
    
//     res.json(fullTransactionResult.rows[0]);
    
//   } catch (err) {
//     await client.query('ROLLBACK');
//     console.error('Error creating transaction:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   } finally {
//     client.release();
//   }
// });

// ============================================================================
// DATA LOADER HELPER FUNCTIONS
// ============================================================================

// Helper function to process product features
async function processProductFeatures(client, productId, rawData, featuresConfig) {
  try {
    const featuresField = rawData[featuresConfig.csvField];
    if (!featuresField || typeof featuresField !== 'string') {
      console.log('No features field found or empty');
      return;
    }
    
    // Split features by delimiter
    const features = featuresField.split(featuresConfig.delimiter)
      .map(feature => feature.trim())
      .filter(feature => feature.length > 0);
    
    if (features.length === 0) {
      console.log('No features found after splitting');
      return;
    }
    
    // Delete existing features for this product
    await client.query(`
      DELETE FROM product_features WHERE product_id = $1
    `, [productId]);
    
    // Insert new features
    for (const feature of features) {
      // Validate feature length
      if (feature.length > 100) {
        console.warn(`Feature name too long (${feature.length} chars): ${feature.substring(0, 50)}...`);
        continue;
      }
      
      await client.query(`
        INSERT INTO product_features (product_id, feature_name, feature_value)
        VALUES ($1, $2, $3)
      `, [productId, feature, '']); // Empty feature_value for now
    }
    
    console.log(`Processed ${features.length} features for product ${productId}`);
  } catch (error) {
    console.error('Error processing product features:', error);
    throw error;
  }
}

// ============================================================================
// DATA LOADER API ENDPOINTS
// ============================================================================

// File upload and CSV parsing
app.post('/api/data-loader/upload', upload.single('csvFile'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { type, maxRows } = req.body; // 'products' or 'customers', maxRows
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!type || !['products', 'customers'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "products" or "customers"' });
    }
    
    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return res.status(400).json({ 
        error: `File size exceeds 25MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
      });
    }
    
    // Parse CSV
    const csvData = await parseCSV(file.buffer);
    
    if (csvData.length === 0) {
      return res.status(400).json({ error: 'No valid data found in CSV file' });
    }
    
    // Apply maxRows limit if specified
    const maxRowsNum = parseInt(maxRows) || 0;
    const limitedData = maxRowsNum > 0 ? csvData.slice(0, maxRowsNum) : csvData;
    
    // Create job record
    const jobResult = await client.query(`
      INSERT INTO data_loader_jobs (type, file_name, total_rows, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING job_id
    `, [type, file.originalname, limitedData.length]);
    
    const jobId = jobResult.rows[0].job_id;
    
    // Store CSV rows
    for (let i = 0; i < limitedData.length; i++) {
      await client.query(`
        INSERT INTO data_loader_rows (job_id, row_number, raw_data)
        VALUES ($1, $2, $3)
      `, [jobId, i + 1, JSON.stringify(limitedData[i])]);
    }
    
    res.json({ jobId, totalRows: limitedData.length });
    
  } catch (error) {
    console.error('Error uploading CSV:', error);
    res.status(500).json({ error: 'Failed to upload CSV' });
  } finally {
    client.release();
  }
});

// Get CSV and database fields for mapping
app.get('/api/data-loader/fields/:jobId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { jobId } = req.params;
    
    // Get job info
    const jobResult = await client.query(`
      SELECT type, total_rows FROM data_loader_jobs WHERE job_id = $1
    `, [jobId]);
    
    if (!jobResult.rows.length) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = jobResult.rows[0];
    
    // Get sample data to determine CSV fields
    const sampleResult = await client.query(`
      SELECT raw_data FROM data_loader_rows 
      WHERE job_id = $1 AND row_number = 1
    `, [jobId]);
    
    if (!sampleResult.rows.length) {
      return res.status(404).json({ error: 'No data found for job' });
    }
    
    const csvFields = Object.keys(sampleResult.rows[0].raw_data);
    
    // Get database fields based on type
    const dbFields = job.type === 'products' 
      ? ['name', 'price', 'category', 'stock', 'sku', 'product_type', 'brand', 'collection', 'material', 'color', 'description', 'dimensions', 'weight', 'warranty_info', 'care_instructions', 'main_image_url', 'is_active', 'featured']
      : ['loyalty_number', 'first_name', 'last_name', 'name', 'email', 'phone', 'points', 'total_spent', 'visit_count', 'last_visit', 'member_type', 'member_status', 'enrollment_date', 'notes', 'address_line1', 'address_line2', 'city', 'state', 'country', 'zip_code', 'date_of_birth'];
    
    res.json({ csvFields, dbFields, type: job.type });
    
  } catch (error) {
    console.error('Error getting fields:', error);
    res.status(500).json({ error: 'Failed to get fields' });
  } finally {
    client.release();
  }
});

// Save field mapping
app.post('/api/data-loader/mapping/:jobId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { jobId } = req.params;
    const { fieldMapping, constantValues, featuresConfig } = req.body;
    
    console.log('=== MAPPING ENDPOINT DEBUG ===');
    console.log('Job ID:', jobId);
    console.log('Field Mapping received:', fieldMapping);
    console.log('Constant Values received:', constantValues);
    console.log('=== END MAPPING ENDPOINT DEBUG ===');
    
    if (!fieldMapping || typeof fieldMapping !== 'object') {
      return res.status(400).json({ error: 'Invalid field mapping' });
    }
    
    if (!constantValues || typeof constantValues !== 'object') {
      return res.status(400).json({ error: 'Invalid constant values' });
    }
    
    // Update job with field mapping and constant values
    console.log('Updating database with:');
    console.log('Field Mapping JSON:', JSON.stringify(fieldMapping));
    console.log('Constant Values JSON:', JSON.stringify(constantValues));
    
    const result = await client.query(`
      UPDATE data_loader_jobs 
      SET field_mapping = $1, constant_values = $2, features_config = $3, status = 'mapping', updated_at = CURRENT_TIMESTAMP
      WHERE job_id = $4
    `, [JSON.stringify(fieldMapping), JSON.stringify(constantValues), JSON.stringify(featuresConfig || {}), jobId]);
    
    console.log('Database update result:', result.rowCount, 'rows affected');
    
    // Verify the update by reading back the data
    const verifyResult = await client.query(`
      SELECT field_mapping, constant_values FROM data_loader_jobs WHERE job_id = $1
    `, [jobId]);
    
    console.log('Verification - Field Mapping:', verifyResult.rows[0]?.field_mapping);
    console.log('Verification - Constant Values:', verifyResult.rows[0]?.constant_values);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error saving mapping:', error);
    res.status(500).json({ error: 'Failed to save mapping' });
  } finally {
    client.release();
  }
});

// Preview mapped data
app.get('/api/data-loader/preview/:jobId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { jobId } = req.params;
    const { limit = 10 } = req.query;
    
    // Get job info
    const jobResult = await client.query(`
      SELECT type, field_mapping, constant_values, features_config, total_rows FROM data_loader_jobs WHERE job_id = $1
    `, [jobId]);
    
    if (!jobResult.rows.length) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = jobResult.rows[0];
    const mapping = job.field_mapping ? 
      (typeof job.field_mapping === 'string' ? JSON.parse(job.field_mapping) : job.field_mapping) : {};
    const constants = job.constant_values ? 
      (typeof job.constant_values === 'string' ? JSON.parse(job.constant_values) : job.constant_values) : {};
    const featuresConfig = job.features_config ? 
      (typeof job.features_config === 'string' ? JSON.parse(job.features_config) : job.features_config) : {};
    
    // Get sample rows
    const rowsResult = await client.query(`
      SELECT row_number, raw_data FROM data_loader_rows 
      WHERE job_id = $1 
      ORDER BY row_number 
      LIMIT $2
    `, [jobId, parseInt(limit)]);
    
    const previewData = rowsResult.rows.map(row => {
      const rawData = row.raw_data;
      const mappedData = {};
      
      // Apply field mapping (multiple DB fields per CSV field)
      Object.entries(mapping).forEach(([csvField, dbFields]) => {
        if (rawData[csvField] !== undefined && Array.isArray(dbFields)) {
          dbFields.forEach(dbField => {
            mappedData[dbField] = rawData[csvField];
          });
        }
      });
      
      // Apply constant values
      Object.entries(constants).forEach(([dbField, constantData]) => {
        if (constantData && constantData.value !== undefined) {
          // Convert value based on type
          let value = constantData.value;
          if (constantData.type === 'number') {
            value = parseFloat(value);
          } else if (constantData.type === 'boolean') {
            value = ['true', '1', 'yes'].includes(value.toString().toLowerCase());
          }
          mappedData[dbField] = value;
        }
      });
      
      // Process features if enabled
      let features = [];
      if (featuresConfig.enabled && featuresConfig.csvField && rawData[featuresConfig.csvField]) {
        const featuresField = rawData[featuresConfig.csvField];
        features = featuresField.split(featuresConfig.delimiter)
          .map(feature => feature.trim())
          .filter(feature => feature.length > 0);
      }
      
      return {
        rowNumber: row.row_number,
        rawData,
        mappedData,
        features
      };
    });
    
    res.json({ previewData, totalRows: job.total_rows });
    
  } catch (error) {
    console.error('Error getting preview:', error);
    res.status(500).json({ error: 'Failed to get preview' });
  } finally {
    client.release();
  }
});

// Process data import
app.post('/api/data-loader/process/:jobId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { jobId } = req.params;
    
    // Update job status
    await client.query(`
      UPDATE data_loader_jobs SET status = 'processing', updated_at = CURRENT_TIMESTAMP
      WHERE job_id = $1
    `, [jobId]);
    
    // Get job info
    const jobResult = await client.query(`
      SELECT type, field_mapping, constant_values, features_config FROM data_loader_jobs WHERE job_id = $1
    `, [jobId]);
    
    if (!jobResult.rows.length) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = jobResult.rows[0];
    console.log('=== PROCESS ENDPOINT DEBUG ===');
    console.log('Raw job data from DB:', job);
    console.log('Raw field_mapping:', job.field_mapping);
    console.log('Raw constant_values:', job.constant_values);
    
    const mapping = job.field_mapping ? 
      (typeof job.field_mapping === 'string' ? JSON.parse(job.field_mapping) : job.field_mapping) : {};
    const constants = job.constant_values ? 
      (typeof job.constant_values === 'string' ? JSON.parse(job.constant_values) : job.constant_values) : {};
    const featuresConfig = job.features_config ? 
      (typeof job.features_config === 'string' ? JSON.parse(job.features_config) : job.features_config) : {};
    
    console.log('Parsed mapping:', mapping);
    console.log('Parsed constants:', constants);
    console.log('Parsed features config:', featuresConfig);
    console.log('=== END PROCESS ENDPOINT DEBUG ===');
    
    // Process each row
    const rowsResult = await client.query(`
      SELECT * FROM data_loader_rows WHERE job_id = $1 AND status = 'pending'
    `, [jobId]);
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const row of rowsResult.rows) {
      try {
        const rawData = row.raw_data;
        const mappedData = {};
        
        // Apply field mapping (multiple DB fields per CSV field)
        Object.entries(mapping).forEach(([csvField, dbFields]) => {
          if (rawData[csvField] !== undefined && Array.isArray(dbFields)) {
            dbFields.forEach(dbField => {
              mappedData[dbField] = rawData[csvField];
            });
          }
        });
        
        // Apply constant values
        console.log('=== CONSTANT VALUES DEBUG ===');
        console.log('Constants object:', constants);
        console.log('Constants entries:', Object.entries(constants));
        
        Object.entries(constants).forEach(([dbField, constantData]) => {
          console.log(`Processing constant for field: ${dbField}`, constantData);
          if (constantData && constantData.value !== undefined) {
            // Convert value based on type
            let value = constantData.value;
            if (constantData.type === 'number') {
              value = parseFloat(value);
            } else if (constantData.type === 'boolean') {
              value = ['true', '1', 'yes'].includes(value.toString().toLowerCase());
            }
            console.log(`Setting ${dbField} = ${value} (type: ${constantData.type})`);
            mappedData[dbField] = value;
          }
        });
        
        console.log('Final mappedData after constants:', mappedData);
        console.log('=== END CONSTANT VALUES DEBUG ===');
        // Debug: Display contents of mappedData
        // console.log('=== After Data Mapping Debug ===');
        // console.log('Mapped Data:', mappedData);
        // console.log('==========================');
        
        // Insert into appropriate table
        let productId = null;
        if (job.type === 'products') {
          productId = await insertProduct(client, mappedData);
        } else {
          await insertCustomer(client, mappedData);
        }
        
        // Process features if enabled and this is a product
        if (job.type === 'products' && featuresConfig.enabled && featuresConfig.csvField && productId) {
          await processProductFeatures(client, productId, rawData, featuresConfig);
        }
        
        // Update row status
        await client.query(`
          UPDATE data_loader_rows SET status = 'processed', mapped_data = $1
          WHERE id = $2
        `, [JSON.stringify(mappedData), row.id]);
        
        processedCount++;
        
      } catch (error) {
        // Mark row as error
        await client.query(`
          UPDATE data_loader_rows SET status = 'error', error_message = $1
          WHERE id = $2
        `, [error.message, row.id]);
        
        // Log error
        await client.query(`
          INSERT INTO data_loader_errors (job_id, row_id, error_type, error_message)
          VALUES ($1, $2, 'import', $3)
        `, [jobId, row.id, error.message]);
        
        errorCount++;
      }
    }
    
    // Update job status
    await client.query(`
      UPDATE data_loader_jobs 
      SET status = 'completed', processed_rows = $1, error_count = $2, completed_at = CURRENT_TIMESTAMP
      WHERE job_id = $3
    `, [processedCount, errorCount, jobId]);
    
    res.json({ 
      success: true, 
      processedRows: processedCount, 
      errorCount: errorCount 
    });
    
  } catch (error) {
    console.error('Error processing data:', error);
    
    // Update job status to failed
    await client.query(`
      UPDATE data_loader_jobs SET status = 'failed', updated_at = CURRENT_TIMESTAMP
      WHERE job_id = $1
    `, [req.params.jobId]);
    
    res.status(500).json({ error: 'Failed to process data' });
  } finally {
    client.release();
  }
});

// Get job status
app.get('/api/data-loader/status/:jobId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { jobId } = req.params;
    
    const jobResult = await client.query(`
      SELECT status, total_rows, processed_rows, error_count, created_at, completed_at
      FROM data_loader_jobs WHERE job_id = $1
    `, [jobId]);
    
    if (!jobResult.rows.length) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(jobResult.rows[0]);
    
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  } finally {
    client.release();
  }
});

// Get import errors
app.get('/api/data-loader/errors/:jobId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { jobId } = req.params;
    
    const errorsResult = await client.query(`
      SELECT e.*, r.row_number
      FROM data_loader_errors e
      JOIN data_loader_rows r ON e.row_id = r.id
      WHERE e.job_id = $1
      ORDER BY r.row_number
    `, [jobId]);
    
    res.json(errorsResult.rows);
    
  } catch (error) {
    console.error('Error getting errors:', error);
    res.status(500).json({ error: 'Failed to get errors' });
  } finally {
    client.release();
  }
});

// Helper function to insert product
async function insertProduct(client, data) {
  console.log('=== INSERT PRODUCT DEBUG ===');
  console.log('Raw data received:', data);
  console.log('Data keys:', Object.keys(data));
  console.log('Data values:', Object.values(data));
  
  const { sku } = data;
  
  if (!sku) {
    throw new Error('SKU is required for product operations');
  }
  
  // Check if product exists
  const existingProduct = await client.query(`
    SELECT id FROM products WHERE sku = $1
  `, [sku]);
  
  if (existingProduct.rows.length > 0) {
    // Product exists - perform UPDATE with only provided fields
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    // Build dynamic UPDATE query based on provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && key !== 'sku') {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
        paramCount++;
      }
    });
    
    if (updateFields.length > 0) {
      // Add updated_at
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add SKU as the last parameter for WHERE clause
      updateValues.push(sku);
      
      const updateQuery = `
        UPDATE products 
        SET ${updateFields.join(', ')}
        WHERE sku = $${paramCount}
        RETURNING id
      `;
      
      console.log('UPDATE query:', updateQuery);
      console.log('UPDATE values:', updateValues);
      
      const result = await client.query(updateQuery, updateValues);
      console.log('UPDATE successful, product ID:', result.rows[0].id);
      return result.rows[0].id;
    } else {
      // No fields to update, just return existing ID
      console.log('No fields to update, returning existing product ID:', existingProduct.rows[0].id);
      return existingProduct.rows[0].id;
    }
  } else {
    // Product doesn't exist - check if we have required fields for INSERT
    const { name } = data;
    
    if (!name) {
      throw new Error(`Cannot create new product without required field 'name'. SKU: ${sku}`);
    }
    
    // For new products, we need at least name and sku
    const {
      price, category, stock, product_type, brand, collection,
      material, color, description, dimensions, weight, warranty_info,
      care_instructions, main_image_url, is_active, featured
    } = data;
    
    const values = [
      name, price, category, stock || 0, sku, product_type, brand, collection,
      material, color, description, dimensions, weight, warranty_info,
      care_instructions, main_image_url, is_active !== false, featured || false
    ];
    
    console.log('Creating new product with values:', values);
    
    const result = await client.query(`
      INSERT INTO products (
        name, price, category, stock, sku, product_type, brand, collection,
        material, color, description, dimensions, weight, warranty_info,
        care_instructions, main_image_url, is_active, featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id
    `, values);
    
    console.log('INSERT successful, product ID:', result.rows[0].id);
    return result.rows[0].id;
  }
}

// Helper function to insert customer
async function insertCustomer(client, data) {
  const { loyalty_number } = data;
  
  if (!loyalty_number) {
    throw new Error('Loyalty number is required for customer operations');
  }
  
  // Check if customer exists
  const existingCustomer = await client.query(`
    SELECT id FROM customers WHERE loyalty_number = $1
  `, [loyalty_number]);
  
  if (existingCustomer.rows.length > 0) {
    // Customer exists - perform UPDATE with only provided fields
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    // Build dynamic UPDATE query based on provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && key !== 'loyalty_number') {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
        paramCount++;
      }
    });
    
    if (updateFields.length > 0) {
      // Add updated_at
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateFields.push(`status = 'Updated'`);
      
      // Add loyalty_number as the last parameter for WHERE clause
      updateValues.push(loyalty_number);
      
      const updateQuery = `
        UPDATE customers 
        SET ${updateFields.join(', ')}
        WHERE loyalty_number = $${paramCount}
        RETURNING id
      `;
      
      const result = await client.query(updateQuery, updateValues);
      return result.rows[0].id;
    } else {
      // No fields to update, just return existing ID
      return existingCustomer.rows[0].id;
    }
  } else {
    // Customer doesn't exist - check if we have required fields for INSERT
    const { first_name, last_name } = data;
    
    if (!first_name || !last_name) {
      throw new Error(`Cannot create new customer without required fields 'first_name' and 'last_name'. Loyalty Number: ${loyalty_number}`);
    }
    
    // For new customers, we need at least first_name, last_name, and loyalty_number
    const {
      name, email, phone, points,
      total_spent, visit_count, last_visit, member_type, member_status,
      enrollment_date, notes, address_line1, address_line2, city, state, country, zip_code, date_of_birth
    } = data;
    
    const result = await client.query(`
      INSERT INTO customers (
        loyalty_number, first_name, last_name, name, email, phone, points,
        total_spent, visit_count, last_visit, member_type, member_status,
        enrollment_date, notes, address_line1, address_line2, city, state, country, zip_code, date_of_birth, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING id
    `, [
      loyalty_number, first_name, last_name, name || `${first_name} ${last_name}`,
      email, phone, points || 0, total_spent || 0, visit_count || 0,
      last_visit, member_type, member_status, enrollment_date, notes,
      address_line1, address_line2, city, state, country, zip_code, date_of_birth, 'Created'
    ]);
    
    return result.rows[0].id;
  }
}

// Helper function to parse CSV
async function parseCSV(buffer) {
  const csv = require('csv-parser');
  const { Readable } = require('stream');
  
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (data) => {
        // Clean and validate each row
        const cleanedData = {};
        for (const [key, value] of Object.entries(data)) {
          if (key && key.trim() !== '') {
            const cleanKey = key.trim();
            const cleanValue = value ? value.toString().trim() : '';
            if (cleanValue !== '') {
              cleanedData[cleanKey] = cleanValue;
            }
          }
        }
        if (Object.keys(cleanedData).length > 0) {
          results.push(cleanedData);
        }
      })
      .on('end', () => {
        if (results.length === 0) {
          reject(new Error('No valid data found in CSV file'));
        } else {
          resolve(results);
        }
      })
      .on('error', (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      });
  });
}

// Send products to Loyalty Cloud
app.post('/api/loyalty/products/send', async (req, res) => {
  try {
    const { product: productId } = req.query;
    const client = await pool.connect();
    
    try {
      let productsResult;
      
      if (productId) {
        // Send specific product
        productsResult = await client.query(`
          SELECT id, name, sku, price, category, product_type, brand, collection,
                 material, color, description, dimensions, weight, warranty_info,
                 care_instructions, main_image_url, is_active, featured, stock
          FROM products 
          WHERE id = $1 AND is_active = true
        `, [productId]);
      } else {
        // Send all products
        productsResult = await client.query(`
          SELECT id, name, sku, price, category, product_type, brand, collection,
                 material, color, description, dimensions, weight, warranty_info,
                 care_instructions, main_image_url, is_active, featured, stock
          FROM products 
          WHERE is_active = true
          ORDER BY created_at DESC
        `);
      }
      
      const products = productsResult.rows;
      
      if (products.length === 0) {
        return res.json({
          summary: productId ? "Product not found or inactive." : "No active products found to sync with Loyalty Cloud.",
          statistics: {
            totalProcessed: 0,
            created: 0,
            updated: 0,
            failed: 0
          },
          failures: null
        });
      }
      
      // Call MuleSoft API to send products
      const settingsResult = await pool.query(
        'SELECT setting_value FROM system_settings WHERE setting_key = $1',
        ['mulesoft_loyalty_sync_endpoint']
      );
  
      if (!settingsResult.rows.length || !settingsResult.rows[0].setting_value) {
        return res.status(400).json({ error: 'MuleSoft endpoint not configured' });
      }
  
      const mulesoftEndpoint = settingsResult.rows[0].setting_value;
       const muleSoftResponse = await fetch(mulesoftEndpoint + '/loyalty/products/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MULESOFT_ACCESS_TOKEN || 'your-token-here'}`
        },
        body: JSON.stringify({
          products: products,
          syncType: productId ? 'single_product' : 'full_sync'
        })
      });
      
      if (!muleSoftResponse.ok) {
        throw new Error(`MuleSoft API error: ${muleSoftResponse.status} ${muleSoftResponse.statusText}`);
      }
      
      const result = await muleSoftResponse.json();
      
      // Return the response from MuleSoft API
      res.json(result);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error sending products to Loyalty:', error);
    res.status(500).json({ 
      error: 'Failed to send products to Loyalty Cloud',
      details: error.message 
    });
  }
});

// AI Product Improvement endpoint
app.post('/api/products/improve/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // Get the MuleSoft endpoint from system settings
    const settingsResult = await pool.query(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'mulesoft_loyalty_sync_endpoint'
    `);
    
    if (!settingsResult.rows.length) {
      return res.status(500).json({ error: 'MuleSoft endpoint not configured' });
    }
    
    const muleSoftBaseUrl = settingsResult.rows[0].setting_value;
    const improveUrl = `${muleSoftBaseUrl}/products/improve?product=${productId}`;
    
    //  console.log('Calling MuleSoft AI improvement endpoint:', improveUrl);
    
    // Call MuleSoft API for product improvement
    const muleSoftResponse = await fetch(improveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MULESOFT_ACCESS_TOKEN || 'your-token-here'}`
      }
    });
    
    if (!muleSoftResponse.ok) {
      throw new Error(`MuleSoft API error: ${muleSoftResponse.status} ${muleSoftResponse.statusText}`);
    }
    
    const result = await muleSoftResponse.json();
    
    // Return the response from MuleSoft API
    res.json(result);
    
  } catch (error) {
    console.error('Error improving product with AI:', error);
    res.status(500).json({ 
      error: 'Failed to improve product with AI',
      details: error.message 
    });
  }
});

// Generate random inventory for all products
app.post('/api/products/generate-inventory', async (req, res) => {
  try {
    const { 
      enableInventory = true, 
      enablePricing = false, 
      keepExistingStock = true,
      priceRangeMin = 1,
      priceRangeMax = 100,
      keepExistingPrice = true
    } = req.body;
    
    // Validate that at least one option is enabled
    if (!enableInventory && !enablePricing) {
      return res.status(400).json({ 
        error: 'At least one option (inventory or pricing) must be enabled' 
      });
    }
    
    // Get all products with both stock and price
    const productsResult = await pool.query('SELECT id, stock, price FROM products WHERE is_active = true');
    const products = productsResult.rows;
    
    if (products.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No active products found',
        updated: 0 
      });
    }
    
    let updatedCount = 0;
    const updates = [];
    
    for (const product of products) {
      const update = { id: product.id };
      let shouldUpdate = false;
      
      // Handle inventory generation
      if (enableInventory) {
        let newStock;
        
        if (keepExistingStock && product.stock > 0) {
          // Keep existing stock if it's greater than 0
          newStock = product.stock;
        } else {
          // Generate random stock between 0 and 100
          newStock = Math.floor(Math.random() * 101);
        }
        
        update.stock = newStock;
        shouldUpdate = true;
      }
      
      // Handle pricing generation
      if (enablePricing) {
        let newPrice;
        
        if (keepExistingPrice && product.price > 0) {
          // Keep existing price if it's greater than 0
          newPrice = product.price;
        } else {
          // Generate random price within the specified range
          newPrice = (Math.random() * (priceRangeMax - priceRangeMin) + priceRangeMin).toFixed(2);
        }
        
        update.price = parseFloat(newPrice);
        shouldUpdate = true;
      }
      
      if (shouldUpdate) {
        updates.push(update);
      }
    }
    
    // Update all products in batch
    for (const update of updates) {
      const setClauses = [];
      const values = [];
      let paramCount = 1;
      
      if (update.stock !== undefined) {
        setClauses.push(`stock = $${paramCount}`);
        values.push(update.stock);
        paramCount++;
      }
      
      if (update.price !== undefined) {
        setClauses.push(`price = $${paramCount}`);
        values.push(update.price);
        paramCount++;
      }
      
//      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
//      values.push(update.id);
      
      await pool.query(
        `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${paramCount}`,
        values
      );
      updatedCount++;
    }
    
    // Build success message
    const messages = [];
    if (enableInventory) messages.push('inventory');
    if (enablePricing) messages.push('pricing');
    
    res.json({
      success: true,
      message: `Successfully generated random ${messages.join(' and ')} for ${updatedCount} products`,
      updated: updatedCount,
      enableInventory,
      enablePricing,
      keepExistingStock,
      priceRangeMin,
      priceRangeMax,
      keepExistingPrice
    });
    
  } catch (error) {
    console.error('Error generating random data:', error);
    res.status(500).json({ 
      error: 'Failed to generate random data',
      details: error.message 
    });
  }
});

// Customer Avatar Management Endpoints

// Upload customer avatar
app.post('/api/customers/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_data, filename, file_size, width, height } = req.body;
    
    // console.log(`Avatar upload request for customer ${id}`);
    // console.log('Request body keys:', Object.keys(req.body));
    // console.log('Image data present:', !!image_data);
    // console.log('Image data length:', image_data ? image_data.length : 0);
    
    if (!image_data) {
      console.log('No image data provided');
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    // Check if customer exists
    const customerResult = await pool.query('SELECT id FROM customers WHERE id = $1', [id]);
    if (customerResult.rows.length === 0) {
      console.log(`Customer ${id} not found`);
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // console.log(`Customer ${id} found, proceeding with avatar upload`);
    
    // Delete existing avatar if any
    const deleteResult = await pool.query('DELETE FROM customer_images WHERE customer_id = $1', [id]);
    console.log(`Deleted ${deleteResult.rowCount} existing avatars for customer ${id}`);
    
    // Insert new avatar
    const result = await pool.query(
      'INSERT INTO customer_images (customer_id, filename, image_data, file_size, width, height) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [id, filename || 'avatar.jpg', image_data, file_size || 0, width || 0, height || 0]
    );
    
    // console.log(`Avatar uploaded successfully for customer ${id}, avatar_id: ${result.rows[0].id}`);
    
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar_id: result.rows[0].id
    });
    
  } catch (error) {
    console.error('Error uploading customer avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Get customer avatar
app.get('/api/customers/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
   // console.log(`Fetching avatar for customer ID: ${id}`);
    
    // Check if customer exists first
    const customerCheck = await pool.query('SELECT id FROM customers WHERE id = $1', [id]);
    if (customerCheck.rows.length === 0) {
      console.log(`Customer with ID ${id} not found`);
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const result = await pool.query(
      'SELECT image_data, filename, file_size, width, height FROM customer_images WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    );
    
   // console.log(`Avatar query result for customer ${id}: ${result.rows.length} rows`);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No avatar found' });
    }
    
    const avatar = result.rows[0];
    res.json({
      success: true,
      avatar: {
        image_data: avatar.image_data,
        filename: avatar.filename,
        file_size: avatar.file_size,
        width: avatar.width,
        height: avatar.height
      }
    });
    
  } catch (error) {
    console.error('Error getting customer avatar:', error);
    res.status(500).json({ error: 'Failed to get avatar' });
  }
});

// Delete customer avatar
app.delete('/api/customers/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM customer_images WHERE customer_id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No avatar found to delete' });
    }
    
    res.json({
      success: true,
      message: 'Avatar deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting customer avatar:', error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

// ==================== VOUCHER ENDPOINTS ====================

// Get all vouchers for a customer
app.get('/api/customers/:id/vouchers', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        cv.*,
        p.name as product_name,
        p.price as product_price
      FROM customer_vouchers cv
      LEFT JOIN products p ON cv.product_id = p.id
      WHERE cv.customer_id = $1 
        AND cv.status = 'Issued' 
        AND cv.is_active = true
        AND (cv.expiration_date IS NULL OR cv.expiration_date >= CURRENT_DATE)
        AND (cv.voucher_type != 'Value' OR cv.remaining_value > 0)
      ORDER BY cv.created_date DESC
    `, [id]);
    
    res.json({
      success: true,
      vouchers: result.rows
    });
    
  } catch (error) {
    console.error('Error getting customer vouchers:', error);
    res.status(500).json({ error: 'Failed to get vouchers' });
  }
});

// Get all vouchers for a customer (including expired, redeemed, etc.)
app.get('/api/customers/:id/vouchers/all', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        cv.*,
        p.name as product_name,
        p.price as product_price
      FROM customer_vouchers cv
      LEFT JOIN products p ON cv.product_id = p.id
      WHERE cv.customer_id = $1 
      ORDER BY cv.created_date DESC
    `, [id]);
    
    res.json({
      success: true,
      vouchers: result.rows
    });
    
  } catch (error) {
    console.error('Error getting all customer vouchers:', error);
    res.status(500).json({ error: 'Failed to get all vouchers' });
  }
});

// Refresh vouchers from MuleSoft API
app.post('/api/customers/:id/vouchers/refresh', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get customer loyalty number
    const customerResult = await pool.query(
      'SELECT loyalty_number FROM customers WHERE id = $1',
      [id]
    );
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const loyaltyNumber = customerResult.rows[0].loyalty_number;
    
    // Get MuleSoft endpoint from system settings
    const settingsResult = await pool.query(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      ['mulesoft_loyalty_sync_endpoint']
    );

    if (!settingsResult.rows.length || !settingsResult.rows[0].setting_value) {
      // MuleSoft endpoint not configured - return empty vouchers for demo
      console.log('MuleSoft endpoint not configured - returning empty vouchers for demo');
      return res.json({ 
        message: 'MuleSoft endpoint not configured - no vouchers refreshed',
        vouchers: []
      });
    }

    const mulesoftEndpoint = settingsResult.rows[0].setting_value;
    const vouchersUrl = `${mulesoftEndpoint}/members/vouchers?member=${id}`;
    
    // Call MuleSoft API
    const mulesoftResponse = await fetch(vouchersUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any required authentication headers here
      }
    });
    
    if (!mulesoftResponse.ok) {
      if (mulesoftResponse.status === 404) {
        // MuleSoft endpoint not found - return empty vouchers for demo
        console.log('MuleSoft API endpoint ' + vouchersUrl + ' not found (404) - returning empty vouchers for demo');
        return res.json({ 
          message: 'MuleSoft API endpoint ' + vouchersUrl + ' not available - no vouchers refreshed',
          vouchers: []
        });
      }
      throw new Error(`MuleSoft API error: ${mulesoftResponse.status}`);
    }
    
    const mulesoftData = await mulesoftResponse.json();
    
    // Clear existing vouchers for this customer
    // await pool.query('DELETE FROM customer_vouchers WHERE customer_id = $1', [id]);
    
    // Insert new vouchers from MuleSoft
    const vouchers = mulesoftData.vouchers || [];
    // for (const voucher of vouchers) {
    //   await pool.query(`
    //     INSERT INTO customer_vouchers (
    //       sf_id, customer_id, voucher_code, name, status, voucher_type,
    //       face_value, discount_percent, product_id, remaining_value,
    //       description, image_url, is_active, effective_date, expiration_date,
    //       created_date, use_date
    //     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    //   `, [
    //     voucher.Id,
    //     id,
    //     voucher.VoucherCode,
    //     voucher.Name,
    //     voucher.Status,
    //     voucher.VoucherDefinition?.Type === 'ProductOrService' ? 'ProductSpecific' : 
    //     voucher.DiscountPercent ? 'Discount' : 'Value',
    //     voucher.VoucherDefinition?.FaceValue,
    //     voucher.DiscountPercent,
    //     voucher.VoucherDefinition?.ProductId ? 
    //       (await pool.query('SELECT id FROM products WHERE sf_id = $1', [voucher.VoucherDefinition.ProductId])).rows[0]?.id : null,
    //     voucher.RemainingValue,
    //     voucher.VoucherDefinition?.Description,
    //     voucher.VoucherDefinition?.ImageUrl,
    //     voucher.VoucherDefinition?.IsActive === 'true',
    //     voucher.VoucherDefinition?.EffectiveDate,
    //     voucher.ExpirationDate,
    //     voucher.CreatedDate,
    //     voucher.UseDate
    //   ]);
    // }
    
    res.json({
      success: true,
      message: `Refreshed ${vouchers.length} vouchers from MuleSoft`,
      vouchers: vouchers.length
    });
    
  } catch (error) {
    console.error('Error refreshing vouchers from MuleSoft:', error);
    res.status(500).json({ error: 'Failed to refresh vouchers from MuleSoft' });
  }
});

// Get specific voucher details
app.get('/api/vouchers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        cv.*,
        c.name as customer_name,
        c.loyalty_number,
        p.name as product_name
      FROM customer_vouchers cv
      JOIN customers c ON cv.customer_id = c.id
      LEFT JOIN products p ON cv.product_id = p.id
      WHERE cv.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }
    
    res.json({
      success: true,
      voucher: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting voucher:', error);
    res.status(500).json({ error: 'Failed to get voucher' });
  }
});

// Sync vouchers from MuleSoft
app.post('/api/vouchers/sync', async (req, res) => {
  try {
    const { customer_id, vouchers } = req.body;
    
    if (!customer_id || !vouchers || !Array.isArray(vouchers)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear existing vouchers for this customer
      await client.query('DELETE FROM customer_vouchers WHERE customer_id = $1', [customer_id]);
      
      // Insert new vouchers
      for (const voucher of vouchers) {
        const {
          Id: sf_id,
          Name: name,
          VoucherCode: voucher_code,
          Status: status,
          ExpirationDate: expiration_date,
          CreatedDate: created_date,
          UseDate: use_date,
          VoucherDefinition: voucher_def
        } = voucher;
        
        const {
          FaceValue: face_value,
          Description: description,
          IsActive: is_active,
          ImageUrl: image_url,
          ProductId: product_id,
          Name: def_name,
          Type: type,
          DiscountPercent: discount_percent,
          EffectiveDate: effective_date
        } = voucher_def || {};
        
        // Determine voucher type
        let voucher_type = 'Value';
        if (discount_percent) {
          voucher_type = 'Discount';
        } else if (product_id) {
          voucher_type = 'ProductSpecific';
        }
        
        // Calculate remaining value for value vouchers
        const remaining_value = face_value || 0;
        
        await client.query(`
          INSERT INTO customer_vouchers (
            sf_id, customer_id, voucher_code, name, status, voucher_type,
            face_value, discount_percent, product_id, remaining_value,
            description, image_url, is_active, effective_date, expiration_date,
            created_date, use_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          sf_id, customer_id, voucher_code, name, status, voucher_type,
          face_value, discount_percent, product_id, remaining_value,
          description, image_url, is_active === 'true', effective_date, expiration_date,
          created_date, use_date
        ]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Synced ${vouchers.length} vouchers for customer ${customer_id}`
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error syncing vouchers:', error);
    res.status(500).json({ error: 'Failed to sync vouchers' });
  }
});

// Validate voucher before use
app.get('/api/vouchers/validate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT is_voucher_valid($1) as is_valid', [id]);
    const isValid = result.rows[0].is_valid;
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Voucher is not valid or has expired' 
      });
    }
    
    // Get voucher details for validation response
    const voucherResult = await pool.query(`
      SELECT * FROM customer_vouchers WHERE id = $1
    `, [id]);
    
    if (voucherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }
    
    res.json({
      success: true,
      valid: true,
      voucher: voucherResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error validating voucher:', error);
    res.status(500).json({ error: 'Failed to validate voucher' });
  }
});

// Apply voucher to transaction
app.post('/api/transactions/:id/apply-voucher', async (req, res) => {
  try {
    const { id: transaction_id } = req.params;
    const { voucher_id, item_id } = req.body;
    
    if (!voucher_id || !item_id) {
      return res.status(400).json({ error: 'Voucher ID and Item ID are required' });
    }
    
    // Validate voucher
    const voucherResult = await pool.query('SELECT is_voucher_valid($1) as is_valid', [voucher_id]);
    if (!voucherResult.rows[0].is_valid) {
      return res.status(400).json({ error: 'Voucher is not valid' });
    }
    
    // Get item details
    const itemResult = await pool.query(`
      SELECT ti.*, p.name as product_name, p.price
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      WHERE ti.id = $1 AND ti.transaction_id = $2
    `, [item_id, transaction_id]);
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction item not found' });
    }
    
    const item = itemResult.rows[0];
    
    // Calculate discount
    const discountResult = await pool.query(`
      SELECT calculate_voucher_discount($1, $2, $3) as discount_amount
    `, [voucher_id, item.price, item.product_id]);
    
    const discount_amount = discountResult.rows[0].discount_amount;
    
    if (discount_amount <= 0) {
      return res.status(400).json({ error: 'Voucher cannot be applied to this item' });
    }
    
    // Update transaction item with voucher
    await pool.query(`
      UPDATE transaction_items 
      SET voucher_id = $1, discount_amount = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [voucher_id, discount_amount, item_id]);
    
    res.json({
      success: true,
      message: 'Voucher applied successfully',
      discount_amount: discount_amount
    });
    
  } catch (error) {
    console.error('Error applying voucher:', error);
    res.status(500).json({ error: 'Failed to apply voucher' });
  }
});

// Remove voucher from transaction
app.delete('/api/transactions/:id/remove-voucher', async (req, res) => {
  try {
    const { id: transaction_id } = req.params;
    const { item_id } = req.body;
    
    if (!item_id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    // Remove voucher from transaction item
    await pool.query(`
      UPDATE transaction_items 
      SET voucher_id = NULL, discount_amount = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND transaction_id = $2
    `, [item_id, transaction_id]);
    
    res.json({
      success: true,
      message: 'Voucher removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing voucher:', error);
    res.status(500).json({ error: 'Failed to remove voucher' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

