import { useEffect } from 'react'
import type { EditorView } from '@codemirror/view'

interface ShortcutHandlers {
  onSave: () => void
  onBold?: () => void
  onItalic?: () => void
  onTogglePreview?: () => void
}

export function useEditorShortcuts(
  editorViewRef: React.RefObject<EditorView | null>,
  handlers: ShortcutHandlers
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      switch (e.key.toLowerCase()) {
        case 's': {
          e.preventDefault()
          handlers.onSave()
          break
        }
        case 'b': {
          e.preventDefault()
          const view = editorViewRef.current
          if (!view) return
          const { from, to } = view.state.selection.main
          const selected = view.state.sliceDoc(from, to)
          const text = selected || '텍스트'
          const insert = `**${text}**`
          view.dispatch({
            changes: { from, to, insert },
            selection: { anchor: from + 2, head: from + 2 + text.length }
          })
          view.focus()
          break
        }
        case 'i': {
          e.preventDefault()
          const view = editorViewRef.current
          if (!view) return
          const { from, to } = view.state.selection.main
          const selected = view.state.sliceDoc(from, to)
          const text = selected || '텍스트'
          const insert = `*${text}*`
          view.dispatch({
            changes: { from, to, insert },
            selection: { anchor: from + 1, head: from + 1 + text.length }
          })
          view.focus()
          break
        }
        case 'enter': {
          if (handlers.onTogglePreview) {
            e.preventDefault()
            handlers.onTogglePreview()
          }
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editorViewRef, handlers])
}
