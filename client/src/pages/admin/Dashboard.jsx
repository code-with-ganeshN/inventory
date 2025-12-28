import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Loading, Error, Badge } from '../../components/Common';
import { orderAPI, productAPI, inventoryAPI, auditAPI } from '../../api/endpoints';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    lowStockItems: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const ordersResponse = await orderAPI.getAllOrders();
      const productsResponse = await productAPI.getAllProducts();
      const inventoryResponse = await inventoryAPI.getInventoryByWarehouse();

      const orders = ordersResponse.data.orders || [];
      const products = productsResponse.data.products || [];
      const inventory = inventoryResponse.data.inventory || [];

      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const lowStockItems = inventory.filter(item => item.quantity <= item.reorder_level).length;

      setStats({
        totalOrders: orders.length,
        totalProducts: products.length,
        totalRevenue,
        lowStockItems,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
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
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.totalOrders}</div>
            <p className="text-gray-600">Total Orders</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{stats.totalProducts}</div>
            <p className="text-gray-600">Total Products</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">₹{(stats.totalRevenue / 100000).toFixed(1)}L</div>
            <p className="text-gray-600">Total Revenue</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">{stats.lowStockItems}</div>
            <p className="text-gray-600">Low Stock Items</p>
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card title="Recent Orders" className="mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Order #</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-bold">#{order.order_number}</td>
                  <td className="px-4 py-2">{order.user_name}</td>
                  <td className="px-4 py-2 text-right">₹{order.total_amount?.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <Badge variant={
                      order.status === 'DELIVERED' ? 'green' :
                      order.status === 'CANCELLED' ? 'red' :
                      order.status === 'SHIPPED' ? 'blue' : 'yellow'
                    }>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Quick Actions">
          <div className="space-y-2">
            <a href="/admin/products" className="block p-3 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
              → Manage Products
            </a>
            <a href="/admin/orders" className="block p-3 bg-green-50 text-green-600 rounded hover:bg-green-100">
              → Manage Orders
            </a>
            <a href="/admin/inventory" className="block p-3 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
              → Check Inventory
            </a>
          </div>
        </Card>

        <Card title="System Status">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Database</span>
              <Badge variant="green">Connected</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>API Server</span>
              <Badge variant="green">Running</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Backup Status</span>
              <Badge variant="green">Updated</Badge>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
