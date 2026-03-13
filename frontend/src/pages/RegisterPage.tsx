import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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
        <p className="auth-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}
