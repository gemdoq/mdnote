import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const SAVED_USERNAME_KEY = 'savedUsername'
const REMEMBER_USERNAME_KEY = 'rememberUsername'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberUsername, setRememberUsername] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_USERNAME_KEY)
    if (saved === 'true') {
      setRememberUsername(true)
      setUsername(localStorage.getItem(SAVED_USERNAME_KEY) || '')
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (rememberUsername) {
      localStorage.setItem(SAVED_USERNAME_KEY, username)
      localStorage.setItem(REMEMBER_USERNAME_KEY, 'true')
    } else {
      localStorage.removeItem(SAVED_USERNAME_KEY)
      localStorage.removeItem(REMEMBER_USERNAME_KEY)
    }
    const err = await login({ username, password, rememberMe })
    if (err) {
      setError(err)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>mdnote</h1>
        <p className="auth-subtitle">마크다운 노트</p>
        {error && <div className="error-message" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="사용자명"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            aria-label="사용자명"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="비밀번호"
          />
          <div className="login-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberUsername}
                onChange={(e) => setRememberUsername(e.target.checked)}
              />
              아이디 기억
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              자동 로그인
            </label>
          </div>
          <button type="submit" className="btn-primary" aria-label="로그인">로그인</button>
        </form>
        <p className="auth-link">
          계정이 없으신가요? <Link to="/register">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
