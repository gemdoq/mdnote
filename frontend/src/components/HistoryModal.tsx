import { useState, useEffect, useRef, useCallback } from 'react'
import { getNoteHistory, type HistoryEntry } from '../api/notes'

interface HistoryModalProps {
  isOpen: boolean
  filename: string
  onClose: () => void
}

export default function HistoryModal({ isOpen, filename, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !filename) return
    setLoading(true)
    setError('')
    getNoteHistory(filename)
      .then((res) => setHistory(res.data))
      .catch(() => setError('히스토리를 불러올 수 없습니다.'))
      .finally(() => setLoading(false))
  }, [isOpen, filename])

  // Tab 트랩 + Escape 닫기
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="버전 히스토리">
      <div className="modal-card history-modal" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        <h3 className="modal-title">버전 히스토리</h3>
        {loading && <p className="history-loading">로딩 중...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && history.length === 0 && (
          <p className="history-empty">히스토리가 없습니다.</p>
        )}
        {!loading && !error && history.length > 0 && (
          <ul className="history-list">
            {history.map((entry) => (
              <li key={entry.sha} className="history-item">
                <div className="history-item-header">
                  <span className="history-date">{formatDate(entry.date)}</span>
                  <span className="history-author">{entry.author}</span>
                </div>
                <p className="history-message">{entry.message}</p>
                <span className="history-sha">{entry.sha.substring(0, 7)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="modal-actions">
          <button onClick={onClose} className="btn-primary" aria-label="히스토리 닫기">닫기</button>
        </div>
      </div>
    </div>
  )
}
