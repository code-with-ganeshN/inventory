import { useState, useEffect } from 'react';
import { productAPI, categoryAPI } from '../../api/endpoints';
import AdminLayout from '../../components/Layout/AdminLayout';
import { validateForm, validateFieldRealTime, sanitizeInput, productSchema } from '../../utils/validation';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    stock: '',
    low_stock_threshold: '10',
  });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});

  const handleInputChange = (field, value, fieldType) => {
    // Sanitize input based on field type
    const sanitizedValue = sanitizeInput(value, fieldType);
    
    // Update form data
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Mark field as touched
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    
    // Real-time validation
    if (fieldTouched[field] || sanitizedValue) {
      const error = validateFieldRealTime(field, sanitizedValue, productSchema);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories for product form...');
      const response = await categoryAPI.getAllCategories();
      console.log('Categories response for products:', response);
      const categoriesData = Array.isArray(response.data) ? response.data : [];
      console.log('Setting categories:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories for products:', error);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getAllProducts({});
      // tolerate different response shapes: API may return array or wrapped { data: { products: [...] } }
      const payload = response.data;
      const productsList = Array.isArray(payload)
        ? payload
        : payload?.data?.products || payload?.products || payload?.data || [];
      setProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(formData, productSchema);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setErrors({});
    
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || null,
        price: Number(formData.price),
        category_id: Number(formData.category_id),
        image_url: formData.image_url || null,
        stock: formData.stock ? Number(formData.stock) : undefined,
        low_stock_threshold: formData.low_stock_threshold ? Number(formData.low_stock_threshold) : undefined,
      };

      let resp;
      if (editingId) {
        resp = await productAPI.updateProduct(editingId, payload);
        alert('Product updated successfully');
      } else {
        resp = await productAPI.createProduct(payload);
        alert('Product created successfully');
      }
      console.log('Create product response:', resp.data);
      setFormData({
        name: '',
        sku: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        stock: '',
        low_stock_threshold: '10',
      });
      setShowForm(false);
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error.response || error);
      const errMsg = error.response?.data?.error || error.message || 'Failed to create product';
      alert(errMsg);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      price: product.price || '',
      category_id: product.category_id || '',
      image_url: product.image_url || '',
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await productAPI.deactivateProduct(id);
      alert('Product deactivated');
      fetchProducts();
    } catch (err) {
      console.error('Error deactivating product', err);
      alert(err.response?.data?.error || 'Failed to deactivate product');
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('Are you sure you want to activate this product?')) return;
    try {
      await productAPI.activateProduct(id);
      alert('Product activated');
      fetchProducts();
    } catch (err) {
      console.error('Error activating product', err);
      alert(err.response?.data?.error || 'Failed to activate product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      await productAPI.deleteProduct(id);
      alert('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product', err);
      alert(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleView = (product) => {
    // Navigate to product detail page
    window.location.href = `/products/${product.id}`;
  };

  const handleAdjustInventory = (productId) => {
    // navigate to inventory page with productId query param
    window.location.href = `/admin/inventory?productId=${productId}`;
  };

  return (
    <AdminLayout>
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
            <div>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value, 'alphanumeric')}
                onBlur={() => setFieldTouched(prev => ({ ...prev, name: true }))}
                required
                className={`border rounded px-3 py-2 w-full ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <input
                type="text"
                placeholder="SKU"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value, 'sku')}
                onBlur={() => setFieldTouched(prev => ({ ...prev, sku: true }))}
                required
                className={`border rounded px-3 py-2 w-full ${errors.sku ? 'border-red-500' : ''}`}
              />
              {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
            </div>
            <div>
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value, 'number')}
                onBlur={() => setFieldTouched(prev => ({ ...prev, price: true }))}
                required
                className={`border rounded px-3 py-2 w-full ${errors.price ? 'border-red-500' : ''}`}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
            <div>
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value, 'number')}
                onBlur={() => setFieldTouched(prev => ({ ...prev, category_id: true }))}
                required
                className={`border rounded px-3 py-2 w-full ${errors.category_id ? 'border-red-500' : ''}`}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
            </div>
            <div className="col-span-full">
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value, 'text')}
                onBlur={() => setFieldTouched(prev => ({ ...prev, description: true }))}
                className={`border rounded px-3 py-2 w-full ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            <div className="col-span-full">
              <input
                type="url"
                placeholder="Image URL"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value, 'url')}
                onBlur={() => setFieldTouched(prev => ({ ...prev, image_url: true }))}
                className={`border rounded px-3 py-2 w-full ${errors.image_url ? 'border-red-500' : ''}`}
              />
              {errors.image_url && <p className="text-red-500 text-sm mt-1">{errors.image_url}</p>}
            </div>
            <div className="col-span-full">
              <input
                type="number"
                min="0"
                placeholder="Initial Stock"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value, 'number')}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <div className="col-span-full">
              <input
                type="number"
                min="0"
                placeholder="Low Stock Threshold (default: 10)"
                value={formData.low_stock_threshold}
                onChange={(e) => handleInputChange('low_stock_threshold', e.target.value, 'number')}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {editingId ? 'Update Product' : 'Create Product'}
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
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">SKU</th>
                <th className="border p-2 text-left">Price</th>
                <th className="border p-2 text-left">Stock</th>
                <th className="border p-2 text-left">Low Stock Threshold</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="border p-2">{product.id}</td>
                  <td className="border p-2">{product.name}</td>
                  <td className="border p-2">{product.sku}</td>
                  <td className="border p-2">${product.price}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-white ${
                      (product.stock || 0) === 0 ? 'bg-red-700' : 
                      (product.stock || 0) <= (product.low_stock_threshold || 10) ? 'bg-yellow-600' : 'bg-green-600'
                    }`}>
                      {product.stock || 0} {(product.stock || 0) <= (product.low_stock_threshold || 10) && (product.stock || 0) > 0 ? '(Low)' : ''}
                      {(product.stock || 0) === 0 ? '(Out)' : ''}
                    </span>
                  </td>
                  <td className="border p-2">{product.low_stock_threshold || 10}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-white ${product.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="border p-2">
                    <div className="flex flex-wrap gap-2">
                      <button 
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        onClick={() => handleView(product)}
                      >
                        View
                      </button>
                      <button 
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
                      <button 
                        className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                        onClick={() => handleAdjustInventory(product.id)}
                      >
                        Inventory
                      </button>
                      {product.is_active ? (
                        <button 
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          onClick={() => handleDelete(product.id)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <>
                          <button 
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                            onClick={() => handleActivate(product.id)}
                          >
                            Activate
                          </button>
                          <button 
                            className="bg-red-700 text-white px-3 py-1 rounded text-sm hover:bg-red-800"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
