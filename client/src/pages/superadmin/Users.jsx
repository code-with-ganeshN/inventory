import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error, Badge, Pagination } from '../../components/Common';
import { adminAPI } from '../../api/endpoints';
import { validateForm, validateFieldRealTime, sanitizeInput, adminUserSchema } from '../../utils/validation';

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role_id: 2, // Default to ADMIN
  });
  const [formErrors, setFormErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});

  const handleInputChange = (field, value, fieldType) => {
    const sanitizedValue = sanitizeInput(value, fieldType);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    
    if (fieldTouched[field] || sanitizedValue) {
      const error = validateFieldRealTime(field, sanitizedValue, adminUserSchema);
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  useEffect(() => {
    console.log('Component mounted or currentPage changed:', currentPage);
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users with params:', { page: currentPage, limit: 10 });
      const response = await adminAPI.getAllUsers({ page: currentPage, limit: 10 });
      console.log('Users response:', response);
      // Backend returns { data: { users, total, ... } }
      const payload = response.data?.data || response.data || {};
      setUsers(payload.users || []);
      const totalCount = parseInt(payload.total || 0, 10) || 0;
      setTotalPages(Math.max(1, Math.ceil(totalCount / 10)));
      console.log('Users set:', payload.users, 'total:', totalCount);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(formData, adminUserSchema);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    setFormErrors({});
    
    try {
      await adminAPI.createAdminAccount(formData);
      alert('Admin account created successfully');
      setFormData({ email: '', first_name: '', last_name: '', password: '', role_id: 2 });
      setFieldTouched({});
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create admin account');
    }
  };

  const handleToggleStatus = async (userId, status) => {
    // Prevent users from modifying their own account
    if (currentUser?.id === userId) {
      alert('You cannot modify your own account status');
      return;
    }
    
    try {
      const newStatus = status === 'ACTIVE' ? 'deactivate' : 'activate';
      if (status === 'ACTIVE') {
        await adminAPI.deactivateUser(userId);
      } else {
        await adminAPI.activateUser(userId);
      }
      alert(`User ${newStatus}d successfully`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${status === 'ACTIVE' ? 'deactivate' : 'activate'} user`);
    }
  };

  const handleDeleteUser = async (userId) => {
    // Prevent users from deleting their own account
    if (currentUser?.id === userId) {
      alert('You cannot delete your own account');
      return;
    }
    
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await adminAPI.deleteUser(userId);
      alert('User deleted successfully');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    {
      key: 'role_name',
      label: 'Role',
      render: (row) => <Badge>{row.role_name || 'Unknown'}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={row.status === 'ACTIVE' ? 'green' : 'red'}>{row.status}</Badge>,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => {
        const isCurrentUser = currentUser?.id === row.id;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={row.status === 'ACTIVE' ? 'danger' : 'success'}
              onClick={() => handleToggleStatus(row.id, row.status)}
              disabled={isCurrentUser}
              title={isCurrentUser ? 'Cannot modify your own account' : ''}
            >
              {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDeleteUser(row.id)}
              disabled={isCurrentUser}
              title={isCurrentUser ? 'Cannot delete your own account' : ''}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <Button onClick={() => setShowModal(true)}>+ Add Admin</Button>
      </div>

      {loading && <Loading />}
      {error && <Error message={error} onRetry={fetchUsers} />}

      <Card>
        <Table
          columns={columns}
          data={users}
          loading={loading}
          error={error}
          onRetry={fetchUsers}
        />
        <div className="mt-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </Card>

      <Modal isOpen={showModal} title="Add New Admin" onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value, 'email')}
              onBlur={() => setFieldTouched(prev => ({ ...prev, email: true }))}
              required
              className={`w-full px-4 py-2 border rounded-lg ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value, 'name')}
              onBlur={() => setFieldTouched(prev => ({ ...prev, first_name: true }))}
              required
              className={`w-full px-4 py-2 border rounded-lg ${formErrors.first_name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.first_name && <p className="text-red-500 text-sm mt-1">{formErrors.first_name}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value, 'name')}
              onBlur={() => setFieldTouched(prev => ({ ...prev, last_name: true }))}
              required
              className={`w-full px-4 py-2 border rounded-lg ${formErrors.last_name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.last_name && <p className="text-red-500 text-sm mt-1">{formErrors.last_name}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password (min 8 characters)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value, 'password')}
              onBlur={() => setFieldTouched(prev => ({ ...prev, password: true }))}
              required
              placeholder="Enter secure password"
              className={`w-full px-4 py-2 border rounded-lg ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={(e) => setFormData(prev => ({ ...prev, role_id: parseInt(e.target.value) }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="2">Admin</option>
              <option value="1">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary">Create</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
