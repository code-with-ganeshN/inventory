import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error, Badge } from '../../components/Common';
import { productAPI, categoryAPI } from '../../api/endpoints';
import { validateForm, categorySchema } from '../../utils/validation';
import ConnectivityTest from '../../components/ConnectivityTest';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', parent_id: null });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const testDirectAPI = async () => {
    try {
      console.log('Testing direct API call...');
      
      // Test database info first
      const dbResponse = await fetch('http://localhost:5000/api/db-info');
      const dbData = await dbResponse.json();
      console.log('Database info:', dbData);
      
      // Test categories
      const response = await fetch('http://localhost:5000/api/categories-test');
      const data = await response.json();
      console.log('Categories test response:', data);
      
      alert(`Tests completed. Check console for details.\nDB Info: ${dbData.success}\nCategories: ${data.success}`);
    } catch (error) {
      console.error('Direct API test failed:', error);
      alert(`Direct API test failed: ${error.message}`);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching categories...');
      const response = await categoryAPI.getAllCategories();
      console.log('Categories response:', response);
      const categoriesData = Array.isArray(response.data) ? response.data : [];
      console.log('Categories data:', categoriesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error fetching categories:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load categories';
      setError(errorMessage);
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
    
    // Validate form
    const validation = validateForm(formData, categorySchema);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setErrors({});
    
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
        <div className="flex gap-2">
        </div>
      </div>

      {showTest && <ConnectivityTest />}

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
