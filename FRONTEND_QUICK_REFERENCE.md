# Frontend Quick Reference

## Start Development

```bash
cd client
pnpm install
pnpm run dev
```

Visit: `http://localhost:5173`

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `src/App.jsx` | Main routing | 130 |
| `src/store/index.js` | Redux store setup | 20 |
| `src/api/client.js` | Axios configuration | 35 |
| `src/api/endpoints.js` | All API calls | 200+ |
| `src/components/Common/index.jsx` | UI components | 250+ |
| `src/pages/Home.jsx` | Landing page | 100 |
| `src/pages/Login.jsx` | Auth page | 80 |
| `src/pages/ProductBrowser.jsx` | Product list | 90 |
| `src/pages/Cart.jsx` | Shopping cart | 95 |
| `src/pages/admin/Dashboard.jsx` | Admin dashboard | 120 |

## Component Usage Examples

### Button Component
```jsx
import { Button } from '../components/Common';

<Button onClick={handleClick}>Click Me</Button>
<Button variant="danger" size="lg">Delete</Button>
<Button variant="outline">Cancel</Button>
```

### Input Component
```jsx
import { Input } from '../components/Common';

<Input
  type="email"
  name="email"
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
/>
```

### Card Component
```jsx
import { Card } from '../components/Common';

<Card title="User Profile" className="mb-4">
  {/* Content here */}
</Card>
```

### Modal Component
```jsx
import { Modal } from '../components/Common';

<Modal
  isOpen={showModal}
  title="Confirm Action"
  onClose={() => setShowModal(false)}
>
  {/* Modal content */}
</Modal>
```

### Table Component
```jsx
import { Table } from '../components/Common';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  {
    key: 'id',
    label: 'Actions',
    render: (row) => <Button onClick={() => handleEdit(row)}>Edit</Button>
  }
];

<Table columns={columns} data={users} loading={loading} error={error} />
```

## Redux State Usage

### Access State
```jsx
import { useSelector, useDispatch } from 'react-redux';

const { user, isAuthenticated } = useSelector((state) => state.auth);
const { products } = useSelector((state) => state.product);
const { items, total } = useSelector((state) => state.cart);
```

### Dispatch Actions
```jsx
import { logout, setError } from '../store/authSlice';
import { setProducts, setLoading } from '../store/productSlice';
import { addItem, removeItem } from '../store/cartSlice';

const dispatch = useDispatch();

dispatch(logout());
dispatch(setProducts(productList));
dispatch(addItem({ id: 1, name: 'Product', price: 99, quantity: 1 }));
```

## API Integration

### Making API Calls
```jsx
import { productAPI, orderAPI } from '../api/endpoints';

// Get products
const response = await productAPI.getAllProducts({ page: 1, limit: 10 });

// Get specific product
const product = await productAPI.getProductById(123);

// Create order
const order = await orderAPI.createOrder({ items, total_amount });

// Update order status
await orderAPI.updateOrderStatus(orderId, { status: 'SHIPPED' });
```

### Error Handling
```jsx
try {
  const response = await productAPI.getAllProducts();
  dispatch(setProducts(response.data.products));
} catch (error) {
  const message = error.response?.data?.error || 'Failed to load';
  dispatch(setError(message));
}
```

## Routing

### Navigate Between Pages
```jsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

navigate('/');              // Home
navigate('/products');      // Products
navigate('/products/123');  // Product detail
navigate('/cart');          // Cart
navigate('/checkout');      // Checkout
navigate('/orders');        // Orders
navigate('/admin');         // Admin dashboard
```

### Protected Routes Example
```jsx
<Route
  path="/admin/products"
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <AdminProducts />
    </ProtectedRoute>
  }
/>
```

## Form Handling

### Basic Form
```jsx
const [formData, setFormData] = useState({ name: '', email: '' });
const [errors, setErrors] = useState({});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  // Validate and submit
};
```

### Form with API Call
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await productAPI.createProduct(formData);
    alert('Product created!');
    setFormData({ name: '', price: '' });
  } catch (error) {
    setErrors({ submit: error.response?.data?.error });
  }
};
```

## Common Patterns

### Fetch Data on Page Load
```jsx
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await API.getData();
    setData(response.data);
  } catch (error) {
    setError(error.response?.data?.error);
  } finally {
    setLoading(false);
  }
};
```

### Loading State in Component
```jsx
if (loading) return <Loading />;
if (error) return <Error message={error} onRetry={fetchData} />;

return (
  <div>
    {/* Your content */}
  </div>
);
```

### Pagination
```jsx
const [currentPage, setCurrentPage] = useState(1);

