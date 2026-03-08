import { useState, useEffect, type FormEvent } from 'react'
import { getProfile, updateGitHubSettings, type UserProfile } from '../api/user'

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [githubToken, setGithubToken] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile()
      .then((res) => {
        setProfile(res.data)
        setGithubRepo(res.data.githubRepo || '')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await updateGitHubSettings({ githubToken, githubRepo })
      setMessage('설정이 저장되었습니다.')
      setGithubToken('')
    } catch {
      setMessage('설정 저장에 실패했습니다.')
    }
  }

  if (loading) return <div className="loading">로딩 중...</div>

  return (
    <div className="settings-page">
      <h2>설정</h2>

      <section className="settings-section">
        <h3>프로필</h3>
        <p>사용자명: {profile?.username}</p>
        <p>이메일: {profile?.email}</p>
      </section>

      <section className="settings-section">
        <h3>GitHub 연동</h3>
        <p className="settings-help">
          GitHub Personal Access Token이 필요합니다.
          GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens에서
          생성할 수 있습니다. repo 권한(Contents read/write)이 필요합니다.
        </p>
        {message && <div className="success-message">{message}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            GitHub Token
            <input
              type="password"
              placeholder={profile?.hasGithubToken ? '(설정됨 - 변경하려면 입력)' : 'ghp_...'}
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              required={!profile?.hasGithubToken}
            />
          </label>
          <label>
            저장소 (owner/repo 형식)
            <input
              type="text"
              placeholder="username/my-notes"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn-primary">저장</button>
        </form>
      </section>
    </div>
  )
}
