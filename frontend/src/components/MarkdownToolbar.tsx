import { useRef } from 'react'
import type { EditorView } from '@codemirror/view'
import { uploadImage } from '../api/notes'
import { useToast } from '../contexts/ToastContext'

interface MarkdownToolbarProps {
  editorView: EditorView | null
}

export default function MarkdownToolbar({ editorView }: MarkdownToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    if (!editorView) return
    const { from, to } = editorView.state.selection.main
    const selected = editorView.state.sliceDoc(from, to)
    const text = selected || placeholder
    const insert = `${before}${text}${after}`
    editorView.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + before.length, head: from + before.length + text.length }
    })
    editorView.focus()
  }

  const insertLinePrefix = (prefix: string) => {
    if (!editorView) return
    const { from } = editorView.state.selection.main
    const line = editorView.state.doc.lineAt(from)
    const insert = `${prefix}${line.text}`
    editorView.dispatch({
      changes: { from: line.from, to: line.to, insert }
    })
    editorView.focus()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editorView) return

    try {
      showToast('이미지 업로드 중...', 'info')
      const res = await uploadImage(file)
      const { from, to } = editorView.state.selection.main
      const insert = `![이미지](${res.data.url})`
      editorView.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + insert.length }
      })
      editorView.focus()
      showToast('이미지가 업로드되었습니다.', 'success')
    } catch {
      showToast('이미지 업로드에 실패했습니다.', 'error')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const buttons = [
    { label: 'B', title: '굵게', action: () => insertText('**', '**', '텍스트') },
    { label: 'I', title: '기울임', action: () => insertText('*', '*', '텍스트') },
    { label: 'H', title: '제목', action: () => insertLinePrefix('## ') },
    { label: '-', title: '목록', action: () => insertLinePrefix('- ') },
    { label: '1.', title: '번호목록', action: () => insertLinePrefix('1. ') },
    { label: '[]', title: '링크', action: () => insertText('[', '](url)', '텍스트') },
    { label: '`', title: '코드', action: () => insertText('`', '`', 'code') },
    { label: '```', title: '코드블록', action: () => insertText('```\n', '\n```', 'code') },
    { label: '>', title: '인용', action: () => insertLinePrefix('> ') },
    { label: 'img', title: '이미지 업로드', action: () => fileInputRef.current?.click() },
  ]

  return (
    <div className="markdown-toolbar" role="toolbar" aria-label="마크다운 서식 도구">
      {buttons.map((btn) => (
        <button
          key={btn.title}
          type="button"
          className="toolbar-btn"
          title={btn.title}
          aria-label={btn.title}
          onClick={btn.action}
        >
          {btn.label}
        </button>
      ))}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
        aria-label="이미지 파일 선택"
      />
    </div>
  )
}
