// 代码片段管理
import { showToast } from './utils.js'

const STORAGE_KEY = 'markflow_snippets'

// 默认片段
const defaultSnippets = [
  { name: '代码块', trigger: 'code', content: '```${1:language}\n${2:code}\n```' },
  { name: '链接', trigger: 'link', content: '[${1:text}](${2:url})' },
  { name: '图片', trigger: 'img', content: '![${1:alt}](${2:url})' },
  { name: '表格 2x2', trigger: 'table2', content: '| ${1:Header1} | ${2:Header2} |\n| --- | --- |\n| ${3:Cell1} | ${4:Cell2} |' },
  { name: '表格 3x3', trigger: 'table3', content: '| ${1:H1} | ${2:H2} | ${3:H3} |\n| --- | --- | --- |\n| ${4:} | ${5:} | ${6:} |\n| ${7:} | ${8:} | ${9:} |' },
  { name: '折叠详情', trigger: 'details', content: '<details>\n<summary>${1:标题}</summary>\n\n${2:内容}\n\n</details>' },
  { name: '注释', trigger: 'comment', content: '<!-- ${1:注释内容} -->' },
  { name: '脚注', trigger: 'footnote', content: '[^${1:1}]: ${2:脚注内容}' },
  { name: '徽章', trigger: 'badge', content: '![${1:label}](https://img.shields.io/badge/${2:label}-${3:message}-${4:blue})' },
  { name: '当前日期', trigger: 'date', content: '{{DATE}}' },
  { name: '当前时间', trigger: 'time', content: '{{TIME}}' },
  { name: '当前日期时间', trigger: 'datetime', content: '{{DATETIME}}' },
]

// 获取所有片段
export function getSnippets() {
  try {
    const custom = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return [...defaultSnippets, ...custom]
  } catch {
    return defaultSnippets
  }
}

// 保存自定义片段
export function saveCustomSnippet(snippet) {
  try {
    const custom = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    custom.push(snippet)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
    showToast('片段已保存')
  } catch {
    showToast('保存失败', 'error')
  }
}

// 删除自定义片段
export function deleteCustomSnippet(trigger) {
  try {
    let custom = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    custom = custom.filter(s => s.trigger !== trigger)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
    showToast('片段已删除')
  } catch {
    showToast('删除失败', 'error')
  }
}

// 插入片段
export function insertSnippet(editor, snippet) {
  if (!editor || !snippet) return
  
  let content = snippet.content
  
  // 替换日期时间占位符
  content = content.replace('{{DATE}}', new Date().toLocaleDateString())
  content = content.replace('{{TIME}}', new Date().toLocaleTimeString())
  content = content.replace('{{DATETIME}}', new Date().toLocaleString())
  
  // 处理 Tab Stop (简化版，只处理第一个)
  const tabStopMatch = content.match(/\$\{1:([^}]*)\}/)
  let cursorOffset = content.length
  
  if (tabStopMatch) {
    const placeholder = tabStopMatch[1]
    content = content.replace(/\$\{\d+:([^}]*)\}/g, '$1')
    cursorOffset = content.indexOf(placeholder)
  }
  
  const pos = editor.state.selection.main.head
  editor.dispatch({
    changes: { from: pos, insert: content },
    selection: { anchor: pos + cursorOffset }
  })
  
  editor.focus()
}

