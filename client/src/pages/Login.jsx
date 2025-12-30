import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginSuccess, loginFailure, setLoading } from '../store/authSlice';
import { authAPI } from '../api/endpoints';
import { validateForm, loginSchema } from '../utils/validation';
import { Modal } from '../components/Common';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Clear previous alerts
    setAlertMessage('');
    
    // Basic validation for empty fields
    if (!formData.email.trim() || !formData.password.trim()) {
      setAlertMessage('Please enter a valid email and password.');
      return;
    }
    
    // Validate form format
    const validation = validateForm(formData, loginSchema);
    if (!validation.isValid) {
      setAlertMessage('Please enter a valid email and password.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await authAPI.login(formData.email, formData.password);
      // Only dispatch loginSuccess and navigate on actual success
      dispatch(loginSuccess({
        user: response.data.user,
        token: response.data.token,
        role: response.data.user.role,
      }));
      navigate('/');
    } catch (error) {
      // Handle errors without dispatching any success actions
      const errorMessage = error.response?.data?.error || 'Login failed';
      if (errorMessage === 'Account is inactive') {
        setShowDeactivatedModal(true);
      } else {
        setAlertMessage(errorMessage);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Inventory Management System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {alertMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{alertMessage}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register here
              </Link>
            </p>
          </div>
        </form>

        <Modal 
          isOpen={showDeactivatedModal} 
          title="Account Deactivated" 
          onClose={() => setShowDeactivatedModal(false)}
        >
          <p className="text-gray-700 mb-4">
            Your account is deactivated and contact the customer support for deactivated accounts.
          </p>
          <button
            onClick={() => setShowDeactivatedModal(false)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
          >
            OK
          </button>
        </Modal>
      </div>
    </div>
  );
}
