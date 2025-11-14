-- ============================================================================
-- MERGE DUPLICATE ROLES
-- ============================================================================
-- Problem: Database has duplicate roles (Admin/admin, Manager/manager)
-- Solution: Keep granular POS roles, update simple Loyalty roles to match
-- 
-- Strategy:
-- 1. Update "Admin" (ID 1) to have same granular permissions as "admin" (ID 5)
-- 2. Update "Manager" (ID 2) to have same granular permissions as "manager" (ID 6)
-- 3. Keep Employee, Customer, cashier, viewer as-is (they're unique)
-- 4. Delete duplicate lowercase roles (admin, manager)
-- ============================================================================

BEGIN;

-- Step 1: Update "Admin" (ID 1) to have granular permissions like "admin" (ID 5)
UPDATE roles 
SET 
  permissions = '{
    "all": true,
    "pos": {"read": true, "write": true, "delete": true},
    "users": {"read": true, "write": true, "delete": true},
    "reports": {"read": true, "write": true},
    "settings": {"read": true, "write": true, "delete": true},
    "customers": {"read": true, "write": true, "delete": true},
    "inventory": {"read": true, "write": true, "delete": true},
    "locations": {"read": true, "write": true, "delete": true},
    "transactions": {"read": true, "write": true, "delete": true}
  }'::jsonb,
  description = 'System Administrator with full access to all features',
  updated_at = NOW()
WHERE id = 1 AND name = 'Admin';

-- Step 2: Update "Manager" (ID 2) to have granular permissions like "manager" (ID 6)
UPDATE roles 
SET 
  permissions = '{
    "pos": {"read": true, "write": true},
    "users": {"read": true},
    "reports": {"read": true, "write": true},
    "settings": {"read": true},
    "customers": {"read": true, "write": true},
    "inventory": {"read": true, "write": true},
    "locations": {"read": true, "write": true},
    "transactions": {"read": true, "write": true}
  }'::jsonb,
  description = 'Store Manager with management access',
  updated_at = NOW()
WHERE id = 2 AND name = 'Manager';

-- Step 3: Update "Employee" (ID 3) to have more detailed permissions
UPDATE roles 
SET 
  permissions = '{
    "pos": {"read": true, "write": true},
    "customers": {"read": true, "write": true},
    "inventory": {"read": true},
    "transactions": {"read": true, "write": true}
  }'::jsonb,
  description = 'Store Employee with POS access',
  updated_at = NOW()
WHERE id = 3 AND name = 'Employee';

-- Step 4: Update "Customer" (ID 4) to have clearer permissions
UPDATE roles 
SET 
  permissions = '{
    "orders": {"read": true, "write": true},
    "profile": {"read": true, "write": true}
  }'::jsonb,
  description = 'Customer account with order history access',
  updated_at = NOW()
WHERE id = 4 AND name = 'Customer';

-- Step 5: Move any users from lowercase roles to capitalized roles
-- (Currently no users on lowercase roles, but good to have for safety)
UPDATE users SET role_id = 1 WHERE role_id = 5; -- admin -> Admin
UPDATE users SET role_id = 2 WHERE role_id = 6; -- manager -> Manager

-- Step 6: Delete duplicate lowercase roles
DELETE FROM roles WHERE id = 5 AND name = 'admin';
DELETE FROM roles WHERE id = 6 AND name = 'manager';

-- Step 7: Update remaining roles for consistency
UPDATE roles 
SET description = 'Cashier with basic POS and customer service access'
WHERE id = 7 AND name = 'cashier';

UPDATE roles 
SET description = 'Viewer with read-only access for reporting'
WHERE id = 8 AND name = 'viewer';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run these after the above transaction)
-- ============================================================================

-- Check all roles
SELECT id, name, description, 
       CASE 
         WHEN permissions->>'all' = 'true' THEN 'ADMIN (all: true)'
         ELSE jsonb_pretty(permissions)
       END as permissions_summary
FROM roles 
ORDER BY id;

-- Check all users and their roles
SELECT u.id, u.username, u.role_id, r.name as role_name
FROM users u 
JOIN roles r ON u.role_id = r.id
ORDER BY u.id;

-- Summary
SELECT 'Total Roles: ' || COUNT(*) as summary FROM roles;

