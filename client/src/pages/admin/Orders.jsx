import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { orderAPI } from '../../api/endpoints';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getAllOrders();
      setOrders(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await orderAPI.updateOrderStatus(selectedOrder.id, { status: newStatus });
      alert('Order status updated successfully');
      setShowModal(false);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Orders Management</h1>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={fetchOrders} className="ml-2 underline">Retry</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2 text-left">Order #</th>
                <th className="border p-2 text-left">Customer</th>
                <th className="border p-2 text-left">Amount</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="border p-2">{order.order_number}</td>
                  <td className="border p-2">
                    {order.first_name} {order.last_name}
                    <br />
                    <span className="text-sm text-gray-500">{order.user_email}</span>
                  </td>
                  <td className="border p-2">${parseFloat(order.total_amount).toFixed(2)}</td>
                  <td className="border p-2">
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="border p-2">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setNewStatus(order.status);
                        setShowModal(true);
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Update Status Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Update Order #{selectedOrder?.order_number}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateStatus}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Update Status
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
