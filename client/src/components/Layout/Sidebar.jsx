import React from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);

  const adminMenuItems = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Products', href: '/admin/products', icon: '📦' },
    { name: 'Categories', href: '/admin/categories', icon: '🏷️' },
    { name: 'Inventory', href: '/admin/inventory', icon: '📈' },
    { name: 'Orders', href: '/admin/orders', icon: '🛒' },
    { name: 'Suppliers', href: '/admin/suppliers', icon: '🤝' },
    { name: 'Reports', href: '/admin/reports', icon: '📋' },
  ];

  const superAdminMenuItems = [
    { name: 'Dashboard', href: '/super-admin', icon: '👑' },
    { name: 'Users', href: '/super-admin/users', icon: '👥' },
    { name: 'Roles', href: '/super-admin/roles', icon: '🔐' },
    { name: 'Permissions', href: '/super-admin/permissions', icon: '✅' },
    { name: 'System Config', href: '/super-admin/config', icon: '⚙️' },
    { name: 'Audit Logs', href: '/super-admin/audit', icon: '📝' },
    { name: 'Reports', href: '/super-admin/reports', icon: '📊' },
  ];

  // Determine which menu to show based on route
  const isSuperAdmin = window.location.pathname.startsWith('/super-admin');
  const menuItems = isSuperAdmin ? superAdminMenuItems : adminMenuItems;

  return (
    <aside className={`bg-gray-900 text-white transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} min-h-screen`}>
      <div className="p-4 flex justify-between items-center">
        {!collapsed && <h2 className="font-bold text-lg">Admin Menu</h2>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-800 rounded"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="mt-8">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 transition"
            title={item.name}
          >
            <span className="text-xl">{item.icon}</span>
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
