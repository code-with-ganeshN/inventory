import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/authSlice';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">IN</span>
          </div>
          <h1 className="text-xl font-bold">Inventory Pro</h1>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-6">
          <a href="/" className="hover:text-blue-200 transition">Home</a>
          {user?.role === 'ADMIN' && (
            <a href="/admin" className="hover:text-blue-200 transition">Admin</a>
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <a href="/super-admin" className="hover:text-blue-200 transition">Super Admin</a>
          )}
          <a href="/products" className="hover:text-blue-200 transition">Products</a>
          <a href="/cart" className="hover:text-blue-200 transition">
            Cart
            {/* Cart count badge could go here */}
          </a>
        </nav>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 hover:bg-blue-700 px-3 py-2 rounded transition"
          >
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-600 font-bold">
              {user?.first_name?.charAt(0)}
            </div>
            <span>{user?.first_name}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg z-10">
              <a
                href="/profile"
                className="block px-4 py-2 hover:bg-gray-100 first:rounded-t-lg"
              >
                My Profile
              </a>
              <a
                href="/orders"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                My Orders
              </a>
              <hr className="my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 last:rounded-b-lg text-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
