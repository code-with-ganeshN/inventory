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
          <div className="space-y-3">
            <a 
              href="/admin/products" 
              className="block p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <div>
                  <div className="font-semibold">Product Management</div>
                  <div className="text-sm text-blue-500">Manage all products and inventory</div>
                </div>
              </div>
            </a>
            <a 
              href="/admin/categories" 
              className="block p-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <div>
                  <div className="font-semibold">Category Management</div>
                  <div className="text-sm text-green-500">Organize and manage categories</div>
                </div>
              </div>
            </a>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
