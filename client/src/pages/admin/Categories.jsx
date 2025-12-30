import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error, Badge } from '../../components/Common';
import { productAPI, categoryAPI } from '../../api/endpoints';
import { validateForm, categorySchema } from '../../utils/validation';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', parent_id: null });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

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

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Categories Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="primary" 
            onClick={() => {
              setFormData({ name: '', description: '', parent_id: null });
              setEditingId(null);
              setErrors({});
              setShowModal(true);
            }}
          >
            Add Category
          </Button>
        </div>
      </div>

      {loading && <div className="text-center py-8">Loading...</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                <th className="border p-3 text-left font-medium text-gray-700">Category Name</th>
                <th className="border p-3 text-left font-medium text-gray-700">Description</th>
                <th className="border p-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="border p-3">{category.name}</td>
                  <td className="border p-3">{category.description || 'No description'}</td>
                  <td className="border p-3">
                    <div className="flex gap-2">
                      <button 
                        className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 transition-colors cursor-pointer"
                        onClick={() => handleEdit(category)}
                        title="Edit Category"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors cursor-pointer"
                        onClick={() => handleDelete(category.id)}
                        title="Delete Category"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
