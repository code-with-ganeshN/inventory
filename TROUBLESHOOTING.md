# Troubleshooting Guide

## Common Issues and Solutions

### Database Connection Issues

#### Problem: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Causes:**
- PostgreSQL service not running
- Wrong host/port in DATABASE_URL
- Database not created

**Solutions:**
```bash
# Windows - Start PostgreSQL service
net start postgresql-x64-15

# Verify PostgreSQL is running
psql --version

# Check if database exists
psql -U postgres -l

# Create database if missing
createdb -U postgres inventory

# Test connection
psql -U postgres -d inventory -c "SELECT 1;"
```

#### Problem: `Error: password authentication failed`

**Causes:**
- Wrong username or password in DATABASE_URL
- PostgreSQL user doesn't exist

**Solutions:**
```bash
# Reset PostgreSQL password
psql -U postgres
# ALTER USER postgres WITH PASSWORD 'newpassword';

# Update DATABASE_URL with correct credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/inventory
```

#### Problem: `Error: database "inventory" does not exist`

**Solutions:**
```bash
# Create the database
createdb -U postgres inventory

# Verify creation
psql -U postgres -l | grep inventory

# Run migrations
psql -d inventory -f server/src/migrations/001_init.sql
```

---

### Server Startup Issues

#### Problem: `Error: Cannot find module 'dotenv'`

**Causes:**
- Dependencies not installed
- node_modules corrupted

**Solutions:**
```bash
cd server
rm -r node_modules pnpm-lock.yaml
pnpm install
pnpm run dev
```

#### Problem: `Error: JWT_SECRET is required`

**Causes:**
- .env file not created
- JWT_SECRET not set

**Solutions:**
```bash
# Create .env file in server directory
cat > server/.env << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/inventory
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=development
PORT=5000
EOF

# Verify variables
cat server/.env
```

#### Problem: `Port 5000 already in use`

**Solutions:**
```bash
# Windows - Find process using port
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use different port
PORT=5001 pnpm run dev
```

#### Problem: TypeScript compilation errors

**Solutions:**
```bash
# Clear cache and reinstall
cd server
rm -r dist
pnpm run build

# Check for TypeScript errors
pnpm run build --verbose

# Check tsconfig.json
cat tsconfig.json
```

---

### Frontend Issues

#### Problem: `Vite port 5173 already in use`

**Solutions:**
```bash
# Windows - Find process using port
netstat -ano | findstr :5173

# Kill process
taskkill /PID <PID> /F

# Or allow Vite to auto-select port
pnpm run dev
```

#### Problem: `Cannot find module 'react-redux'`

**Solutions:**
```bash
cd client
pnpm install react-redux
pnpm install @reduxjs/toolkit
```

#### Problem: `VITE_API_URL is undefined`

**Causes:**
- .env file not created in client directory
- Variables not prefixed with VITE_

**Solutions:**
```bash
# Create client/.env
cat > client/.env << EOF
VITE_API_URL=http://localhost:5000/api
EOF

# Verify in vite.config.js that it references .env
cat client/vite.config.js
```

#### Problem: CORS errors when calling API

**Causes:**
- API_URL points to wrong host/port
- CORS not configured on backend
- API not running

**Solutions:**
```bash
# Check backend .env
cat server/.env | grep CORS

# Verify backend is running
curl http://localhost:5000/api/health

# Check CORS configuration in app.ts
grep -n "cors" server/src/app.ts

# Update client API URL
echo "VITE_API_URL=http://localhost:5000/api" > client/.env
```

---

### Authentication Issues

#### Problem: Login returns `400 Bad Request`

**Causes:**
- Invalid email/password format
- Request body missing
- Content-Type header missing

**Solutions:**
```bash
# Test with proper format
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Check request validation schema
grep -A 10 "loginSchema" server/src/controllers/auth.ts
```

#### Problem: Login returns `401 Unauthorized`

**Causes:**
- Wrong credentials
- User doesn't exist
- User account deactivated

**Solutions:**
```bash
# Verify user exists in database
psql -d inventory -c "SELECT * FROM users WHERE email='test@example.com';"

# Check user status
psql -d inventory -c "SELECT email, status FROM users WHERE email='test@example.com';"

# Create test user
psql -d inventory << EOF
INSERT INTO users (email, password_hash, first_name, last_name, status, role_id)
VALUES ('test@example.com', '\$2b\$10\$...' , 'Test', 'User', 'ACTIVE', 1);
EOF
```

#### Problem: Token validation fails with `401 Unauthorized`

**Causes:**
- Token expired
- Token signature invalid
- JWT_SECRET mismatch
- Token not sent in Authorization header

**Solutions:**
```bash
# Verify JWT_SECRET is same in server
grep "JWT_SECRET" server/.env

# Check token format
# Should be: Authorization: Bearer <token>

# Test with proper header
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Decode token to check expiry
node -e "console.log(require('jsonwebtoken').decode('TOKEN_HERE'))"
```

