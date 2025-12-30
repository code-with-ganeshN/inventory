import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import * as authController from '../controllers/auth';
import * as superAdminController from '../controllers/superAdmin';
import * as rolesController from '../controllers/roles';
import * as permissionsController from '../controllers/permissions';
import * as systemConfigController from '../controllers/systemConfig';
import * as auditController from '../controllers/audit';
import * as productsController from '../controllers/products';
import * as categoriesController from '../controllers/categories';
import * as inventoryController from '../controllers/inventory';
import * as ordersController from '../controllers/orders';
import * as suppliersController from '../controllers/suppliers';
import * as cartController from '../controllers/cart';
import * as adminController from '../controllers/admin';

const router = Router();

// ==================== AUTH ROUTES ====================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authMiddleware, authController.refreshToken);
router.get('/auth/me', authMiddleware, authController.getCurrentUser);
router.put('/auth/profile', authMiddleware, authController.updateProfile);
router.post('/auth/change-password', authMiddleware, authController.changePassword);

// ==================== SUPER ADMIN ROUTES ====================
// User Management
router.get('/admin/users', authMiddleware, roleMiddleware(['SUPER_ADMIN']), superAdminController.getAllUsers);
router.post('/admin/users/admin-account', authMiddleware, roleMiddleware(['SUPER_ADMIN']), superAdminController.createAdminAccount);
router.put('/admin/users/:id', authMiddleware, roleMiddleware(['SUPER_ADMIN']), superAdminController.updateUser);
router.delete('/admin/users/:id', authMiddleware, roleMiddleware(['SUPER_ADMIN']), superAdminController.deleteUser);
router.post('/admin/users/:id/deactivate', authMiddleware, roleMiddleware(['SUPER_ADMIN']), superAdminController.deactivateUser);
router.post('/admin/users/:id/activate', authMiddleware, roleMiddleware(['SUPER_ADMIN']), superAdminController.activateUser);
router.post('/admin/users/:id/lock', authMiddleware, roleMiddleware(['SUPER_ADMIN']), superAdminController.lockUser);
router.post('/admin/users/:id/reset-password', authMiddleware, roleMiddleware(['SUPER_ADMIN']), superAdminController.resetUserPassword);
router.get('/admin/users/:id/login-history', authMiddleware, roleMiddleware(['SUPER_ADMIN']), superAdminController.getUserLoginHistory);

// Role Management
router.get('/admin/roles', authMiddleware, roleMiddleware(['SUPER_ADMIN']), rolesController.getAllRoles);
router.get('/admin/roles/:id', authMiddleware, roleMiddleware(['SUPER_ADMIN']), rolesController.getRoleWithPermissions);
router.post('/admin/roles', authMiddleware, roleMiddleware(['SUPER_ADMIN']), rolesController.createRole);
router.put('/admin/roles/:id', authMiddleware, roleMiddleware(['SUPER_ADMIN']), rolesController.updateRole);
router.delete('/admin/roles/:id', authMiddleware, roleMiddleware(['SUPER_ADMIN']), rolesController.deleteRole);

// Permission Management
router.get('/admin/permissions', authMiddleware, roleMiddleware(['SUPER_ADMIN']), permissionsController.getAllPermissions);
router.get('/admin/permissions/role/:roleId', authMiddleware, roleMiddleware(['SUPER_ADMIN']), permissionsController.getPermissionsByRole);
router.post('/admin/permissions', authMiddleware, roleMiddleware(['SUPER_ADMIN']), permissionsController.createPermission);
router.put('/admin/permissions/:id', authMiddleware, roleMiddleware(['SUPER_ADMIN']), permissionsController.updatePermission);
router.delete('/admin/permissions/:id', authMiddleware, roleMiddleware(['SUPER_ADMIN']), permissionsController.deletePermission);

// System Configuration
router.get('/admin/config', systemConfigController.getSystemConfig);
router.put('/admin/config', authMiddleware, roleMiddleware(['SUPER_ADMIN']), systemConfigController.updateSystemConfig);
router.get('/admin/config/:key', systemConfigController.getConfigValue);
router.post('/admin/config/:key', authMiddleware, roleMiddleware(['SUPER_ADMIN']), systemConfigController.setConfigValue);

