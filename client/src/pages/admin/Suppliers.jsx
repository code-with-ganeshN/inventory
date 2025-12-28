import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error } from '../../components/Common';
import { supplierAPI, productAPI } from '../../api/endpoints';

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    phone: '',
    address: '',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await supplierAPI.getAllSuppliers();
      setSuppliers(response.data.suppliers || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supplierAPI.updateSupplier(editingId, formData);
        alert('Supplier updated successfully');
      } else {
        await supplierAPI.createSupplier(formData);
        alert('Supplier created successfully');
      }
      setFormData({ name: '', contact_email: '', phone: '', address: '' });
      setEditingId(null);
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save supplier');
    }
  };

  const handleEdit = (supplier) => {
    setFormData(supplier);
    setEditingId(supplier.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await supplierAPI.deleteSupplier(id);
        alert('Supplier deleted successfully');
        fetchSuppliers();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete supplier');
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Supplier Name' },
    { key: 'contact_email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleEdit(row)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Suppliers Management</h1>
        <Button onClick={() => { setFormData({ name: '', contact_email: '', phone: '', address: '' }); setEditingId(null); setShowModal(true); }}>
          + Add Supplier
        </Button>
      </div>

      {loading && <Loading />}
      {error && <Error message={error} onRetry={fetchSuppliers} />}

      <Card>
        <Table
          columns={columns}
          data={suppliers}
          loading={loading}
          error={error}
          onRetry={fetchSuppliers}
        />
      </Card>

      <Modal
        isOpen={showModal}
        title={editingId ? 'Edit Supplier' : 'Add New Supplier'}
        onClose={() => { setShowModal(false); setEditingId(null); }}
      >
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="name"
            label="Supplier Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            name="contact_email"
            label="Email"
            value={formData.contact_email || ''}
            onChange={handleChange}
            required
          />
          <Input
            type="tel"
            name="phone"
            label="Phone"
            value={formData.phone || ''}
            onChange={handleChange}
          />
          <Input
            type="text"
            name="address"
            label="Address"
            value={formData.address || ''}
            onChange={handleChange}
          />
          <div className="flex gap-2 mt-4">
            <Button type="submit" variant="primary">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
