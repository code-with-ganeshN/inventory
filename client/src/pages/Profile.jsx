import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import UserLayout from '../components/Layout/UserLayout';
import { authAPI } from '../api/endpoints';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

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

  // Fetch fresh user data when component mounts
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
  }, []);

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
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
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
      
      // Update Redux store with new user data
      dispatch({ type: 'auth/setUser', payload: response.data.user });
      
      // Update localStorage as well
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage('New passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await authAPI.changePassword(passwordData.old_password, passwordData.new_password);
      setMessage('Password changed successfully!');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
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

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
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
                {errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
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
                {errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone (digits only)
              </label>
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
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address (30-255 characters)
              </label>
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
              <p className="text-sm text-gray-500 mt-1">
                {formData.address.length}/255 characters
              </p>
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                name="old_password"
                value={passwordData.old_password}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength="8"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength="8"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </UserLayout>
  );
}