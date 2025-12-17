// 阅读模式 - 沉浸式阅读体验
import { showToast } from './utils.js'

let isReadingMode = false
let originalStyles = {}

export function toggleReadingMode(editor) {
  isReadingMode = !isReadingMode
  
  const sidebar = document.querySelector('.sidebar')
  const toolbar = document.querySelector('.toolbar')
  const statusBar = document.querySelector('.status-bar')
  const tabBar = document.getElementById('tab-bar')
  const editorPane = document.getElementById('editorPane')
  const previewPane = document.getElementById('previewPane')
  const themeSwitcher = document.querySelector('.theme-switcher-container')
  
  if (isReadingMode) {
    // 进入阅读模式
    document.body.classList.add('reading-mode')
    
    // 隐藏UI元素
    if (sidebar) sidebar.style.display = 'none'
    if (toolbar) toolbar.style.display = 'none'
    if (statusBar) statusBar.style.display = 'none'
    if (tabBar) tabBar.style.display = 'none'
    if (themeSwitcher) themeSwitcher.style.display = 'none'
    
    // 显示预览，隐藏编辑器
    if (editorPane) editorPane.style.display = 'none'
    if (previewPane) {
      previewPane.classList.remove('hidden')
      previewPane.style.maxWidth = '800px'
      previewPane.style.margin = '0 auto'
      previewPane.style.padding = '60px 40px'
    }
    
    // 添加退出提示
    showExitHint()
    
    showToast('已进入阅读模式 (按 Esc 退出)')
  } else {
    // 退出阅读模式
    exitReadingMode()
  }
}

function exitReadingMode() {
  isReadingMode = false
  document.body.classList.remove('reading-mode')
  
  const sidebar = document.querySelector('.sidebar')
  const toolbar = document.querySelector('.toolbar')
  const statusBar = document.querySelector('.status-bar')
  const tabBar = document.getElementById('tab-bar')
  const editorPane = document.getElementById('editorPane')
  const previewPane = document.getElementById('previewPane')
  const themeSwitcher = document.querySelector('.theme-switcher-container')
  
  // 恢复UI
  if (sidebar && !sidebar.classList.contains('collapsed')) sidebar.style.display = ''
  if (toolbar) toolbar.style.display = ''
  if (statusBar) statusBar.style.display = ''
  if (tabBar) tabBar.style.display = ''
  if (themeSwitcher) themeSwitcher.style.display = ''
  
  // 恢复编辑器
  if (editorPane) editorPane.style.display = ''
  if (previewPane) {
    previewPane.classList.add('hidden')
    previewPane.style.maxWidth = ''
    previewPane.style.margin = ''
    previewPane.style.padding = ''
  }
  
  // 移除退出提示
  const hint = document.getElementById('readingModeHint')
  if (hint) hint.remove()
  
  showToast('已退出阅读模式')
}

function showExitHint() {
  const existing = document.getElementById('readingModeHint')
  if (existing) existing.remove()
  
  const hint = document.createElement('div')
  hint.id = 'readingModeHint'
  hint.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    color: var(--text-secondary);
    opacity: 0.7;
    z-index: 9999;
    cursor: pointer;
    transition: opacity 0.3s;
  `
  hint.textContent = '按 Esc 退出阅读模式'
  hint.onclick = () => exitReadingMode()
  
  // 3秒后淡出
  setTimeout(() => {
    hint.style.opacity = '0.3'
  }, 3000)
  
  hint.onmouseenter = () => hint.style.opacity = '1'
  hint.onmouseleave = () => hint.style.opacity = '0.3'
  
  document.body.appendChild(hint)
}

// 监听 Esc 键退出
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isReadingMode) {
    exitReadingMode()
  }
})

export function isInReadingMode() {
  return isReadingMode
}
