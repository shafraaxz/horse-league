// FILE: components/ui/Layout.js (ENHANCED)
// ===========================================
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowUp, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  RefreshCw,
  Home,
  Users,
  Calendar,
  Trophy
} from 'lucide-react';
import Navbar from './Navbar';
import LoadingSpinner from './LoadingSpinner';
import { Toaster } from 'react-hot-toast';

export default function Layout({ children, title, description, showBreadcrumb = true }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pageError, setPageError] = useState(null);

  // Generate page title
  const pageTitle = title 
    ? `${title} - Horse Futsal League`
    : 'Horse Futsal League - Premier Futsal Tournament';

  // Generate breadcrumb items
  const getBreadcrumbItems = () => {
    const pathSegments = router.pathname.split('/').filter(Boolean);
    const items = [{ label: 'Home', href: '/', icon: Home }];
    
    const routeMap = {
      'teams': { label: 'Teams', icon: Users },
      'players': { label: 'Players', icon: Users },
      'matches': { label: 'Matches', icon: Calendar },
      'standings': { label: 'Standings', icon: Trophy },
      'transfers': { label: 'Transfers', icon: ArrowUp },
      'admin': { label: 'Admin', icon: Users },
    };

    pathSegments.forEach((segment, index) => {
      if (segment === '[id]' || segment.startsWith('[')) return;
      
      const route = routeMap[segment];
      if (route) {
        const href = '/' + pathSegments.slice(0, index + 1).join('/');
        items.push({
          label: route.label,
          href,
          icon: route.icon
        });
      }
    });

    return items;
  };

  // Handle scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Error boundary for page errors
  useEffect(() => {
    const handleError = (error) => {
      console.error('Page Error:', error);
      setPageError(error.message);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Refresh page function
  const refreshPage = () => {
    window.location.reload();
  };

  // Loading state
  if (status === 'loading') {
    return (
      <>
        <Head>
          <title>Loading - Horse Futsal League</title>
          <meta name="description" content="Loading Horse Futsal League..." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4 text-lg">Loading Horse Futsal League...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we prepare everything for you</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (pageError) {
    return (
      <>
        <Head>
          <title>Error - Horse Futsal League</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              We encountered an error while loading the page. Please try refreshing.
            </p>
            <div className="space-y-3">
              <button
                onClick={refreshPage}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </button>
              <Link
                href="/"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Error: {pageError}
            </p>
          </div>
        </div>
      </>
    );
  }

  const breadcrumbItems = showBreadcrumb ? getBreadcrumbItems() : [];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description || 'Premier futsal tournament management system with live matches, team statistics, and comprehensive player tracking.'} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description || 'Premier futsal tournament management system'} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
            <div className="flex items-center justify-center space-x-2">
              <WifiOff className="w-4 h-4" />
              <span>You're currently offline. Some features may not work properly.</span>
            </div>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        {showBreadcrumb && breadcrumbItems.length > 1 && (
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-2 py-3 text-sm">
                {breadcrumbItems.map((item, index) => {
                  const IconComponent = item.icon;
                  const isLast = index === breadcrumbItems.length - 1;
                  
                  return (
                    <div key={item.href} className="flex items-center space-x-2">
                      {index > 0 && (
                        <span className="text-gray-400">/</span>
                      )}
                      {isLast ? (
                        <div className="flex items-center space-x-1 text-gray-900 font-medium">
                          <IconComponent className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* About */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  About
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/about" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      About the League
                    </Link>
                  </li>
                  <li>
                    <Link href="/rules" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Rules & Regulations
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Tournament */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  Tournament
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/teams" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Teams
                    </Link>
                  </li>
                  <li>
                    <Link href="/players" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Players
                    </Link>
                  </li>
                  <li>
                    <Link href="/matches" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Matches
                    </Link>
                  </li>
                  <li>
                    <Link href="/standings" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Standings
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  Resources
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/schedule" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Match Schedule
                    </Link>
                  </li>
                  <li>
                    <Link href="/statistics" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Statistics
                    </Link>
                  </li>
                  <li>
                    <Link href="/transfers" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Transfer Market
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Connect */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  Connect
                </h3>
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Horse Futsal League</p>
                  <p className="mb-2">Premier Futsal Tournament</p>
                  <div className="flex items-center space-x-1 mt-4">
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-xs">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-gray-500">
                © 2024 Horse Futsal League. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </footer>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </>
  );
}
