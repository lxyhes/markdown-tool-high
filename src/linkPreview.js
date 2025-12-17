// 链接预览 - 悬停显示链接信息
let previewEl = null
let hideTimeout = null

export function setupLinkPreview(editor) {
  if (!editor) return
  
  editor.dom.addEventListener('mouseover', (e) => {
    const target = e.target
    
    // 检查是否是链接
    if (target.classList.contains('cm-url') || target.classList.contains('cm-link')) {
      const url = extractURL(target)
      if (url) {
        showPreview(url, e.clientX, e.clientY)
      }
    }
  })
  
  editor.dom.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('cm-url') || e.target.classList.contains('cm-link')) {
      hidePreviewDelayed()
    }
  })
}

function extractURL(element) {
  let text = element.textContent || ''
  
  // 清理 Markdown 语法
  text = text.replace(/^\(|\)$/g, '')
  
  // 检查是否是有效 URL
  if (text.match(/^https?:\/\//)) {
    return text
  }
  
  return null
}

function showPreview(url, x, y) {
  clearTimeout(hideTimeout)
  
  if (previewEl) {
    previewEl.remove()
  }
  
  previewEl = document.createElement('div')
  previewEl.id = 'linkPreview'
  previewEl.style.cssText = `
    position: fixed;
    left: ${x + 10}px;
    top: ${y + 10}px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999;
    max-width: 350px;
    font-size: 13px;
  `
  
  // 解析 URL
  let domain = ''
  try {
    domain = new URL(url).hostname
  } catch {
    domain = url
  }
  
  previewEl.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
      <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=16" 
           style="width: 16px; height: 16px;" 
           onerror="this.style.display='none'">
      <span style="color: var(--text-primary); font-weight: 500;">${domain}</span>
    </div>
    <div style="
      color: var(--accent-color);
      word-break: break-all;
      font-size: 12px;
      max-height: 60px;
      overflow: hidden;
    ">${url}</div>
    <div style="margin-top: 8px; display: flex; gap: 8px;">
      <button onclick="window.open('${url}', '_blank')" style="
        padding: 4px 10px;
        background: var(--accent-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">打开链接</button>
      <button onclick="navigator.clipboard.writeText('${url}')" style="
        padding: 4px 10px;
        background: var(--bg-tertiary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">复制</button>
    </div>
  `
  
  document.body.appendChild(previewEl)
  
  // 鼠标进入预览框时不隐藏
  previewEl.onmouseenter = () => clearTimeout(hideTimeout)
  previewEl.onmouseleave = () => hidePreviewDelayed()
  
  // 确保不超出屏幕
  const rect = previewEl.getBoundingClientRect()
  if (rect.right > window.innerWidth) {
    previewEl.style.left = (window.innerWidth - rect.width - 10) + 'px'
  }
  if (rect.bottom > window.innerHeight) {
    previewEl.style.top = (y - rect.height - 10) + 'px'
  }
}

function hidePreviewDelayed() {
  hideTimeout = setTimeout(() => {
    if (previewEl) {
      previewEl.remove()
      previewEl = null
    }
  }, 300)
}
