'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SplashLoader } from './splash-loader'

interface LoaderContextType {
  triggerLoader: (duration?: number) => void
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined)

export function useLoader() {
  const context = useContext(LoaderContext)
  if (!context) {
    throw new Error('useLoader must be used within a LoaderProvider')
  }
  return context
}

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if this is the first load in the session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash')
    if (!hasSeenSplash) {
      // First load: trigger splash
      setIsVisible(true)
      sessionStorage.setItem('hasSeenSplash', 'true')
      
      // Auto-hide after 3 seconds minimum for the premium feel
      setTimeout(() => {
        setIsVisible(false)
      }, 3000)
    }
  }, [])

  const triggerLoader = (duration: number = 3000) => {
    setIsVisible(true)
    setTimeout(() => {
      setIsVisible(false)
    }, duration)
  }

  return (
    <LoaderContext.Provider value={{ triggerLoader }}>
      {children}
      <SplashLoader isVisible={isVisible} />
    </LoaderContext.Provider>
  )
}
