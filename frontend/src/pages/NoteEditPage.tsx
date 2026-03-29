import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import type { EditorView } from '@codemirror/view'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { getNote, updateNote, uploadImage } from '../api/notes'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from '../components/ConfirmModal'
import MarkdownToolbar from '../components/MarkdownToolbar'
import MarkdownHelp from '../components/MarkdownHelp'
import SaveStatus, { type SaveState } from '../components/SaveStatus'
import { NoteViewSkeleton } from '../components/Skeleton'
import { useTheme } from '../contexts/ThemeContext'
import { useEditorShortcuts } from '../hooks/useEditorShortcuts'

export default function NoteEditPage() {
  const { filename } = useParams<{ filename: string }>()
  const [content, setContent] = useState('')
  const [sha, setSha] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftContent, setDraftContent] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const editorViewRef = useRef<EditorView | null>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const initialContentRef = useRef('')
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { theme } = useTheme()

  const draftKey = filename ? `draft-edit-${filename}` : ''

  useEffect(() => {
    if (!filename) return
    getNote(filename)
      .then((res) => {
        setContent(res.data.content)
        setSha(res.data.sha)
        initialContentRef.current = res.data.content

        const draft = localStorage.getItem(draftKey)
        if (draft && draft !== res.data.content) {
          setDraftContent(draft)
          setShowDraftModal(true)
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [filename, navigate])

  // 자동저장
  const contentRef = useRef(content)
  contentRef.current = content

  useEffect(() => {
    if (!draftKey) return
    const timer = setInterval(() => {
      localStorage.setItem(draftKey, contentRef.current)
      if (saveState === 'unsaved') {
        setSaveState('draft')
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [draftKey, saveState])

  // 클립보드 이미지 붙여넣기
  useEffect(() => {
    const container = editorContainerRef.current
    if (!container) return

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (!file || !editorViewRef.current) return

          try {
            showToast('이미지 업로드 중...', 'info')
            const res = await uploadImage(file)
            const view = editorViewRef.current
            const { from, to } = view.state.selection.main
            const insert = `![이미지](${res.data.url})`
            view.dispatch({
              changes: { from, to, insert },
              selection: { anchor: from + insert.length }
            })
            showToast('이미지가 업로드되었습니다.', 'success')
          } catch {
            showToast('이미지 업로드에 실패했습니다.', 'error')
          }
          break
        }
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const files = e.dataTransfer?.files
      if (!files || !editorViewRef.current) return

      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          try {
            showToast('이미지 업로드 중...', 'info')
            const res = await uploadImage(file)
            const view = editorViewRef.current
            const { from, to } = view.state.selection.main
            const insert = `![이미지](${res.data.url})`
            view.dispatch({
              changes: { from, to, insert },
              selection: { anchor: from + insert.length }
            })
            showToast('이미지가 업로드되었습니다.', 'success')
          } catch {
            showToast('이미지 업로드에 실패했습니다.', 'error')
          }
          break
        }
      }
    }

    container.addEventListener('paste', handlePaste)
    container.addEventListener('dragover', handleDragOver)
    container.addEventListener('drop', handleDrop)
    return () => {
      container.removeEventListener('paste', handlePaste)
      container.removeEventListener('dragover', handleDragOver)
      container.removeEventListener('drop', handleDrop)
    }
  }, [showToast])

  // 풀스크린 토글
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('fullscreen-editor')
    } else {
      document.body.classList.remove('fullscreen-editor')
    }
    return () => document.body.classList.remove('fullscreen-editor')
  }, [isFullscreen])

  const handleRestoreDraft = () => {
    if (draftContent) setContent(draftContent)
    setShowDraftModal(false)
    setDraftContent(null)
  }

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey)
    setShowDraftModal(false)
    setDraftContent(null)
  }

  const handleSave = async () => {
    if (!filename) return
    setSaving(true)
    try {
      const res = await updateNote(filename, { content, sha })
      setSha(res.data.sha)
      initialContentRef.current = content
      localStorage.removeItem(draftKey)
      setSaveState('saved')
      showToast('노트가 저장되었습니다.', 'success')
      navigate(`/notes/${encodeURIComponent(filename)}`)
    } catch {
      showToast('저장에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const shortcutHandlers = useMemo(() => ({
    onSave: () => { if (!saving) handleSave() },
    onTogglePreview: () => setActiveTab(prev => prev === 'edit' ? 'preview' : 'edit')
  }), [saving])
  useEditorShortcuts(editorViewRef, shortcutHandlers)

  const handleContentChange = useCallback((value: string) => {
    setContent(value)
    setSaveState('unsaved')
  }, [])

  const handleEditorCreate = useCallback((view: EditorView) => {
    editorViewRef.current = view
  }, [])

  // 글자 수 / 단어 수
  const charCount = content.length
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  if (loading) return <NoteViewSkeleton />

  return (
    <div className={`note-edit-page ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {isFullscreen && (
        <div className="fullscreen-bar">
          <span className="fullscreen-filename">{filename}</span>
          <button
            onClick={() => setIsFullscreen(false)}
            className="btn-edit"
            aria-label="전체화면 해제"
          >
            전체화면 해제
          </button>
        </div>
      )}

      {!isFullscreen && (
        <div className="edit-header">
          <h2>{filename}</h2>
          <button
            onClick={() => setIsFullscreen(true)}
            className="btn-edit"
            aria-label="전체화면 편집"
          >
            전체화면
          </button>
        </div>
      )}

      <div className="toggle-switch-wrapper mobile-only">
        <span className={`toggle-label ${activeTab === 'edit' ? 'toggle-label-active' : ''}`}>{'\u270F\uFE0F'} 편집</span>
        <button
          className={`toggle-switch ${activeTab === 'preview' ? 'toggle-on' : ''}`}
          onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
          aria-label={activeTab === 'edit' ? '미리보기로 전환' : '편집으로 전환'}
        >
          <span className="toggle-knob" />
        </button>
        <span className={`toggle-label ${activeTab === 'preview' ? 'toggle-label-active' : ''}`}>{'\uD83D\uDC41'} 미리보기</span>
      </div>

      <div className="editor-split-view">
        <div className={`editor-pane ${activeTab === 'preview' ? 'mobile-hidden' : ''}`} ref={editorContainerRef}>
          <MarkdownToolbar editorView={editorViewRef.current} />
          <CodeMirror
            value={content}
            extensions={[markdown()]}
            onChange={handleContentChange}
            height={isFullscreen ? 'calc(100vh - 180px)' : 'calc(100vh - 280px)'}
            theme={theme === 'dark' ? 'dark' : 'light'}
            onCreateEditor={handleEditorCreate}
          />
          <div className="char-counter" aria-label="글자 수 카운터">
            <SaveStatus state={saveState} />
            <span>{charCount}자 · {wordCount}단어</span>
          </div>
        </div>
        <article className={`markdown-body preview-body preview-pane ${activeTab === 'edit' ? 'mobile-hidden' : ''}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>

      <MarkdownHelp />

      <div className="editor-bottom-actions">
        <button onClick={handleSave} disabled={saving} className="btn-primary" aria-label="노트 저장">
          {saving ? '저장 중...' : '저장'}
        </button>
        <button onClick={() => navigate(-1)} className="btn-cancel" aria-label="편집 취소">취소</button>
      </div>

      <ConfirmModal
        isOpen={showDraftModal}
        title="임시저장"
        message="임시저장된 내용이 있습니다. 복원하시겠습니까?"
        onConfirm={handleRestoreDraft}
        onCancel={handleDiscardDraft}
      />
    </div>
  )
}
