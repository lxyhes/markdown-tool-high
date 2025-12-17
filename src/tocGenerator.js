// 目录生成器 - 从文档生成 TOC
import { showToast } from './utils.js'

// 解析标题
function parseHeadings(text) {
  const headings = []
  const lines = text.split('\n')
  
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: index + 1
      })
    }
  })
  
  return headings
}

// 生成 Markdown 目录
export function generateTOC(text, options = {}) {
  const {
    maxLevel = 3,
    ordered = false,
    includeLinks = true
  } = options
  
  const headings = parseHeadings(text).filter(h => h.level <= maxLevel)
  
  if (headings.length === 0) {
    return '<!-- 未找到标题 -->'
  }
  
  const minLevel = Math.min(...headings.map(h => h.level))
  
  let toc = '## 目录\n\n'
  
  headings.forEach((heading, index) => {
    const indent = '  '.repeat(heading.level - minLevel)
    const bullet = ordered ? `${index + 1}.` : '-'
    const anchor = heading.text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
    
    if (includeLinks) {
      toc += `${indent}${bullet} [${heading.text}](#${anchor})\n`
    } else {
      toc += `${indent}${bullet} ${heading.text}\n`
    }
  })
  
  return toc
}

// 显示目录生成面板
export function showTOCGenerator(editor) {
  if (!editor) return
  
  const existing = document.getElementById('tocGeneratorPanel')
  if (existing) {
    existing.remove()
    return
  }
  
  const content = editor.state.doc.toString()
  const headings = parseHeadings(content)
  
  const panel = document.createElement('div')
  panel.id = 'tocGeneratorPanel'
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 450px;
    max-height: 600px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 9999;
    display: flex;
    flex-direction: column;
  `
  
  panel.innerHTML = `
    <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: 600; color: var(--text-primary);">📑 生成目录</span>
      <button id="closeTOCBtn" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:18px;">&times;</button>
    </div>
    
    <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color);">
      <div style="display: flex; gap: 16px; margin-bottom: 12px;">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); cursor: pointer;">
          <input type="checkbox" id="tocOrdered"> 有序列表
        </label>
        <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); cursor: pointer;">
          <input type="checkbox" id="tocLinks" checked> 包含链接
        </label>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 13px; color: var(--text-secondary);">最大层级:</span>
        <select id="tocMaxLevel" style="
          padding: 4px 8px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 13px;
        ">
          <option value="2">H2</option>
          <option value="3" selected>H3</option>
          <option value="4">H4</option>
          <option value="6">全部</option>
        </select>
      </div>
    </div>
    
    <div style="padding: 16px 20px; flex: 1; overflow-y: auto;">
      <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 8px;">预览 (${headings.length} 个标题)</div>
      <pre id="tocPreview" style="
        background: var(--bg-tertiary);
        padding: 12px;
        border-radius: 6px;
        font-size: 13px;
        color: var(--text-primary);
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 250px;
        overflow-y: auto;
        font-family: var(--font-mono);
      ">${escapeHtml(generateTOC(content))}</pre>
    </div>
    
    <div style="padding: 12px 20px; border-top: 1px solid var(--border-color); display: flex; gap: 8px; justify-content: flex-end;">
      <button id="copyTOCBtn" style="
        padding: 8px 16px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 13px;
      ">复制</button>
      <button id="insertTOCBtn" style="
        padding: 8px 16px;
        background: var(--accent-color);
        border: none;
        border-radius: 6px;
        color: white;
        cursor: pointer;
        font-size: 13px;
      ">插入到文档</button>
    </div>
  `
  
  document.body.appendChild(panel)
  
  // 更新预览
  function updatePreview() {
    const maxLevel = parseInt(document.getElementById('tocMaxLevel').value)
    const ordered = document.getElementById('tocOrdered').checked
    const includeLinks = document.getElementById('tocLinks').checked
    
    const toc = generateTOC(content, { maxLevel, ordered, includeLinks })
    document.getElementById('tocPreview').textContent = toc
  }
  
  // 事件绑定
  document.getElementById('closeTOCBtn').onclick = () => panel.remove()
  document.getElementById('tocMaxLevel').onchange = updatePreview
  document.getElementById('tocOrdered').onchange = updatePreview
  document.getElementById('tocLinks').onchange = updatePreview
  
  document.getElementById('copyTOCBtn').onclick = () => {
    const toc = document.getElementById('tocPreview').textContent
    navigator.clipboard.writeText(toc)
    showToast('目录已复制')
  }
  
  document.getElementById('insertTOCBtn').onclick = () => {
    const toc = document.getElementById('tocPreview').textContent
    const pos = editor.state.selection.main.head
    
    editor.dispatch({
      changes: { from: pos, insert: '\n' + toc + '\n' }
    })
    
    panel.remove()
    showToast('目录已插入')
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

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
