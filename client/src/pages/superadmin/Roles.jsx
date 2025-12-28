import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error } from '../../components/Common';
import { rolesAPI } from '../../api/endpoints';

export default function SuperAdminRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await rolesAPI.getAllRoles();
      setRoles(response.data.roles || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load roles');
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
        await rolesAPI.updateRole(editingId, formData);
        alert('Role updated successfully');
      } else {
        await rolesAPI.createRole(formData);
        alert('Role created successfully');
      }
      setFormData({ name: '', description: '' });
      setEditingId(null);
      setShowModal(false);
      fetchRoles();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save role');
    }
  };

  const handleEdit = (role) => {
    setFormData(role);
    setEditingId(role.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await rolesAPI.deleteRole(id);
        alert('Role deleted successfully');
        fetchRoles();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete role');
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Role Name' },
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
        <h1 className="text-3xl font-bold text-gray-800">Role Management</h1>
        <Button onClick={() => { setFormData({ name: '', description: '' }); setEditingId(null); setShowModal(true); }}>
          + Add Role
        </Button>
      </div>

      {loading && <Loading />}
      {error && <Error message={error} onRetry={fetchRoles} />}

      <Card>
        <Table
          columns={columns}
          data={roles}
          loading={loading}
          error={error}
          onRetry={fetchRoles}
        />
      </Card>

      <Modal
        isOpen={showModal}
        title={editingId ? 'Edit Role' : 'Add New Role'}
        onClose={() => { setShowModal(false); setEditingId(null); }}
      >
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="name"
            label="Role Name"
            value={formData.name}
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
