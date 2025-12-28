import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import UserLayout from '../components/Layout/UserLayout';
import { Card, Button, Input, Select } from '../components/Common';
import { clearCart } from '../store/cartSlice';
import { orderAPI } from '../api/endpoints';

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state) => state.cart);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'CARD',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (items.length === 0) {
    return (
      <UserLayout>
        <Card className="text-center py-12">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
        </Card>
      </UserLayout>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        shipping_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        payment_method: formData.paymentMethod,
        total_amount: total,
      };

      const response = await orderAPI.createOrder(orderData);
      alert('Order placed successfully! Order ID: ' + response.data.order_id);
      dispatch(clearCart());
      navigate(`/orders/${response.data.order_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const taxAmount = total * 0.18; // 18% tax
  const finalTotal = total + taxAmount;

  return (
    <UserLayout>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <Card title="Delivery Details">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <Input
                type="email"
                name="email"
                label="Email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <Input
                type="tel"
                name="phone"
                label="Phone Number"
                placeholder="+91-9999999999"
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <Input
                type="text"
                name="address"
                label="Street Address"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={handleChange}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="city"
                  label="City"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="text"
                  name="state"
                  label="State"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>

              <Input
                type="text"
                name="zipCode"
                label="ZIP Code"
                value={formData.zipCode}
                onChange={handleChange}
                required
              />

              <Select
                name="paymentMethod"
                label="Payment Method"
                value={formData.paymentMethod}
                onChange={handleChange}
                options={[
                  { label: 'Credit Card', value: 'CARD' },
                  { label: 'Debit Card', value: 'DEBIT' },
                  { label: 'Net Banking', value: 'NETBANKING' },
                  { label: 'UPI', value: 'UPI' },
                ]}
              />

              <div className="flex gap-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/cart')}
                  disabled={loading}
                >
                  Back to Cart
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card title="Order Summary" className="sticky top-6">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18%)</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between bg-blue-50 p-3 rounded text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}
