import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getGitHubAuthUrl } from '../api/auth'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const err = await register({ username, email, password })
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
        <p className="auth-subtitle">회원가입</p>
        {error && <div className="error-message" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="사용자명 (3자 이상)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            aria-label="사용자명"
          />
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="이메일"
          />
          <input
            type="password"
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            aria-label="비밀번호"
          />
          <button type="submit" className="btn-primary" aria-label="회원가입">회원가입</button>
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
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}
