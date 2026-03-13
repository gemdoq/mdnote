import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { getNote, deleteNote, pinNote, shareNote, unshareNote, type Note } from '../api/notes'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from '../components/ConfirmModal'

const NOTE_CACHE_PREFIX = 'cache-note-'
const MAX_CACHED_NOTES = 50

function cacheNote(filename: string, data: Note) {
  try {
    const key = `${NOTE_CACHE_PREFIX}${filename}`
    localStorage.setItem(key, JSON.stringify(data))

    // LRU 관리: 캐시 키 목록 유지
    const cacheKeys: string[] = JSON.parse(localStorage.getItem('cache-note-keys') || '[]')
    const idx = cacheKeys.indexOf(key)
    if (idx !== -1) cacheKeys.splice(idx, 1)
    cacheKeys.push(key)

    // 최대 50개 초과 시 오래된 것 삭제
    while (cacheKeys.length > MAX_CACHED_NOTES) {
      const oldest = cacheKeys.shift()
      if (oldest) localStorage.removeItem(oldest)
    }
    localStorage.setItem('cache-note-keys', JSON.stringify(cacheKeys))
  } catch { /* 무시 */ }
}

function getCachedNote(filename: string): Note | null {
  try {
    const data = localStorage.getItem(`${NOTE_CACHE_PREFIX}${filename}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export default function NoteViewPage() {
  const { filename } = useParams<{ filename: string }>()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    if (!filename) return
    getNote(filename)
      .then((res) => {
        setNote(res.data)
        cacheNote(filename, res.data)
      })
      .catch(() => {
        // 오프라인 - 캐시에서 로드
        const cached = getCachedNote(filename)
        if (cached) {
          setNote(cached)
          showToast('오프라인 모드 - 캐시된 내용을 표시합니다', 'info')
        } else {
          navigate('/')
        }
      })
      .finally(() => setLoading(false))
  }, [filename, navigate])

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!filename) return
    setShowDeleteModal(false)
    try {
      await deleteNote(filename)
      showToast('노트가 삭제되었습니다.', 'success')
      navigate('/')
    } catch {
      showToast('삭제에 실패했습니다.', 'error')
    }
  }

  const handlePin = async () => {
    if (!filename) return
    try {
      const res = await pinNote(filename)
      setPinned(res.data.pinned)
      showToast(res.data.pinned ? '노트가 고정되었습니다.' : '고정이 해제되었습니다.', 'success')
    } catch {
      showToast('고정 상태 변경에 실패했습니다.', 'error')
    }
  }

  const handleShare = async () => {
    if (!filename) return
    try {
      const res = await shareNote(filename)
      const token = res.data.token
      setShareToken(token)
      const url = `${window.location.origin}/shared/${token}`
      await navigator.clipboard.writeText(url)
      showToast('공유 링크가 복사되었습니다.', 'success')
    } catch {
      showToast('공유 링크 생성에 실패했습니다.', 'error')
    }
  }

  const handleUnshare = async () => {
    if (!filename) return
    try {
      await unshareNote(filename)
      setShareToken(null)
      showToast('공유가 해제되었습니다.', 'success')
    } catch {
      showToast('공유 해제에 실패했습니다.', 'error')
    }
  }

  if (loading) return <div className="loading">로딩 중...</div>
  if (!note) return null

  return (
    <div className="note-view-page">
      <div className="note-actions">
        <Link to="/" className="btn-back">목록</Link>
        <div>
          <button onClick={handlePin} className="btn-edit" title={pinned ? '고정 해제' : '고정'}>
            {pinned ? '\u2605' : '\u2606'}
          </button>
          <button onClick={handleShare} className="btn-edit">공유</button>
          {shareToken && (
            <button onClick={handleUnshare} className="btn-delete">공유 해제</button>
          )}
          <Link to={`/notes/${encodeURIComponent(note.filename)}/edit`} className="btn-edit">편집</Link>
          <button onClick={handleDelete} className="btn-delete">삭제</button>
        </div>
      </div>

      {note.tags && note.tags.length > 0 && (
        <div className="tag-list view-tags">
          {note.tags.map((tag) => (
            <span key={tag} className="tag-badge">{tag}</span>
          ))}
        </div>
      )}

      <article className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {note.content}
        </ReactMarkdown>
      </article>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="노트 삭제"
        message="정말 이 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
