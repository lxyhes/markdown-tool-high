// 打印优化 - 更好的打印样式
import { showToast } from './utils.js'

// 注入打印样式
export function initPrintStyles() {
  const style = document.createElement('style')
  style.id = 'printStyles'
  style.textContent = `
    @media print {
      /* 隐藏不需要打印的元素 */
      .sidebar,
      .toolbar,
      .status-bar,
      #tab-bar,
      .theme-switcher-container,
      .ai-overlay,
      #pomodoroPanel,
      #writingGoalPanel,
      .toast {
        display: none !important;
      }
      
      /* 主内容区域 */
      .app-container {
        display: block !important;
      }
      
      .main-content {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .editor-container {
        display: block !important;
      }
      
      .editor-pane {
        display: none !important;
      }
      
      .preview-pane {
        display: block !important;
        width: 100% !important;
        max-width: none !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
        background: white !important;
        color: black !important;
      }
      
      /* 内容样式 */
      .preview-pane h1,
      .preview-pane h2,
      .preview-pane h3,
      .preview-pane h4,
      .preview-pane h5,
      .preview-pane h6 {
        color: black !important;
        page-break-after: avoid;
      }
      
      .preview-pane p {
        color: black !important;
        orphans: 3;
        widows: 3;
      }
      
      .preview-pane pre,
      .preview-pane code {
        background: #f5f5f5 !important;
        color: black !important;
        border: 1px solid #ddd !important;
        page-break-inside: avoid;
      }
      
      .preview-pane blockquote {
        border-left-color: #666 !important;
        color: #333 !important;
        background: #f9f9f9 !important;
      }
      
      .preview-pane table {
        border-collapse: collapse !important;
        page-break-inside: avoid;
      }
      
      .preview-pane th,
      .preview-pane td {
        border: 1px solid #333 !important;
        color: black !important;
        background: white !important;
      }
      
      .preview-pane th {
        background: #f0f0f0 !important;
      }
      
      .preview-pane a {
        color: black !important;
        text-decoration: underline !important;
      }
      
      .preview-pane img {
        max-width: 100% !important;
        page-break-inside: avoid;
      }
      
      /* 链接显示 URL */
      .preview-pane a[href^="http"]::after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
        color: #666;
      }
      
      /* 分页控制 */
      .preview-pane h1 {
        page-break-before: always;
      }
      
      .preview-pane h1:first-child {
        page-break-before: avoid;
      }
    }
  `
  document.head.appendChild(style)
}

// 打印文档
export function printDocument() {
  // 确保预览内容是最新的
  if (window.editor) {
    const content = window.editor.state.doc.toString()
    if (window.updatePreview) {
      window.updatePreview(content)
    }
  }
  
  // 临时显示预览面板
  const previewPane = document.getElementById('previewPane')
  const wasHidden = previewPane?.classList.contains('hidden')
  
  if (wasHidden && previewPane) {
    previewPane.classList.remove('hidden')
  }
  
  // 延迟打印，确保预览渲染完成
  setTimeout(() => {
    window.print()
    
    // 恢复预览面板状态
    if (wasHidden && previewPane) {
      previewPane.classList.add('hidden')
    }
  }, 100)
}

// 显示打印预览对话框
export function showPrintPreview() {
  showToast('正在准备打印...')
  printDocument()
}
