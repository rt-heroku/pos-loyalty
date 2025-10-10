# Security Features & Authentication System

## Overview
The POS system now includes a comprehensive authentication and authorization system with role-based access control, secure session management, and audit logging.

## 🔐 Authentication Features

### 1. User Authentication
- **Secure Login System**: Username/password authentication with encrypted password storage
- **Session Management**: JWT-style tokens with expiration (24 hours)
- **Account Lockout**: Automatic account locking after 5 failed login attempts
- **Password Security**: 
  - Passwords are hashed using SHA-256 (production should use bcrypt)
  - Password change functionality with current password verification
  - Password confirmation for changes

### 2. Default Admin Account
- **Username**: `admin`
- **Password**: `P@$$word1`
- **Role**: Full system administrator with all permissions

## 👥 User Roles & Permissions

### Role Hierarchy
1. **Admin** - Full system access
2. **Manager** - Store management with limited admin access
3. **Cashier** - Basic POS operations and customer service
4. **Viewer** - Read-only access for reporting and monitoring

### Permission Matrix

| Module | Action | Admin | Manager | Cashier | Viewer |
|--------|--------|-------|---------|---------|--------|
| POS | Read | ✅ | ✅ | ✅ | ✅ |
| POS | Write | ✅ | ✅ | ✅ | ❌ |
| POS | Delete | ✅ | ❌ | ❌ | ❌ |
| Inventory | Read | ✅ | ✅ | ✅ | ✅ |
| Inventory | Write | ✅ | ✅ | ❌ | ❌ |
| Inventory | Delete | ✅ | ❌ | ❌ | ❌ |
| Customers | Read | ✅ | ✅ | ✅ | ✅ |
| Customers | Write | ✅ | ✅ | ✅ | ❌ |
| Customers | Delete | ✅ | ❌ | ❌ | ❌ |
| Transactions | Read | ✅ | ✅ | ✅ | ✅ |
| Transactions | Write | ✅ | ✅ | ✅ | ❌ |
| Transactions | Delete | ✅ | ❌ | ❌ | ❌ |
| Reports | Read | ✅ | ✅ | ✅ | ✅ |
| Reports | Write | ✅ | ✅ | ❌ | ❌ |
| Settings | Read | ✅ | ✅ | ✅ | ✅ |
| Settings | Write | ✅ | ❌ | ❌ | ❌ |
| Settings | Delete | ✅ | ❌ | ❌ | ❌ |
| Users | Read | ✅ | ✅ | ✅ | ✅ |
| Users | Write | ✅ | ❌ | ❌ | ❌ |
| Users | Delete | ✅ | ❌ | ❌ | ❌ |
| Locations | Read | ✅ | ✅ | ✅ | ✅ |
| Locations | Write | ✅ | ✅ | ❌ | ❌ |
| Locations | Delete | ✅ | ❌ | ❌ | ❌ |

## 🛡️ Security Features

### 1. Session Security
- **Token-based Authentication**: Secure session tokens with expiration
- **Automatic Logout**: Sessions expire after 24 hours
- **Token Invalidation**: Proper logout invalidates session tokens
- **IP Tracking**: Session tokens include IP address for security monitoring

### 2. Access Control
- **Role-based Access Control (RBAC)**: Granular permissions per module and action
- **Permission Checking**: All API endpoints validate user permissions
- **UI Permission Filtering**: Navigation and features hidden based on user permissions
- **Settings Access Control**: Only admins can modify system settings

### 3. Audit Trail
- **User Activity Logging**: All user actions are logged with timestamps
- **Login/Logout Tracking**: Session events are recorded
- **Password Changes**: Password modifications are logged
- **User Management**: User creation, updates, and deletions are tracked
- **Transaction Audit**: All POS transactions include user attribution

### 4. Database Security
- **Password Hashing**: Passwords stored as SHA-256 hashes (upgrade to bcrypt in production)
- **SQL Injection Prevention**: Parameterized queries throughout
- **Foreign Key Constraints**: Data integrity maintained
- **Indexed Queries**: Performance optimization for security checks

