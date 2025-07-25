import { User } from 'lucide-react'

interface LoadingScreenProps {
  handleLogout?: () => void
  message?: string
  subMessage?: string
}

export default function LoadingScreen({ 
  handleLogout, 
  message = "Loading...", 
  subMessage = "Connecting to server..." 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Animated Loading Indicator */}
      <div className="relative mb-8">
        {/* Outer ring */}
        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        
        {/* Inner ring */}
        <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500 border-r-transparent rounded-full animate-spin" 
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
        </div>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <User className="w-6 h-6 text-blue-300" />
        </div>
      </div>

      {/* Loading Messages */}
      <div className="text-center mb-8">
        <h2 className="text-white text-xl font-medium mb-2">{message}</h2>
        <p className="text-blue-300 text-sm">{subMessage}</p>
      </div>

      {/* Optional Logout Button */}
      {handleLogout && (
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl font-medium transition-colors shadow-lg"
        >
          Cancel & Return to Login
        </button>
      )}
    </div>
  )
}