import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { items, subtotal, tax, total } = useSelector(state => state.cart);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
        <Link to="/products" className="text-blue-600 hover:underline">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {items.map(item => (
            <div key={item.id} className="border rounded-lg p-4 mb-4 flex gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{item.product_name}</h3>
                <p className="text-gray-600">SKU: {item.sku}</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">${item.price.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  className="w-16 px-2 py-1 border rounded"
                  disabled
                />
                <p className="mt-2 text-gray-600">
                  Subtotal: ${(item.price * item.quantity).toFixed(2)}
                </p>
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
              <span>Tax (10%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
