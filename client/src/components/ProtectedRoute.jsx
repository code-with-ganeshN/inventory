import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasAccess = allowedRoles.includes(user?.role) || user?.role === 'SUPER_ADMIN';
    
    if (!hasAccess) {
      return <Navigate to="/" />;
    }
  }

  return children;
}
