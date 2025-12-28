import { useState, useEffect } from 'react';
import { productAPI } from '../../api/endpoints';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getAllProducts({});
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await productAPI.createProduct(formData);
      setFormData({
        name: '',
        sku: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
      });
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg mb-8 shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Category ID"
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="border rounded px-3 py-2 col-span-full"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={formData.image_url}
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
              className="border rounded px-3 py-2 col-span-full"
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create Product
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">SKU</th>
                <th className="border p-2 text-left">Price</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="border p-2">{product.name}</td>
                  <td className="border p-2">{product.sku}</td>
                  <td className="border p-2">${product.price}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-white ${product.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="border p-2">
                    <button className="text-blue-600 hover:underline mr-2">Edit</button>
                    <button className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
