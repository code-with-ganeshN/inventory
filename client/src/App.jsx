import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// User Pages
import Home from './pages/Home';
import ProductBrowser from './pages/ProductBrowser';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCategories from './pages/admin/Categories';
import AdminProducts from './pages/admin/ProductManagement';
import AdminInventory from './pages/admin/Inventory';

// Super Admin Pages
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminUsers from './pages/superadmin/Users';
import SuperAdminRoles from './pages/superadmin/Roles';
import SuperAdminPermissions from './pages/superadmin/Permissions';
import SuperAdminConfig from './pages/superadmin/Config';
import SuperAdminAudit from './pages/superadmin/AuditLogs';
import SuperAdminInventory from './pages/superadmin/Inventory';
import SuperAdminOrders from './pages/superadmin/Orders';

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    // Restore user from localStorage if not in Redux state
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser && !user) {
      try {
        const parsedUser = JSON.parse(storedUser);
        dispatch({ type: 'auth/setUser', payload: parsedUser });
      } catch (e) {
        console.error('Failed to restore user:', e);
      }
    }
  }, [dispatch, user]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" /> : <Register />}
        />

        {/* User Routes */}
        <Route path="/" element={<Home />} />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductBrowser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Categories, Products, and Inventory */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={['ADMIN', 'SUPER_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute requiredRole={['ADMIN', 'SUPER_ADMIN']}>
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute requiredRole={['ADMIN', 'SUPER_ADMIN']}>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute requiredRole={['ADMIN', 'SUPER_ADMIN']}>
              <AdminInventory />
            </ProtectedRoute>
          }
        />

        {/* Super Admin Routes */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/users"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/roles"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminRoles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/permissions"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminPermissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/config"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/audit"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminAudit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/inventory"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/orders"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminOrders />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;