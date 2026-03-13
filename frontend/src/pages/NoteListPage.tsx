import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listNotes, searchNotes, pinNote, deleteNote, type NoteListItem } from '../api/notes'
import { useToast } from '../contexts/ToastContext'
import { NoteListSkeleton } from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'

const SORT_OPTIONS = [
  { label: '최신순', sort: 'date', order: 'desc' },
  { label: '오래된순', sort: 'date', order: 'asc' },
  { label: '제목순(가나다)', sort: 'title', order: 'asc' },
  { label: '제목순(역순)', sort: 'title', order: 'desc' },
]

const CACHE_KEY = 'cache-note-list'
const PAGE_SIZE = 20

export default function NoteListPage() {
  const [notes, setNotes] = useState<NoteListItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [sortIndex, setSortIndex] = useState(0)
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const { showToast } = useToast()

  // Pull-to-refresh
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 스와이프 상태
  const [swipingIndex, setSwipingIndex] = useState<number | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const swipeStartX = useRef(0)
  const swipeStartY = useRef(0)
  const swipeDirection = useRef<'horizontal' | 'vertical' | null>(null)

  // 삭제 모달
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // 무한 스크롤 감지
  const sentinelRef = useRef<HTMLDivElement>(null)

  const sortedNotes = useCallback((items: NoteListItem[]) => {
    const pinned = items.filter((n) => n.pinned)
    const unpinned = items.filter((n) => !n.pinned)
    return [...pinned, ...unpinned]
  }, [])

  const fetchNotes = async (pageNum: number = 0, append: boolean = false, showLoading: boolean = true) => {
    try {
      if (!append && showLoading) setLoading(true)
      if (append) setLoadingMore(true)

      if (query) {
        const res = await searchNotes(query)
        const sorted = sortedNotes(res.data)
        setNotes(sorted)
        setTotalElements(sorted.length)
        setHasMore(false)
        setError('')
      } else {
        const { sort, order } = SORT_OPTIONS[sortIndex]
        const res = await listNotes(sort, order, pageNum, PAGE_SIZE)
        const newItems = res.data.content
        if (append) {
          setNotes((prev) => sortedNotes([...prev, ...newItems]))
        } else {
          setNotes(sortedNotes(newItems))
        }
        setTotalElements(res.data.totalElements)
        setPage(res.data.page)
        setHasMore(res.data.page < res.data.totalPages - 1)
        setError('')
        // 캐시 저장 (첫 페이지만)
        if (!append) {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(sortedNotes(newItems)))
          } catch { /* 무시 */ }
        }
      }
    } catch {
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
      setLoadingMore(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setPage(0)
    fetchNotes(0, false)
  }, [sortIndex])

  // 무한 스크롤 IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchNotes(page + 1, true, false)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, page, sortIndex, query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchNotes(0, false)
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

  const handleDelete = async (filename: string) => {
    try {
      await deleteNote(filename)
      setNotes((prev) => prev.filter((n) => n.filename !== filename))
      setTotalElements((prev) => prev - 1)
      showToast('노트가 삭제되었습니다.', 'success')
    } catch {
      showToast('삭제에 실패했습니다.', 'error')
    }
    setDeleteTarget(null)
  }

  // Pull-to-refresh
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
      setPage(0)
      fetchNotes(0, false, false)
    }
    setPulling(false)
    setPullDistance(0)
  }

  // 스와이프 제스처
  const handleSwipeStart = (e: React.TouchEvent, index: number) => {
    swipeStartX.current = e.touches[0].clientX
    swipeStartY.current = e.touches[0].clientY
    swipeDirection.current = null
    setSwipingIndex(index)
    setSwipeOffset(0)
  }

  const handleSwipeMove = (e: React.TouchEvent) => {
    if (swipingIndex === null) return
    const dx = e.touches[0].clientX - swipeStartX.current
    const dy = e.touches[0].clientY - swipeStartY.current

    if (swipeDirection.current === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        swipeDirection.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
      }
    }

    if (swipeDirection.current === 'horizontal') {
      e.preventDefault()
      setSwipeOffset(Math.max(-120, Math.min(120, dx)))
    }
  }

  const handleSwipeEnd = (note: NoteListItem) => {
    if (swipeDirection.current === 'horizontal') {
      if (swipeOffset < -60) {
        // 왼쪽 스와이프 → 삭제
        setDeleteTarget(note.filename)
      } else if (swipeOffset > 60) {
        // 오른쪽 스와이프 → 고정 토글
        pinNote(note.filename).then((res) => {
          setNotes((prev) =>
            sortedNotes(prev.map((n) =>
              n.filename === note.filename ? { ...n, pinned: res.data.pinned } : n
            ))
          )
          showToast(res.data.pinned ? '노트가 고정되었습니다.' : '고정이 해제되었습니다.', 'success')
        }).catch(() => {
          showToast('고정 상태 변경에 실패했습니다.', 'error')
        })
      }
    }
    setSwipingIndex(null)
    setSwipeOffset(0)
    swipeDirection.current = null
  }

  const parseFilename = (filename: string) => {
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/)
    if (match) {
      return { date: match[1], title: match[2].replace(/-/g, ' ') }
    }
    return { date: '', title: filename.replace('.md', '') }
  }

  if (loading) return <NoteListSkeleton />

  return (
    <div
      className="note-list-page"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
              : `${totalElements}개의 노트`}
          </span>
        </h2>
        <select
          className="sort-select"
          value={sortIndex}
          onChange={(e) => setSortIndex(Number(e.target.value))}
          aria-label="정렬 기준"
        >
          {SORT_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="노트 검색"
        />
        <button type="submit" aria-label="검색 실행">검색</button>
        <Link to="/new" className="btn-search-style" aria-label="새 노트 만들기">새 노트</Link>
      </form>

      {error && <div className="error-message">{error}</div>}

      {notes.length === 0 && !error ? (
        <div className="empty-state">
          <p>노트가 없습니다.</p>
          <Link to="/new">첫 번째 노트를 만들어보세요</Link>
        </div>
      ) : (
        <ul className="note-list">
          {notes.map((note, index) => {
            const { date, title } = parseFilename(note.filename)
            const isSwiping = swipingIndex === index
            const offset = isSwiping ? swipeOffset : 0

            return (
              <li key={note.filename} className="swipe-container">
                {/* 스와이프 배경 */}
                <div className="swipe-bg">
                  <div className={`swipe-action swipe-action-right ${offset > 30 ? 'swipe-action-visible' : ''}`}>
                    {note.pinned ? '고정 해제' : '고정'}
                  </div>
                  <div className={`swipe-action swipe-action-left ${offset < -30 ? 'swipe-action-visible' : ''}`}>
                    삭제
                  </div>
                </div>
                <div
                  className="note-item-wrapper"
                  style={{ transform: `translateX(${offset}px)`, transition: isSwiping ? 'none' : 'transform 0.3s ease' }}
                  onTouchStart={(e) => handleSwipeStart(e, index)}
                  onTouchMove={handleSwipeMove}
                  onTouchEnd={() => handleSwipeEnd(note)}
                >
                  <button
                    className="pin-btn"
                    onClick={(e) => handlePin(e, note.filename)}
                    title={note.pinned ? '고정 해제' : '고정'}
                    aria-label={note.pinned ? '고정 해제' : '노트 고정'}
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

      {/* 무한 스크롤 감지 */}
      <div ref={sentinelRef} className="scroll-sentinel" />
      {loadingMore && (
        <div className="loading-more">로딩 중...</div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="노트 삭제"
        message="정말 이 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
