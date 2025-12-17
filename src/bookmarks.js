// 书签功能 - 标记重要位置
const STORAGE_KEY = 'markflow_bookmarks'

let bookmarks = [] // { id, line, label, filePath }
let currentFilePath = null

// 加载书签
export function loadBookmarks(filePath) {
  currentFilePath = filePath
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    bookmarks = all[filePath] || []
  } catch {
    bookmarks = []
  }
  return bookmarks
}

// 保存书签
function saveBookmarks() {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (currentFilePath) {
      all[currentFilePath] = bookmarks
    } else {
      all['__untitled__'] = bookmarks
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch (e) {
    console.warn('Save bookmarks failed:', e)
  }
}

// 添加书签
export function addBookmark(editor, label = '') {
  if (!editor) return
  
  const pos = editor.state.selection.main.head
  const line = editor.state.doc.lineAt(pos).number
  
  // 检查是否已存在
  const existing = bookmarks.find(b => b.line === line)
  if (existing) {
    removeBookmark(existing.id)
    return
  }
  
  const bookmark = {
    id: Date.now().toString(),
    line,
    label: label || `行 ${line}`,
    created: Date.now()
  }
  
  bookmarks.push(bookmark)
  bookmarks.sort((a, b) => a.line - b.line)
  saveBookmarks()
  
  if (window.showToast) window.showToast(`已添加书签: 行 ${line}`)
  
  return bookmark
}

// 移除书签
export function removeBookmark(id) {
  const index = bookmarks.findIndex(b => b.id === id)
  if (index !== -1) {
    bookmarks.splice(index, 1)
    saveBookmarks()
  }
}

// 跳转到书签
export function goToBookmark(editor, bookmark) {
  if (!editor || !bookmark) return
  
  try {
    const line = editor.state.doc.line(bookmark.line)
    editor.dispatch({
      selection: { anchor: line.from },
      scrollIntoView: true
    })
    editor.focus()
  } catch (e) {
    // 行号可能已经不存在
    if (window.showToast) window.showToast('书签位置已失效', 'error')
  }
}

// 显示书签面板
export function showBookmarksPanel(editor) {
  const existing = document.getElementById('bookmarksPanel')
  if (existing) {
    existing.remove()
    return
  }
  
  const panel = document.createElement('div')
  panel.id = 'bookmarksPanel'
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 400px;
    max-height: 500px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 9999;
    display: flex;
    flex-direction: column;
  `
  
  // 标题栏
  const header = document.createElement('div')
  header.style.cssText = `
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `
  header.innerHTML = `
    <span style="font-weight: 600; color: var(--text-primary);">🔖 书签</span>
    <div style="display: flex; gap: 8px;">
      <button id="addBookmarkBtn" style="
        padding: 4px 12px;
        background: var(--accent-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">+ 添加当前行</button>
      <button id="closeBookmarksBtn" style="
        background: none;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
        font-size: 18px;
      ">&times;</button>
    </div>
  `
  
  // 书签列表
  const list = document.createElement('div')
  list.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  `
  
  function renderList() {
    list.innerHTML = ''
    
    if (bookmarks.length === 0) {
      list.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-tertiary);">
          <div style="font-size: 32px; margin-bottom: 12px;">🔖</div>
          <div>暂无书签</div>
          <div style="font-size: 12px; margin-top: 8px;">按 Ctrl+M 添加当前行为书签</div>
        </div>
      `
      return
    }
    
    bookmarks.forEach(bm => {
      const item = document.createElement('div')
      item.style.cssText = `
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background 0.15s;
        margin-bottom: 4px;
      `
      item.onmouseenter = () => item.style.background = 'var(--bg-tertiary)'
      item.onmouseleave = () => item.style.background = 'transparent'
      
      item.innerHTML = `
        <span style="
          background: var(--accent-light);
          color: var(--accent-color);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        ">L${bm.line}</span>
        <span style="flex: 1; color: var(--text-primary); font-size: 14px;">${bm.label}</span>
        <button class="delete-bookmark" data-id="${bm.id}" style="
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          opacity: 0.5;
          transition: opacity 0.15s;
        ">🗑️</button>
      `
      
      item.onclick = (e) => {
        if (e.target.classList.contains('delete-bookmark')) {
          removeBookmark(e.target.dataset.id)
          renderList()
          return
        }
        goToBookmark(editor, bm)
        panel.remove()
      }
      
      list.appendChild(item)
    })
  }
  
  panel.appendChild(header)
  panel.appendChild(list)
  document.body.appendChild(panel)
  
  renderList()
  
  // 事件
  document.getElementById('addBookmarkBtn').onclick = () => {
    addBookmark(editor)
    renderList()
  }
  
  document.getElementById('closeBookmarksBtn').onclick = () => panel.remove()
  
  // ESC 关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      panel.remove()
      document.removeEventListener('keydown', escHandler)
    }
  }
  document.addEventListener('keydown', escHandler)
}

// 切换当前行书签
export function toggleBookmark(editor) {
  if (!editor) return
  
  const pos = editor.state.selection.main.head
  const line = editor.state.doc.lineAt(pos).number
  
  const existing = bookmarks.find(b => b.line === line)
  if (existing) {
    removeBookmark(existing.id)
    if (window.showToast) window.showToast(`已移除书签: 行 ${line}`)
  } else {
    addBookmark(editor)
  }
}

// 跳转到下一个书签
export function nextBookmark(editor) {
  if (!editor || bookmarks.length === 0) return
  
  const pos = editor.state.selection.main.head
  const currentLine = editor.state.doc.lineAt(pos).number
  
  const next = bookmarks.find(b => b.line > currentLine) || bookmarks[0]
  goToBookmark(editor, next)
}

// 跳转到上一个书签
export function prevBookmark(editor) {
  if (!editor || bookmarks.length === 0) return
  
  const pos = editor.state.selection.main.head
  const currentLine = editor.state.doc.lineAt(pos).number
  
  const prev = [...bookmarks].reverse().find(b => b.line < currentLine) || bookmarks[bookmarks.length - 1]
  goToBookmark(editor, prev)
}
