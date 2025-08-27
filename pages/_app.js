// pages/_app.js - Fixed with AppProvider wrapper
import { useState, useEffect } from 'react';
import { AppProvider } from '../contexts/AppContext'; // ✅ IMPORT THE PROVIDER
import '../styles/globals.css';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    setLoading(false);
  }, []);

  // Show loading during SSR or initial load
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ WRAP WITH APP PROVIDER
  return (
    <AppProvider>
      <Head>
        <title>The Horse Futsal League</title>
        <meta name="theme-color" content="#1e3a8a" />
      </Head>
      <Component {...pageProps} />
    </AppProvider>
  );
}

export default MyApp;