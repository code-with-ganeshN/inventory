import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import UserLayout from '../components/Layout/UserLayout';
import AdminLayout from '../components/Layout/AdminLayout';
import { authAPI } from '../api/endpoints';

export default function Profile() {
  const dispatch = useDispatch();
  const { user, role } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const userRole = user?.role || role;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const Layout = isAdmin ? AdminLayout : UserLayout;

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        dispatch({ type: 'auth/setUser', payload: response.data });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    
    if (!user?.phone && !user?.address) {
      fetchUserData();
    }

    // Check for success message after page refresh
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('updated') === 'true') {
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const validatePasswordField = (name, value) => {
    const newErrors = { ...passwordErrors };
    
    switch (name) {
      case 'old_password':
        if (!value.trim()) {
          newErrors.old_password = 'Current password is required';
        } else {
          delete newErrors.old_password;
        }
        break;
        
      case 'new_password':
        if (!value.trim()) {
          newErrors.new_password = 'New password is required';
        } else if (value.length < 8) {
          newErrors.new_password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          newErrors.new_password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        } else {
          delete newErrors.new_password;
        }
        break;
        
      case 'confirm_password':
        if (!value.trim()) {
          newErrors.confirm_password = 'Please confirm your password';
        } else if (value !== passwordData.new_password) {
          newErrors.confirm_password = 'Passwords do not match';
        } else {
          delete newErrors.confirm_password;
        }
        break;
        
      default:
        break;
    }
    
    setPasswordErrors(newErrors);
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'first_name':
        if (!value.trim()) {
          newErrors.first_name = 'First name is required';
        } else if (value.length < 2) {
          newErrors.first_name = 'First name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          newErrors.first_name = 'First name can only contain letters and spaces';
        } else {
          delete newErrors.first_name;
        }
        break;
        
      case 'last_name':
        if (!value.trim()) {
          newErrors.last_name = 'Last name is required';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          newErrors.last_name = 'Last name can only contain letters and spaces';
        } else {
          delete newErrors.last_name;
        }
        break;
        
      case 'phone':
        if (value && !/^\d+$/.test(value)) {
          newErrors.phone = 'Phone number can only contain digits';
        } else if (value && (value.length <10 || value.length >10)) {
          newErrors.phone = 'Phone number must be 10 digits';
        } else {
          delete newErrors.phone;
        }
        break;
        
      case 'address':
        if (value && value.length < 30) {
          newErrors.address = 'Address must be at least 30 characters';
        } else if (value && value.length > 255) {
          newErrors.address = 'Address cannot exceed 255 characters';
        } else {
          delete newErrors.address;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    validateField(name, value);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    validatePasswordField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key]);
    });
    
    if (Object.keys(errors).length > 0) {
      setMessage('Please fix the validation errors');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(formData);
      dispatch({ type: 'auth/setUser', payload: response.data.user });
      setShowProfileModal(false);
      // Refresh page with success indicator
      window.location.href = '/profile?updated=true';
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all password fields
    Object.keys(passwordData).forEach(key => {
      validatePasswordField(key, passwordData[key]);
    });
    
    if (Object.keys(passwordErrors).length > 0) {
      setMessage('Please fix the validation errors');
      return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage('New passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await authAPI.changePassword(passwordData.old_password, passwordData.new_password);
      setMessage('Password changed successfully!');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setPasswordErrors({});
      setShowPasswordModal(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {message && (
        <div className={`mb-6 p-4 rounded ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Profile Information Display */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Personal Information</h2>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Update Profile
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user?.first_name || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user?.last_name || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user?.email || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user?.phone || 'Not provided'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user?.address || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Password</h2>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Change Password
          </button>
        </div>
        <p className="text-gray-600 mt-2">Click the button to change your password</p>
      </div>

      {/* Profile Update Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Update Profile</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone (digits only)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1234567890"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address (30-255 characters)</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your complete address (minimum 30 characters)"
                />
                <p className="text-sm text-gray-500 mt-1">{formData.address.length}/255 characters</p>
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Change Password</h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    passwordErrors.old_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {passwordErrors.old_password && <p className="text-red-500 text-sm mt-1">{passwordErrors.old_password}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    passwordErrors.new_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  minLength="8"
                />
                {passwordErrors.new_password && <p className="text-red-500 text-sm mt-1">{passwordErrors.new_password}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    passwordErrors.confirm_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  minLength="8"
                />
                {passwordErrors.confirm_password && <p className="text-red-500 text-sm mt-1">{passwordErrors.confirm_password}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Changing...' : 'Change'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}