# Order Placement 500 Error - Troubleshooting Guide

## Problem
Users getting "Internal Server Error (500)" when trying to place orders through the checkout process.

## Root Causes Identified and Fixed

### 1. **Database Transaction Issues**
- **Problem**: Order creation involved multiple database operations without proper transaction handling
- **Fix**: Wrapped all database operations in a transaction with proper rollback on errors

### 2. **Missing Inventory Records**
- **Problem**: Products might not have corresponding inventory records, causing database errors
- **Fix**: Added logic to create default inventory records if they don't exist

### 3. **Role Validation Issues**
- **Problem**: Strict role checking that might fail for users without explicit roles
- **Fix**: Modified role validation to allow users without explicit roles or with USER role

### 4. **Missing Database Initialization**
- **Problem**: Required roles and warehouse records might not exist in the database
- **Fix**: Created initialization scripts to set up required data

## Files Modified

### Backend Changes
1. **`/server/src/controllers/orders.ts`**
   - Added proper database transaction handling
   - Improved error handling and logging
   - Added inventory record creation for missing products
   - Fixed role validation logic

2. **Database Initialization**
   - **`/server/init-roles.sql`**: SQL script to create default roles and warehouse
   - **`/server/setup-db.sh`**: Shell script to run database initialization

### Frontend Changes
3. **`/client/src/pages/Checkout.jsx`**
   - Optimized performance with useMemo for calculations
   - Improved error handling and display
   - Added form validation
   - Fixed navigation consistency

## Setup Instructions

### 1. Initialize Database
```bash
cd /home/tensorgo/inventory/server
./setup-db.sh
```

### 2. Verify Database Setup
Check that the following tables have data:
```sql
SELECT * FROM roles;
SELECT * FROM warehouses;
```

### 3. Test Order Placement
1. Add products to cart
2. Go to checkout
3. Fill in delivery information
4. Place order

## Common Issues and Solutions

### Issue 1: "Cart is empty" error
- **Cause**: No items in shopping cart or products are inactive
- **Solution**: Add active products to cart before checkout

### Issue 2: "Insufficient stock" error
- **Cause**: Not enough inventory for requested quantity
- **Solution**: Check inventory levels or reduce order quantity

### Issue 3: "Unauthorized" error
- **Cause**: User not logged in or invalid token
- **Solution**: Ensure user is logged in with valid authentication token

### Issue 4: "Validation failed" error
- **Cause**: Missing required fields (delivery_address, delivery_phone)
- **Solution**: Fill in all required checkout form fields

## Monitoring and Debugging

### Server Logs
Monitor server console for detailed error messages:
```bash
cd /home/tensorgo/inventory/server
npm run dev
```

### Database Queries
Check for failed transactions or constraint violations in PostgreSQL logs.

### Frontend Network Tab
Check browser developer tools Network tab for:
- Request payload
- Response status and error messages
- Authentication headers

## Prevention

1. **Regular Database Maintenance**
   - Ensure all products have inventory records
   - Monitor for orphaned cart items

2. **Error Monitoring**
   - Implement proper logging for all order operations
   - Set up alerts for 500 errors

3. **Testing**
   - Test order placement with different user roles
   - Test with various cart configurations
   - Test error scenarios (insufficient stock, etc.)