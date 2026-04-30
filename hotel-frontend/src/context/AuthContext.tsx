'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { MeResponse, UserRole } from '@/lib/types'

interface AuthUser {
  userId: number
  email: string
  role: UserRole
  clientId: number | null
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  isAdmin: boolean
  isClient: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      document.cookie = `token=${savedToken}; path=/; max-age=3600; SameSite=Lax`
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    document.cookie = `token=${newToken}; path=/; max-age=3600; SameSite=Lax`
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; max-age=0'
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, token,
      login, logout,
      isAdmin: user?.role === 'Admin',
      isClient: user?.role === 'Client',
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