// In JSX
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>
```

## Styling

### Tailwind Classes
```jsx
// Colors
<div className="text-blue-600 bg-blue-50">Text</div>

// Spacing
<div className="px-4 py-2 mb-4">Content</div>

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>

// Flexbox
<div className="flex justify-between items-center">
  {/* Flex layout */}
</div>
```

### Common Patterns
```jsx
// Card styling
<div className="bg-white rounded-lg shadow-md p-6">

// Button hover
<button className="hover:bg-blue-700">

// Alert/Error box
<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">

// Badge/label
<span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
```

## Debug Tips

### Check Redux State
```javascript
// In browser console
store.getState()
```

### Log Redux Actions
```jsx
// Add to store configuration
import logger from 'redux-logger'; // if using

// Or manual logging
dispatch((action) => {
  console.log('Action:', action);
  return action;
});
```

### Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by XHR/Fetch
4. Check request/response headers
5. Verify JWT token in headers

### Check API Response
```jsx
.then(response => {
  console.log('API Response:', response.data);
  return response;
})
```

## Common Issues & Solutions

### API Returns 401 (Unauthorized)
- Check if user is logged in
- Verify JWT token in Redux state
- Check if token is expired
- Token should be in request headers

### CORS Error
- Verify VITE_API_URL in .env
- Check backend CORS configuration
- Make sure API server is running

### Components Not Rendering
- Check if route exists in App.jsx
- Verify component import path
- Check browser console for errors
- Check if protected route role matches

### State Not Updating
- Check Redux action dispatch
- Verify reducer is updating state
- Check if component is connected to store
- Use Redux DevTools for debugging

## Performance Tips

1. **Memoize Components**
   ```jsx
   const MyComponent = React.memo(({ data }) => {
     return <div>{data}</div>;
   });
   ```

2. **Lazy Load Routes**
   ```jsx
   const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
   ```

3. **Optimize Images**
   - Use actual images instead of placeholders
   - Compress before uploading

4. **Pagination**
   - Load limited items per page
   - Implement server-side pagination

## Deployment Checklist

Before deploying:
- [ ] Build project: `pnpm run build`
- [ ] Check dist/ folder is created
- [ ] Update VITE_API_URL for production
- [ ] Remove console.log statements
- [ ] Test all pages work
- [ ] Test all roles (user, admin, super-admin)
- [ ] Check responsive design
- [ ] Verify API endpoints work
- [ ] Check error messages display correctly

## File Locations Quick Access

```
Header Component:      src/components/Layout/Header.jsx
Sidebar Component:     src/components/Layout/Sidebar.jsx
UI Components:         src/components/Common/index.jsx
Protected Route:       src/components/ProtectedRoute.jsx

Home Page:            src/pages/Home.jsx
Login Page:           src/pages/Login.jsx
Products Page:        src/pages/ProductBrowser.jsx
Cart Page:            src/pages/Cart.jsx
Orders Page:          src/pages/Orders.jsx

Admin Dashboard:      src/pages/admin/Dashboard.jsx
Admin Products:       src/pages/admin/ProductManagement.jsx
Admin Orders:         src/pages/admin/Orders.jsx

Super Admin Users:    src/pages/superadmin/Users.jsx
Super Admin Roles:    src/pages/superadmin/Roles.jsx
Super Admin Audit:    src/pages/superadmin/AuditLogs.jsx

Redux Auth Store:     src/store/authSlice.js
Redux Product Store:  src/store/productSlice.js
Redux Cart Store:     src/store/cartSlice.js
Redux Config:         src/store/index.js

API Client:           src/api/client.js
API Endpoints:        src/api/endpoints.js

Main App Router:      src/App.jsx
Entry Point:          src/main.jsx
```

## Useful Commands

```bash
# Development
pnpm run dev              # Start dev server

# Building
pnpm run build            # Build for production
pnpm run preview          # Preview production build

# Linting (if configured)
pnpm run lint             # Check code style

# Package management
pnpm add <package>        # Add new package
pnpm remove <package>     # Remove package
pnpm update               # Update packages

# Cleaning
rm -r node_modules        # Remove dependencies
rm pnpm-lock.yaml         # Remove lock file
pnpm install              # Reinstall dependencies
```

## Environment Variables

Create `.env` file in `client/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

## Additional Resources

- [React Documentation](https://react.dev)
- [Redux Toolkit Docs](https://redux-toolkit.js.org)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Axios Documentation](https://axios-http.com)

---

**Frontend Complete!** 🚀

The frontend is ready to integrate with the backend and deploy to production.