// Audit & Monitoring
router.get('/admin/audit-logs', authMiddleware, roleMiddleware(['SUPER_ADMIN']), auditController.getAuditLogs);
router.get('/admin/audit-logs/user/:id', authMiddleware, roleMiddleware(['SUPER_ADMIN']), auditController.getUserAuditLogs);
router.get('/admin/audit-logs/action/:action', authMiddleware, roleMiddleware(['SUPER_ADMIN']), auditController.getAuditLogsByAction);
router.get('/admin/audit-stats', authMiddleware, roleMiddleware(['SUPER_ADMIN']), auditController.getAuditStatstics);

// ==================== ADMIN & SUPER ADMIN ROUTES ====================
// Admin Dashboard
router.get('/admin/dashboard/stats', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), adminController.getAdminDashboardStats);

// Product Management
router.get('/products/search', productsController.searchProducts);
router.get('/products', productsController.getAllProducts);
router.get('/products/:id', productsController.getProductById);
router.post('/products', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), productsController.createProduct);
router.put('/products/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), productsController.updateProduct);
router.post('/products/:id/deactivate', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), productsController.deactivateProduct);
router.post('/products/:id/activate', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), productsController.activateProduct);
router.delete('/products/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), productsController.deleteProduct);

// Category Management
router.get('/categories', categoriesController.getAllCategories);
router.get('/categories/:id', categoriesController.getCategoryById);
router.post('/categories', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), categoriesController.createCategory);
router.put('/categories/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), categoriesController.updateCategory);
router.delete('/categories/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), categoriesController.deleteCategory);
router.post('/categories/reorder', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), categoriesController.reorderCategories);

// Inventory Management
router.get('/inventory/product/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), inventoryController.getInventoryByProduct);
router.get('/inventory/warehouse/:warehouseId', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), inventoryController.getInventoryByWarehouse);
router.post('/inventory/product/:productId/add-stock', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), inventoryController.addStock);
router.post('/inventory/product/:productId/adjust-stock', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), inventoryController.adjustStock);
router.post('/inventory/product/:productId/set-threshold', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), inventoryController.setLowStockThreshold);
router.get('/inventory/product/:productId/movements', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), inventoryController.getInventoryMovements);
router.get('/inventory/warehouse/:warehouseId/low-stock', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), inventoryController.getLowStockProducts);
router.get('/inventory/stats', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), inventoryController.getInventoryStats);

// Order Management
router.get('/orders', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), ordersController.getAllOrders);
router.get('/orders/:id', authMiddleware, ordersController.getOrderById);
router.post('/orders/:id/status', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), ordersController.updateOrderStatus);
router.get('/orders/stats', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), ordersController.getOrderStats);

// Supplier Management - SUPER_ADMIN only
router.get('/suppliers', authMiddleware, roleMiddleware(['SUPER_ADMIN']), suppliersController.getAllSuppliers);
router.get('/suppliers/:id', authMiddleware, roleMiddleware(['SUPER_ADMIN']), suppliersController.getSupplierById);
router.post('/suppliers', authMiddleware, roleMiddleware(['SUPER_ADMIN']), suppliersController.createSupplier);
router.put('/suppliers/:id', authMiddleware, roleMiddleware(['SUPER_ADMIN']), suppliersController.updateSupplier);
router.post('/suppliers/:id/deactivate', authMiddleware, roleMiddleware(['SUPER_ADMIN']), suppliersController.deactivateSupplier);
router.post('/suppliers/:supplierId/products/:productId/link', authMiddleware, roleMiddleware(['SUPER_ADMIN']), suppliersController.linkProductToSupplier);
router.get('/suppliers/:supplierId/products', authMiddleware, roleMiddleware(['SUPER_ADMIN']), suppliersController.getSupplierProducts);

// ==================== USER ROUTES ====================
// Order Management
router.post('/orders', authMiddleware, ordersController.createOrder);
router.get('/my-orders', authMiddleware, ordersController.getUserOrders);
router.post('/orders/:id/cancel', authMiddleware, ordersController.cancelOrder);

// Shopping Cart
router.get('/cart', authMiddleware, cartController.getCart);
router.post('/cart/add', authMiddleware, cartController.addToCart);
router.put('/cart/:cartItemId', authMiddleware, cartController.updateCartItem);
router.delete('/cart/:cartItemId', authMiddleware, cartController.removeFromCart);
router.post('/cart/clear', authMiddleware, cartController.clearCart);
router.get('/cart/saved', authMiddleware, cartController.getSavedItems);
router.post('/cart/:cartItemId/save', authMiddleware, cartController.saveForLater);
router.post('/cart/:cartItemId/move', authMiddleware, cartController.moveToCart);

export default router;
