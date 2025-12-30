import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Loading, Error, Badge } from '../../components/Common';
import { UsersIcon, CartIcon } from '../../components/Icons';
import { adminAPI, orderAPI, userAPI } from '../../api/endpoints';
import { Link } from 'react-router-dom';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch users and orders separately with error handling
      let totalUsers = 0;
      let orders = [];
      
      // Fetch users using userAPI instead of adminAPI
      try {
        const usersResponse = await userAPI.getAllUsers();
        console.log('Full users response:', usersResponse);
        console.log('Users response data:', usersResponse.data);
        console.log('Nested data:', usersResponse.data.data);
        
        // Handle double-nested response structure
        const userData = usersResponse.data.data || usersResponse.data;
        console.log('Actual user data:', userData);
        
        if (userData) {
          if (Array.isArray(userData)) {
            totalUsers = userData.length;
            console.log('Users count from array:', totalUsers);
          } else if (userData.users && Array.isArray(userData.users)) {
            totalUsers = userData.users.length;
            console.log('Users count from users array:', totalUsers);
          } else if (userData.total) {
            totalUsers = userData.total;
            console.log('Users count from total field:', totalUsers);
          } else {
            // Try to extract from any array field in the response
            const dataKeys = Object.keys(userData);
            console.log('Available keys in user data:', dataKeys);
            for (const key of dataKeys) {
              if (Array.isArray(userData[key])) {
                totalUsers = userData[key].length;
                console.log(`Users count from ${key} array:`, totalUsers);
                break;
              }
            }
          }
        }
      } catch (userError) {
        console.error('Error fetching users:', userError);
        // Fallback to adminAPI if userAPI fails
        try {
          const adminUsersResponse = await adminAPI.getAllUsers();
          console.log('Admin users response:', adminUsersResponse);
          if (adminUsersResponse.data) {
            if (Array.isArray(adminUsersResponse.data)) {
              totalUsers = adminUsersResponse.data.length;
            } else if (adminUsersResponse.data.users && Array.isArray(adminUsersResponse.data.users)) {
              totalUsers = adminUsersResponse.data.users.length;
            } else if (adminUsersResponse.data.total) {
              totalUsers = adminUsersResponse.data.total;
            }
          }
        } catch (adminError) {
          console.error('Error fetching users from admin API:', adminError);
        }
      }
      
      try {
        const ordersResponse = await orderAPI.getAllOrders();
        console.log('Full orders response:', ordersResponse);
        
        if (ordersResponse.data) {
          if (Array.isArray(ordersResponse.data)) {
            orders = ordersResponse.data;
          } else if (ordersResponse.data.orders && Array.isArray(ordersResponse.data.orders)) {
            orders = ordersResponse.data.orders;
          }
        }
      } catch (orderError) {
        console.error('Error fetching orders:', orderError);
      }
      
      const pendingOrders = orders.filter(order => order.status === 'PENDING').length;
      const deliveredOrders = orders.filter(order => order.status === 'DELIVERED');
      const revenue = deliveredOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

      console.log('Final stats:', { totalUsers, totalOrders: orders.length, pendingOrders, revenue });

      setStats({
        totalUsers,
        totalOrders: orders.length,
        pendingOrders,
        revenue,
      });
    } catch (err) {
      console.error('Dashboard error:', err);
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
            <div className="flex items-center justify-center text-4xl font-bold text-purple-600 mb-2">
              <CartIcon className="w-8 h-8 mr-2" />
              <span>{stats.totalOrders}</span>
            </div>
            <p className="text-gray-600">Total Orders</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center text-4xl font-bold text-yellow-600 mb-2">
              <CartIcon className="w-8 h-8 mr-2" />
              <span>{stats.pendingOrders}</span>
            </div>
            <p className="text-gray-600">Pending Orders</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">${stats.revenue.toFixed(2)}</div>
            <p className="text-gray-600">Revenue</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Quick Access">
          <div className="space-y-3">
            <Link 
              to="/superadmin/users" 
              className="block p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <UsersIcon className="w-6 h-6 mr-3" />
                <div>
                  <div className="font-semibold">User Management</div>
                  <div className="text-sm text-blue-500">Manage all users and roles</div>
                </div>
              </div>
            </Link>
            <Link 
              to="/superadmin/orders" 
              className="block p-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <CartIcon className="w-6 h-6 mr-3" />
                <div>
                  <div className="font-semibold">Order Management</div>
                  <div className="text-sm text-purple-500">View and manage all orders</div>
                </div>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
