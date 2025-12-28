import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setProducts } from '../store/productSlice';
import { productAPI } from '../api/endpoints';

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
      const params = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (searchTerm) params.query = searchTerm;
      
      const response = await productAPI.getAllProducts(params);
      dispatch(setProducts(response.data));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2">SKU: {product.sku}</p>
              <p className="text-2xl font-bold text-blue-600 mb-4">${product.price.toFixed(2)}</p>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
