import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error, Badge } from '../../components/Common';
import { inventoryAPI } from '../../api/endpoints';

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: 0,
    reorder_level: 0,
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await inventoryAPI.getInventoryByWarehouse();
      setInventory(response.data.inventory || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'product_id' || name === 'warehouse_id' ? parseInt(value) : parseInt(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.updateStock(formData.product_id, {
        warehouse_id: formData.warehouse_id,
        quantity: formData.quantity,
      });
      alert('Inventory updated successfully');
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update inventory');
    }
  };

  const columns = [
    { key: 'product_name', label: 'Product' },
    { key: 'warehouse_name', label: 'Warehouse' },
    { key: 'quantity', label: 'Quantity' },
    {
      key: 'quantity',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.quantity > row.reorder_level ? 'green' : 'red'}>
          {row.quantity > row.reorder_level ? 'In Stock' : 'Low Stock'}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: () => (
        <Button size="sm" onClick={() => setShowModal(true)}>Adjust</Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
        <Button onClick={() => setShowModal(true)}>+ Adjust Stock</Button>
      </div>

      {loading && <Loading />}
      {error && <Error message={error} onRetry={fetchInventory} />}

      <Card>
        <Table
          columns={columns}
          data={inventory}
          loading={loading}
          error={error}
          onRetry={fetchInventory}
        />
      </Card>

      <Modal isOpen={showModal} title="Adjust Stock" onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <Input
            type="number"
            name="product_id"
            label="Product ID"
            value={formData.product_id}
            onChange={handleChange}
            required
          />
          <Input
            type="number"
            name="warehouse_id"
            label="Warehouse ID"
            value={formData.warehouse_id}
            onChange={handleChange}
            required
          />
          <Input
            type="number"
            name="quantity"
            label="Quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
          <Input
            type="number"
            name="reorder_level"
            label="Reorder Level"
            value={formData.reorder_level}
            onChange={handleChange}
          />
          <div className="flex gap-2 mt-4">
            <Button type="submit" variant="primary">Update</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
