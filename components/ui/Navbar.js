// FILE: components/ui/Navbar.js (ENHANCED)
// ===========================================
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { 
  Menu, X, Home, Users, Calendar, Trophy, ArrowRightLeft, 
  Settings, LogOut, Play, BarChart3, Search, Bell, 
  ChevronDown, Shield, UserPlus, FileText, Activity
} from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [liveMatchCount, setLiveMatchCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Players', href: '/players', icon: Users },
    { name: 'Matches', href: '/matches', icon: Calendar },
    { name: 'Standings', href: '/standings', icon: Trophy },
    { name: 'Transfers', href: '/transfers', icon: ArrowRightLeft },
  ];

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3, description: 'Overview & analytics' },
    { name: 'Teams', href: '/admin/teams', icon: Shield, description: 'Manage teams' },
    { name: 'Players', href: '/admin/players', icon: UserPlus, description: 'Manage players' },
    { name: 'Matches', href: '/admin/matches', icon: Calendar, description: 'Schedule matches' },
    { name: 'Live Match', href: '/matches/live', icon: Play, description: 'Live match manager' },
    { name: 'Reports', href: '/admin/reports', icon: FileText, description: 'Generate reports' },
  ];

  // Check for live matches
  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        const response = await fetch('/api/public/matches?status=live');
        if (response.ok) {
          const matches = await response.json();
          setLiveMatchCount(Array.isArray(matches) ? matches.length : 0);
        }
      } catch (error) {
        console.error('Failed to fetch live matches:', error);
      }
    };

    fetchLiveMatches();
    // Poll every 30 seconds for live matches
    const interval = setInterval(fetchLiveMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
      setIsAdminOpen(false);
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  // Check if current path matches navigation item
  const isCurrentPath = (href) => {
    if (href === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(href);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                  Horse Futsal League
                </h1>
                <h1 className="text-lg font-bold text-gray-900 sm:hidden">HFL</h1>
              </div>
            </Link>

            {/* Live Match Indicator */}
            {liveMatchCount > 0 && (
              <Link 
                href="/matches/live" 
                className="ml-4 flex items-center bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-medium transition-colors animate-pulse"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                {liveMatchCount} Live
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              const isActive = isCurrentPath(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'text-blue-600 bg-blue-50 shadow-sm' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 mr-2 ${isActive ? 'text-blue-600' : ''}`} />
                  {item.name}
                </Link>
              );
            })}

            {/* Search Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Admin Dropdown */}
            {session?.user?.role === 'admin' && (
              <div className="relative">
                <button
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    router.pathname.startsWith('/admin')
                      ? 'text-blue-600 bg-blue-50 shadow-sm'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAdminOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsAdminOpen(false)}
                    />
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-2">
                          Administration
                        </div>
                        {adminNavigation.map((item) => {
                          const IconComponent = item.icon;
                          const isActive = isCurrentPath(item.href);
                          
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsAdminOpen(false)}
                              className={`flex items-start px-3 py-3 rounded-lg transition-colors group ${
                                isActive
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <IconComponent className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                              }`} />
                              <div>
                                <div className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                                  {item.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.description}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User Menu */}
            {session ? (
              <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  {session.user.avatar ? (
                    <Image
                      className="h-8 w-8 rounded-full ring-2 ring-gray-200"
                      src={session.user.avatar}
                      alt={session.user.name}
                      width={32}
                      height={32}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {session.user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="hidden xl:block">
                    <div className="text-sm font-medium text-gray-900">
                      {session.user.name}
                    </div>
                    {session.user.role === 'admin' && (
                      <div className="text-xs text-blue-600 font-medium">Administrator</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="ml-6 pl-6 border-l border-gray-200">
                <Link
                  href="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            {liveMatchCount > 0 && (
              <Link 
                href="/matches/live" 
                className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium"
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></div>
                Live
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="border-t border-gray-100 py-4">
            <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search teams, players, matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </form>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-20 lg:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Mobile Menu */}
          <div className="lg:hidden absolute left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-30">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Search in Mobile */}
              <div className="px-3 py-2">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </form>
              </div>

              {/* Main Navigation */}
              {navigation.map((item) => {
                const IconComponent = item.icon;
                const isActive = isCurrentPath(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <IconComponent className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
              
              {/* Admin Navigation */}
              {session?.user?.role === 'admin' && (
                <>
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Administration
                    </div>
                    {adminNavigation.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = isCurrentPath(item.href);
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                            isActive
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <IconComponent className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
              
              {/* User Section */}
              {session && (
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="flex items-center px-3 py-3">
                    {session.user.avatar ? (
                      <Image
                        className="h-10 w-10 rounded-full mr-3"
                        src={session.user.avatar}
                        alt={session.user.name}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                        <span className="text-white font-bold">
                          {session.user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-base font-medium text-gray-900">
                        {session.user.name}
                      </div>
                      {session.user.role === 'admin' && (
                        <div className="text-sm text-blue-600">Administrator</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
