// components/layout/MobileMenu.js - Updated Mobile Navigation
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  Trophy, 
  Users, 
  Shield, 
  LogOut, 
  LogIn,
  X,
  User
} from 'lucide-react';

const MobileMenu = ({ 
  isOpen, 
  onClose, 
  currentView, 
  onNavigate, 
  selectedLeague 
}) => {
  const { currentUser, logout } = useApp();

  if (!isOpen) return null;

  const navItems = [
    {
      id: 'league-selection',
      label: 'Leagues',
      icon: Trophy,
      requiresAuth: false
    }
  ];

  // Add league-specific items if a league is selected
  if (selectedLeague) {
    navItems.push({
      id: 'teams',
      label: 'Teams',
      icon: Users,
      requiresAuth: false,
      params: { leagueId: selectedLeague._id }
    });
  }

  // Add admin items for authenticated users
  if (currentUser) {
    navItems.push({
      id: 'admin-panel',
      label: 'Admin Panel',
      icon: Shield,
      requiresAuth: true
    });
  }

  const handleNavClick = (item) => {
    if (item.params) {
      onNavigate(item.id, item.params);
    } else {
      onNavigate(item.id);
    }
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="bg-white w-80 h-full shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8" />
            <span className="font-bold text-lg">League Manager</span>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Section */}
        <div className="p-4 bg-gray-50 border-b">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-600">{currentUser.email}</p>
                <p className="text-xs text-blue-600 font-medium capitalize">
                  {currentUser.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Not signed in</p>
            </div>
          )}
        </div>

        {/* Selected League Info */}
        {selectedLeague && (
          <div className="p-4 bg-blue-50 border-b">
            <p className="text-xs text-blue-600 font-medium">Current League</p>
            <p className="font-semibold text-blue-800">{selectedLeague.name}</p>
            <p className="text-xs text-blue-600 capitalize">
              {selectedLeague.type} • {selectedLeague.sport}
            </p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map(item => {
              if (item.requiresAuth && !currentUser) return null;
              
              const IconComponent = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Auth Actions */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  // This would trigger the login modal
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Football League Manager
            </p>
            <p className="text-xs text-gray-400">
              v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;