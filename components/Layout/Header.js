import React from 'react';
import { Users } from 'lucide-react';

const Header = ({ user }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">HFL</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">The Horse Futsal League</h1>
              <p className="text-blue-100">Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-blue-100">Welcome, {user?.name || 'User'}</span>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;