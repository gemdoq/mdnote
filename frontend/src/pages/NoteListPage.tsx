import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listNotes, searchNotes, pinNote, type NoteListItem } from '../api/notes'
import { useToast } from '../contexts/ToastContext'

const SORT_OPTIONS = [
  { label: '최신순', sort: 'date', order: 'desc' },
  { label: '오래된순', sort: 'date', order: 'asc' },
  { label: '제목순(가나다)', sort: 'title', order: 'asc' },
  { label: '제목순(역순)', sort: 'title', order: 'desc' },
]

const CACHE_KEY = 'cache-note-list'

export default function NoteListPage() {
  const [notes, setNotes] = useState<NoteListItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortIndex, setSortIndex] = useState(0)
  const { showToast } = useToast()

  // Pull-to-refresh 상태
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const sortedNotes = useCallback((items: NoteListItem[]) => {
    // 고정된 노트를 항상 상단에
    const pinned = items.filter((n) => n.pinned)
    const unpinned = items.filter((n) => !n.pinned)
    return [...pinned, ...unpinned]
  }, [])

  const fetchNotes = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const { sort, order } = SORT_OPTIONS[sortIndex]
      const res = query
        ? await searchNotes(query)
        : await listNotes(sort, order)
      const sorted = sortedNotes(res.data)
      setNotes(sorted)
      setError('')
      // 캐시 저장
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(sorted))
      } catch { /* 무시 */ }
    } catch {
      // 오프라인 - 캐시에서 로드
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          setNotes(JSON.parse(cached))
          showToast('오프라인 모드 - 캐시된 내용을 표시합니다', 'info')
        } catch {
          setError('노트를 불러올 수 없습니다. GitHub 설정을 확인해주세요.')
        }
      } else {
        setError('노트를 불러올 수 없습니다. GitHub 설정을 확인해주세요.')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [sortIndex])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchNotes()
  }

  const handlePin = async (e: React.MouseEvent, filename: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await pinNote(filename)
      setNotes((prev) =>
        sortedNotes(prev.map((n) =>
          n.filename === filename ? { ...n, pinned: res.data.pinned } : n
        ))
      )
      showToast(res.data.pinned ? '노트가 고정되었습니다.' : '고정이 해제되었습니다.', 'success')
    } catch {
      showToast('고정 상태 변경에 실패했습니다.', 'error')
    }
  }

  // Pull-to-refresh 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
      setPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling) return
    const diff = e.touches[0].clientY - touchStartY.current
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 80))
    }
  }

  const handleTouchEnd = () => {
    if (pullDistance > 50) {
      setRefreshing(true)
      fetchNotes(false)
    }
    setPulling(false)
    setPullDistance(0)
  }

  const parseFilename = (filename: string) => {
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/)
    if (match) {
      return { date: match[1], title: match[2].replace(/-/g, ' ') }
    }
    return { date: '', title: filename.replace('.md', '') }
  }

  if (loading) return <div className="loading">로딩 중...</div>

  return (
    <div
      className="note-list-page"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh 인디케이터 */}
      {(pullDistance > 0 || refreshing) && (
        <div className="pull-indicator" style={{ height: refreshing ? 40 : pullDistance }}>
          {refreshing ? '새로고침 중...' : pullDistance > 50 ? '놓으면 새로고침' : '당겨서 새로고침'}
        </div>
      )}

      <div className="page-header">
        <h2>
          노트 목록
          <span className="note-count">
            {query
              ? `${notes.length}개의 검색 결과`
              : `${notes.length}개의 노트`}
          </span>
        </h2>
        <div className="page-header-actions">
          <select
            className="sort-select"
            value={sortIndex}
            onChange={(e) => setSortIndex(Number(e.target.value))}
          >
            {SORT_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>{opt.label}</option>
            ))}
          </select>
          <Link to="/new" className="btn-primary">새 노트</Link>
        </div>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">검색</button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {notes.length === 0 && !error ? (
        <div className="empty-state">
          <p>노트가 없습니다.</p>
          <Link to="/new">첫 번째 노트를 만들어보세요</Link>
        </div>
      ) : (
        <ul className="note-list">
          {notes.map((note) => {
            const { date, title } = parseFilename(note.filename)
            return (
              <li key={note.filename}>
                <div className="note-item-wrapper">
                  <button
                    className="pin-btn"
                    onClick={(e) => handlePin(e, note.filename)}
                    title={note.pinned ? '고정 해제' : '고정'}
                  >
                    {note.pinned ? '\u2605' : '\u2606'}
                  </button>
                  <Link to={`/notes/${encodeURIComponent(note.filename)}`} className="note-item">
                    <div className="note-item-content">
                      <span className="note-title">{title}</span>
                      {note.tags && note.tags.length > 0 && (
                        <div className="tag-list">
                          {note.tags.map((tag) => (
                            <span key={tag} className="tag-badge">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {date && <span className="note-date">{date}</span>}
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
