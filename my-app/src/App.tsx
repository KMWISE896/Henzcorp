import React, { useState } from 'react';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { AppProvider } from './contexts/AppContext';
import AppDatabase from './App-Database';
import AppMock from './App-Mock';
import DatabaseModeToggle from './components/DatabaseModeToggle';

// Import the original mock-based app
import AppMockOriginal from './App-Mock';

export default function App() {
  const [useMockData, setUseMockData] = useState(true);

  return (
    <div className="relative">
      <DatabaseModeToggle 
        useMockData={useMockData} 
        onToggle={setUseMockData} 
      />
      
      {useMockData ? (
        <AppProvider>
          <AppMockOriginal />
        </AppProvider>
      ) : (
        <SupabaseProvider>
          <AppDatabase />
        </SupabaseProvider>
      )}
    </div>
  );
}