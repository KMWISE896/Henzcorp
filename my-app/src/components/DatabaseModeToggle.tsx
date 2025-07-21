import React, { useState } from 'react'
import { Database, HardDrive, ToggleLeft, ToggleRight } from 'lucide-react'

interface DatabaseModeToggleProps {
  useMockData: boolean
  onToggle: (useMock: boolean) => void
}

export default function DatabaseModeToggle({ useMockData, onToggle }: DatabaseModeToggleProps) {
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async () => {
    setIsToggling(true)
    
    // Add a small delay for visual feedback
    setTimeout(() => {
      onToggle(!useMockData)
      setIsToggling(false)
    }, 300)
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <HardDrive className={`w-4 h-4 ${useMockData ? 'text-gray-400' : 'text-green-400'}`} />
            <span className={`text-xs font-medium ${useMockData ? 'text-gray-400' : 'text-green-400'}`}>
              Database
            </span>
          </div>
          
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className="relative"
          >
            {useMockData ? (
              <ToggleLeft className={`w-8 h-8 text-gray-400 transition-all ${isToggling ? 'animate-pulse' : 'hover:text-gray-300'}`} />
            ) : (
              <ToggleRight className={`w-8 h-8 text-green-400 transition-all ${isToggling ? 'animate-pulse' : 'hover:text-green-300'}`} />
            )}
          </button>
          
          <div className="flex items-center space-x-2">
            <Database className={`w-4 h-4 ${!useMockData ? 'text-gray-400' : 'text-blue-400'}`} />
            <span className={`text-xs font-medium ${!useMockData ? 'text-gray-400' : 'text-blue-400'}`}>
              Mock
            </span>
          </div>
        </div>
        
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-400">
            {useMockData ? 'Using Mock Data' : 'Using Supabase DB'}
          </p>
        </div>
      </div>
    </div>
  )
}