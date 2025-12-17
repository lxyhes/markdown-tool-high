// 剪贴板历史 - 记录复制的内容
const MAX_HISTORY = 20
let history = []

// 添加到历史
export function addToClipboardHistory(text) {
  if (!text || text.trim().length === 0) return
  
  // 移除重复项
  history = history.filter(item => item.text !== text)
  
  // 添加到开头
  history.unshift({
    text,
    time: Date.now(),
    preview: text.slice(0, 100)
  })
  
  // 限制数量
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY)
  }
}

// 获取历史
export function getClipboardHistory() {
  return history
}

// 清空历史
export function clearClipboardHistory() {
  history = []
}

// 显示剪贴板历史面板
export function showClipboardHistory(editor) {
  const existing = document.getElementById('clipboardHistoryPanel')
  if (existing) {
    existing.remove()
    return
  }
  
  const panel = document.createElement('div')
  panel.id = 'clipboardHistoryPanel'
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 500px;
    max-height: 500px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 9999;
    display: flex;
    flex-direction: column;
  `
  
  // 标题
  const header = document.createElement('div')
  header.style.cssText = `
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `
  header.innerHTML = `
    <span style="font-weight: 600; color: var(--text-primary);">📋 剪贴板历史</span>
    <div style="display: flex; gap: 8px;">
      <button id="clearClipboardBtn" style="
        padding: 4px 10px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 12px;
      ">清空</button>
      <button id="closeClipboardBtn" style="
        background: none;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
        font-size: 18px;
      ">&times;</button>
    </div>
  `
  
  // 列表
  const list = document.createElement('div')
  list.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  `
  
  function renderList() {
    list.innerHTML = ''
    
    if (history.length === 0) {
      list.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-tertiary);">
          <div style="font-size: 32px; margin-bottom: 12px;">📋</div>
          <div>剪贴板历史为空</div>
          <div style="font-size: 12px; margin-top: 8px;">复制的内容会显示在这里</div>
        </div>
      `
      return
    }
    
    history.forEach((item, index) => {
      const el = document.createElement('div')
      el.style.cssText = `
        padding: 12px;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 4px;
        border: 1px solid var(--border-color);
        transition: all 0.15s;
      `
      el.onmouseenter = () => {
        el.style.background = 'var(--bg-tertiary)'
        el.style.borderColor = 'var(--accent-color)'
      }
      el.onmouseleave = () => {
        el.style.background = 'transparent'
        el.style.borderColor = 'var(--border-color)'
      }
      
      const timeAgo = getTimeAgo(item.time)
      const preview = item.preview.replace(/\n/g, ' ').trim()
      
      el.innerHTML = `
        <div style="
          font-size: 13px;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
          font-family: var(--font-mono);
        ">${escapeHtml(preview)}${item.text.length > 100 ? '...' : ''}</div>
        <div style="
          font-size: 11px;
          color: var(--text-tertiary);
          display: flex;
          justify-content: space-between;
        ">
          <span>${item.text.length} 字符</span>
          <span>${timeAgo}</span>
        </div>
      `
      
      el.onclick = () => {
        insertFromHistory(editor, item.text)
        panel.remove()
      }
      
      list.appendChild(el)
    })
  }
  
  panel.appendChild(header)
  panel.appendChild(list)
  document.body.appendChild(panel)
  
  renderList()
  
  // 事件
  document.getElementById('closeClipboardBtn').onclick = () => panel.remove()
  document.getElementById('clearClipboardBtn').onclick = () => {
    clearClipboardHistory()
    renderList()
  }
  
  // ESC 关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      panel.remove()
      document.removeEventListener('keydown', escHandler)
    }
  }
  document.addEventListener('keydown', escHandler)
}

function insertFromHistory(editor, text) {
  if (!editor || !text) return
  
  const pos = editor.state.selection.main
  editor.dispatch({
    changes: { from: pos.from, to: pos.to, insert: text },
    selection: { anchor: pos.from + text.length }
  })
  editor.focus()
}

function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  
  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return new Date(timestamp).toLocaleDateString()
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 监听复制事件
export function setupClipboardListener() {
  document.addEventListener('copy', (e) => {
    setTimeout(() => {
      navigator.clipboard.readText().then(text => {
        if (text) addToClipboardHistory(text)
      }).catch(() => {})
    }, 100)
  })
}
