import { useState, useEffect } from 'react';
import { productAPI, categoryAPI } from '../../api/endpoints';
import AdminLayout from '../../components/Layout/AdminLayout';
import { validateForm, validateFieldRealTime, sanitizeInput, productSchema } from '../../utils/validation';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [filter, setFilter] = useState('all');
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
    
    // Create validation data - only validate required fields for updates
    const validationData = { ...formData };
    
    // For updates, don't require stock and threshold if they're empty
    if (editingId) {
      // Remove empty optional fields from validation
      if (!validationData.stock) delete validationData.stock;
      if (!validationData.low_stock_threshold) delete validationData.low_stock_threshold;
      if (!validationData.image_url) delete validationData.image_url;
      if (!validationData.description) delete validationData.description;
    }
    
    // Validate form
    const validation = validateForm(validationData, productSchema);
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
      stock: product.stock || '',
      low_stock_threshold: product.low_stock_threshold || '10',
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
    setViewingProduct(product);
    setShowViewModal(true);
  };

  // Filter products based on selected filter
  const filteredProducts = products.filter(product => {
    switch (filter) {
      case 'out_of_stock':
        return (product.stock || 0) === 0;
      case 'low_stock':
        return (product.stock || 0) > 0 && (product.stock || 0) <= (product.low_stock_threshold || 10);
      case 'inactive':
        return !product.is_active;
      default:
        return true;
    }
  });

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <div className="flex gap-2 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-2 bg-white text-gray-700"
          >
            <option value="all">All Products</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="inactive">Inactive</option>
          </select>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {(showForm || editingId) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingId ? `Edit Product: ${formData.name}` : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
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
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
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
                min="1"
                placeholder="Initial Stock (minimum 1)"
                value={formData.stock}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (parseInt(value) >= 1)) {
                    handleInputChange('stock', value, 'number');
                  }
                }}
                onBlur={() => {
                  if (formData.stock && parseInt(formData.stock) < 1) {
                    handleInputChange('stock', '1', 'number');
                  }
                }}
                className={`border rounded px-3 py-2 w-full ${errors.stock ? 'border-red-500' : ''}`}
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
              <p className="text-sm text-gray-500 mt-1">Stock must be at least 1 unit</p>
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
          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {editingId ? 'Update Product' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
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
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
          </form>
          </div>
        </div>
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
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="border p-2">{product.id}</td>
                  <td className="border p-2">{product.name}</td>
                  <td className="border p-2">{product.sku}</td>
                  <td className="border p-2">${product.price}</td>
                  <td className="border p-2">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="font-medium">{product.stock || 0}</span>
                      {(product.stock || 0) === 0 ? (
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 font-medium">
                          OUT OF STOCK
                        </span>
                      ) : (product.stock || 0) <= (product.low_stock_threshold || 10) ? (
                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 font-medium">
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 font-medium">
                          IN STOCK
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border p-2">{product.low_stock_threshold || 10}</td>
                  <td className="border p-2">
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="border p-2">
                    <div className="flex flex-wrap gap-2">
                      <button 
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors cursor-pointer"
                        onClick={() => handleView(product)}
                        title="View Product Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 transition-colors cursor-pointer"
                        onClick={() => handleEdit(product)}
                        title="Edit Product"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {product.is_active ? (
                        <button 
                          className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors cursor-pointer"
                          onClick={() => handleDelete(product.id)}
                          title="Deactivate Product"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      ) : (
                        <>
                          <button 
                            className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors cursor-pointer"
                            onClick={() => handleActivate(product.id)}
                            title="Activate Product"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button 
                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors cursor-pointer"
                            onClick={() => handleDeleteProduct(product.id)}
                            title="Delete Product Permanently"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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

      {/* Product View Modal */}
      {showViewModal && viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Product Details</h2>
              <button 
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                <p className="text-gray-900">{viewingProduct.id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{viewingProduct.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <p className="text-gray-900">{viewingProduct.sku}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <p className="text-gray-900">${viewingProduct.price}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-gray-900">
                  {categories.find(cat => cat.id === viewingProduct.category_id)?.name || 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <p className={`font-semibold ${
                  (viewingProduct.stock || 0) === 0 ? 'text-red-600' : 
                  (viewingProduct.stock || 0) <= (viewingProduct.low_stock_threshold || 10) ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {viewingProduct.stock || 0} units
                  {(viewingProduct.stock || 0) <= (viewingProduct.low_stock_threshold || 10) && (viewingProduct.stock || 0) > 0 && ' (Low Stock)'}
                  {(viewingProduct.stock || 0) === 0 && ' (Out of Stock)'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <p className="text-gray-900">{viewingProduct.low_stock_threshold || 10} units</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 rounded text-white text-sm ${
                  viewingProduct.is_active ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {viewingProduct.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{viewingProduct.description || 'No description available'}</p>
              </div>
              
              {viewingProduct.image_url && (
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  <img 
                    src={viewingProduct.image_url} 
                    alt={viewingProduct.name}
                    className="max-w-xs h-auto rounded border"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">
                  {viewingProduct.created_at ? new Date(viewingProduct.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-gray-900">
                  {viewingProduct.updated_at ? new Date(viewingProduct.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setShowViewModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
