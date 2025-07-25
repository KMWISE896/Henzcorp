import { SupabaseProvider } from './contexts/SupabaseContext';
import AppDatabase from './App-Database';

export default function App() {
  return (
    <SupabaseProvider>
      <AppDatabase />
    </SupabaseProvider>
  );
}