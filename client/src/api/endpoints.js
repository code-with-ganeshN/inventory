import api from './client';

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (oldPassword, newPassword) => api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),
  refreshToken: () => api.post('/auth/refresh'),
};

// Product APIs
export const productAPI = {
  getAllProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  searchProducts: (params) => api.get('/products/search', { params }),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deactivateProduct: (id) => api.post(`/products/${id}/deactivate`),
  activateProduct: (id) => api.post(`/products/${id}/activate`),
};

// Category APIs
export const categoryAPI = {
  getAllCategories: (params) => api.get('/categories', { params }),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  reorderCategories: (data) => api.post('/categories/reorder', data),
};

// Cart APIs
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart/add', data),
  updateCartItem: (cartItemId, data) => api.put(`/cart/${cartItemId}`, data),
  removeFromCart: (cartItemId) => api.delete(`/cart/${cartItemId}`),
  clearCart: () => api.post('/cart/clear'),
  getSavedItems: () => api.get('/cart/saved'),
  saveForLater: (cartItemId) => api.post(`/cart/${cartItemId}/save`),
  moveToCart: (cartItemId) => api.post(`/cart/${cartItemId}/move`),
};

// Order APIs
export const orderAPI = {
  getAllOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  getUserOrders: (params) => api.get('/my-orders', { params }),
  updateOrderStatus: (id, status) => api.post(`/orders/${id}/status`, { status }),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  getOrderStats: () => api.get('/orders/stats'),
};

// Inventory APIs
export const inventoryAPI = {
  getInventoryByProduct: (productId) => api.get(`/inventory/product/${productId}`),
  getInventoryByWarehouse: (warehouseId, params) => api.get(`/inventory/warehouse/${warehouseId}`, { params }),
  addStock: (productId, data) => api.post(`/inventory/product/${productId}/add-stock`, data),
  adjustStock: (productId, data) => api.post(`/inventory/product/${productId}/adjust-stock`, data),
  setLowStockThreshold: (productId, data) => api.post(`/inventory/product/${productId}/set-threshold`, data),
  getInventoryMovements: (productId, params) => api.get(`/inventory/product/${productId}/movements`, { params }),
  getLowStockProducts: (warehouseId, params) => api.get(`/inventory/warehouse/${warehouseId}/low-stock`, { params }),
  getInventoryStats: () => api.get('/inventory/stats'),
};

// User Management APIs (Super Admin)
export const userAPI = {
  getAllUsers: (params) => api.get('/admin/users', { params }),
  createAdminAccount: (data) => api.post('/admin/users/admin-account', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deactivateUser: (id) => api.post(`/admin/users/${id}/deactivate`),
  activateUser: (id) => api.post(`/admin/users/${id}/activate`),
  lockUser: (id) => api.post(`/admin/users/${id}/lock`),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  getUserLoginHistory: (id, params) => api.get(`/admin/users/${id}/login-history`, { params }),
};

// Admin Dashboard APIs (also called adminAPI for Users page)
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getRecentOrders: (limit = 10) => api.get('/admin/dashboard/recent-orders', { params: { limit } }),
  getSystemStatus: () => api.get('/admin/dashboard/status'),
  getLowStockProducts: (limit = 5) => api.get('/admin/dashboard/low-stock', { params: { limit } }),
  // User management methods for SuperAdminUsers page
  getAllUsers: (params) => api.get('/admin/users', { params }),
  createAdminAccount: (data) => api.post('/admin/users/admin-account', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deactivateUser: (id) => api.post(`/admin/users/${id}/deactivate`),
  activateUser: (id) => api.post(`/admin/users/${id}/activate`),
  lockUser: (id) => api.post(`/admin/users/${id}/lock`),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  getUserLoginHistory: (id, params) => api.get(`/admin/users/${id}/login-history`, { params }),
};

// Role APIs
export const roleAPI = {
  getAllRoles: () => api.get('/admin/roles'),
  getRoleById: (id) => api.get(`/admin/roles/${id}`),
  createRole: (data) => api.post('/admin/roles', data),
  updateRole: (id, data) => api.put(`/admin/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/admin/roles/${id}`),
};

// Alias for rolesAPI
export const rolesAPI = roleAPI;

// Permission APIs
export const permissionAPI = {
  getAllPermissions: (params) => api.get('/admin/permissions', { params }),
  getPermissionsByRole: (roleId) => api.get(`/admin/permissions/role/${roleId}`),
  createPermission: (data) => api.post('/admin/permissions', data),
  updatePermission: (id, data) => api.put(`/admin/permissions/${id}`, data),
  deletePermission: (id) => api.delete(`/admin/permissions/${id}`),
};

// Alias for permissionsAPI
export const permissionsAPI = permissionAPI;

// Supplier APIs
export const supplierAPI = {
  getAllSuppliers: (params) => api.get('/suppliers', { params }),
  getSupplierById: (id) => api.get(`/suppliers/${id}`),
  createSupplier: (data) => api.post('/suppliers', data),
  updateSupplier: (id, data) => api.put(`/suppliers/${id}`, data),
  deactivateSupplier: (id) => api.post(`/suppliers/${id}/deactivate`),
  linkProductToSupplier: (supplierId, productId, data) => api.post(`/suppliers/${supplierId}/products/${productId}/link`, data),
  getSupplierProducts: (supplierId) => api.get(`/suppliers/${supplierId}/products`),
};

// System Configuration APIs
export const configAPI = {
  getSystemConfig: () => api.get('/admin/config'),
  updateSystemConfig: (data) => api.put('/admin/config', data),
  getConfigValue: (key) => api.get(`/admin/config/${key}`),
  setConfigValue: (key, data) => api.post(`/admin/config/${key}`, data),
};

// Alias for systemConfigAPI
export const systemConfigAPI = configAPI;

// Audit Log APIs
export const auditAPI = {
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getUserAuditLogs: (userId, params) => api.get(`/admin/audit-logs/user/${userId}`, { params }),
  getAuditLogsByAction: (action, params) => api.get(`/admin/audit-logs/action/${action}`, { params }),
  getAuditStats: (params) => api.get('/admin/audit-stats', { params }),
};
