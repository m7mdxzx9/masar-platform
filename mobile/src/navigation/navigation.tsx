import React, { createContext, useContext, useState, useEffect } from 'react'
import { BackHandler } from 'react-native'

export interface NavigationRoute {
  screen: string
  params?: any
}

interface NavigationContextType {
  currentRoute: NavigationRoute
  stack: NavigationRoute[]
  push: (screen: string, params?: any) => void
  pop: () => void
  reset: (screen: string, params?: any) => void
  canGoBack: boolean
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export const NavigationProvider: React.FC<{ children: React.ReactNode; initialScreen?: string }> = ({
  children,
  initialScreen = 'Dashboard',
}) => {
  const [stack, setStack] = useState<NavigationRoute[]>([{ screen: initialScreen }])

  const currentRoute = stack[stack.length - 1]

  const push = (screen: string, params?: any) => {
    setStack((prev) => [...prev, { screen, params }])
  }

  const pop = () => {
    if (stack.length > 1) {
      setStack((prev) => prev.slice(0, -1))
      return true
    }
    return false
  }

  const reset = (screen: string, params?: any) => {
    setStack([{ screen, params }])
  }

  const canGoBack = stack.length > 1

  useEffect(() => {
    const onBackPress = () => {
      if (stack.length > 1) {
        pop()
        return true // Intercept back button
      }
      return false // Default back behavior (exit app)
    }

    BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress)
  }, [stack])

  return (
    <NavigationContext.Provider value={{ currentRoute, stack, push, pop, reset, canGoBack }}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
