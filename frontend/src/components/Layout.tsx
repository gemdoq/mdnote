import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Layout() {
  const { username, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">mdnote</Link>
        <nav className="nav">
          <Link to="/new" className="nav-link desktop-nav-link" aria-label="새 노트 만들기">새 노트</Link>
          <Link to="/settings" className="nav-link desktop-nav-link" aria-label="설정">설정</Link>
          <button
            onClick={toggleTheme}
            className="nav-link btn-theme-toggle"
            aria-label={theme === 'dark' ? '라이트 테마로 전환' : '다크 테마로 전환'}
          >
            {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
          <span className="nav-username">{username}</span>
          <button onClick={handleLogout} className="nav-link btn-logout" aria-label="로그아웃">로그아웃</button>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="하단 네비게이션">
        <Link
          to="/"
          className={`bottom-nav-item ${isActive('/') ? 'bottom-nav-active' : ''}`}
          aria-label="노트 목록"
        >
          <span className="bottom-nav-icon">{'\uD83C\uDFE0'}</span>
          <span className="bottom-nav-label">홈</span>
        </Link>
        <Link
          to="/new"
          className={`bottom-nav-item ${isActive('/new') ? 'bottom-nav-active' : ''}`}
          aria-label="새 노트"
        >
          <span className="bottom-nav-icon">{'\uD83D\uDCDD'}</span>
          <span className="bottom-nav-label">새 노트</span>
        </Link>
        <Link
          to="/settings"
          className={`bottom-nav-item ${isActive('/settings') ? 'bottom-nav-active' : ''}`}
          aria-label="설정"
        >
          <span className="bottom-nav-icon">{'\u2699\uFE0F'}</span>
          <span className="bottom-nav-label">설정</span>
        </Link>
      </nav>
    </div>
  )
}