#### Problem: Permission denied errors despite being logged in

**Causes:**
- Wrong role assigned
- Permission not assigned to role
- Route requires specific role

**Solutions:**
```bash
# Check user's role
psql -d inventory -c "SELECT u.email, r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email='test@example.com';"

# Check role permissions
psql -d inventory -c "SELECT p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id=1;"

# Check route requirements
grep -B 5 "roleMiddleware" server/src/routes/index.ts | grep "router\."
```

---

### API Response Issues

#### Problem: API returns `500 Internal Server Error`

**Causes:**
- Database query failed
- Unhandled exception
- Missing required data

**Solutions:**
```bash
# Check server logs
# Look for error messages in terminal output

# Test database connectivity
psql -d inventory -c "SELECT 1;"

# Check specific query
psql -d inventory << EOF
SELECT * FROM products LIMIT 1;
EOF

# Enable verbose logging
DEBUG=* pnpm run dev
```

#### Problem: API returns `400 Bad Request`

**Causes:**
- Invalid request data
- Validation failed
- Missing required fields

**Solutions:**
```bash
# Test with valid data
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Product Name",
    "sku": "UNIQUE-SKU",
    "price": 99.99,
    "category_id": 1,
    "description": "Description"
  }'

# Check validation schema
grep -A 20 "productSchema" server/src/controllers/products.ts
```

#### Problem: API returns empty array when should return data

**Causes:**
- Data not created yet
- Filters are too restrictive
- User role restriction
- Database query error

**Solutions:**
```bash
# Verify data exists
psql -d inventory -c "SELECT COUNT(*) FROM products;"

# Check for deleted/inactive items
psql -d inventory -c "SELECT * FROM products WHERE status='ACTIVE';"

# Test without filters
curl -X GET "http://localhost:5000/api/products?limit=1000" \
  -H "Authorization: Bearer TOKEN"

# Check user permissions
psql -d inventory -c "SELECT role FROM users WHERE id=YOUR_USER_ID;"
```

---

### Frontend Component Issues

#### Problem: Redux store is empty

**Causes:**
- Component not dispatching action
- Reducer not configured
- Store not initialized

**Solutions:**
```bash
# Check store configuration
cat client/src/store/index.js

# Verify slice is exported
grep "export" client/src/store/*Slice.js

# Check component dispatch call
grep -n "useDispatch\|dispatch" client/src/pages/*.jsx
```

#### Problem: API call not happening from component

**Causes:**
- API endpoint wrong
- Axios client not configured
- Missing error handling

**Solutions:**
```bash
# Check API endpoint
grep "VITE_API_URL" client/src/api/client.js

# Test endpoint manually
curl http://localhost:5000/api/products

# Check component effect
grep -A 5 "useEffect" client/src/pages/*.jsx

# Verify API function exists
grep "getAllProducts\|getProducts" client/src/api/endpoints.js
```

#### Problem: Styling not applied (Tailwind classes not working)

**Causes:**
- Tailwind not configured
- CSS not imported
- Build not running

**Solutions:**
```bash
# Verify Tailwind config exists
ls -la client/tailwind.config.js

# Check CSS import in main file
grep "import.*css" client/src/main.jsx

# Rebuild frontend
cd client
pnpm run build

# Clear cache
rm -r client/dist
pnpm run build
```

---

### Database Issues

#### Problem: Migration failed

**Causes:**
- Syntax error in SQL
- Foreign key constraint violation
- Table already exists

**Solutions:**
```bash
# Check migration file for syntax
cat server/src/migrations/001_init.sql | head -50

# Validate SQL syntax
psql -d inventory << 'EOF'
-- Test your SQL here
EOF

# If table exists, drop it first (DEV ONLY!)
psql -d inventory -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migration
psql -d inventory -f server/src/migrations/001_init.sql
```

#### Problem: Constraint violations when inserting data

**Causes:**
- Foreign key doesn't exist
- Unique constraint violation
- Data type mismatch

**Solutions:**
```bash
# Check constraints
psql -d inventory -c "\d products"

# Verify foreign key exists
psql -d inventory -c "SELECT * FROM categories WHERE id=1;"

# Check for duplicate
psql -d inventory -c "SELECT * FROM products WHERE sku='SKU-VALUE';"

# Test insert with all required fields
psql -d inventory << EOF
INSERT INTO products (name, sku, price, category_id, description, status)
VALUES ('Test', 'TEST-001', 99.99, 1, 'Test product', 'ACTIVE');
EOF
```

#### Problem: Slow queries

**Causes:**
- Missing indexes
- Full table scan
- Inefficient joins

**Solutions:**
```bash
# Check if indexes exist
psql -d inventory -c "\d+ products"

# Check slow query log
psql -d inventory << EOF
SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
EOF

# Add missing index
psql -d inventory -c "CREATE INDEX idx_products_category ON products(category_id);"

# Analyze query plan
psql -d inventory -c "EXPLAIN ANALYZE SELECT * FROM products WHERE category_id=1;"
```

