import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setProducts, setError } from '../store/productSlice';
import { productAPI, cartAPI } from '../api/endpoints';
import UserLayout from '../components/Layout/UserLayout';

export default function ProductBrowser() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useDispatch();
  const products = useSelector(state => state.products.products);
  const loading = useSelector(state => state.products.loading);
  const error = useSelector(state => state.products.error);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    dispatch(setLoading(true));
    try {
      dispatch(setError(null));
      const params = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (searchTerm) params.query = searchTerm;
      
      const response = await productAPI.getAllProducts(params);
      // Normalize response: handle array or wrapped payload
      const payload = response.data;
      const productsList = Array.isArray(payload)
        ? payload
        : payload?.data?.products || payload?.products || payload?.data || [];
      dispatch(setProducts(productsList));
    } catch (error) {
      console.error('Error fetching products:', error);
      dispatch(setError(error.response?.data?.error || error.message || 'Failed to load products'));
      dispatch(setProducts([]));
    }
  };

  const addToCart = async (productId) => {
    try {
      await cartAPI.addToCart({ product_id: productId, quantity: 1 });
      alert('Product added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.response?.data?.error || 'Failed to add product to cart');
    }
  };

  return (
    <UserLayout>
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      
      {loading && <div className="text-center py-8 text-gray-600">Loading products...</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}
      
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {!loading && products.length === 0 && !error && (
        <div className="text-center py-8 text-gray-600">No products found.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className={`border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${!product.is_active ? 'opacity-50 blur-sm' : ''}`}>
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2">SKU: {product.sku}</p>
              <p className="text-2xl font-bold text-blue-600 mb-4">${Number(product.price).toFixed(2)}</p>
              <button 
                onClick={() => addToCart(product.id)}
                disabled={!product.is_active}
                className={`w-full py-2 rounded ${
                  product.is_active 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                {product.is_active ? 'Add to Cart' : 'Unavailable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </UserLayout>
  );
}
