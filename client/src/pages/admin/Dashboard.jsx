import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Loading, Error, Badge } from '../../components/Common';
import { adminAPI } from '../../api/endpoints';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data);
    } catch (err) {
      console.error('Admin dashboard load error:', err.response || err);
      setError(err.response?.data?.error || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AdminLayout><Loading /></AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.totalProducts}</div>
            <p className="text-gray-600">Total Products</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{stats.activeProducts}</div>
            <p className="text-gray-600">Active Products</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">{stats.inactiveProducts}</div>
            <p className="text-gray-600">Inactive Products</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">{stats.lowStockProducts}</div>
            <p className="text-gray-600">Low Stock Products</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Quick Actions">
          <div className="space-y-2">
            <a href="/admin/products" className="block p-3 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
              → Manage Products
            </a>
            <a href="/admin/categories" className="block p-3 bg-green-50 text-green-600 rounded hover:bg-green-100">
              → Manage Categories
            </a>
            <a href="/admin/inventory" className="block p-3 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
              → Check Inventory
            </a>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
