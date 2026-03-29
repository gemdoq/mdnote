import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getGitHubAuthUrl } from '../api/auth'

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
        <div className="auth-divider"><span>또는</span></div>
        <button
          type="button"
          className="btn-github"
          onClick={async () => {
            try {
              const res = await getGitHubAuthUrl()
              sessionStorage.setItem('github_oauth_state', res.data.state)
              window.location.href = res.data.url
            } catch {
              setError('GitHub 로그인 URL을 가져오는데 실패했습니다.')
            }
          }}
        >
          <svg className="github-icon" width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub로 로그인
        </button>
        <p className="auth-link">
          계정이 없으신가요? <Link to="/register">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
