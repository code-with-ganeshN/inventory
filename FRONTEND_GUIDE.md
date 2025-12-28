# Frontend Implementation Guide

## Overview

Complete React frontend for the Inventory Management System with role-based access control for three user tiers: Regular Users, Admins, and Super Admins.

## Project Structure

```
client/src/
├── components/
│   ├── Layout/
│   │   ├── Header.jsx          # Navigation header with user menu
│   │   ├── Sidebar.jsx         # Admin navigation sidebar
│   │   ├── AdminLayout.jsx     # Layout wrapper for admin pages
│   │   └── UserLayout.jsx      # Layout wrapper for user pages
│   ├── Common/
│   │   └── index.jsx           # Reusable UI components (Button, Input, Card, etc)
│   └── ProtectedRoute.jsx      # Route protection by role
├── pages/
│   ├── Login.jsx               # Authentication
│   ├── Home.jsx                # User dashboard
│   ├── ProductBrowser.jsx      # Product listing
│   ├── ProductDetail.jsx       # Product details
│   ├── Cart.jsx                # Shopping cart
│   ├── Checkout.jsx            # Order checkout
│   ├── Orders.jsx              # Order listing
│   ├── OrderDetail.jsx         # Order details
│   ├── admin/
│   │   ├── Dashboard.jsx       # Admin dashboard
│   │   ├── ProductManagement.jsx
│   │   ├── Categories.jsx
│   │   ├── Inventory.jsx
│   │   ├── Orders.jsx
│   │   └── Suppliers.jsx
│   └── superadmin/
│       ├── Dashboard.jsx       # Super admin dashboard
│       ├── Users.jsx           # User management
│       ├── Roles.jsx           # Role management
│       ├── Permissions.jsx     # Permission management
│       ├── Config.jsx          # System configuration
│       └── AuditLogs.jsx       # Audit logging
├── store/
│   ├── authSlice.js            # Authentication state
│   ├── productSlice.js         # Product state
│   ├── cartSlice.js            # Cart state
│   └── index.js                # Store configuration
├── api/
│   ├── client.js               # Axios configuration with interceptors
│   └── endpoints.js            # API endpoint functions
├── App.jsx                     # Main app with routing
├── App.css                     # Application styles
├── main.jsx                    # Entry point
└── index.css                   # Global styles
```

## Components

### Layout Components

#### Header.jsx
- Top navigation bar with logo
- User profile dropdown
- Navigation links (filtered by role)
- Logout functionality

#### Sidebar.jsx
- Collapsible navigation menu for admin areas
- Role-based menu items
- Smooth transitions

#### AdminLayout.jsx
- Combines Header + Sidebar for admin pages
- Main content wrapper

#### UserLayout.jsx
- Header + Footer for user pages
- Responsive footer with links

### Common UI Components

All components are exported from `client/src/components/Common/index.jsx`:

- **Button** - Variants: primary, secondary, danger, success, outline
- **Input** - Text input with label and error support
- **Select** - Dropdown select with options
- **Card** - Reusable card container
- **Modal** - Pop-up modal dialog
- **Badge** - Status badges (blue, green, red, yellow, gray)
- **Loading** - Spinner animation
- **Error** - Error message with retry
- **Table** - Data table with columns
- **Pagination** - Page navigation controls

### ProtectedRoute.jsx

Route wrapper that:
- Checks if user is authenticated
- Validates user role for admin/super-admin routes
- Redirects to login if not authenticated
- Redirects to home if insufficient permissions

## Pages

### User Pages

#### Home.jsx
- Hero section with call-to-action
- Statistics cards
- Featured products grid
- Feature highlights

#### ProductBrowser.jsx
- Product listing with search/filter
- Pagination support
- Add to cart functionality
- Loading and error states

#### ProductDetail.jsx
- Product information display
- Product images/description
- Price and availability
- Quantity selector
- Add to cart button
- Related products

#### Cart.jsx
- Shopping cart items
- Edit quantities
- Remove items
- Save for later
- Cart total calculation
- Checkout button

#### Checkout.jsx
- Delivery address form
- Payment method selection
- Order summary with tax calculation
- Order placement

