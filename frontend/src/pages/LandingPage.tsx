import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getGitHubAuthUrl } from '../api/auth'

function SyncIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8 12l2-2v6" />
      <path d="M14 10h2v6" />
    </svg>
  )
}

function EditorIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function DevicesIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

const features = [
  {
    icon: <SyncIcon />,
    title: 'GitHub 동기화',
    desc: '노트가 GitHub 저장소에 저장되어 데이터를 직접 소유합니다',
  },
  {
    icon: <EditorIcon />,
    title: '마크다운 에디터',
    desc: '실시간 미리보기와 툴바로 마크다운을 쉽게 작성하세요',
  },
  {
    icon: <DevicesIcon />,
    title: '어디서나 접근',
    desc: '모바일, 데스크톱 어디서든 PWA로 빠르게 접근하세요',
  },
  {
    icon: <ShareIcon />,
    title: '공유 & 백업',
    desc: '한 클릭으로 노트를 공유하고 ZIP으로 백업하세요',
  },
]

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <div className="loading">로딩 중...</div>
  if (isAuthenticated) return <Navigate to="/" />

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <h1 className="landing-title">mdnote</h1>
        <p className="landing-subtitle">
          GitHub 기반 마크다운 노트 — 당신의 아이디어를 안전하게 기록하세요
        </p>
        <div className="landing-cta">
          <Link to="/register" className="btn-primary landing-btn">시작하기</Link>
          <Link to="/login" className="btn-landing-secondary landing-btn">로그인</Link>
          <button
            type="button"
            className="btn-github landing-btn"
            onClick={async () => {
              try {
                const res = await getGitHubAuthUrl()
                sessionStorage.setItem('github_oauth_state', res.data.state)
                window.location.href = res.data.url
              } catch {
                // 에러 시 로그인 페이지로 이동
                window.location.href = '/login'
              }
            }}
          >
            <svg className="github-icon" width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub로 시작하기
          </button>
        </div>
      </section>

      <section className="landing-features">
        {features.map((f) => (
          <div key={f.title} className="landing-feature-card">
            <div className="landing-feature-icon">{f.icon}</div>
            <h3 className="landing-feature-title">{f.title}</h3>
            <p className="landing-feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="landing-footer">
        <p className="landing-footer-text">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </footer>
    </div>
  )
}