// 显示片段管理面板
export function showSnippetsPanel(editor) {
  const existing = document.getElementById('snippetsPanel')
  if (existing) {
    existing.remove()
    return
  }
  
  const snippets = getSnippets()
  
  const panel = document.createElement('div')
  panel.id = 'snippetsPanel'
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 500px;
    max-height: 600px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 9999;
    display: flex;
    flex-direction: column;
  `
  
  panel.innerHTML = `
    <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: 600; color: var(--text-primary);">📦 代码片段</span>
      <div style="display: flex; gap: 8px;">
        <button id="addSnippetBtn" style="
          padding: 4px 12px;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">+ 新建</button>
        <button id="closeSnippetsBtn" style="
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 18px;
        ">&times;</button>
      </div>
    </div>
    
    <div style="padding: 12px; border-bottom: 1px solid var(--border-color);">
      <input type="text" id="snippetSearch" placeholder="搜索片段..." style="
        width: 100%;
        padding: 8px 12px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 13px;
      ">
    </div>
    
    <div id="snippetsList" style="flex: 1; overflow-y: auto; padding: 8px;"></div>
  `
  
  document.body.appendChild(panel)
  
  const listEl = document.getElementById('snippetsList')
  const searchInput = document.getElementById('snippetSearch')
  
  function renderList(filter = '') {
    listEl.innerHTML = ''
    
    const filtered = snippets.filter(s => 
      s.name.toLowerCase().includes(filter.toLowerCase()) ||
      s.trigger.toLowerCase().includes(filter.toLowerCase())
    )
    
    if (filtered.length === 0) {
      listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-tertiary);">无匹配片段</div>'
      return
    }
    
    filtered.forEach(snippet => {
      const item = document.createElement('div')
      item.style.cssText = `
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 4px;
        border: 1px solid var(--border-color);
        transition: all 0.15s;
      `
      item.onmouseenter = () => {
        item.style.background = 'var(--bg-tertiary)'
        item.style.borderColor = 'var(--accent-color)'
      }
      item.onmouseleave = () => {
        item.style.background = 'transparent'
        item.style.borderColor = 'var(--border-color)'
      }
      
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="color: var(--text-primary); font-weight: 500;">${snippet.name}</span>
            <code style="
              margin-left: 8px;
              padding: 2px 6px;
              background: var(--bg-tertiary);
              border-radius: 3px;
              font-size: 11px;
              color: var(--accent-color);
            ">${snippet.trigger}</code>
          </div>
        </div>
        <div style="
          margin-top: 6px;
          font-size: 12px;
          color: var(--text-tertiary);
          font-family: var(--font-mono);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${escapeHtml(snippet.content.slice(0, 50))}${snippet.content.length > 50 ? '...' : ''}</div>
      `
      
      item.onclick = () => {
        insertSnippet(editor, snippet)
        panel.remove()
      }
      
      listEl.appendChild(item)
    })
  }
  
  renderList()
  
  searchInput.oninput = (e) => renderList(e.target.value)
  searchInput.focus()
  
  document.getElementById('closeSnippetsBtn').onclick = () => panel.remove()
  document.getElementById('addSnippetBtn').onclick = () => showAddSnippetDialog(editor, panel)
  
  // ESC 关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      panel.remove()
      document.removeEventListener('keydown', escHandler)
    }
  }
  document.addEventListener('keydown', escHandler)
}

function showAddSnippetDialog(editor, parentPanel) {
  const dialog = document.createElement('div')
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    width: 400px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 10000;
  `
  
  dialog.innerHTML = `
    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 16px;">新建代码片段</div>
    <div style="margin-bottom: 12px;">
      <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">名称</label>
      <input type="text" id="newSnippetName" placeholder="例如: 我的模板" style="
        width: 100%;
        padding: 8px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-primary);
      ">
    </div>
    <div style="margin-bottom: 12px;">
      <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">触发词</label>
      <input type="text" id="newSnippetTrigger" placeholder="例如: mytemplate" style="
        width: 100%;
        padding: 8px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-primary);
      ">
    </div>
    <div style="margin-bottom: 16px;">
      <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">内容</label>
      <textarea id="newSnippetContent" rows="5" placeholder="片段内容..." style="
        width: 100%;
        padding: 8px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-primary);
        font-family: var(--font-mono);
        resize: vertical;
      "></textarea>
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="cancelSnippetBtn" style="
        padding: 8px 16px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-primary);
        cursor: pointer;
      ">取消</button>
      <button id="saveSnippetBtn" style="
        padding: 8px 16px;
        background: var(--accent-color);
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
      ">保存</button>
    </div>
  `
  
  document.body.appendChild(dialog)
  document.getElementById('newSnippetName').focus()
  
  document.getElementById('cancelSnippetBtn').onclick = () => dialog.remove()
  document.getElementById('saveSnippetBtn').onclick = () => {
    const name = document.getElementById('newSnippetName').value.trim()
    const trigger = document.getElementById('newSnippetTrigger').value.trim()
    const content = document.getElementById('newSnippetContent').value
    
    if (!name || !trigger || !content) {
      showToast('请填写所有字段', 'error')
      return
    }
    
    saveCustomSnippet({ name, trigger, content })
    dialog.remove()
    parentPanel.remove()
    showSnippetsPanel(editor)
  }
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