#### Orders.jsx
- User's order history
- Order status badges
- View order details link
- Pagination

#### OrderDetail.jsx
- Order status tracking
- Order items list
- Shipping address
- Cost breakdown
- Cancel/edit options

### Admin Pages

#### Dashboard.jsx
- Key statistics (orders, products, revenue, low stock)
- Recent orders table
- Quick action links
- System status

#### ProductManagement.jsx
- Product CRUD operations
- Product search and filtering
- Bulk actions
- Product status toggle
- Category assignment

#### Categories.jsx
- Category CRUD operations
- Hierarchical category support
- Parent-child relationships
- Category deletion with validation

#### Inventory.jsx
- Stock levels by warehouse
- Low stock alerts
- Inventory adjustments
- Reorder level settings
- Stock movement tracking

#### Orders.jsx
- All orders listing
- Order status updates
- Order filtering
- Customer information
- Order details view

#### Suppliers.jsx
- Supplier management CRUD
- Supplier contact information
- Product-supplier linking
- Supplier deactivation

### Super Admin Pages

#### Dashboard.jsx
- System-wide statistics
- Recent activity log
- User, product, and revenue metrics
- Quick management links

#### Users.jsx
- User listing with pagination
- Create new admin accounts
- Activate/deactivate users
- View user roles and status
- User status management

#### Roles.jsx
- Role CRUD operations
- Role descriptions
- Assign permissions to roles
- View role permissions

#### Permissions.jsx
- Permission management
- Module-based permissions
- Permission assignment to roles
- View role-permission mappings

#### Config.jsx
- System configuration key-value pairs
- Configuration types (STRING, NUMBER, BOOLEAN, JSON)
- Update global settings
- Common configurations guide

#### AuditLogs.jsx
- View system activity logs
- Filter by action/entity/user
- Timestamp tracking
- Activity statistics
- Pagination

## State Management (Redux)

### authSlice.js
```javascript
{
  isAuthenticated: boolean,
  user: {
    id, email, first_name, last_name, role, status
  },
  loading: boolean,
  error: string
}
```

Actions:
- `login(credentials)` - Authenticate user
- `logout()` - Clear auth state
- `setUser(user)` - Set user data
- `setLoading(bool)` - Set loading state
- `setError(error)` - Set error message

### productSlice.js
```javascript
{
  products: [],
  currentProduct: null,
  loading: boolean,
  error: string,
  filters: {
    search: string,
    category: string,
    page: number,
    limit: number
  }
}
```

Actions:
- `setProducts(products)` - Set product list
- `setCurrentProduct(product)` - Set selected product
- `setLoading(bool)` - Set loading state
- `setError(error)` - Set error message
- `setFilters(filters)` - Update filters

### cartSlice.js
```javascript
{
  items: [
    { id, name, price, quantity, sku }
  ],
  total: number,
  savedItems: []
}
```

Actions:
- `addItem(item)` - Add to cart
- `updateItem(id, quantity)` - Update quantity
- `removeItem(id)` - Remove from cart
- `saveForLater(id)` - Move to saved
- `clearCart()` - Empty cart

## API Integration

### client.js

Axios instance with:
- Base URL from `VITE_API_URL` environment variable
- JWT token in Authorization header
- Request/response interceptors
- Auto-redirect on 401 Unauthorized
- Error handling

### endpoints.js

Organized API functions by category:

1. **authAPI** - Login, register, profile, password change
2. **productAPI** - CRUD for products, search, filtering
3. **categoryAPI** - Category management
4. **cartAPI** - Cart operations
5. **orderAPI** - Order CRUD, status updates
6. **inventoryAPI** - Stock management
7. **supplierAPI** - Supplier management
8. **adminAPI** - User and account management
9. **rolesAPI** - Role CRUD
10. **permissionsAPI** - Permission CRUD
11. **systemConfigAPI** - System configuration
12. **auditAPI** - Audit log viewing

## Routing

Protected routes use the `ProtectedRoute` component:

```javascript
<Route
  path="/admin/products"
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <AdminProducts />
    </ProtectedRoute>
  }
/>
```

### Route Structure

