import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cartAPI } from '../api/endpoints';
import UserLayout from '../components/Layout/UserLayout';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      console.log('Fetching cart...');
      const response = await cartAPI.getCart();
      console.log('Cart response:', response.data);
      
      // Handle the response structure from the API
      const cartData = response.data;
      if (cartData && cartData.items) {
        setCartItems(cartData.items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        setError('Please login to view your cart');
      } else {
        setError(error.response?.data?.error || 'Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await cartAPI.removeFromCart(cartItemId);
      fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove item from cart');
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      await cartAPI.updateCartItem(cartItemId, { quantity });
      fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity');
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems
      .filter(item => item.is_active) // Only count active products
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 1.0;
    return { subtotal, tax, total: subtotal + tax };
  };

  const { subtotal, tax, total } = calculateTotal();

  return (
    <UserLayout>
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {loading && <div className="text-center py-8">Loading cart...</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      {!loading && cartItems.length === 0 && (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <Link to="/products" className="text-blue-600 hover:underline">
            Continue Shopping
          </Link>
        </div>
      )}

      {!loading && cartItems.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {cartItems.map(item => (
              <div key={item.id} className={`border rounded-lg p-4 mb-4 flex gap-4 ${!item.is_active ? 'bg-red-50 border-red-200' : ''}`}>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{item.product_name}</h3>
                  <p className="text-gray-600">SKU: {item.sku}</p>
                  {!item.is_active && (
                    <p className="text-red-600 font-semibold mt-1">⚠️ Product not available</p>
                  )}
                  <p className="text-2xl font-bold text-blue-600 mt-2">${Number(item.price).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  {item.is_active ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 border rounded">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 bg-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-gray-600 mb-2">
                        Subtotal: ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p className="text-red-600 mb-2 font-semibold">Cannot order</p>
                  )}
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-6 rounded-lg h-fit">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (100%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <Link 
              to="/checkout"
              className="block w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 text-center"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
