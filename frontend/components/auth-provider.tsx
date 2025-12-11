"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/api"

// Helper para cookies
const setCookie = (name: string, value: string, days: number) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

const eraseCookie = (name: string) => {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

interface User {
  email: string
  role: 'superadmin' | 'official' | 'citizen'
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token")
      if (token) {
        const savedRole = localStorage.getItem("user_role") as any || 'official';
        setUser({ email: 'usuario@sesion.com', role: savedRole })
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const data = await authService.login({ email, password })
      
      localStorage.setItem("auth_token", data.access_token)
      localStorage.setItem("user_role", data.user_role)
      setCookie("auth_token", data.access_token, 1)
      
      setUser({ email, role: data.user_role })
      
      // CORRECCIÓN: Usar router.push() para la redirección
      router.push('/dashboard')
    } catch (error) {
      // Re-lanzar el error para que la página de login lo capture
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_role")
    eraseCookie("auth_token")
    
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}