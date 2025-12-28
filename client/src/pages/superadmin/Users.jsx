import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error, Badge, Pagination } from '../../components/Common';
import { adminAPI } from '../../api/endpoints';

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role_id: 2, // Default to ADMIN
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllUsers({ page: currentPage, limit: 10 });
      setUsers(response.data.users || []);
      setTotalPages(Math.ceil(response.data.total / 10));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'role_id' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createAdminAccount(formData);
      alert('Admin account created successfully');
      setFormData({ email: '', first_name: '', last_name: '', role_id: 2 });
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create admin account');
    }
  };

  const handleToggleStatus = async (userId, status) => {
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

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    {
      key: 'role_id',
      label: 'Role',
      render: (row) => <Badge>{row.role_id === 1 ? 'Super Admin' : 'Admin'}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={row.status === 'ACTIVE' ? 'green' : 'red'}>{row.status}</Badge>,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          variant={row.status === 'ACTIVE' ? 'danger' : 'success'}
          onClick={() => handleToggleStatus(row.id, row.status)}
        >
          {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </Button>
      ),
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
          <Input
            type="email"
            name="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            type="text"
            name="first_name"
            label="First Name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
          <Input
            type="text"
            name="last_name"
            label="Last Name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
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
