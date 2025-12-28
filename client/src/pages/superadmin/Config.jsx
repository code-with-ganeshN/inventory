import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Card, Button, Input, Modal, Table, Loading, Error } from '../../components/Common';
import { systemConfigAPI } from '../../api/endpoints';

export default function SuperAdminConfig() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ key: '', value: '', type: 'STRING' });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await systemConfigAPI.getAllConfigs();
      setConfigs(response.data.configs || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load configuration');
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
      await systemConfigAPI.setConfig(formData.key, formData.value);
      alert('Configuration updated successfully');
      setFormData({ key: '', value: '', type: 'STRING' });
      setShowModal(false);
      fetchConfigs();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save configuration');
    }
  };

  const handleDelete = async (key) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      try {
        // Note: Delete endpoint might not exist, this is a placeholder
        alert('Configuration deletion not available');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete configuration');
      }
    }
  };

  const columns = [
    { key: 'key', label: 'Configuration Key' },
    { key: 'value', label: 'Value' },
    { key: 'type', label: 'Type' },
    {
      key: 'key',
      label: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          onClick={() => {
            setFormData({ key: row.key, value: row.value, type: row.type });
            setShowModal(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">System Configuration</h1>
        <Button onClick={() => { setFormData({ key: '', value: '', type: 'STRING' }); setShowModal(true); }}>
          + Add Config
        </Button>
      </div>

      {loading && <Loading />}
      {error && <Error message={error} onRetry={fetchConfigs} />}

      <Card>
        <Table
          columns={columns}
          data={configs}
          loading={loading}
          error={error}
          onRetry={fetchConfigs}
        />
      </Card>

      {/* Common Configs Info */}
      <Card title="Common Configurations" className="mt-6">
        <div className="space-y-2 text-sm text-gray-600">
          <p>• <strong>COMPANY_NAME</strong> - Your company's name</p>
          <p>• <strong>SUPPORT_EMAIL</strong> - Customer support email</p>
          <p>• <strong>TAX_RATE</strong> - Default tax percentage</p>
          <p>• <strong>CURRENCY</strong> - Default currency code</p>
          <p>• <strong>MAX_LOGIN_ATTEMPTS</strong> - Max failed login attempts</p>
          <p>• <strong>SESSION_TIMEOUT</strong> - Session timeout in minutes</p>
        </div>
      </Card>

      <Modal isOpen={showModal} title="Edit Configuration" onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="key"
            label="Configuration Key"
            value={formData.key}
            onChange={handleChange}
            required
            disabled={formData.key !== ''}
          />
          <Input
            type="text"
            name="value"
            label="Value"
            value={formData.value}
            onChange={handleChange}
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="STRING">String</option>
              <option value="NUMBER">Number</option>
              <option value="BOOLEAN">Boolean</option>
              <option value="JSON">JSON</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
