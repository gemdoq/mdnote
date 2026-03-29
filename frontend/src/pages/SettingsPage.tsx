import { useState, useEffect, type FormEvent } from 'react'
import { getProfile, updateGitHubSettings, testGithubConnection, changePassword, type UserProfile } from '../api/user'
import { exportAllNotes } from '../api/notes'
import { useToast } from '../contexts/ToastContext'
import { SettingsSkeleton } from '../components/Skeleton'

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [githubToken, setGithubToken] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { showToast } = useToast()

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
      showToast('설정이 저장되었습니다.', 'success')
      setGithubToken('')
    } catch {
      showToast('설정 저장에 실패했습니다.', 'error')
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      await testGithubConnection()
      showToast('GitHub 연결 성공!', 'success')
    } catch {
      showToast('GitHub 연결에 실패했습니다. 토큰과 저장소 설정을 확인해주세요.', 'error')
    } finally {
      setTesting(false)
    }
  }

  const handleExportAll = async () => {
    setExporting(true)
    try {
      const res = await exportAllNotes()
      const blob = new Blob([res.data], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mdnote-backup-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showToast('백업 파일이 다운로드되었습니다.', 'success')
    } catch {
      showToast('백업 다운로드에 실패했습니다.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast('새 비밀번호가 일치하지 않습니다.', 'error')
      return
    }
    setChangingPassword(true)
    try {
      const res = await changePassword({ currentPassword, newPassword })
      if (res.data.success) {
        showToast(res.data.message, 'success')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        showToast(res.data.message, 'error')
      }
    } catch {
      showToast('비밀번호 변경에 실패했습니다.', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) return <SettingsSkeleton />

  return (
    <div className="settings-page">
      <h2>설정</h2>

      <section className="settings-section">
        <h3>프로필</h3>
        <p>사용자명: {profile?.username}</p>
        <p>이메일: {profile?.email}</p>
      </section>

      {profile?.provider === 'LOCAL' && (
        <section className="settings-section">
          <h3>비밀번호 변경</h3>
          <form onSubmit={handleChangePassword}>
            <label htmlFor="current-password">현재 비밀번호</label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              aria-label="현재 비밀번호"
            />
            <label htmlFor="new-password">새 비밀번호</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="8자 이상, 영문+숫자"
              aria-label="새 비밀번호"
            />
            <label htmlFor="confirm-password">새 비밀번호 확인</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-label="새 비밀번호 확인"
            />
            <button type="submit" className="btn-primary" disabled={changingPassword}>
              {changingPassword ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </section>
      )}

      <section className="settings-section">
        <h3>GitHub 연동</h3>
        <details className="token-guide">
          <summary className="token-guide-toggle">토큰 발급 가이드 (펼쳐서 보기)</summary>
          <div className="token-guide-content">
            <p className="guide-title">사전 준비</p>
            <ol>
              <li>GitHub 계정이 없다면 <a href="https://github.com/signup" target="_blank" rel="noopener noreferrer">github.com/signup</a>에서 가입합니다.</li>
              <li>노트를 저장할 저장소(repository)를 하나 만듭니다. 저장소 이름은 자유롭게 지정하세요. (예: my-notes)</li>
            </ol>

            <p className="guide-title">토큰 발급 방법</p>
            <ol>
              <li>GitHub에 로그인한 상태에서 <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer">Fine-grained token 발급 페이지</a>로 이동합니다.</li>
              <li><strong>Generate new token</strong> 버튼을 클릭합니다.</li>
              <li><strong>Token name</strong>: 원하는 이름 입력 (예: mdnote)</li>
              <li><strong>Expiration</strong>: 토큰 만료일을 선택합니다. (최대 1년)</li>
              <li><strong>Description</strong>: 비워두어도 됩니다.</li>
              <li><strong>Resource owner</strong>: 기본값 그대로 두면 됩니다. (본인 계정이 자동 선택됨)</li>
              <li><strong>Repository access</strong>: <strong>"Only select repositories"</strong>를 선택하고, 위에서 만든 저장소를 선택합니다.</li>
              <li><strong>Permissions</strong> 섹션에서 <strong>"+ Add permissions"</strong> 버튼을 클릭합니다.</li>
              <li><strong>"Select repository permissions"</strong> 목록이 나타나면, 체크박스 중 <strong>Contents</strong>를 체크합니다.</li>
              <li>추가된 Contents 항목의 <strong>"Access: Read-only"</strong> 셀렉트박스를 클릭하여 <strong>"Read and write"</strong>로 변경합니다. <strong>"Access: Read and write"</strong>로 표시되는지 확인하세요.</li>
              <li>나머지 권한은 건드리지 않아도 됩니다.</li>
              <li>하단의 <strong>"Generate token"</strong> 버튼을 클릭합니다.</li>
              <li>생성된 토큰(<code>github_pat_...</code>)을 복사하여 아래에 붙여넣습니다. 이 토큰은 한 번만 표시되니 바로 붙여넣어주세요.</li>
            </ol>
          </div>
        </details>
        <form onSubmit={handleSubmit}>
          <label htmlFor="github-token">
            GitHub Token
          </label>
          <input
            id="github-token"
            type="password"
            placeholder={profile?.hasGithubToken ? '(설정됨 - 변경하려면 입력)' : 'github_pat_...'}
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            required={!profile?.hasGithubToken}
            aria-label="GitHub 토큰"
          />
          <label htmlFor="github-repo">
            저장소 (owner/repo 형식)
          </label>
          <input
            id="github-repo"
            type="text"
            placeholder="username/my-notes"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            required
            aria-label="GitHub 저장소"
          />
          <div className="settings-form-actions">
            <button type="submit" className="btn-primary" aria-label="설정 저장">저장</button>
            <button
              type="button"
              className="btn-edit"
              onClick={handleTestConnection}
              disabled={testing}
              aria-label="GitHub 연결 테스트"
            >
              {testing ? '테스트 중...' : '연결 테스트'}
            </button>
          </div>
        </form>
      </section>

      <section className="settings-section">
        <h3>데이터 백업</h3>
        <p>전체 노트를 ZIP 파일로 다운로드합니다.</p>
        <button
          className="btn-primary"
          onClick={handleExportAll}
          disabled={exporting}
          aria-label="전체 백업 다운로드"
        >
          {exporting ? '다운로드 중...' : '전체 백업'}
        </button>
      </section>
    </div>
  )
}
