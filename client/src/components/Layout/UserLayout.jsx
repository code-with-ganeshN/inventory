import React from 'react';
import { useSelector } from 'react-redux';
import Header from './Header';
import Sidebar from './Sidebar';

export default function UserLayout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  if (isAdmin) {
    // Use admin layout structure for admin/super admin users
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Regular user layout
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
