import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error, Badge, Pagination } from '../../components/Common';
import { adminAPI } from '../../api/endpoints';
import { validateForm, validateFieldRealTime, sanitizeInput, adminUserSchema } from '../../utils/validation';

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchTerm]);

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
            <button
              className={`p-2 rounded hover:bg-opacity-80 transition-colors ${
                row.status === 'ACTIVE' 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              } ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => !isCurrentUser && handleToggleStatus(row.id, row.status)}
              disabled={isCurrentUser}
              title={isCurrentUser ? 'Cannot modify your own account' : (row.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User')}
            >
              {row.status === 'ACTIVE' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <button
              className={`p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors ${
                isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={() => !isCurrentUser && handleDeleteUser(row.id)}
              disabled={isCurrentUser}
              title={isCurrentUser ? 'Cannot delete your own account' : 'Delete User'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by email, first name, or last name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-96"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Button onClick={() => setShowModal(true)}>+ Add Admin</Button>
        </div>
      </div>

      {loading && <Loading />}
      {error && <Error message={error} onRetry={fetchUsers} />}

      <Card>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="border p-3 text-left font-medium text-gray-700">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border p-3 text-sm">{user.email}</td>
                  <td className="border p-3 text-sm">{user.first_name}</td>
                  <td className="border p-3 text-sm">{user.last_name}</td>
                  <td className="border p-3">
                    <Badge>{user.role_name || 'Unknown'}</Badge>
                  </td>
                  <td className="border p-3">
                    <Badge variant={user.status === 'ACTIVE' ? 'green' : 'red'}>{user.status}</Badge>
                  </td>
                  <td className="border p-3">
                    <div className="flex gap-2">
                      <button
                        className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowViewModal(true);
                        }}
                        title="View User Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {columns[5].render(user)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      <Modal isOpen={showViewModal} title="User Details" onClose={() => setShowViewModal(false)}>
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <p className="text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <p className="text-sm text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                <Badge>{selectedUser.role_name || 'Unknown'}</Badge>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <Badge variant={selectedUser.status === 'ACTIVE' ? 'green' : 'red'}>{selectedUser.status}</Badge>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Created Date</label>
                <p className="text-sm text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Updated</label>
                <p className="text-sm text-gray-900">{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
