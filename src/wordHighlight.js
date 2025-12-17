// 相同单词高亮 - 选中单词后高亮所有相同单词
let highlightStyle = null

export function setupWordHighlight(editor) {
  if (!editor) return
  
  // 添加高亮样式
  if (!highlightStyle) {
    highlightStyle = document.createElement('style')
    highlightStyle.textContent = `
      .cm-same-word-highlight {
        background: rgba(255, 215, 0, 0.3) !important;
        border-radius: 2px;
      }
    `
    document.head.appendChild(highlightStyle)
  }
  
  // 监听选择变化
  // 注意：这个功能需要通过 CodeMirror 扩展实现更好
  // 这里提供一个简化版本
}

// 高亮所有匹配的单词
export function highlightWord(editor, word) {
  if (!editor || !word || word.length < 2) {
    clearHighlights()
    return
  }
  
  clearHighlights()
  
  const content = editor.state.doc.toString()
  const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi')
  let match
  const positions = []
  
  while ((match = regex.exec(content)) !== null) {
    positions.push({ from: match.index, to: match.index + match[0].length })
  }
  
  if (positions.length > 1) {
    // 创建高亮标记
    positions.forEach(pos => {
      const marker = document.createElement('div')
      marker.className = 'word-highlight-marker'
      // 这里需要更复杂的实现来在 CodeMirror 中添加装饰
    })
  }
}

function clearHighlights() {
  document.querySelectorAll('.word-highlight-marker').forEach(el => el.remove())
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
