import React from 'react';

export const Icon = ({ children, className = 'w-6 h-6', ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    {children}
  </svg>
);

export const DashboardIcon = ({ className = 'w-6 h-6', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z" fill="currentColor" />
  </Icon>
);

export const ChevronLeft = ({ className = 'w-5 h-5', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Icon>
);

export const ChevronRight = ({ className = 'w-5 h-5', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Icon>
);

export const UsersIcon = ({ className = 'w-6 h-6', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM6 11c1.657 0 3-1.343 3-3S7.657 5 6 5 3 6.343 3 8s1.343 3 3 3zm0 2c-2.673 0-8 1.336-8 4v3h14v-3c0-2.664-5.327-4-6-4zm10 0c-.29 0-.632.016-.992.049C15.69 14.19 17 15.153 17 16v3h6v-3c0-2.664-5.327-4-6-4z" fill="currentColor" />
  </Icon>
);

export const BoxIcon = ({ className = 'w-6 h-6', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.732L13 3l-7 3.268A2 2 0 0 0 5 8v8a2 2 0 0 0 1 1.732L11 21l7-3.268A2 2 0 0 0 21 16zM12 3v9" stroke="currentColor" strokeWidth="0" fill="currentColor"/>
  </Icon>
);

export const CartIcon = ({ className = 'w-6 h-6', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="0" fill="currentColor" />
  </Icon>
);

export const LockIcon = ({ className = 'w-5 h-5', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-7h-1V7a5 5 0 10-10 0v3H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z" fill="currentColor" />
  </Icon>
);

export const CheckIcon = ({ className = 'w-5 h-5', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M20.285 6.708l-11.39 11.39L3.715 13.92 5.13 12.506l3.765 3.765 10.05-10.05z" fill="currentColor" />
  </Icon>
);

export const CrossIcon = ({ className = 'w-5 h-5', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M18.3 5.71L12 12l6.3 6.29-1.58 1.42L10.41 13.41 3.12 20.7 1.7 19.29 8.99 12 1.7 4.71 3.12 3.29 10.41 10.58 16.72 4.29z" fill="currentColor" />
  </Icon>
);

export const CogIcon = ({ className = 'w-6 h-6', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M19.14 12.936a7.96 7.96 0 000-1.872l2.03-1.582a.5.5 0 00.12-.636l-1.922-3.326a.5.5 0 00-.607-.22l-2.39.96a8.05 8.05 0 00-1.62-.94l-.36-2.54A.5.5 0 0013.76 2h-3.52a.5.5 0 00-.495.422l-.36 2.54c-.57.24-1.11.55-1.62.94l-2.39-.96a.5.5 0 00-.607.22L2.09 8.446a.5.5 0 00.12.636l2.03 1.582a8.05 8.05 0 000 1.872L2.21 14.01a.5.5 0 00-.12.636l1.922 3.326c.14.243.414.344.64.26l2.39-.96c.51.39 1.05.7 1.62.94l.36 2.54c.05.28.29.49.57.49h3.52c.28 0 .52-.21.57-.49l.36-2.54c.57-.24 1.11-.55 1.62-.94l2.39.96c.226.09.5-.017.64-.26l1.922-3.326a.5.5 0 00-.12-.636l-2.03-1.582zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z" fill="currentColor" />
  </Icon>
);

export const ClipboardIcon = ({ className = 'w-6 h-6', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M16 2H8a2 2 0 00-2 2v1h12V4a2 2 0 00-2-2zM6 7v13a2 2 0 002 2h8a2 2 0 002-2V7H6z" fill="currentColor" />
  </Icon>
);

export const ProductIcon = ({ className = 'w-8 h-8', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M3 7l9-4 9 4-9 4L3 7zM3 11l9 4 9-4" fill="currentColor" />
  </Icon>
);

export const BoltIcon = ({ className = 'w-6 h-6', ...props }) => (
  <Icon className={className} {...props}>
    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" fill="currentColor" />
  </Icon>
);

export default {
  DashboardIcon,
  UsersIcon,
  BoxIcon,
  CartIcon,
  LockIcon,
  CheckIcon,
  CrossIcon,
  CogIcon,
  ClipboardIcon,
  ProductIcon,
  BoltIcon,
};
