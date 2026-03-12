import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, type LoginRequest, type RegisterRequest } from '../api/auth'
import { getToken, clearToken } from '../api/client'

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  loading: boolean
  login: (data: LoginRequest) => Promise<string | null>
  register: (data: RegisterRequest) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    const savedUsername = localStorage.getItem('username') || sessionStorage.getItem('username')
    if (token && savedUsername) {
      setUsername(savedUsername)
    }
    setLoading(false)
  }, [])

  const login = async (data: LoginRequest): Promise<string | null> => {
    try {
      const res = await apiLogin(data)
      if (res.data.token) {
        const storage = data.rememberMe ? localStorage : sessionStorage
        storage.setItem('token', res.data.token)
        storage.setItem('username', res.data.username!)
        if (!data.rememberMe) {
          localStorage.removeItem('token')
          localStorage.removeItem('username')
        }
        setUsername(res.data.username!)
        return null
      }
      return res.data.error || '로그인에 실패했습니다.'
    } catch {
      return '로그인에 실패했습니다.'
    }
  }

  const register = async (data: RegisterRequest): Promise<string | null> => {
    try {
      const res = await apiRegister(data)
      if (res.data.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('username', res.data.username!)
        setUsername(res.data.username!)
        return null
      }
      return res.data.error || '회원가입에 실패했습니다.'
    } catch {
      return '회원가입에 실패했습니다.'
    }
  }

  const logout = () => {
    clearToken()
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!username, username, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
