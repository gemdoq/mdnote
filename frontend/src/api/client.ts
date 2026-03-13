import axios from 'axios'

export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')
}

export function getStorageType(): 'localStorage' | 'sessionStorage' {
  return localStorage.getItem('accessToken') ? 'localStorage' : 'sessionStorage'
}

export function setTokens(accessToken: string, refreshToken: string, storage: Storage) {
  storage.setItem('accessToken', accessToken)
  storage.setItem('refreshToken', refreshToken)
}

export function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('username')
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('refreshToken')
  sessionStorage.removeItem('username')
}

const client = axios.create({
  baseURL: '/api',
})

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      // refresh 요청 자체가 401이면 바로 로그아웃
      if (originalRequest.url === '/auth/refresh') {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return client(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const currentRefreshToken = getRefreshToken()
      if (!currentRefreshToken) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await client.post('/auth/refresh', { refreshToken: currentRefreshToken })
        const { accessToken, refreshToken } = res.data
        const storage = getStorageType() === 'localStorage' ? localStorage : sessionStorage
        setTokens(accessToken, refreshToken, storage)
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return client(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default client
