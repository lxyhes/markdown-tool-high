// 最近文件管理器
const STORAGE_KEY = 'markflow_recent_files'
const MAX_RECENT = 10

// 获取最近文件列表
export function getRecentFiles() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// 添加到最近文件
export function addRecentFile(filePath, fileName) {
  if (!filePath) return
  
  const recent = getRecentFiles()
  
  // 移除已存在的相同文件
  const filtered = recent.filter(f => f.path !== filePath)
  
  // 添加到开头
  filtered.unshift({
    path: filePath,
    name: fileName || filePath.split(/[/\\]/).pop(),
    time: Date.now()
  })
  
  // 限制数量
  const trimmed = filtered.slice(0, MAX_RECENT)
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

// 清空最近文件
export function clearRecentFiles() {
  localStorage.removeItem(STORAGE_KEY)
}

// 创建最近文件面板
export function showRecentFilesPanel() {
  // 移除已存在的面板
  const existing = document.getElementById('recentFilesPanel')
  if (existing) existing.remove()
  
  const recent = getRecentFiles()
  
  const overlay = document.createElement('div')
  overlay.id = 'recentFilesPanel'
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
  `
  
  const panel = document.createElement('div')
  panel.style.cssText = `
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    width: 450px;
    max-height: 500px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
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
    <span style="font-weight: 600; color: var(--text-primary);">📂 最近文件</span>
    <button id="closeRecentPanel" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:18px;">&times;</button>
  `
  
  // 文件列表
  const list = document.createElement('div')
  list.style.cssText = `
    max-height: 400px;
    overflow-y: auto;
    padding: 8px;
  `
  
  if (recent.length === 0) {
    list.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-tertiary);">暂无最近文件</div>`
  } else {
    recent.forEach(file => {
      const item = document.createElement('div')
      item.style.cssText = `
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background 0.15s;
      `
      item.onmouseenter = () => item.style.background = 'var(--bg-tertiary)'
      item.onmouseleave = () => item.style.background = 'transparent'
      
      const timeAgo = getTimeAgo(file.time)
      
      item.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <div style="flex:1; min-width:0;">
          <div style="color: var(--text-primary); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.name}</div>
          <div style="color: var(--text-tertiary); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.path}</div>
        </div>
        <span style="color: var(--text-tertiary); font-size: 11px; white-space: nowrap;">${timeAgo}</span>
      `
      
      item.onclick = () => {
        overlay.remove()
        if (window.openFileByPath) {
          window.openFileByPath(file.path)
        }
      }
      
      list.appendChild(item)
    })
  }
  
  panel.appendChild(header)
  panel.appendChild(list)
  overlay.appendChild(panel)
  document.body.appendChild(overlay)
  
  // 关闭事件
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove()
  }
  document.getElementById('closeRecentPanel').onclick = () => overlay.remove()
  
  // ESC 关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove()
      document.removeEventListener('keydown', escHandler)
    }
  }
  document.addEventListener('keydown', escHandler)
}

// 时间格式化
function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return new Date(timestamp).toLocaleDateString()
}
