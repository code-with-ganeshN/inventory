import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  DashboardIcon,
  BoxIcon,
  ClipboardIcon,
  CartIcon,
  UsersIcon,
  CogIcon,
  LockIcon,
  CheckIcon,
  ChevronLeft,
  ChevronRight,
} from '../Icons';

export default function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const { user, role } = useSelector((state) => state.auth);
  
  // Use role from user object or fallback to role field
  const userRole = user?.role || role;

  const adminMenuItems = [
    { name: 'Dashboard', href: '/admin', icon: DashboardIcon },
    { name: 'Categories', href: '/admin/categories', icon: ClipboardIcon },
    { name: 'Inventory', href: '/admin/products', icon: BoxIcon },
  ];

  const superAdminMenuItems = [
    { name: 'Dashboard', href: '/superadmin', icon: DashboardIcon },
    { name: 'Users', href: '/superadmin/users', icon: UsersIcon },
    { name: 'Orders', href: '/superadmin/orders', icon: CartIcon },
  ];

  // Determine which menu to show based on user role
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const menuItems = isSuperAdmin ? superAdminMenuItems : adminMenuItems;

  return (
    <aside className={`bg-gray-900 text-white transition-all duration-300 ${collapsed ? 'w-20' : 'w-56'} min-h-screen`}>
      <div className="p-4 flex justify-between items-center">
        {!collapsed && <h2 className="font-bold text-lg">Admin Menu</h2>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-800 rounded"
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
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
            <span className="text-xl">
              {(() => {
                const IconComp = item.icon;
                return IconComp ? <IconComp className="w-6 h-6" /> : null;
              })()}
            </span>
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
