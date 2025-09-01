// FILE: pages/_app.js
// ===========================================
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import Layout from '../components/ui/Layout';
import '../styles/globals.css';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </Layout>
    </SessionProvider>
  );
}