---

### Performance Issues

#### Problem: API response is slow (> 1 second)

**Causes:**
- Database query slow
- Too many joins
- N+1 query problem
- No pagination

**Solutions:**
```bash
# Add pagination
curl "http://localhost:5000/api/products?limit=10&offset=0"

# Check query performance
EXPLAIN ANALYZE SELECT * FROM products JOIN categories ON ...

# Add indexes
psql -d inventory -c "CREATE INDEX idx_products_status ON products(status);"

# Optimize query
# Move complex filters to WHERE clause instead of application logic
```

#### Problem: Memory usage increasing continuously

**Causes:**
- Memory leak in code
- Unclosed database connections
- Large objects not garbage collected

**Solutions:**
```bash
# Monitor memory
node --max-old-space-size=4096 dist/server.js

# Check for unclosed connections
grep -n "pool\|connection" server/src/controllers/*.ts

# Enable garbage collection logging
node --trace-gc dist/server.js | head -100

# Check for event listeners
grep -n "\.on\(" server/src/**/*.ts | grep -v "request\|response"
```

---

### Common Error Messages

#### `TypeError: Cannot read property 'id' of undefined`

**Solution:**
```
Check that the object exists before accessing properties.
Verify data is being fetched correctly.
Add null checks in components.
```

#### `SyntaxError: Unexpected token < in JSON at position 0`

**Solution:**
```
API is returning HTML instead of JSON.
Check if backend is returning error page.
Verify API endpoint is correct.
Check for server errors.
```

#### `Error: ENOMEM: Cannot allocate memory`

**Solution:**
```
Increase available memory or free up resources.
Close unnecessary processes.
Increase Node.js max memory: node --max-old-space-size=4096
```

#### `Error: ENOENT: no such file or directory`

**Solution:**
```
Verify file path is correct.
Check file exists: ls -la <file>
Verify relative vs absolute paths.
```

---

### Debugging Techniques

#### Enable Verbose Logging
```bash
# Server
DEBUG=inventory:* pnpm run dev

# Frontend (in browser console)
localStorage.debug = 'axios,*'
```

#### Check Logs
```bash
# Server logs
tail -f server.log

# Database logs (PostgreSQL)
sudo tail -f /var/log/postgresql/postgresql.log

# Browser console
Press F12 → Console tab
```

#### Network Debugging
```bash
# Monitor requests
curl -v http://localhost:5000/api/products

# Check headers
curl -i http://localhost:5000/api/products

# Full request/response
curl -vv http://localhost:5000/api/products
```

#### Database Debugging
```bash
# Connect to database
psql -d inventory

# List tables
\dt

# Describe table
\d products

# Run query
SELECT * FROM products LIMIT 5;

# Check recent changes
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

---

### Getting Help

1. **Check Logs First**
   - Server terminal output
   - Browser console (F12)
   - PostgreSQL logs

2. **Verify Configuration**
   - Check .env files
   - Verify DATABASE_URL
   - Check VITE_API_URL

3. **Test Connectivity**
   - Database: `psql -d inventory -c "SELECT 1;"`
   - Server: `curl http://localhost:5000/api/health`
   - API: Test endpoint with curl

4. **Check Documentation**
   - README_IMPLEMENTATION.md
   - QUICK_START.md
   - API_DOCUMENTATION.md

5. **Search Issues**
   - GitHub issues for dependencies
   - Stack Overflow
   - Official documentation

---

## Emergency Recovery

### If Database is Corrupted

```bash
# Backup current database
pg_dump inventory > backup_corrupted.sql

# Drop corrupted database
dropdb inventory

# Create fresh database
createdb inventory

# Run migrations
psql -d inventory -f server/src/migrations/001_init.sql

# Restore data from backup (if available)
# Restore specific tables only
psql -d inventory < backup_corrupted.sql
```

### If Server Won't Start

```bash
# 1. Check if port is available
netstat -ano | findstr :5000

# 2. Kill any process using port
taskkill /PID <PID> /F

# 3. Clear dependencies
rm -r server/node_modules
rm server/pnpm-lock.yaml

# 4. Reinstall
cd server
pnpm install

# 5. Check .env
cat server/.env

# 6. Start server
pnpm run dev
```

### If Forgotten Admin Password

```bash
# Reset via database
psql -d inventory << EOF
-- Generate new password hash
-- This is bcrypt hash of 'newpassword123'
UPDATE users SET password_hash = '\$2b\$10\$...' WHERE email='admin@example.com';
EOF

# Or create new admin user
psql -d inventory << EOF
INSERT INTO users (email, password_hash, first_name, last_name, status, role_id)
VALUES ('admin2@example.com', '\$2b\$10\$...' , 'Admin', 'Two', 'ACTIVE', 1);
EOF

# Then generate hash in Node
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('password', 10))"
```

---

For more detailed help, refer to the main documentation files or check the implementation code directly.
