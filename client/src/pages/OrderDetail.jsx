import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserLayout from '../components/Layout/UserLayout';
import { Card, Loading, Error, Badge, Button } from '../components/Common';
import { orderAPI } from '../api/endpoints';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getOrderById(id);
      setOrder(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load order');
    } finally {
      setLoading(false);
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

  if (loading) return <UserLayout><Loading /></UserLayout>;
  if (error) return <UserLayout><Error message={error} onRetry={fetchOrder} /></UserLayout>;
  if (!order) return <UserLayout><Error message="Order not found" /></UserLayout>;

  return (
    <UserLayout>
      <button
        onClick={() => navigate('/orders')}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center space-x-1"
      >
        <span>←</span>
        <span>Back to Orders</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Order Status */}
        <Card>
          <h3 className="font-bold text-lg mb-4">Order Status</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={getStatusColor(order.status)} className="mt-2">
                {order.status}
              </Badge>
            </div>
            <div className="text-3xl">
              {order.status === 'DELIVERED' && '✅'}
              {order.status === 'CANCELLED' && '❌'}
              {order.status === 'SHIPPED' && '🚚'}
              {order.status === 'PROCESSING' && '⏳'}
              {order.status === 'PENDING' && '📋'}
            </div>
          </div>
        </Card>

        {/* Order Information */}
        <Card>
          <h3 className="font-bold text-lg mb-4">Order Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="font-bold">#{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>

        {/* Amount Summary */}
        <Card>
          <h3 className="font-bold text-lg mb-4">Amount</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{(order.total_amount / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (100%)</span>
              <span>₹{(order.total_amount / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold text-lg">
              <span>Total</span>
              <span className="text-blue-600">₹{order.total_amount?.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Order Items */}
      <Card title="Order Items" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-center">Quantity</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{item.product_name}</td>
                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">₹{item.unit_price?.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-bold">
                    ₹{(item.quantity * item.unit_price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Shipping Address */}
      <Card title="Shipping Address">
        <p className="text-gray-800">{order.shipping_address}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm">
            Edit Delivery Address
          </Button>
          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <Button variant="danger" size="sm">
              Cancel Order
            </Button>
          )}
        </div>
      </Card>
    </UserLayout>
  );
}
