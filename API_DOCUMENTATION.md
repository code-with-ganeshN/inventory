# API Documentation - Inventory Management System

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "1234567890",
  "address": "123 Main St"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": { ... }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": { ... }
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "USER",
  ...
}
```

### Update Profile
```
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "1234567890",
  "address": "123 Main St"
}

Response: 200 OK
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

### Change Password
```
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "old_password": "oldpassword123",
  "new_password": "newpassword123"
}

Response: 200 OK
{
  "message": "Password changed successfully"
}
```

### Refresh Token
```
POST /auth/refresh
Authorization: Bearer <token>

Response: 200 OK
{
  "token": "new_jwt_token"
}
```

---

## Product Endpoints

### Get All Products
```
GET /products?limit=20&offset=0&category_id=1&active=true

Query Parameters:
- limit: number (default: 20)
- offset: number (default: 0)
- category_id: number
- active: boolean

Response: 200 OK
[
  {
    "id": 1,
    "name": "Product Name",
    "sku": "SKU-001",
    "price": 99.99,
    "category_id": 1,
    "is_active": true,
    ...
  }
]
```

### Get Product by ID
```
GET /products/:id

Response: 200 OK
{
  "id": 1,
  "name": "Product Name",
  "sku": "SKU-001",
  ...
}
```

### Search Products
```
GET /products/search?query=laptop&category_id=1&limit=20&offset=0

Response: 200 OK
[ { ... } ]
```

### Create Product (Admin)
```
POST /products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Product Name",
  "sku": "SKU-001",
  "description": "Product description",
  "price": 99.99,
  "category_id": 1,
  "image_url": "https://..."
}

Response: 201 Created
{
  "message": "Product created successfully",
  "product": { ... }
}
```

### Update Product (Admin)
```
PUT /products/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 89.99
}

Response: 200 OK
{
  "message": "Product updated successfully",
  "product": { ... }
}
```

### Deactivate Product (Admin)
```
POST /products/:id/deactivate
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "message": "Product deactivated successfully",
  "product": { ... }
}
```

### Activate Product (Admin)
```
POST /products/:id/activate
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "message": "Product activated successfully",
  "product": { ... }
}
```

---

## Category Endpoints

### Get All Categories
```
GET /categories?active=true&parent_id=null

Response: 200 OK
[ { ... } ]
```

### Get Category by ID
```
GET /categories/:id

Response: 200 OK
{
  "id": 1,
  "name": "Electronics",
  "parent_id": null,
  "childCategories": [ ... ]
}
```

### Create Category (Admin)
```
POST /categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic products",
  "parent_id": null
}

Response: 201 Created
{ ... }
```

### Update Category (Admin)
```
PUT /categories/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Electronics",
  "display_order": 1
}

Response: 200 OK
{ ... }
```

### Delete Category (Admin)
```
DELETE /categories/:id
Authorization: Bearer <admin_token>

Response: 200 OK
{ "message": "Category deleted successfully" }
```

### Reorder Categories (Admin)
```
POST /categories/reorder
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "categories": [
    { "id": 1, "display_order": 1 },
    { "id": 2, "display_order": 2 }
  ]
}

Response: 200 OK
{ "message": "Categories reordered successfully" }
```

---

## Inventory Endpoints

### Get Inventory by Product
```
GET /inventory/product/:productId
Authorization: Bearer <admin_token>

Response: 200 OK
[
  {
    "id": 1,
    "product_id": 1,
    "warehouse_id": 1,
    "quantity_on_hand": 100,
    "low_stock_threshold": 10
  }
]
```

### Get Inventory by Warehouse
```
GET /inventory/warehouse/:warehouseId?low_stock=false&limit=50&offset=0
Authorization: Bearer <admin_token>

Response: 200 OK
[ { ... } ]
```

### Add Stock (Admin)
```
POST /inventory/product/:productId/add-stock
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "warehouse_id": 1,
  "quantity": 50,
  "notes": "New stock arrival"
}

Response: 200 OK
{ "message": "Stock added successfully" }
```

