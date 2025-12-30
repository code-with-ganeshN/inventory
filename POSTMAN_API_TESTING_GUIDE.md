# Postman API Testing Guide - Inventory Management System

## Base Configuration

**Base URL:** `http://localhost:5000/api`

### Environment Variables (Create in Postman)
- `baseUrl`: `http://localhost:5000/api`
- `token`: (will be set after login)
- `userId`: (will be set after login)
- `productId`: (will be set after creating product)
- `categoryId`: (will be set after creating category)
- `orderId`: (will be set after creating order)

## Authentication Setup

### 1. Headers for Authenticated Requests
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

## Testing Flow (Step by Step)

### STEP 1: Authentication

#### 1.1 Register User (Optional)
```
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "password123",
  "first_name": "Test",
  "last_name": "User",
  "phone": "1234567890",
  "address": "123 Test Street"
}
```

#### 1.2 Login (Get Token)
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@inventory.local",
  "password": "admin@123456"
}
```

**Response:** Save the `token` to environment variable
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@inventory.local",
    "role": "SUPER_ADMIN"
  }
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
    pm.environment.set("userId", response.user.id);
}
```

#### 1.3 Get Current User
```
GET {{baseUrl}}/auth/me
Authorization: Bearer {{token}}
```

#### 1.4 Update Profile
```
PUT {{baseUrl}}/auth/profile
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "first_name": "Updated",
  "last_name": "Name",
  "phone": "9876543210"
}
```

#### 1.5 Change Password
```
POST {{baseUrl}}/auth/change-password
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "old_password": "admin@123456",
  "new_password": "newpassword123"
}
```

### STEP 2: Category Management

#### 2.1 Create Category
```
POST {{baseUrl}}/categories
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "display_order": 1
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("categoryId", response.category.id);
}
```

#### 2.2 Get All Categories
```
GET {{baseUrl}}/categories
```

#### 2.3 Get Category by ID
```
GET {{baseUrl}}/categories/{{categoryId}}
```

#### 2.4 Update Category
```
PUT {{baseUrl}}/categories/{{categoryId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Updated Electronics",
  "description": "Updated description"
}
```

#### 2.5 Delete Category
```
DELETE {{baseUrl}}/categories/{{categoryId}}
Authorization: Bearer {{token}}
```

### STEP 3: Product Management

#### 3.1 Create Product
```
POST {{baseUrl}}/products
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "iPhone 15",
  "sku": "IPH15-001",
  "description": "Latest iPhone model",
  "price": 999.99,
  "category_id": {{categoryId}},
  "image_url": "https://example.com/iphone15.jpg"
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("productId", response.product.id);
}
```

#### 3.2 Get All Products
```
GET {{baseUrl}}/products
```

**With Query Parameters:**
```
GET {{baseUrl}}/products?category_id={{categoryId}}&active=true&limit=10&offset=0
```

#### 3.3 Get Product by ID
```
GET {{baseUrl}}/products/{{productId}}
```

#### 3.4 Update Product
```
PUT {{baseUrl}}/products/{{productId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "price": 1199.99,
  "description": "Updated description"
}
```

#### 3.5 Deactivate Product
```
POST {{baseUrl}}/products/{{productId}}/deactivate
Authorization: Bearer {{token}}
```

#### 3.6 Activate Product
```
POST {{baseUrl}}/products/{{productId}}/activate
Authorization: Bearer {{token}}
```

#### 3.7 Search Products
```
GET {{baseUrl}}/products/search?query=iPhone&category_id={{categoryId}}&limit=10
```

### STEP 4: Supplier Management

#### 4.1 Create Supplier
```
POST {{baseUrl}}/suppliers
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Apple Inc.",
  "contact_person": "John Doe",
  "email": "contact@apple.com",
  "phone": "1-800-APL-CARE",
  "address": "1 Apple Park Way, Cupertino, CA"
}
```

#### 4.2 Get All Suppliers
```
GET {{baseUrl}}/suppliers
Authorization: Bearer {{token}}
```

#### 4.3 Get Supplier by ID
```
GET {{baseUrl}}/suppliers/1
Authorization: Bearer {{token}}
```

#### 4.4 Update Supplier
```
PUT {{baseUrl}}/suppliers/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Apple Inc. Updated",
  "contact_person": "Jane Smith"
}
```

#### 4.5 Link Product to Supplier
```
POST {{baseUrl}}/suppliers/1/products/{{productId}}/link
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "supplier_sku": "APL-IPH15-001",
  "lead_time_days": 7,
  "min_order_quantity": 10,
  "unit_price": 800.00
}
```

### STEP 5: Inventory Management

#### 5.1 Get Inventory by Product
```
GET {{baseUrl}}/inventory/product/{{productId}}
Authorization: Bearer {{token}}
```

#### 5.2 Get Inventory by Warehouse
```
GET {{baseUrl}}/inventory/warehouse/1
Authorization: Bearer {{token}}
```

#### 5.3 Add Stock
```
POST {{baseUrl}}/inventory/product/{{productId}}/add-stock
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "warehouse_id": 1,
  "quantity": 100,
  "notes": "Initial stock"
}
```

#### 5.4 Adjust Stock
```
POST {{baseUrl}}/inventory/product/{{productId}}/adjust-stock
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "warehouse_id": 1,
  "quantity": -5,
  "reason": "DAMAGED",
  "notes": "Damaged during transport"
}
```

