import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error, Badge } from '../../components/Common';
import { productAPI, categoryAPI } from '../../api/endpoints';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', parent_id: null });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryAPI.getAllCategories();
      setCategories(response.data.categories || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : (name === 'parent_id' ? parseInt(value) : value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await categoryAPI.updateCategory(editingId, formData);
        alert('Category updated successfully');
      } else {
        await categoryAPI.createCategory(formData);
        alert('Category created successfully');
      }
      setFormData({ name: '', description: '', parent_id: null });
      setEditingId(null);
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setFormData(category);
    setEditingId(category.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryAPI.deleteCategory(id);
        alert('Category deleted successfully');
        fetchCategories();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete category');
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Category Name' },
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
        <h1 className="text-3xl font-bold text-gray-800">Categories Management</h1>
        <Button onClick={() => { setFormData({ name: '', description: '', parent_id: null }); setEditingId(null); setShowModal(true); }}>
          + Add Category
        </Button>
      </div>

      {loading && <Loading />}
      {error && <Error message={error} onRetry={fetchCategories} />}

      <Card>
        <Table
          columns={columns}
          data={categories}
          loading={loading}
          error={error}
          onRetry={fetchCategories}
        />
      </Card>

      <Modal
        isOpen={showModal}
        title={editingId ? 'Edit Category' : 'Add New Category'}
        onClose={() => { setShowModal(false); setEditingId(null); }}
      >
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="name"
            label="Category Name"
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
