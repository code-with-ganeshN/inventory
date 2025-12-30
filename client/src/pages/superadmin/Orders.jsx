import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error, Badge } from '../../components/Common';
import { orderAPI } from '../../api/endpoints';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;
    
    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at).toDateString();
        const filterDate = new Date(dateFilter).toDateString();
        return orderDate === filterDate;
      });
    }
    
    setFilteredOrders(filtered);
  }, [orders, statusFilter, dateFilter]);

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
      await orderAPI.updateOrderStatus(selectedOrder.id, newStatus);
      alert('Order status updated successfully');
      setShowModal(false);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order');
    }
  };

  const resetFilters = () => {
    setStatusFilter('ALL');
    setDateFilter('');
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
    { key: 'total_amount', label: 'Amount', render: (row) => `$${parseFloat(row.total_amount).toFixed(2)}` },
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
        <button
          className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors cursor-pointer"
          onClick={() => {
            setSelectedOrder(row);
            setNewStatus(row.status);
            setShowModal(true);
          }}
          title="Update Order Status"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Orders Management</h1>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {(statusFilter !== 'ALL' || dateFilter) && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={resetFilters}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {loading && <Loading />}
      {error && <Error message={error} onRetry={fetchOrders} />}

      <Card>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="border p-3 text-left font-medium text-gray-700">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="border p-3 text-sm">{order.order_number}</td>
                  <td className="border p-3 text-sm">${parseFloat(order.total_amount).toFixed(2)}</td>
                  <td className="border p-3">
                    <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
                  </td>
                  <td className="border p-3 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="border p-3">
                    <div className="flex gap-2">
                      <button
                        className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowViewModal(true);
                        }}
                        title="View Order Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {columns[4].render(order)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              <option value="CONFIRMED">Confirmed</option>
              <option value="PACKED">Packed</option>
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

      <Modal
        isOpen={showViewModal}
        title={`Order Details - #${selectedOrder?.order_number}`}
        onClose={() => setShowViewModal(false)}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Order Number</label>
                <p className="text-sm text-gray-900">{selectedOrder.order_number}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <Badge variant={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer</label>
                <p className="text-sm text-gray-900">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                <p className="text-xs text-gray-500">{selectedOrder.user_email}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Amount</label>
                <p className="text-sm text-gray-900 font-semibold">${parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Order Date</label>
                <p className="text-sm text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Updated</label>
                <p className="text-sm text-gray-900">{new Date(selectedOrder.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Address</label>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-900">{selectedOrder.shipping_address}</p>
              </div>
            </div>

            {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Order Items</label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.product_name || 'Product'}</p>
                          <p className="text-xs text-gray-500">SKU: {item.sku || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">Qty: {item.quantity}</p>
                          <p className="text-sm font-medium text-gray-900">${parseFloat(item.price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