#### 5.5 Set Low Stock Threshold
```
POST {{baseUrl}}/inventory/product/{{productId}}/set-threshold
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "warehouse_id": 1,
  "low_stock_threshold": 10,
  "reorder_quantity": 50
}
```

### STEP 6: Shopping Cart

#### 6.1 Add to Cart
```
POST {{baseUrl}}/cart/add
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "product_id": {{productId}},
  "quantity": 2
}
```

#### 6.2 Get Cart
```
GET {{baseUrl}}/cart
Authorization: Bearer {{token}}
```

#### 6.3 Update Cart Item
```
PUT {{baseUrl}}/cart/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "quantity": 3
}
```

#### 6.4 Remove from Cart
```
DELETE {{baseUrl}}/cart/1
Authorization: Bearer {{token}}
```

#### 6.5 Clear Cart
```
POST {{baseUrl}}/cart/clear
Authorization: Bearer {{token}}
```

### STEP 7: Order Management

#### 7.1 Create Order
```
POST {{baseUrl}}/orders
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "delivery_address": "123 Main St, City, State 12345",
  "delivery_phone": "555-0123",
  "notes": "Please deliver during business hours"
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("orderId", response.order.id);
}
```

#### 7.2 Get All Orders (Admin)
```
GET {{baseUrl}}/orders
Authorization: Bearer {{token}}
```

#### 7.3 Get User Orders
```
GET {{baseUrl}}/my-orders
Authorization: Bearer {{token}}
```

#### 7.4 Get Order by ID
```
GET {{baseUrl}}/orders/{{orderId}}
Authorization: Bearer {{token}}
```

#### 7.5 Update Order Status (Admin)
```
POST {{baseUrl}}/orders/{{orderId}}/status
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

#### 7.6 Cancel Order
```
POST {{baseUrl}}/orders/{{orderId}}/cancel
Authorization: Bearer {{token}}
```

### STEP 8: User Management (Super Admin Only)

#### 8.1 Get All Users
```
GET {{baseUrl}}/admin/users
Authorization: Bearer {{token}}
```

#### 8.2 Create Admin Account
```
POST {{baseUrl}}/admin/users/admin-account
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "email": "newadmin@example.com",
  "password": "password123",
  "first_name": "New",
  "last_name": "Admin",
  "phone": "555-0199"
}
```

#### 8.3 Update User
```
PUT {{baseUrl}}/admin/users/2
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "first_name": "Updated",
  "last_name": "User",
  "is_active": true
}
```

#### 8.4 Deactivate User
```
POST {{baseUrl}}/admin/users/2/deactivate
Authorization: Bearer {{token}}
```

#### 8.5 Activate User
```
POST {{baseUrl}}/admin/users/2/activate
Authorization: Bearer {{token}}
```

### STEP 9: Role & Permission Management

#### 9.1 Get All Roles
```
GET {{baseUrl}}/admin/roles
Authorization: Bearer {{token}}
```

#### 9.2 Create Role
```
POST {{baseUrl}}/admin/roles
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "MANAGER",
  "description": "Manager role with limited admin access"
}
```

#### 9.3 Get All Permissions
```
GET {{baseUrl}}/admin/permissions
Authorization: Bearer {{token}}
```

#### 9.4 Create Permission
```
POST {{baseUrl}}/admin/permissions
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "view_reports",
  "description": "View system reports",
  "module": "reports"
}
```

### STEP 10: System Configuration

#### 10.1 Get System Config
```
GET {{baseUrl}}/admin/config
```

#### 10.2 Update System Config
```
PUT {{baseUrl}}/admin/config
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "site_name": "My Inventory System",
  "maintenance_mode": false,
  "max_cart_items": 50
}
```

### STEP 11: Audit Logs

#### 11.1 Get Audit Logs
```
GET {{baseUrl}}/admin/audit-logs
Authorization: Bearer {{token}}
```

#### 11.2 Get User Audit Logs
```
GET {{baseUrl}}/admin/audit-logs/user/{{userId}}
Authorization: Bearer {{token}}
```

#### 11.3 Get Audit Stats
```
GET {{baseUrl}}/admin/audit-stats
Authorization: Bearer {{token}}
```

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "price",
      "message": "Price must be a positive number"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized - No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden - Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Product not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Testing Tips

1. **Create Environment**: Set up a Postman environment with the base URL and token variables
2. **Use Test Scripts**: Add test scripts to automatically save IDs and tokens
3. **Test in Order**: Follow the step-by-step flow to ensure dependencies are met
4. **Check Status Codes**: Verify expected status codes (200, 201, 400, 401, 403, 404, 500)
5. **Validate Responses**: Check response structure and required fields
6. **Test Edge Cases**: Try invalid data, missing fields, and unauthorized access
7. **Clean Up**: Delete test data after testing to avoid conflicts

## Postman Collection Structure

```
Inventory API Tests/
├── Authentication/
│   ├── Register
│   ├── Login
│   ├── Get Current User
│   ├── Update Profile
│   └── Change Password
├── Categories/
│   ├── Create Category
│   ├── Get All Categories
│   ├── Get Category by ID
│   ├── Update Category
│   └── Delete Category
├── Products/
│   ├── Create Product
│   ├── Get All Products
│   ├── Get Product by ID
│   ├── Update Product
│   ├── Deactivate Product
│   ├── Activate Product
│   └── Search Products
├── Suppliers/
├── Inventory/
├── Cart/
├── Orders/
├── User Management/
├── Roles & Permissions/
├── System Config/
└── Audit Logs/
```