## 🔧 Additional Security Recommendations

### 1. Production Enhancements
```sql
-- Upgrade to bcrypt for password hashing
-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update password hashing function
CREATE OR REPLACE FUNCTION hash_password(password TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql;

-- Update password verification function
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT) RETURNS BOOLEAN AS $$
BEGIN
    RETURN crypt(password, hash) = hash;
END;
$$ LANGUAGE plpgsql;
```

### 2. HTTPS Implementation
```javascript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}
```

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later'
});

app.use('/api/auth/login', loginLimiter);
```

### 4. Password Policy
```javascript
// Password validation function
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
}
```

### 5. Two-Factor Authentication (2FA)
```sql
-- Add 2FA support to users table
ALTER TABLE users 
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN two_factor_secret VARCHAR(32),
ADD COLUMN backup_codes TEXT[];
```

### 6. Account Recovery
```sql
-- Password reset functionality
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚨 Security Monitoring

### 1. Failed Login Monitoring
- Track failed login attempts per user
- Automatic account lockout after 5 failed attempts
- Admin notification of suspicious activity

### 2. Session Monitoring
- Track active sessions per user
- Monitor session duration and frequency
- Alert on unusual session patterns

### 3. Permission Violation Logging
- Log all permission check failures
- Track unauthorized access attempts
- Generate security reports

## 📊 Security Reports

### 1. User Activity Reports
```sql
-- Generate user activity summary
SELECT 
    u.username,
    u.first_name,
    u.last_name,
    COUNT(ual.id) as total_activities,
    MAX(ual.created_at) as last_activity,
    COUNT(CASE WHEN ual.activity_type = 'login' THEN 1 END) as login_count
FROM users u
LEFT JOIN user_activity_log ual ON u.id = ual.user_id
WHERE ual.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.username, u.first_name, u.last_name
ORDER BY total_activities DESC;
```

### 2. Security Audit Reports
```sql
-- Security events summary
SELECT 
    activity_type,
    COUNT(*) as event_count,
    DATE_TRUNC('day', created_at) as event_date
FROM user_activity_log
WHERE activity_type IN ('login', 'logout', 'password_change', 'user_created', 'user_updated')
    AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY activity_type, DATE_TRUNC('day', created_at)
ORDER BY event_date DESC, event_count DESC;
```

## 🔒 Compliance Features

### 1. Data Protection
- **Audit Trail**: Complete history of all data modifications
- **User Attribution**: All records include creator and modifier information
- **Data Retention**: Configurable retention policies for audit logs

### 2. Privacy Controls
- **User Consent**: Marketing consent tracking for customers
- **Data Minimization**: Only collect necessary user information
- **Access Logging**: Track who accessed what data and when

### 3. Regulatory Compliance
- **GDPR Ready**: User data export and deletion capabilities
- **PCI DSS**: Secure handling of payment information
- **SOX Compliance**: Audit trails for financial transactions

## 🛠️ Implementation Notes

### 1. Environment Variables
```env
# Security Configuration
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret
PASSWORD_SALT_ROUNDS=12
SESSION_TIMEOUT_HOURS=24
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_MINUTES=30
```

### 2. Database Migration
```bash
# Run the updated database schema
psql your_database < database.sql

# Verify authentication tables
\dt users
\dt roles
\dt user_sessions
\dt user_activity_log
```

### 3. Testing Security Features
```bash
# Test login with default admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"P@$$word1"}'

# Test protected endpoint
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎯 Next Steps

1. **Implement bcrypt** for production password hashing
2. **Add rate limiting** to prevent brute force attacks
3. **Enable HTTPS** for all production deployments
4. **Implement 2FA** for admin accounts
5. **Add security monitoring** and alerting
6. **Create security documentation** for end users
7. **Regular security audits** and penetration testing
8. **Backup and disaster recovery** procedures

This authentication system provides a solid foundation for a secure POS application while maintaining ease of use and scalability.
