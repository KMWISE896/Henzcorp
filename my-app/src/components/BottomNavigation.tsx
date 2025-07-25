
import { Home, ArrowUpDown, Users, User } from 'lucide-react';

interface BottomNavigationProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export default function BottomNavigation({ currentScreen, onNavigate }: BottomNavigationProps) {
  const navItems = [
    {
      id: 'home',
      icon: Home,
      label: 'Home',
      onClick: () => onNavigate('home')
    },
    {
      id: 'transfer',
      icon: ArrowUpDown,
      label: 'Transfer',
      onClick: () => onNavigate('transfer')
    },
    {
      id: 'referral',
      icon: Users,
      label: 'Referral',
      onClick: () => onNavigate('referral')
    },
    {
      id: 'account',
      icon: User,
      label: 'Account',
      onClick: () => onNavigate('account')
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-blue-800/30 z-50">
      <div className="flex items-center justify-around py-4 px-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center space-y-1 transition-colors ${
                isActive ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}