### Adjust Stock (Admin)
```
POST /inventory/product/:productId/adjust-stock
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "warehouse_id": 1,
  "quantity": -5,
  "notes": "Inventory correction"
}

Response: 200 OK
{
  "message": "Stock adjusted successfully",
  "oldQuantity": 100,
  "newQuantity": 95
}
```

### Set Low Stock Threshold (Admin)
```
POST /inventory/product/:productId/set-threshold
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "warehouse_id": 1,
  "threshold": 20
}

Response: 200 OK
{ "message": "Low stock threshold updated successfully" }
```

### Get Inventory Movements
```
GET /inventory/product/:productId/movements?limit=50&offset=0
Authorization: Bearer <admin_token>

Response: 200 OK
[
  {
    "id": 1,
    "movement_type": "RECEIVED",
    "quantity": 100,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Get Low Stock Products
```
GET /inventory/warehouse/:warehouseId/low-stock?limit=50&offset=0
Authorization: Bearer <admin_token>

Response: 200 OK
[ { ... } ]
```

### Get Inventory Statistics
```
GET /inventory/stats
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "total_products": 100,
  "total_quantity": 5000,
  "low_stock_count": 15,
  "out_of_stock_count": 3
}
```

---

## Order Endpoints

### Get All Orders (Admin)
```
GET /orders?status=PENDING&user_id=1&limit=20&offset=0
Authorization: Bearer <admin_token>

Response: 200 OK
[ { ... } ]
```

### Get Order by ID
```
GET /orders/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "order_number": "ORD-123456",
  "status": "PENDING",
  "total": 199.98,
  "items": [ { ... } ]
}
```

### Create Order (User)
```
POST /orders
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "delivery_address": "123 Main St",
  "delivery_phone": "1234567890",
  "notes": "Please ring doorbell"
}

Response: 201 Created
{
  "message": "Order created successfully",
  "order": { ... }
}
```

### Get My Orders (User)
```
GET /my-orders?limit=20&offset=0
Authorization: Bearer <user_token>

Response: 200 OK
[ { ... } ]
```

### Update Order Status (Admin)
```
POST /orders/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "SHIPPED"
}

Response: 200 OK
{
  "message": "Order status updated successfully",
  "order": { ... }
}
```

### Cancel Order (User/Admin)
```
POST /orders/:id/cancel
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Order cancelled successfully",
  "order": { ... }
}
```

### Get Order Statistics (Admin)
```
GET /orders/stats
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "total_orders": 150,
  "delivered_orders": 120,
  "pending_orders": 30,
  "total_revenue": 15000,
  "average_order_value": 100
}
```

---

## Shopping Cart Endpoints

### Get Cart
```
GET /cart
Authorization: Bearer <user_token>

Response: 200 OK
{
  "items": [ { ... } ],
  "subtotal": 199.98,
  "tax": 20,
  "total": 219.98,
  "itemCount": 2
}
```

### Add to Cart
```
POST /cart/add
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2,
  "saved_for_later": false
}

Response: 200 OK
{
  "message": "Item added to cart successfully",
  "cartItem": { ... }
}
```

### Update Cart Item
```
PUT /cart/:cartItemId
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "quantity": 3
}

Response: 200 OK
{
  "message": "Cart item updated successfully",
  "cartItem": { ... }
}
```

### Remove from Cart
```
DELETE /cart/:cartItemId
Authorization: Bearer <user_token>

Response: 200 OK
{ "message": "Item removed from cart successfully" }
```

### Clear Cart
```
POST /cart/clear
Authorization: Bearer <user_token>

Response: 200 OK
{ "message": "Cart cleared successfully" }
```

### Get Saved Items
```
GET /cart/saved
Authorization: Bearer <user_token>

Response: 200 OK
[ { ... } ]
```

### Save for Later
```
POST /cart/:cartItemId/save
Authorization: Bearer <user_token>

Response: 200 OK
{ "message": "Item saved for later successfully" }
```

### Move to Cart
```
POST /cart/:cartItemId/move
Authorization: Bearer <user_token>

