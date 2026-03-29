import { useState } from 'react'

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const modKey = isMac ? 'Cmd' : 'Ctrl'

const HELP_ITEMS = [
  { syntax: '# 제목', desc: '제목 (H1~H6, #의 개수로 조절)' },
  { syntax: '**굵게**', desc: '굵은 글씨' },
  { syntax: '*기울임*', desc: '기울임 글씨' },
  { syntax: '~~취소선~~', desc: '취소선' },
  { syntax: '[텍스트](URL)', desc: '링크' },
  { syntax: '![대체텍스트](이미지URL)', desc: '이미지' },
  { syntax: '`인라인 코드`', desc: '인라인 코드' },
  { syntax: '```언어\n코드\n```', desc: '코드 블록' },
  { syntax: '- 항목', desc: '순서 없는 리스트' },
  { syntax: '1. 항목', desc: '순서 있는 리스트' },
  { syntax: '> 인용문', desc: '인용' },
  { syntax: '---', desc: '구분선' },
  { syntax: '| 헤더 | 헤더 |\n|------|------|\n| 셀 | 셀 |', desc: '표' },
  { syntax: '- [ ] 할 일', desc: '체크리스트' },
]

const SHORTCUT_ITEMS = [
  { shortcut: `${modKey}+S`, desc: '저장' },
  { shortcut: `${modKey}+B`, desc: '굵게' },
  { shortcut: `${modKey}+I`, desc: '기울임' },
  { shortcut: `${modKey}+Enter`, desc: '편집/미리보기 전환' },
]

export default function MarkdownHelp() {
  const [open, setOpen] = useState(false)

  return (
    <div className="markdown-help">
      <button
        type="button"
        className="markdown-help-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="마크다운 도움말 토글"
      >
        {open ? 'v' : '>'} 마크다운 도움말
      </button>
      {open && (
        <div className="markdown-help-content">
          <h4 className="markdown-help-section-title">키보드 단축키</h4>
          <table className="markdown-help-table">
            <thead>
              <tr>
                <th>단축키</th>
                <th>동작</th>
              </tr>
            </thead>
            <tbody>
              {SHORTCUT_ITEMS.map((item, i) => (
                <tr key={i}>
                  <td><kbd>{item.shortcut}</kbd></td>
                  <td>{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4 className="markdown-help-section-title">마크다운 문법</h4>
          <table className="markdown-help-table">
            <thead>
              <tr>
                <th>문법</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              {HELP_ITEMS.map((item, i) => (
                <tr key={i}>
                  <td><code>{item.syntax}</code></td>
                  <td>{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
