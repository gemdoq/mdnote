import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { githubCallback } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const { loginWithTokens } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      setError('GitHub 인증 코드가 없습니다.')
      return
    }

    const savedState = sessionStorage.getItem('github_oauth_state')
    if (savedState && state !== savedState) {
      setError('OAuth state 값이 일치하지 않습니다. 다시 시도해주세요.')
      return
    }

    sessionStorage.removeItem('github_oauth_state')

    githubCallback(code, state || '')
      .then((res) => {
        if (res.data.accessToken) {
          loginWithTokens(res.data.accessToken, res.data.refreshToken!, res.data.username!)
          navigate('/')
        } else {
          setError(res.data.error || 'GitHub 로그인에 실패했습니다.')
        }
      })
      .catch(() => {
        setError('GitHub 로그인에 실패했습니다.')
      })
  }, [searchParams, loginWithTokens, navigate])

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>mdnote</h1>
          <p className="auth-subtitle">GitHub 로그인 실패</p>
          <div className="error-message" role="alert">{error}</div>
          <p className="auth-link">
            <Link to="/login">로그인 페이지로 돌아가기</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>mdnote</h1>
        <p className="auth-subtitle">GitHub 로그인 처리 중...</p>
      </div>
    </div>
  )
}