Response: 200 OK
{ "message": "Item moved to cart successfully" }
```

---

## Admin User Management Endpoints

### Get All Users (Super Admin)
```
GET /admin/users?role=ADMIN&status=active&limit=50&offset=0
Authorization: Bearer <super_admin_token>

Response: 200 OK
[ { ... } ]
```

### Create Admin Account (Super Admin)
```
POST /admin/users/admin-account
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "email": "admin@example.com",
  "first_name": "Admin",
  "last_name": "User",
  "phone": "1234567890"
}

Response: 201 Created
{
  "message": "Admin account created successfully",
  "user": { ... },
  "password": "GeneratedPassword123!"
}
```

### Update User (Super Admin)
```
PUT /admin/users/:id
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "first_name": "Updated",
  "last_name": "Name"
}

Response: 200 OK
{ ... }
```

### Deactivate User (Super Admin)
```
POST /admin/users/:id/deactivate
Authorization: Bearer <super_admin_token>

Response: 200 OK
{ ... }
```

### Activate User (Super Admin)
```
POST /admin/users/:id/activate
Authorization: Bearer <super_admin_token>

Response: 200 OK
{ ... }
```

### Lock User Account (Super Admin)
```
POST /admin/users/:id/lock
Authorization: Bearer <super_admin_token>

Response: 200 OK
{ ... }
```

### Reset User Password (Super Admin)
```
POST /admin/users/:id/reset-password
Authorization: Bearer <super_admin_token>

Response: 200 OK
{
  "message": "Password reset successfully",
  "newPassword": "NewPassword123!",
  "user": { ... }
}
```

### Get User Login History (Super Admin)
```
GET /admin/users/:id/login-history?limit=50&offset=0
Authorization: Bearer <super_admin_token>

Response: 200 OK
[
  {
    "id": 1,
    "login_time": "2024-01-01T10:00:00Z",
    "logout_time": "2024-01-01T11:00:00Z",
    "ip_address": "192.168.1.1"
  }
]
```

---

## Role Management Endpoints

### Get All Roles (Super Admin)
```
GET /admin/roles
Authorization: Bearer <super_admin_token>

Response: 200 OK
[
  {
    "id": 1,
    "name": "SUPER_ADMIN",
    "description": "..."
  }
]
```

### Get Role with Permissions (Super Admin)
```
GET /admin/roles/:id
Authorization: Bearer <super_admin_token>

Response: 200 OK
{
  "id": 1,
  "name": "SUPER_ADMIN",
  "permissions": [ { ... } ]
}
```

### Create Role (Super Admin)
```
POST /admin/roles
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "name": "CUSTOM_ROLE",
  "description": "Custom role",
  "permissions": [1, 2, 3]
}

Response: 201 Created
{ ... }
```

### Update Role (Super Admin)
```
PUT /admin/roles/:id
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "description": "Updated description",
  "permissions": [1, 2, 3, 4]
}

Response: 200 OK
{ ... }
```

### Delete Role (Super Admin)
```
DELETE /admin/roles/:id
Authorization: Bearer <super_admin_token>

Response: 200 OK
{ "message": "Role deleted successfully" }
```

---

## Permission Management Endpoints

### Get All Permissions (Super Admin)
```
GET /admin/permissions?module=products

Response: 200 OK
[ { ... } ]
```

### Get Permissions by Role (Super Admin)
```
GET /admin/permissions/role/:roleId
Authorization: Bearer <super_admin_token>

Response: 200 OK
[ { ... } ]
```

### Create Permission (Super Admin)
```
POST /admin/permissions
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "name": "custom_permission",
  "description": "...",
  "module": "custom"
}

Response: 201 Created
{ ... }
```

### Update Permission (Super Admin)
```
PUT /admin/permissions/:id
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "description": "Updated description"
}

Response: 200 OK
{ ... }
```

### Delete Permission (Super Admin)
```
DELETE /admin/permissions/:id
Authorization: Bearer <super_admin_token>

