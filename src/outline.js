import { EditorView } from '@codemirror/view'

// 解析文档大纲
export function parseOutline(doc) {
  const headings = []
  const lines = doc.split('\n')

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const id = text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')

      headings.push({
        level,
        text,
        id,
        line: index + 1
      })
    }
  })

  return headings
}

// 渲染大纲
export function renderOutline(headings) {
  const outlineContainer = document.getElementById('outlineContainer')
  if (!outlineContainer) return

  // Keep header, clear list
  let listContainer = outlineContainer.querySelector('.outline-content')
  if (!listContainer) {
    // If we are initializing or missing structure, check if header exists
    if (outlineContainer.querySelector('.outline-header')) {
      listContainer = document.createElement('div')
      listContainer.className = 'outline-content'
      listContainer.style.cssText = 'flex: 1; overflow-y: auto; padding: 10px 0;'
      outlineContainer.appendChild(listContainer)
    } else {
      // Should not happen if createOutlineContainer was called
      outlineContainer.innerHTML = ''
      listContainer = outlineContainer
    }
  } else {
    listContainer.innerHTML = ''
  }

  if (headings.length === 0) {
    listContainer.innerHTML = '<div style="padding: 24px; color: var(--text-tertiary); text-align: center; font-size: 13px;">暂无大纲</div>'
    return
  }

  const list = document.createElement('ul')
  list.style.cssText = `
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 13px;
    font-family: var(--font-sans);
  `

  headings.forEach((heading, index) => {
    const item = document.createElement('li')
    // Indent based on level
    const paddingLeft = (heading.level - 1) * 12 + 16

    item.style.cssText = `
      padding: 6px 16px 6px ${paddingLeft}px;
      cursor: pointer;
      border-left: 2px solid transparent;
      transition: var(--transition-fast);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      line-height: 1.4;
    `

    item.onmouseenter = () => {
      if (!item.classList.contains('active')) {
        item.style.background = 'var(--bg-tertiary)'
        item.style.color = 'var(--text-primary)'
      }
    }

    item.onmouseleave = () => {
      if (!item.classList.contains('active')) {
        item.style.background = 'transparent'
        item.style.color = 'var(--text-secondary)'
      }
    }

    item.onclick = () => {
      jumpToLine(heading.line)
    }

    const textSpan = document.createElement('span')
    textSpan.textContent = heading.text
    textSpan.style.cssText = `
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
    `

    item.appendChild(textSpan)
    list.appendChild(item)
  })

  listContainer.appendChild(list)
}

// 跳转到指定行
function jumpToLine(lineNumber) {
  if (window.editor && window.editor.state && window.editor.state.doc) {
    const editor = window.editor
    const doc = editor.state.doc

    if (lineNumber <= doc.lines) {
      const line = doc.line(lineNumber)

      editor.dispatch({
        selection: { anchor: line.from },
        effects: EditorView.scrollIntoView(line.from, { y: 'center' })
      })
      editor.focus()
    }
  }
}

// 更新当前标题高亮
export function updateActiveHeading(headings, currentLine) {
  let activeHeadingIdx = -1

  for (let i = headings.length - 1; i >= 0; i--) {
    if (headings[i].line <= currentLine) {
      activeHeadingIdx = i
      break
    }
  }

  // 更新大纲中的高亮
  const listContainer = document.querySelector('#outlineContainer .outline-content') || document.getElementById('outlineContainer')
  if (!listContainer) return

  const items = listContainer.querySelectorAll('li')
  items.forEach((item, index) => {
    if (index === activeHeadingIdx) {
      item.classList.add('active')
      item.style.background = 'var(--bg-tertiary)'
      item.style.color = 'var(--accent-color)'
      item.style.borderLeftColor = 'var(--accent-color)'
      item.style.fontWeight = '500'
    } else {
      item.classList.remove('active')
      item.style.background = 'transparent'
      item.style.color = 'var(--text-secondary)'
      item.style.borderLeftColor = 'transparent'
      item.style.fontWeight = 'normal'
    }
  })
}

// 创建大纲容器
export function createOutlineContainer() {
  // Check if exists
  if (document.getElementById('outlineContainer')) return document.getElementById('outlineContainer')

  const outlineDiv = document.createElement('div')
  outlineDiv.id = 'outlineContainer'
  outlineDiv.style.cssText = `
    position: fixed;
    top: 0;
    right: -300px;
    width: 280px;
    height: 100vh;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 50;
  `

  // 添加大纲标题
  const header = document.createElement('div')
  header.className = 'outline-header'
  header.style.cssText = `
    padding: 0 16px;
    height: 56px; /* Match toolbar height explicitly if var not working */
    height: var(--toolbar-height, 56px);
    border-bottom: 1px solid var(--border-color);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-secondary);
    flex-shrink: 0;
  `

  const title = document.createElement('span')
  title.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
      文档大纲
    </div>
  `

  const closeBtn = document.createElement('button')
  closeBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-fast);
  `
  closeBtn.onmouseenter = () => { closeBtn.style.color = 'var(--text-primary)'; closeBtn.style.background = 'var(--bg-tertiary)'; }
  closeBtn.onmouseleave = () => { closeBtn.style.color = 'var(--text-secondary)'; closeBtn.style.background = 'transparent'; }
  closeBtn.onclick = () => toggleOutline()

  header.appendChild(title)
  header.appendChild(closeBtn)
  outlineDiv.appendChild(header)

  document.body.appendChild(outlineDiv)

  return outlineDiv
}

// 切换大纲显示
export function toggleOutline() {
  const outlineContainer = document.getElementById('outlineContainer')
  if (!outlineContainer) return

  if (outlineContainer.style.right === '0px') {
    outlineContainer.style.right = '-300px'
  } else {
    outlineContainer.style.right = '0px'

    // 更新大纲内容
    if (window.editor && window.editor.state && window.editor.state.doc) {
      const content = window.editor.state.doc.toString()
      const headings = parseOutline(content)
      renderOutline(headings)
    }
  }
}