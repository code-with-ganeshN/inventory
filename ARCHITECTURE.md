# System Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   React Components                        │   │
│  │ ┌────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐ │   │
│  │ │  User  │ │  Admin   │ │SuperAdmin │ │  Shared UI  │ │   │
│  │ │ Pages  │ │  Pages   │ │ Pages     │ │ Components  │ │   │
│  │ └────────┘ └──────────┘ └───────────┘ └──────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Redux Store (State Management)              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │   Auth   │  │ Products │  │  Cart    │              │   │
│  │  │  State   │  │  State   │  │  State   │              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      Axios API Client (HTTP Communication)               │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Request Interceptors (JWT Auth) │ Response Handlers│ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                        HTTP/REST API
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  API Routes (50+ endpoints)              │   │
│  │  ┌──────┐ ┌──────────┐ ┌────────┐ ┌──────────────────┐ │   │
│  │  │Auth  │ │ Products │ │Orders  │ │ Admin/SuperAdmin │ │   │
│  │  │Routes│ │ Routes   │ │Routes  │ │ Routes           │ │   │
│  │  └──────┘ └──────────┘ └────────┘ └──────────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │  Auth Check  │  │  Role Check  │  │Audit Logging │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          12 Business Logic Controllers                    │   │
│  │  ┌────────┐ ┌──────┐ ┌─────┐ ┌────┐ ┌──────┐ ┌──────┐  │   │
│  │  │  Auth  │ │Users │ │Roles│ │Perms│ │Config│ │Audit │  │   │
│  │  └────────┘ └──────┘ └─────┘ └────┘ └──────┘ └──────┘  │   │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Products │ │ Categories│ │Inventory │ │ Orders  │  │   │
│  │  └──────────┘ └───────────┘ └──────────┘ └──────────┘  │   │
│  │  ┌──────────┐ ┌───────────┐                             │   │
│  │  │Suppliers │ │ Cart      │                             │   │
│  │  └──────────┘ └───────────┘                             │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Data Access Layer (TypeScript)               │   │
│  │       ↓ Database Queries, Validations, Utilities        │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    PostgreSQL Database
                              ↓
         ┌──────────────────────────────────┐
         │   20 Database Tables             │
         │  ┌────────────────────────────┐  │
         │  │ Users, Roles, Permissions  │  │
         │  │ Products, Categories       │  │
         │  │ Inventory, Warehouses      │  │
         │  │ Orders, Items, Cart        │  │
         │  │ Suppliers, Audit Logs      │  │
         │  │ System Config, Login Hist  │  │
         │  └────────────────────────────┘  │
         └──────────────────────────────────┘
```

## Data Flow

### Authentication Flow
```
User Login
    ↓
Login Page (React) → POST /api/auth/login
    ↓
Auth Controller (Backend) → Validate Credentials
    ↓
JWT Token Generated
    ↓
Redux Store (Client) → Store Token & User Info
    ↓
Axios Interceptor → Add Token to All Requests
    ↓
Protected Routes Active
```

### Product Purchase Flow
```
User Browse Products
    ↓
ProductBrowser → GET /api/products
    ↓
Product List (Redux State)
    ↓
User Views Details
    ↓
ProductDetail → GET /api/products/:id
    ↓
User Adds to Cart
    ↓
Cart Slice (Redux) → Update Cart Items
    ↓
User Checkout
    ↓
Checkout Page → POST /api/cart/checkout
    ↓
Order Created (Backend)
    ↓
Inventory Reduced
    ↓
Audit Log Entry
    ↓
Order Confirmation
```

### Admin Management Flow
```
Super Admin Creates Roles
    ↓
RoleManagement → POST /api/roles
    ↓
Role Controller → Validate & Create
    ↓
Audit Log → CREATE action logged
    ↓
Admin List Updated
    ↓
Admin Can Now Assign Permissions
    ↓
PermissionManagement → POST /api/role-permissions
    ↓
Role Now Has Permissions
```

## Authentication & Authorization

```
┌─────────────────────────────────────────────────────┐
│          CLIENT-SIDE (React)                        │
│  1. User enters credentials                         │
│  2. POST to /api/auth/login                         │
│  3. Receive JWT token                               │
│  4. Store in Redux state                            │
│  5. Include in all API requests via header          │
└─────────────────────────────────────────────────────┘
                        ↓ JWT Token