**Public Routes:**
- `/login` - Login page
- `/` - Home page (accessible without auth)

**User Routes (Authenticated):**
- `/products` - Product listing
- `/products/:id` - Product details
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/orders` - Order history
- `/orders/:id` - Order details

**Admin Routes (role: ADMIN):**
- `/admin` - Admin dashboard
- `/admin/products` - Product management
- `/admin/categories` - Category management
- `/admin/inventory` - Inventory management
- `/admin/orders` - Order management
- `/admin/suppliers` - Supplier management

**Super Admin Routes (role: SUPER_ADMIN):**
- `/super-admin` - Super admin dashboard
- `/super-admin/users` - User management
- `/super-admin/roles` - Role management
- `/super-admin/permissions` - Permission management
- `/super-admin/config` - System configuration
- `/super-admin/audit` - Audit logs

## Environment Configuration

Create `.env` file in client directory:

```
VITE_API_URL=http://localhost:5000/api
```

## Installation & Running

```bash
cd client

# Install dependencies
pnpm install

# Development mode with hot reload
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Features Implemented

### User Features
- ✅ Authentication (login/logout)
- ✅ Product browsing and search
- ✅ Product details view
- ✅ Shopping cart management
- ✅ Checkout process
- ✅ Order placement
- ✅ Order tracking
- ✅ Order history

### Admin Features
- ✅ Dashboard with statistics
- ✅ Product CRUD and management
- ✅ Category management
- ✅ Inventory tracking
- ✅ Order management and status updates
- ✅ Supplier management
- ✅ Stock level monitoring

### Super Admin Features
- ✅ User account management
- ✅ Admin account creation
- ✅ User activation/deactivation
- ✅ Role management
- ✅ Permission management
- ✅ System configuration
- ✅ Audit log viewing and filtering

## Styling

Uses Tailwind CSS for utility-first styling. Configuration in `tailwind.config.js`.

Responsive design with:
- Mobile-first approach
- Grid and flexbox layouts
- Tailwind responsive prefixes (md:, lg:)

## Performance Optimizations

- Code splitting by route
- Lazy loading images
- Pagination for large datasets
- Redux state management for reduced re-renders
- Axios request caching through API client

## Error Handling

- Try-catch in all API calls
- User-friendly error messages
- Error boundaries for component crashes
- Retry functionality on failed API calls

## Testing Checklist

- [ ] Login/logout flow
- [ ] Product search and filtering
- [ ] Add to cart and checkout
- [ ] Order creation and tracking
- [ ] Admin dashboard loads correctly
- [ ] Admin can create/update products
- [ ] Super admin can create admin users
- [ ] Role-based access control works
- [ ] Protected routes redirect properly
- [ ] Mobile responsiveness

## Common Issues & Solutions

**Issue:** API calls failing with CORS errors
- **Solution:** Check VITE_API_URL in .env matches backend server

**Issue:** Redux state not persisting
- **Solution:** Add Redux Persist middleware if needed

**Issue:** Images not loading
- **Solution:** Placeholder emoji used; replace with actual image URLs

**Issue:** Authentication token expired
- **Solution:** Axios interceptor handles 401 and redirects to login

## Future Enhancements

1. Add profile page with user settings
2. Implement product reviews and ratings
3. Add wishlist functionality
4. Email notifications for orders
5. Advanced reporting and analytics
6. Real-time notifications
7. Payment gateway integration
8. Invoice generation
9. Export reports to PDF
10. Multi-language support

## File Count Summary

- **Layout Components:** 4 files
- **Common Components:** 1 file (10+ component exports)
- **User Pages:** 7 files
- **Admin Pages:** 6 files
- **Super Admin Pages:** 6 files
- **Store (Redux):** 4 files
- **API Layer:** 2 files
- **Main App:** 1 file

**Total Frontend Files:** 31 files with 2,500+ lines of React code

## Code Quality

- ✅ Consistent naming conventions
- ✅ Component composition best practices
- ✅ Props validation where appropriate
- ✅ Error handling in all API calls
- ✅ Loading states for all async operations
- ✅ Responsive design throughout
- ✅ Accessible form elements
- ✅ Semantic HTML structure
