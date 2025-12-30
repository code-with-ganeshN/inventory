import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { inventoryAPI, productAPI } from '../../api/endpoints';

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 0,
    low_stock_threshold: 10,
  });
  const [queryProductId, setQueryProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    // Check URL for productId query param
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('productId');
    if (pid) {
      setQueryProductId(Number(pid));
      setFormData(prev => ({ ...prev, product_id: Number(pid) }));
      setShowModal(true); // Auto-open modal for specific product
    }
    fetchInventory();
    fetchProducts();
  }, [queryProductId]);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAllProducts({});
      const productsList = Array.isArray(response.data) ? response.data : response.data?.products || [];
      setProducts(productsList);
      
      // If we have a query product ID, find and set the selected product
      if (queryProductId) {
        const product = productsList.find(p => p.id === queryProductId);
        setSelectedProduct(product);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      if (queryProductId) {
        // Get specific product inventory
        const response = await inventoryAPI.getInventoryByProduct(queryProductId);
        setInventory(Array.isArray(response.data) ? response.data : []);
      } else {
        // Get all products and their inventory status
        const [inventoryResponse, productsResponse] = await Promise.all([
          inventoryAPI.getInventoryByWarehouse(1).catch(() => ({ data: [] })),
          productAPI.getAllProducts({})
        ]);
        
        const inventoryData = Array.isArray(inventoryResponse.data) ? inventoryResponse.data : [];
        const productsData = Array.isArray(productsResponse.data) ? productsResponse.data : productsResponse.data?.products || [];
        
        // Create inventory view combining products with their inventory data
        const inventoryView = productsData.map(product => {
          const inventoryItem = inventoryData.find(inv => inv.product_id === product.id);
          return {
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            quantity_on_hand: inventoryItem?.quantity_on_hand || 0,
            low_stock_threshold: inventoryItem?.low_stock_threshold || 10,
            ...inventoryItem
          };
        });
        
        setInventory(inventoryView);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load inventory');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.adjustStock(formData.product_id, {
        warehouse_id: 1, // Default warehouse
        quantity: formData.quantity,
        notes: 'Stock adjustment from admin panel'
      });
      
      // Update low stock threshold if provided
      if (formData.low_stock_threshold) {
        await inventoryAPI.setLowStockThreshold(formData.product_id, {
          warehouse_id: 1, // Default warehouse
          threshold: formData.low_stock_threshold
        });
      }
      
      alert('Inventory updated successfully');
      setShowModal(false);
      setFormData({ product_id: '', quantity: 0, low_stock_threshold: 10 });
      setSelectedProduct(null);
      // Refresh both inventory and products data
      await fetchInventory();
      await fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update inventory');
    }
  };

  const handleAdjustClick = (item) => {
    setFormData({
      product_id: item.product_id,
      quantity: item.quantity_on_hand || 0,
      low_stock_threshold: item.low_stock_threshold || 10
    });
    const product = products.find(p => p.id === item.product_id);
    setSelectedProduct(product);
    setShowModal(true);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {queryProductId ? `Inventory - ${selectedProduct?.name || 'Product'}` : 'Inventory Management'}
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Adjust Stock
        </button>
      </div>

      {loading && <div className="text-center py-8">Loading inventory...</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock Threshold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventory.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {queryProductId ? 'No inventory found for this product' : 'No inventory items found'}
                </td>
              </tr>
            ) : (
              inventory.map((item, index) => {
                const isLowStock = item.quantity_on_hand <= item.low_stock_threshold;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product_name || `Product ID: ${item.product_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.product_sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity_on_hand || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.low_stock_threshold || 10}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleAdjustClick(item)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Adjust Stock {selectedProduct && `- ${selectedProduct.name}`}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => {
                      const productId = Number(e.target.value);
                      setFormData(prev => ({ ...prev, product_id: productId }));
                      const product = products.find(p => p.id === productId);
                      setSelectedProduct(product);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Update Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ product_id: '', quantity: 0, low_stock_threshold: 10 });
                      setSelectedProduct(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
