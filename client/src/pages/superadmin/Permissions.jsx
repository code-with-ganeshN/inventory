import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error } from '../../components/Common';
import { permissionsAPI } from '../../api/endpoints';

export default function SuperAdminPermissions() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module: '',
    action: '',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await permissionsAPI.getAllPermissions();
      setPermissions(response.data.permissions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load permissions');
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
        await permissionsAPI.updatePermission(editingId, formData);
        alert('Permission updated successfully');
      } else {
        await permissionsAPI.createPermission(formData);
        alert('Permission created successfully');
      }
      setFormData({ name: '', description: '', module: '', action: '' });
      setEditingId(null);
      setShowModal(false);
      fetchPermissions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save permission');
    }
  };

  const handleEdit = (permission) => {
    setFormData(permission);
    setEditingId(permission.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this permission?')) {
      try {
        await permissionsAPI.deletePermission(id);
        alert('Permission deleted successfully');
        fetchPermissions();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete permission');
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Permission' },
    { key: 'module', label: 'Module' },
    { key: 'action', label: 'Action' },
    { key: 'description', label: 'Description' },
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
        <h1 className="text-3xl font-bold text-gray-800">Permission Management</h1>
        <Button onClick={() => { setFormData({ name: '', description: '', module: '', action: '' }); setEditingId(null); setShowModal(true); }}>
          + Add Permission
        </Button>
      </div>

      {loading && <Loading />}
      {error && <Error message={error} onRetry={fetchPermissions} />}

      <Card>
        <Table
          columns={columns}
          data={permissions}
          loading={loading}
          error={error}
          onRetry={fetchPermissions}
        />
      </Card>

      <Modal
        isOpen={showModal}
        title={editingId ? 'Edit Permission' : 'Add New Permission'}
        onClose={() => { setShowModal(false); setEditingId(null); }}
      >
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="name"
            label="Permission Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            type="text"
            name="module"
            label="Module"
            placeholder="e.g., PRODUCTS, USERS"
            value={formData.module || ''}
            onChange={handleChange}
            required
          />
          <Input
            type="text"
            name="action"
            label="Action"
            placeholder="e.g., CREATE, READ, UPDATE"
            value={formData.action || ''}
            onChange={handleChange}
            required
          />
          <Input
            type="text"
            name="description"
            label="Description"
            value={formData.description || ''}
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
