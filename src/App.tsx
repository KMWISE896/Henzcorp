import React from 'react';
import React from 'react';
import { SupabaseProvider } from './contexts/SupabaseContext';
import AppDatabase from './App-Database';
import AdminApp from './AdminApp';

export default function App() {
  // Check if we're on the admin route
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  
  if (isAdminRoute) {
    return <AdminApp />;
  }

  return (
    <SupabaseProvider>
      <AppDatabase />
    </SupabaseProvider>
  );
}