Response: 200 OK
{ "message": "Permission deleted successfully" }
```

---

## System Configuration Endpoints

### Get System Configuration
```
GET /admin/config

Response: 200 OK
{
  "currency": "USD",
  "tax_rate": "0.1",
  "low_stock_threshold": "10"
}
```

### Update System Configuration (Super Admin)
```
PUT /admin/config
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "currency": "USD",
  "tax_rate": 0.1,
  "order_limit": 100000
}

Response: 200 OK
{ "message": "System configuration updated successfully" }
```

### Get Configuration Value
```
GET /admin/config/:key

Response: 200 OK
{
  "key": "currency",
  "value": "USD"
}
```

### Set Configuration Value (Super Admin)
```
POST /admin/config/:key
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "value": "USD",
  "description": "Default currency"
}

Response: 200 OK
{ ... }
```

---

## Audit & Monitoring Endpoints

### Get Audit Logs (Super Admin)
```
GET /admin/audit-logs?user_id=1&action=PRODUCT_CREATED&limit=100&offset=0
Authorization: Bearer <super_admin_token>

Response: 200 OK
[
  {
    "id": 1,
    "user_id": 1,
    "action": "PRODUCT_CREATED",
    "entity_type": "PRODUCT",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Get User Audit Logs (Super Admin)
```
GET /admin/audit-logs/user/:id?limit=50&offset=0
Authorization: Bearer <super_admin_token>

Response: 200 OK
[ { ... } ]
```

### Get Audit Logs by Action (Super Admin)
```
GET /admin/audit-logs/action/:action?limit=50&offset=0
Authorization: Bearer <super_admin_token>

Response: 200 OK
[ { ... } ]
```

### Get Audit Statistics (Super Admin)
```
GET /admin/audit-stats?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <super_admin_token>

Response: 200 OK
[
  {
    "action": "PRODUCT_CREATED",
    "count": 10,
    "entity_type": "PRODUCT",
    "date": "2024-01-01"
  }
]
```

---

## Supplier Endpoints

### Get All Suppliers (Admin)
```
GET /suppliers?active=true&limit=20&offset=0
Authorization: Bearer <admin_token>

Response: 200 OK
[ { ... } ]
```

### Get Supplier by ID (Admin)
```
GET /suppliers/:id
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "id": 1,
  "name": "Supplier Name",
  "products": [ { ... } ]
}
```

### Create Supplier (Admin)
```
POST /suppliers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Supplier Name",
  "contact_person": "John Doe",
  "email": "john@supplier.com",
  "phone": "1234567890",
  "address": "Supplier Address"
}

Response: 201 Created
{ ... }
```

### Update Supplier (Admin)
```
PUT /suppliers/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Updated Name"
}

Response: 200 OK
{ ... }
```

### Deactivate Supplier (Admin)
```
POST /suppliers/:id/deactivate
Authorization: Bearer <admin_token>

Response: 200 OK
{ ... }
```

### Link Product to Supplier (Admin)
```
POST /suppliers/:supplierId/products/:productId/link
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "supplier_sku": "SUP-001",
  "lead_time_days": 7,
  "min_order_quantity": 10,
  "unit_price": 50.00
}

Response: 200 OK
{ "message": "Product linked to supplier successfully" }
```

### Get Supplier Products (Admin)
```
GET /suppliers/:supplierId/products
Authorization: Bearer <admin_token>

Response: 200 OK
[ { ... } ]
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": []  // Optional validation errors
}
```

### Common Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

No rate limiting is currently implemented. Consider adding:
- 100 requests per minute per IP
- 1000 requests per day per user

---

## Pagination

All list endpoints support pagination:
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Number of results to skip (default: 0)

Example: `GET /products?limit=50&offset=100`

---

## Sorting

Default sorting varies by endpoint:
- Products: `created_at DESC`
- Orders: `created_at DESC`
- Users: `created_at DESC`

Custom sorting to be implemented.

---

For more information, see the complete documentation in `README_IMPLEMENTATION.md`.
