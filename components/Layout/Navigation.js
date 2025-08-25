import React from 'react';
import { 
  BarChart3, 
  Users, 
  Trophy, 
  Calendar, 
  Play, 
  Camera, 
  Settings,
  Home
} from 'lucide-react';

const Navigation = ({ views, currentView, setCurrentView }) => {
  const navigationItems = [
    { key: 'dashboard', label: views.dashboard, icon: Home, color: 'blue' },
    { key: 'players', label: views.players, icon: Users, color: 'green' },
    { key: 'teams', label: views.teams, icon: Trophy, color: 'yellow' },
    { key: 'schedules', label: views.schedules, icon: Calendar, color: 'purple' },
    { key: 'live', label: views.live, icon: Play, color: 'red' },
    { key: 'statistics', label: views.statistics, icon: BarChart3, color: 'orange' },
    { key: 'gallery', label: views.gallery, icon: Camera, color: 'pink' },
    { key: 'admins', label: views.admins, icon: Settings, color: 'gray' }
  ];

  const getNavItemClasses = (item) => {
    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center space-x-2";
    
    if (currentView === item.key) {
      return `${baseClasses} bg-blue-600 text-white shadow-md transform scale-105`;
    }
    
    return `${baseClasses} text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:transform hover:scale-105`;
  };

  const getIconColor = (item) => {
    if (currentView === item.key) {
      return "text-white";
    }
    
    const colorMap = {
      blue: "text-blue-500",
      green: "text-green-500",
      yellow: "text-yellow-500",
      purple: "text-purple-500",
      red: "text-red-500",
      orange: "text-orange-500",
      pink: "text-pink-500",
      gray: "text-gray-500"
    };
    
    return colorMap[item.color] || "text-gray-500";
  };

  return (
    <div className="flex space-x-1 overflow-x-auto pb-1">
      {navigationItems.map((item) => {
        const IconComponent = item.icon;
        
        return (
          <button
            key={item.key}
            onClick={() => setCurrentView(item.key)}
            className={getNavItemClasses(item)}
            title={item.label}
          >
            <IconComponent 
              size={16} 
              className={getIconColor(item)} 
            />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;