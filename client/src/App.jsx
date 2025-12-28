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

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/ProductManagement';
import AdminCategories from './pages/admin/Categories';
import AdminInventory from './pages/admin/Inventory';
import AdminOrders from './pages/admin/Orders';
import AdminSuppliers from './pages/admin/Suppliers';

// Super Admin Pages
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminUsers from './pages/superadmin/Users';
import SuperAdminRoles from './pages/superadmin/Roles';
import SuperAdminPermissions from './pages/superadmin/Permissions';
import SuperAdminConfig from './pages/superadmin/Config';
import SuperAdminAudit from './pages/superadmin/AuditLogs';

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

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/suppliers"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminSuppliers />
            </ProtectedRoute>
          }
        />

        {/* Super Admin Routes */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/users"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/roles"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminRoles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/permissions"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminPermissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/config"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/audit"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminAudit />
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