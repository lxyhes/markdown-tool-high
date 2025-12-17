// 全局搜索 - 在当前文档中搜索
import { showToast } from './utils.js'

let searchPanel = null
let currentMatches = []
let currentIndex = -1

export function showGlobalSearch(editor) {
  if (searchPanel) {
    searchPanel.remove()
    searchPanel = null
    return
  }
  
  searchPanel = document.createElement('div')
  searchPanel.id = 'globalSearchPanel'
  searchPanel.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 1000;
    width: 320px;
  `
  
  searchPanel.innerHTML = `
    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
      <input type="text" id="searchInput" placeholder="搜索..." style="
        flex: 1;
        padding: 8px 12px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 14px;
        outline: none;
      ">
      <button id="searchCloseBtn" style="
        background: none;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
        font-size: 18px;
        padding: 0 4px;
      ">&times;</button>
    </div>
    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
      <input type="text" id="replaceInput" placeholder="替换为..." style="
        flex: 1;
        padding: 8px 12px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 14px;
        outline: none;
      ">
    </div>
    <div style="display: flex; gap: 6px; align-items: center;">
      <button id="prevMatch" class="search-btn" title="上一个 (Shift+Enter)">◀</button>
      <button id="nextMatch" class="search-btn" title="下一个 (Enter)">▶</button>
      <span id="matchCount" style="font-size: 12px; color: var(--text-tertiary); margin: 0 8px;">0 个结果</span>
      <div style="flex:1;"></div>
      <button id="replaceOne" class="search-btn" title="替换">替换</button>
      <button id="replaceAll" class="search-btn" title="全部替换">全部</button>
    </div>
    <div style="margin-top: 8px; display: flex; gap: 12px;">
      <label style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; cursor: pointer;">
        <input type="checkbox" id="caseSensitive"> 区分大小写
      </label>
      <label style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; cursor: pointer;">
        <input type="checkbox" id="useRegex"> 正则表达式
      </label>
    </div>
  `
  
  // 添加按钮样式
  const style = document.createElement('style')
  style.textContent = `
    .search-btn {
      padding: 4px 10px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-primary);
      cursor: pointer;
      font-size: 12px;
      transition: background 0.15s;
    }
    .search-btn:hover { background: var(--bg-hover); }
  `
  searchPanel.appendChild(style)
  document.body.appendChild(searchPanel)
  
  const searchInput = document.getElementById('searchInput')
  const replaceInput = document.getElementById('replaceInput')
  const matchCount = document.getElementById('matchCount')
  const caseSensitive = document.getElementById('caseSensitive')
  const useRegex = document.getElementById('useRegex')
  
  searchInput.focus()
  
  // 搜索逻辑
  function doSearch() {
    const query = searchInput.value
    if (!query || !editor) {
      currentMatches = []
      currentIndex = -1
      matchCount.textContent = '0 个结果'
      clearHighlights(editor)
      return
    }
    
    const doc = editor.state.doc.toString()
    const isCaseSensitive = caseSensitive.checked
    const isRegex = useRegex.checked
    
    currentMatches = []
    
    try {
      if (isRegex) {
        const flags = isCaseSensitive ? 'g' : 'gi'
        const regex = new RegExp(query, flags)
        let match
        while ((match = regex.exec(doc)) !== null) {
          currentMatches.push({ from: match.index, to: match.index + match[0].length })
        }
      } else {
        const searchStr = isCaseSensitive ? query : query.toLowerCase()
        const searchDoc = isCaseSensitive ? doc : doc.toLowerCase()
        let pos = 0
        while ((pos = searchDoc.indexOf(searchStr, pos)) !== -1) {
          currentMatches.push({ from: pos, to: pos + query.length })
          pos += 1
        }
      }
    } catch (e) {
      matchCount.textContent = '无效表达式'
      return
    }
    
    matchCount.textContent = `${currentMatches.length} 个结果`
    
    if (currentMatches.length > 0) {
      currentIndex = 0
      goToMatch(editor, currentMatches[0])
    } else {
      currentIndex = -1
      clearHighlights(editor)
    }
  }
  
  function goToMatch(editor, match) {
    if (!match) return
    editor.dispatch({
      selection: { anchor: match.from, head: match.to },
      scrollIntoView: true
    })
    editor.focus()
  }
  
  function nextMatch() {
    if (currentMatches.length === 0) return
    currentIndex = (currentIndex + 1) % currentMatches.length
    goToMatch(editor, currentMatches[currentIndex])
    matchCount.textContent = `${currentIndex + 1}/${currentMatches.length}`
  }
  
  function prevMatch() {
    if (currentMatches.length === 0) return
    currentIndex = (currentIndex - 1 + currentMatches.length) % currentMatches.length
    goToMatch(editor, currentMatches[currentIndex])
    matchCount.textContent = `${currentIndex + 1}/${currentMatches.length}`
  }
  
  function replaceOne() {
    if (currentIndex < 0 || !currentMatches[currentIndex]) return
    const match = currentMatches[currentIndex]
    const replacement = replaceInput.value
    
    editor.dispatch({
      changes: { from: match.from, to: match.to, insert: replacement }
    })
    
    doSearch() // 重新搜索
    showToast('已替换')
  }
  
  function replaceAll() {
    if (currentMatches.length === 0) return
    const replacement = replaceInput.value
    
    // 从后往前替换，避免位置偏移
    const changes = [...currentMatches].reverse().map(m => ({
      from: m.from, to: m.to, insert: replacement
    }))
    
    editor.dispatch({ changes })
    showToast(`已替换 ${currentMatches.length} 处`)
    doSearch()
  }
  
  function clearHighlights(editor) {
    // CodeMirror 6 的选择会自动高亮，这里不需要额外处理
  }
  
  // 事件绑定
  searchInput.addEventListener('input', doSearch)
  caseSensitive.addEventListener('change', doSearch)
  useRegex.addEventListener('change', doSearch)
  
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) prevMatch()
      else nextMatch()
    }
    if (e.key === 'Escape') closeSearch()
  })
  
  replaceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch()
  })
  
  document.getElementById('nextMatch').onclick = nextMatch
  document.getElementById('prevMatch').onclick = prevMatch
  document.getElementById('replaceOne').onclick = replaceOne
  document.getElementById('replaceAll').onclick = replaceAll
  document.getElementById('searchCloseBtn').onclick = closeSearch
  
  function closeSearch() {
    if (searchPanel) {
      searchPanel.remove()
      searchPanel = null
    }
    currentMatches = []
    currentIndex = -1
    if (editor) editor.focus()
  }
}

// 跳转到指定行
export function showGoToLine(editor) {
  if (!editor) return
  
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.3);
    z-index: 9999;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 20%;
  `
  
  const panel = document.createElement('div')
  panel.style.cssText = `
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    width: 300px;
  `
  
  const totalLines = editor.state.doc.lines
  
  panel.innerHTML = `
    <div style="margin-bottom: 12px; color: var(--text-primary); font-weight: 500;">跳转到行</div>
    <input type="number" id="lineInput" placeholder="输入行号 (1-${totalLines})" min="1" max="${totalLines}" style="
      width: 100%;
      padding: 10px 12px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
    ">
    <div style="margin-top: 8px; font-size: 12px; color: var(--text-tertiary);">
      当前共 ${totalLines} 行
    </div>
  `
  
  overlay.appendChild(panel)
  document.body.appendChild(overlay)
  
  const input = document.getElementById('lineInput')
  input.focus()
  
  function goToLine() {
    const line = parseInt(input.value)
    if (line >= 1 && line <= totalLines) {
      const pos = editor.state.doc.line(line).from
      editor.dispatch({
        selection: { anchor: pos },
        scrollIntoView: true
      })
      editor.focus()
    }
    overlay.remove()
  }
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') goToLine()
    if (e.key === 'Escape') overlay.remove()
  })
  
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove()
  }
}
