import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error, Badge } from '../../components/Common';
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
      setOrders(response.data.orders || []);
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
      PENDING: 'yellow',
      PROCESSING: 'blue',
      SHIPPED: 'blue',
      DELIVERED: 'green',
      CANCELLED: 'red',
    };
    return colors[status] || 'gray';
  };

  const columns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'user_name', label: 'Customer' },
    { key: 'total_amount', label: 'Amount', render: (row) => `₹${row.total_amount.toFixed(2)}` },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={getStatusColor(row.status)}>{row.status}</Badge>,
    },
    { key: 'created_at', label: 'Date', render: (row) => new Date(row.created_at).toLocaleDateString() },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          onClick={() => {
            setSelectedOrder(row);
            setNewStatus(row.status);
            setShowModal(true);
          }}
        >
          Update
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Orders Management</h1>
        <Button onClick={fetchOrders}>Refresh</Button>
      </div>

      {loading && <Loading />}
      {error && <Error message={error} onRetry={fetchOrders} />}

      <Card>
        <Table
          columns={columns}
          data={orders}
          loading={loading}
          error={error}
          onRetry={fetchOrders}
        />
      </Card>

      <Modal
        isOpen={showModal}
        title={`Update Order #${selectedOrder?.order_number}`}
        onClose={() => setShowModal(false)}
      >
        <form onSubmit={handleUpdateStatus}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Order Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <Button type="submit" variant="primary">Update Status</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
