import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import UserLayout from '../components/Layout/UserLayout';
import { Card, Loading, Error } from '../components/Common';
import { ProductIcon, BoltIcon, LockIcon, DashboardIcon, UsersIcon } from '../components/Icons';
import { productAPI } from '../api/endpoints';
import { setProducts, setLoading, setError } from '../store/productSlice';

export default function Home() {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products.products);
  const loading = useSelector((state) => state.products.loading);
  const error = useSelector((state) => state.products.error);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    dispatch(setLoading(true));
    try {
      const response = await productAPI.getAllProducts({ limit: 6, status: 'ACTIVE' });
      dispatch(setProducts(response.data.products));
    } catch (err) {
      dispatch(setError(err.response?.data?.error || 'Failed to load products'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <UserLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg py-12 px-6 mb-12">
        <h2 className="text-4xl font-bold mb-4">Welcome to Inventory Pro</h2>
        <p className="text-lg mb-6">Manage your inventory efficiently with our comprehensive solution</p>
        <Link
          to="/products"
          className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
        >
          Browse All Products
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
          <p className="text-gray-600">Products Available</p>
        </Card>
        <Card className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">1000+</div>
          <p className="text-gray-600">Happy Customers</p>
        </Card>
        <Card className="text-center">
          <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
          <p className="text-gray-600">Customer Support</p>
        </Card>
      </div>

      {/* Featured Products */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Featured Products</h3>
        
        {loading && <Loading />}
        {error && <Error message={error} onRetry={fetchFeaturedProducts} />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products && products.length > 0 ? (
            products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition cursor-pointer">
                <Link to={`/products/${product.id}`}>
                  <div className="bg-gray-200 h-40 rounded-lg mb-4 flex items-center justify-center text-gray-400">
                    <ProductIcon className="w-16 h-16 text-gray-400" />
                  </div>
                  <h4 className="font-bold text-lg mb-2 hover:text-blue-600">{product.name}</h4>
                  <p className="text-gray-600 text-sm mb-4">{product.description?.substring(0, 60)}...</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">₹{product.price}</span>
                    <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                  </div>
                </Link>
              </Card>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500 py-8">No products available</p>
          )}
        </div>
      </div>

      {/* Features Section */}
      <Card className="bg-gradient-to-r from-gray-50 to-white mb-12">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Why Choose Us?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex space-x-4">
            <div className="text-3xl"><BoltIcon className="w-8 h-8 text-yellow-500" /></div>
            <div>
              <h4 className="font-bold mb-2">Fast Delivery</h4>
              <p className="text-gray-600">Quick order processing and shipping</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="text-3xl"><LockIcon className="w-8 h-8 text-gray-700" /></div>
            <div>
              <h4 className="font-bold mb-2">Secure</h4>
              <p className="text-gray-600">Enterprise-grade security for your data</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="text-3xl"><DashboardIcon className="w-8 h-8 text-purple-600" /></div>
            <div>
              <h4 className="font-bold mb-2">Analytics</h4>
              <p className="text-gray-600">Detailed insights into your inventory</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="text-3xl"><UsersIcon className="w-8 h-8 text-blue-600" /></div>
            <div>
              <h4 className="font-bold mb-2">Support</h4>
              <p className="text-gray-600">24/7 customer support team</p>
            </div>
          </div>
        </div>
      </Card>
    </UserLayout>
  );
}
