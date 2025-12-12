// 显示提示信息
export function showToast(message, typeOrDuration = 'info', duration = 3000) {
  let type = 'info'
  let time = duration

  if (typeof typeOrDuration === 'number') {
    time = typeOrDuration
  } else if (typeof typeOrDuration === 'string') {
    type = typeOrDuration
    // If 3rd arg wasn't passed but 2nd was string, use default duration (3000)
  }

  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`

  // Icon based on type
  let icon = ''
  if (type === 'error') {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#ff6b6b"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
  } else if (type === 'success') {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#51cf66"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
  } else {
    // Info
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#339af0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  }

  toast.innerHTML = `${icon}<span>${message}</span>`
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards'
    setTimeout(() => toast.remove(), 300)
  }, time)
}

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
export function formatDate(date) {
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      if (minutes === 0) {
        return '刚刚'
      }
      return `${minutes} 分钟前`
    }
    return `${hours} 小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days} 天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 防抖函数
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export function throttle(func, limit) {
  let inThrottle
  return function () {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 深拷贝
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const cloned = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
}

// 获取文件扩展名
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}

// 检查是否为Markdown文件
export function isMarkdownFile(filename) {
  const ext = getFileExtension(filename)
  return ['md', 'markdown', 'mdown', 'mkd', 'mkdn'].includes(ext)
}

// 生成唯一ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 本地存储操作
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('读取本地存储失败:', error)
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('写入本地存储失败:', error)
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('删除本地存储失败:', error)
    }
  }
}

// 添加CSS动画
const style = document.createElement('style')
style.textContent = `
  @keyframes slideOut {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(20px);
      opacity: 0;
    }
  }
`
document.head.appendChild(style)