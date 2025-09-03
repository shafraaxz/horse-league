// FILE: components/ui/Navbar.js
// ===========================================
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Calendar, 
  Trophy, 
  ArrowRightLeft, 
  Settings, 
  LogOut 
} from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Players', href: '/players', icon: Users },
    { name: 'Matches', href: '/matches', icon: Calendar },
    { name: 'Standings', href: '/standings', icon: Trophy },
    { name: 'Transfers', href: '/transfers', icon: ArrowRightLeft },
  ];

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: Settings },
    { name: 'Manage Teams', href: '/admin/teams', icon: Users },
    { name: 'Manage Players', href: '/admin/players', icon: Users },
    { name: 'Manage Matches', href: '/admin/matches', icon: Calendar },
    { name: 'Live Match', href: '/matches/live', icon: Calendar },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">The Horse Futsal League</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}

            {session?.user?.role === 'admin' && (
              <div className="relative group">
                <button className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </button>
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    {adminNavigation.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <IconComponent className="w-4 h-4 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {session ? (
              <div className="flex items-center space-x-3">
                {session.user.avatar && (
                  <Image
                    className="h-8 w-8 rounded-full"
                    src={session.user.avatar}
                    alt={session.user.name}
                    width={32}
                    height={32}
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn btn-primary"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <IconComponent className="w-4 h-4 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            
            {session?.user?.role === 'admin' && (
              <>
                <div className="border-t pt-2 mt-2">
                  {adminNavigation.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => setIsOpen(false)}
                      >
                        <IconComponent className="w-4 h-4 mr-3" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
            
            {session && (
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center px-3 py-2">
                  {session.user.avatar && (
                    <Image
                      className="h-8 w-8 rounded-full mr-3"
                      src={session.user.avatar}
                      alt={session.user.name}
                      width={32}
                      height={32}
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {session.user.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
