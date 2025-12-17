// 自动恢复功能 - 防止意外丢失
const STORAGE_KEY = 'markflow_auto_recover'
const SAVE_INTERVAL = 10000 // 10秒保存一次

let saveTimer = null

// 保存当前内容到 localStorage
export function saveRecoveryData(content, path) {
  if (!content) return
  
  try {
    const data = {
      content,
      path: path || null,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Auto-recover save failed:', e)
  }
}

// 获取恢复数据
export function getRecoveryData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    
    const parsed = JSON.parse(data)
    // 只保留24小时内的数据
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      clearRecoveryData()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

// 清除恢复数据
export function clearRecoveryData() {
  localStorage.removeItem(STORAGE_KEY)
}

// 检查是否有可恢复的内容
export function checkRecovery(callback) {
  const data = getRecoveryData()
  if (!data || !data.content) return
  
  // 显示恢复提示
  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed;
    bottom: 60px;
    right: 20px;
    background: var(--bg-secondary);
    border: 1px solid var(--accent-color);
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999;
    max-width: 350px;
    animation: slideUpFade 0.3s ease;
  `
  
  const timeAgo = getTimeAgo(data.timestamp)
  
  toast.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="font-size: 24px;">💾</span>
      <div style="flex: 1;">
        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">发现未保存的内容</div>
        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
          ${timeAgo}的编辑内容可以恢复
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="recoverBtn" style="
            padding: 6px 14px;
            background: var(--accent-color);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
          ">恢复</button>
          <button id="discardBtn" style="
            padding: 6px 14px;
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
          ">忽略</button>
        </div>
      </div>
      <button id="closeRecoverToast" style="
        background: none;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        line-height: 1;
      ">&times;</button>
    </div>
  `
  
  document.body.appendChild(toast)
  
  document.getElementById('recoverBtn').onclick = () => {
    if (callback) callback(data.content)
    clearRecoveryData()
    toast.remove()
  }
  
  document.getElementById('discardBtn').onclick = () => {
    clearRecoveryData()
    toast.remove()
  }
  
  document.getElementById('closeRecoverToast').onclick = () => {
    toast.remove()
  }
  
  // 30秒后自动关闭
  setTimeout(() => {
    if (toast.parentNode) toast.remove()
  }, 30000)
}

// 启动自动保存
export function startAutoRecover(getContent) {
  if (saveTimer) clearInterval(saveTimer)
  
  saveTimer = setInterval(() => {
    const content = getContent()
    if (content) {
      saveRecoveryData(content)
    }
  }, SAVE_INTERVAL)
}

// 停止自动保存
export function stopAutoRecover() {
  if (saveTimer) {
    clearInterval(saveTimer)
    saveTimer = null
  }
}

function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  return new Date(timestamp).toLocaleString()
}
