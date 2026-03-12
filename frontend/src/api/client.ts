import axios from 'axios'

export function getToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

export function clearToken() {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('username')
}

const client = axios.create({
  baseURL: '/api',
})

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
