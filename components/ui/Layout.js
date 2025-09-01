// FILE: components/ui/Layout.js
// ===========================================
import { useSession } from 'next-auth/react';
import Navbar from './Navbar';
import LoadingSpinner from './LoadingSpinner';

export default function Layout({ children }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}