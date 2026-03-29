import client from './client'

export interface LoginRequest {
  username: string
  password: string
  rememberMe: boolean
}

export interface RegisterRequest {
  username: string
  password: string
  email: string
}

export interface AuthResponse {
  accessToken?: string
  refreshToken?: string
  username?: string
  error?: string
}

export const login = (data: LoginRequest) =>
  client.post<AuthResponse>('/auth/login', data)

export const register = (data: RegisterRequest) =>
  client.post<AuthResponse>('/auth/register', data)

export const refreshToken = (token: string) =>
  client.post<AuthResponse>('/auth/refresh', { refreshToken: token })

export const getGitHubAuthUrl = () =>
  client.get<{ url: string; state: string }>('/auth/github')

export const githubCallback = (code: string, state: string) =>
  client.post<AuthResponse>('/auth/github/callback', { code, state })
