import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Loading, Error, Badge } from '../../components/Common';
import { UsersIcon, ProductIcon, CartIcon, ClipboardIcon } from '../../components/Icons';
import { adminAPI, orderAPI, productAPI, auditAPI } from '../../api/endpoints';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });
  const [recentAuditLogs, setRecentAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const usersResponse = await adminAPI.getAllUsers({ limit: 1000 });
      const ordersResponse = await orderAPI.getAllOrders();
      const productsResponse = await productAPI.getAllProducts();
      const auditResponse = await auditAPI.getAuditLogs({ limit: 10 });

      const totalRevenue = (ordersResponse.data.orders || []).reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );

      setStats({
        totalUsers: usersResponse.data.total || 0,
        totalOrders: ordersResponse.data.orders?.length || 0,
        totalProducts: productsResponse.data.products?.length || 0,
        totalRevenue,
      });

      setRecentAuditLogs((auditResponse.data.logs || []).slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AdminLayout><Loading /></AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Super Admin Dashboard</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center text-4xl font-bold text-blue-600 mb-2">
              <UsersIcon className="w-8 h-8 mr-2" />
              <span>{stats.totalUsers}</span>
            </div>
            <p className="text-gray-600">Total Users</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center text-4xl font-bold text-green-600 mb-2">
              <ProductIcon className="w-8 h-8 mr-2" />
              <span>{stats.totalProducts}</span>
            </div>
            <p className="text-gray-600">Total Products</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center text-4xl font-bold text-purple-600 mb-2">
              <CartIcon className="w-8 h-8 mr-2" />
              <span>{stats.totalOrders}</span>
            </div>
            <p className="text-gray-600">Total Orders</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">₹{(stats.totalRevenue / 100000).toFixed(1)}L</div>
            <p className="text-gray-600">Total Revenue</p>
          </div>
        </Card>
      </div>

      {/* Recent Audit Logs */}
      <Card title="Recent Activity" className="mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">Entity</th>
                <th className="px-4 py-2 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-4 text-center text-gray-600">
                    No recent activity
                  </td>
                </tr>
              ) : (
                recentAuditLogs.map((log, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{log.user_name}</td>
                    <td className="px-4 py-2">
                      <Badge variant={
                        log.action === 'CREATE' ? 'green' :
                        log.action === 'DELETE' ? 'red' :
                        log.action === 'UPDATE' ? 'blue' : 'gray'
                      }>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{log.entity_type}</td>
                    <td className="px-4 py-2">{new Date(log.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Management Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="User Management">
          <div className="space-y-2">
            <a href="/super-admin/users" className="block p-3 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
              → Manage Users
            </a>
            <a href="/super-admin/users" className="block p-3 bg-green-50 text-green-600 rounded hover:bg-green-100">
              → View User Roles
            </a>
          </div>
        </Card>

        <Card title="Access Control">
          <div className="space-y-2">
            <a href="/super-admin/roles" className="block p-3 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
              → Manage Roles
            </a>
            <a href="/super-admin/permissions" className="block p-3 bg-orange-50 text-orange-600 rounded hover:bg-orange-100">
              → Manage Permissions
            </a>
          </div>
        </Card>

        <Card title="System Configuration">
          <div className="space-y-2">
            <a href="/super-admin/config" className="block p-3 bg-red-50 text-red-600 rounded hover:bg-red-100">
              → System Config
            </a>
            <a href="/super-admin/audit" className="block p-3 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100">
              → Audit Logs
            </a>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
