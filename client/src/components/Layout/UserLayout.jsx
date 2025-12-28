import React from 'react';
import Header from './Header';

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">About Us</h3>
              <p className="text-gray-400 text-sm">Leading inventory management solution</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Products</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="/products" className="hover:text-white">Browse Products</a></li>
                <li><a href="/cart" className="hover:text-white">Shopping Cart</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Inventory Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
