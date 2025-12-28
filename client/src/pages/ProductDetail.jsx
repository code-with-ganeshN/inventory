import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import UserLayout from '../components/Layout/UserLayout';
import { Card, Button, Input, Loading, Error } from '../components/Common';
import { productAPI } from '../api/endpoints';
import { addItem } from '../store/cartSlice';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getProductById(id);
      setProduct(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (quantity > 0) {
      dispatch(addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: parseInt(quantity),
        sku: product.sku,
      }));
      alert('Product added to cart!');
    }
  };

  if (loading) return <UserLayout><Loading /></UserLayout>;
  if (error) return <UserLayout><Error message={error} onRetry={fetchProduct} /></UserLayout>;
  if (!product) return <UserLayout><Error message="Product not found" /></UserLayout>;

  return (
    <UserLayout>
      <button
        onClick={() => navigate('/products')}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center space-x-1"
      >
        <span>←</span>
        <span>Back to Products</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <Card className="bg-gray-100 h-96 flex items-center justify-center text-6xl text-gray-400">
          📦
        </Card>

        {/* Product Details */}
        <Card>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">{product.name}</h1>
          <p className="text-gray-600 mb-4">SKU: {product.sku}</p>

          {/* Price */}
          <div className="mb-6">
            <p className="text-gray-600 mb-2">Price</p>
            <p className="text-4xl font-bold text-blue-600">₹{product.price?.toFixed(2)}</p>
          </div>

          {/* Category */}
          <div className="mb-6">
            <p className="text-gray-600 mb-2">Category</p>
            <p className="text-lg text-gray-800">{product.category_id}</p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-600 mb-2">Description</p>
            <p className="text-gray-800">{product.description}</p>
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            <p className="text-gray-600 mb-2">Stock Status</p>
            <p className={`font-bold ${product.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
              {product.status === 'ACTIVE' ? '✓ In Stock' : '✗ Out of Stock'}
            </p>
          </div>

          {/* Quantity Selection */}
          <div className="mb-6">
            <Input
              type="number"
              label="Quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Add to Cart Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleAddToCart}
            className="w-full mb-3"
          >
            🛒 Add to Cart
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/products')}
            className="w-full"
          >
            Continue Shopping
          </Button>
        </Card>
      </div>

      {/* Related Products Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Related Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder for related products */}
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="bg-gray-200 h-40 rounded-lg mb-4 flex items-center justify-center text-gray-400">
                📦
              </div>
              <h4 className="font-bold mb-2">Related Product {i}</h4>
              <p className="text-blue-600 font-bold">₹999</p>
            </Card>
          ))}
        </div>
      </div>
    </UserLayout>
  );
}
