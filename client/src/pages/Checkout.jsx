import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import UserLayout from '../components/Layout/UserLayout';
import { orderAPI, cartAPI } from '../api/endpoints';

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    delivery_address: '',
    delivery_phone: '',
    notes: ''
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.getCart();
      const cartData = response.data;
      if (cartData && cartData.items && Array.isArray(cartData.items)) {
        setCartItems(cartData.items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart');
    }
  };

  const { subtotal, tax, total } = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 1.0;
    return { subtotal, tax, total: subtotal + tax };
  }, [cartItems]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'delivery_address':
        if (!value.trim()) {
          newErrors.delivery_address = 'Delivery address is required';
        } else if (value.length < 30) {
          newErrors.delivery_address = 'Address must be at least 30 characters';
        } else if (value.length > 255) {
          newErrors.delivery_address = 'Address cannot exceed 255 characters';
        } else {
          delete newErrors.delivery_address;
        }
        break;
        
      case 'delivery_phone':
        if (!value.trim()) {
          newErrors.delivery_phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(value)) {
          newErrors.delivery_phone = 'Phone number must be exactly 10 digits';
        } else {
          delete newErrors.delivery_phone;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate all fields
    Object.keys(formData).forEach(key => {
      if (key !== 'notes') { // notes is optional
        validateField(key, formData[key]);
      }
    });

    if (Object.keys(errors).length > 0) {
      setError('Please fix the validation errors');
      setLoading(false);
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      setLoading(false);
      return;
    }

    try {
      await orderAPI.createOrder(formData);
      alert('Order placed successfully!');
      await cartAPI.clearCart();
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      setError(error.response?.data?.error || error.response?.data?.details || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <UserLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
          <Link to="/products" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Continue Shopping
          </Link>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address * (30-255 characters)
                </label>
                <textarea
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.delivery_address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your complete delivery address (minimum 30 characters)"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.delivery_address.length}/255 characters
                </p>
                {errors.delivery_address && (
                  <p className="text-red-500 text-sm mt-1">{errors.delivery_address}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number * (10 digits)
                </label>
                <input
                  type="tel"
                  name="delivery_phone"
                  value={formData.delivery_phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.delivery_phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1234567890"
                  maxLength="10"
                  required
                />
                {errors.delivery_phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.delivery_phone}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special delivery instructions"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (100%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