┌─────────────────────────────────────────────────────┐
│          SERVER-SIDE (Express)                      │
│  1. Receive request with token in header            │
│  2. auth middleware verifies JWT                    │
│  3. Extract user info from token                    │
│  4. roleMiddleware checks user role                 │
│  5. Access to route if authorized                   │
│  6. 403 Forbidden if unauthorized                   │
│  7. Audit log entry for sensitive operations        │
└─────────────────────────────────────────────────────┘
```

## Database Schema Structure

```
┌─────────────────────────────────────────────────────┐
│  USER MANAGEMENT TABLES                             │
│  ┌──────────────┐  ┌────────────┐  ┌───────────┐   │
│  │ users        │  │ roles      │  │ permissions│   │
│  │ (50+ fields) │  │ (3 default)│  │ (modular) │   │
│  └──────────────┘  └────────────┘  └───────────┘   │
│                ↓                                     │
│     ┌──────────────────────────────┐               │
│     │ role_permissions             │               │
│     │ (Junction Table - M:N)       │               │
│     └──────────────────────────────┘               │
│  ┌──────────────┐  ┌──────────────┐               │
│  │login_history │  │system_config │               │
│  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  PRODUCT MANAGEMENT TABLES                          │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ products     │  │ categories   │               │
│  │ (15 fields)  │  │ (hierarchical)               │
│  └──────────────┘  └──────────────┘               │
│           ↓ (Foreign Key)                          │
│     ┌──────────────────────────────┐               │
│     │ product_suppliers            │               │
│     │ (M:N Junction Table)         │               │
│     └──────────────────────────────┘               │
│  ┌──────────────┐                                 │
│  │ suppliers    │                                 │
│  │ (8 fields)   │                                 │
│  └──────────────┘                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  INVENTORY MANAGEMENT TABLES                        │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ warehouses   │  │ inventory    │               │
│  │ (3 fields)   │  │ (8 fields)   │               │
│  └──────────────┘  └──────────────┘               │
│           ↓ (Foreign Keys)                         │
│     ┌──────────────────────────────┐               │
│     │ inventory_movements          │               │
│     │ (Audit Trail)                │               │
│     └──────────────────────────────┘               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ORDER MANAGEMENT TABLES                            │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ orders       │  │ order_items  │               │
│  │ (10 fields)  │  │ (4 fields)   │               │
│  └──────────────┘  └──────────────┘               │
│           ↓ (Foreign Keys)                         │
│  ┌──────────────────────────────┐                 │
│  │ shopping_carts               │                 │
│  │ (User's Cart Items)          │                 │
│  └──────────────────────────────┘                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  AUDIT & MONITORING TABLES                          │
│  ┌──────────────┐                                 │
│  │ audit_logs   │                                 │
│  │ (7 fields)   │                                 │
│  └──────────────┘                                 │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

```
FRONTEND                          BACKEND
├── React 19                       ├── Node.js + Express 5
├── Vite 5                         ├── TypeScript 5
├── Redux Toolkit                  ├── PostgreSQL 13+
├── Axios                          ├── jsonwebtoken (JWT)
├── React Router 6                 ├── bcrypt
├── Tailwind CSS 3                 ├── Zod (Validation)
└── Modern JavaScript (ES2022)     └── CORS middleware

DATABASE
├── PostgreSQL 13+
├── Connection Pooling
├── Indexes on FK & common queries
└── Transactions for critical operations
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────┐
│  CLIENT (Deployed on CDN/Web Server)              │
│  ├── React Bundle (dist/index.html)               │
│  ├── Static Assets (JS, CSS)                      │
│  └── Environment: VITE_API_URL=api.domain.com     │
└────────────────────────────────────────────────────┘
                        ↓ HTTPS
┌────────────────────────────────────────────────────┐
│  API SERVER (Deployed on App Server)              │
│  ├── Node.js Express Server (Port 5000)           │
│  ├── Environment: DATABASE_URL, JWT_SECRET        │
│  ├── SSL/TLS Certificates                         │
│  └── Load Balancer (if scaling)                   │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│  DATABASE (Managed PostgreSQL)                     │
│  ├── Primary Instance (Read/Write)                │
│  ├── Replica Instances (Read-only, optional)      │
│  ├── Automated Backups                            │
│  └── Connection Pool (pg-pool)                    │
└────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND SECURITY                                 │
│  ├── JWT Token (HttpOnly Cookie recommended)       │
│  ├── Input Validation (Zod schemas)                │
│  ├── HTTPS only                                    │
│  ├── CORS Protection                               │
│  └── Protected Routes (Role-based)                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  API SECURITY                                      │
│  ├── JWT Verification Middleware                   │
│  ├── Role-Based Access Control (RBAC)              │
│  ├── Request Validation (Zod)                      │
│  ├── Rate Limiting (optional)                      │
│  ├── SQL Injection Prevention (Parameterized)      │
│  ├── CORS Configuration                            │
│  ├── Error Handling (No stack traces exposed)      │
│  └── Audit Logging                                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  DATABASE SECURITY                                 │
│  ├── Password Hashing (bcrypt)                     │
│  ├── Foreign Key Constraints                       │
│  ├── Transaction Isolation                         │
│  ├── Backup Encryption                             │
│  ├── Limited User Privileges                       │
│  └── Connection Encryption (SSL)                   │
└─────────────────────────────────────────────────────┘
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND OPTIMIZATION                             │
│  ├── Code Splitting (Route-based)                  │
│  ├── Lazy Loading (React.lazy)                     │
│  ├── Redux Memoization                             │
│  ├── Image Optimization                            │
│  ├── Minification (Vite)                           │
│  └── Cache Busting                                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  API OPTIMIZATION                                  │
│  ├── Database Indexing (FK, status, timestamps)    │
│  ├── Query Optimization                            │
│  ├── Connection Pooling                            │
│  ├── Pagination (Large datasets)                   │
│  ├── Caching (Response caching optional)           │
│  └── Gzip Compression                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  DATABASE OPTIMIZATION                             │
│  ├── Indexes on: FKs, status, created_at           │
│  ├── Query Plans analyzed                          │
│  ├── Denormalization (where needed)                │
│  ├── Archiving old data (optional)                 │
│  └── Connection pooling                            │
└─────────────────────────────────────────────────────┘
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────┐
│  MONITORING SYSTEM                                 │
│  ├── Application Logs (Winston/Pino)               │
│  ├── Error Tracking (Sentry, optional)             │
│  ├── Performance Monitoring (APM, optional)        │
│  ├── Database Monitoring (Slow queries)            │
│  ├── Health Checks (/api/health endpoint)          │
│  ├── Metrics Dashboard (Prometheus/Grafana)        │
│  └── Alert System (PagerDuty, email)               │
└─────────────────────────────────────────────────────┘
```

This architecture supports:
- ✅ Scalability (Horizontal scaling possible)
- ✅ High availability (Load balancing)
- ✅ Security (Multi-layer)
- ✅ Performance (Caching, optimization)
- ✅ Maintainability (Clean separation)
- ✅ Extensibility (Modular design)
