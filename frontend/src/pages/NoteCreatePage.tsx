import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import type { EditorView } from '@codemirror/view'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { createNote, uploadImage } from '../api/notes'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from '../components/ConfirmModal'
import MarkdownToolbar from '../components/MarkdownToolbar'
import MarkdownHelp from '../components/MarkdownHelp'
import SaveStatus, { type SaveState } from '../components/SaveStatus'
import { useTheme } from '../contexts/ThemeContext'

const DRAFT_KEY = 'draft-new'

export default function NoteCreatePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftData, setDraftData] = useState<{ title: string; content: string } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('unsaved')
  const editorViewRef = useRef<EditorView | null>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { theme } = useTheme()

  // 드래프트 확인
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        if (parsed.title || parsed.content) {
          setDraftData(parsed)
          setShowDraftModal(true)
        }
      } catch { /* 무시 */ }
    }
  }, [])

  // 자동저장
  const titleRef = useRef(title)
  const contentRef = useRef(content)
  titleRef.current = title
  contentRef.current = content

  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title: titleRef.current, content: contentRef.current }))
      if (saveState === 'unsaved') {
        setSaveState('draft')
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [saveState])

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

    container.addEventListener('paste', handlePaste)
    return () => container.removeEventListener('paste', handlePaste)
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
    if (draftData) {
      setTitle(draftData.title)
      setContent(draftData.content)
    }
    setShowDraftModal(false)
    setDraftData(null)
  }

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setShowDraftModal(false)
    setDraftData(null)
  }

  const generateFilename = (title: string): string => {
    const date = new Date().toISOString().slice(0, 10)
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    return `${date}-${slug}.md`
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    try {
      const filename = generateFilename(title)
      await createNote({ filename, content })
      localStorage.removeItem(DRAFT_KEY)
      setSaveState('saved')
      showToast('노트가 생성되었습니다.', 'success')
      navigate(`/notes/${encodeURIComponent(filename)}`)
    } catch {
      showToast('노트 생성에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

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

  return (
    <div className={`note-create-page ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {isFullscreen && (
        <div className="fullscreen-bar">
          <span className="fullscreen-filename">{title ? generateFilename(title) : '새 노트'}</span>
          <button
            onClick={() => setIsFullscreen(false)}
            className="btn-edit"
            type="button"
            aria-label="전체화면 해제"
          >
            전체화면 해제
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isFullscreen && (
          <div className="edit-header">
            <input
              type="text"
              placeholder="제목 (영어 소문자, 띄어쓰기 가능)"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setSaveState('unsaved') }}
              className="title-input"
              required
              aria-label="노트 제목"
            />
            <button
              onClick={() => setIsFullscreen(true)}
              className="btn-edit"
              type="button"
              aria-label="전체화면 편집"
            >
              전체화면
            </button>
          </div>
        )}
        {title && !isFullscreen && (
          <p className="filename-preview">
            파일명: {generateFilename(title)}
          </p>
        )}

        <div className="toggle-switch-wrapper">
          <span className={`toggle-label ${activeTab === 'edit' ? 'toggle-label-active' : ''}`}>{'\u270F\uFE0F'} 편집</span>
          <button
            type="button"
            className={`toggle-switch ${activeTab === 'preview' ? 'toggle-on' : ''}`}
            onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
            aria-label={activeTab === 'edit' ? '미리보기로 전환' : '편집으로 전환'}
          >
            <span className="toggle-knob" />
          </button>
          <span className={`toggle-label ${activeTab === 'preview' ? 'toggle-label-active' : ''}`}>{'\uD83D\uDC41'} 미리보기</span>
        </div>

        {activeTab === 'edit' ? (
          <div ref={editorContainerRef}>
            <MarkdownToolbar editorView={editorViewRef.current} />
            <CodeMirror
              value={content}
              extensions={[markdown()]}
              onChange={handleContentChange}
              height={isFullscreen ? 'calc(100vh - 180px)' : 'calc(100vh - 320px)'}
              theme={theme === 'dark' ? 'dark' : 'light'}
              onCreateEditor={handleEditorCreate}
            />
            <div className="char-counter" aria-label="글자 수 카운터">
              <SaveStatus state={saveState} />
              <span>{charCount}자 · {wordCount}단어</span>
            </div>
          </div>
        ) : (
          <article className="markdown-body preview-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {content}
            </ReactMarkdown>
          </article>
        )}

        <MarkdownHelp />

        <div className="editor-bottom-actions">
          <button type="submit" disabled={saving} className="btn-primary" aria-label="노트 생성">
            {saving ? '생성 중...' : '생성'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-cancel" aria-label="생성 취소">취소</button>
        </div>
      </form>

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
