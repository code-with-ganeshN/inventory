import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Select, Table, Loading, Error, Pagination } from '../../components/Common';
import { auditAPI } from '../../api/endpoints';

export default function SuperAdminAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    userId: '',
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await auditAPI.getAuditLogs({
        page: currentPage,
        limit: 10,
        ...filters,
      });
      setLogs(response.data.logs || []);
      setTotalPages(Math.ceil(response.data.total / 10));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const columns = [
    { key: 'user_name', label: 'User' },
    { key: 'action', label: 'Action' },
    { key: 'entity_type', label: 'Entity' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'description', label: 'Details' },
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (row) => new Date(row.created_at).toLocaleString(),
    },
  ];

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Audit Logs</h1>

      {/* Filters */}
      <Card className="mb-6">
        <h3 className="font-bold mb-4">Filter Logs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="text"
            name="action"
            label="Action"
            placeholder="e.g., CREATE, UPDATE, DELETE"
            value={filters.action}
            onChange={handleFilterChange}
          />
          <Input
            type="text"
            name="entity"
            label="Entity Type"
            placeholder="e.g., PRODUCT, ORDER"
            value={filters.entity}
            onChange={handleFilterChange}
          />
          <Input
            type="text"
            name="userId"
            label="User ID"
            placeholder="User ID"
            value={filters.userId}
            onChange={handleFilterChange}
          />
        </div>
      </Card>

      {loading && <Loading />}
      {error && <Error message={error} onRetry={fetchAuditLogs} />}

      <Card>
        <Table
          columns={columns}
          data={logs}
          loading={loading}
          error={error}
          onRetry={fetchAuditLogs}
        />
        <div className="mt-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{logs.length}</div>
            <p className="text-gray-600">Total Logs (This Page)</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {logs.filter((log) => log.action === 'CREATE').length}
            </div>
            <p className="text-gray-600">Create Actions</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {logs.filter((log) => log.action === 'DELETE').length}
            </div>
            <p className="text-gray-600">Delete Actions</p>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
