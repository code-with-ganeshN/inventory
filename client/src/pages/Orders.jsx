import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/Layout/UserLayout';
import { Card, Loading, Error, Badge, Button } from '../components/Common';
import { orderAPI } from '../api/endpoints';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getMyOrders();
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load orders');
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
  if (error) return <UserLayout><Error message={error} onRetry={fetchOrders} /></UserLayout>;

  return (
    <UserLayout>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Orders</h1>

      {orders.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet</p>
          <Button onClick={() => navigate('/products')}>Start Shopping</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Order #{order.order_number}</h3>
                  <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 py-4 border-y">
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="font-bold">{order.items?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-bold">₹{order.total_amount?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery</p>
                  <p className="font-bold">{order.shipping_address}</p>
                </div>
                <div className="text-right">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </UserLayout>
  );
}
