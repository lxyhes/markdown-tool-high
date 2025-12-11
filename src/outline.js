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

  outlineContainer.innerHTML = ''

  if (headings.length === 0) {
    outlineContainer.innerHTML = '<div style="padding: 16px; color: #808080;">暂无大纲</div>'
    return
  }

  const list = document.createElement('ul')
  list.style.cssText = `
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 13px;
  `

  let currentLevel = 0
  let currentList = list
  const listStack = [list]

  headings.forEach((heading, index) => {
    const item = document.createElement('li')
    item.style.cssText = `
      padding: 4px 8px;
      cursor: pointer;
      border-left: 2px solid transparent;
      transition: all 0.2s ease;
      margin-left: ${(heading.level - 1) * 16}px;
    `

    item.onmouseenter = () => {
      item.style.background = '#2a2d2e'
      item.style.borderLeftColor = '#007acc'
    }

    item.onmouseleave = () => {
      item.style.background = 'transparent'
      item.style.borderLeftColor = 'transparent'
    }

    item.onclick = () => {
      jumpToLine(heading.line)
      // 高亮当前项
      document.querySelectorAll('#outlineContainer li').forEach(li => {
        li.style.background = 'transparent'
        li.style.color = '#cccccc'
      })
      item.style.background = '#37373d'
      item.style.color = '#ffffff'
    }

    const link = document.createElement('span')
    link.textContent = heading.text
    link.style.cssText = `
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: ${heading.level === 1 ? '#ffffff' : heading.level === 2 ? '#cccccc' : '#999999'};
      font-weight: ${heading.level <= 2 ? '500' : 'normal'};
    `

    item.appendChild(link)
    currentList.appendChild(item)
  })

  outlineContainer.appendChild(list)
}

// 跳转到指定行
function jumpToLine(lineNumber) {
  if (window.editor) {
    const editor = window.editor
    const doc = editor.state.doc

    if (lineNumber <= doc.lines) {
      const line = doc.line(lineNumber)
      editor.dispatch({
        selection: { anchor: line.from },
        effects: [
          EditorView.scrollIntoView(line.from, { y: 'center' })
        ]
      })
      editor.focus()
    }
  }
}

// 更新当前标题高亮
export function updateActiveHeading(headings, currentLine) {
  let activeHeading = null

  for (let i = headings.length - 1; i >= 0; i--) {
    if (headings[i].line <= currentLine) {
      activeHeading = headings[i]
      break
    }
  }

  // 更新大纲中的高亮
  const items = document.querySelectorAll('#outlineContainer li')
  items.forEach((item, index) => {
    if (headings[index] === activeHeading) {
      item.style.background = '#37373d'
      item.style.color = '#ffffff'
    } else {
      item.style.background = 'transparent'
      item.style.color = ''
    }
  })
}

// 创建大纲容器
export function createOutlineContainer() {
  const outlineDiv = document.createElement('div')
  outlineDiv.id = 'outlineContainer'
  outlineDiv.style.cssText = `
    position: absolute;
    top: 0;
    right: -300px;
    width: 280px;
    height: 100%;
    background: #1e1e1e;
    border-left: 1px solid #3e3e42;
    overflow-y: auto;
    transition: right 0.3s ease;
    z-index: 100;
  `

  // 添加大纲标题
  const header = document.createElement('div')
  header.style.cssText = `
    padding: 16px;
    border-bottom: 1px solid #3e3e42;
    font-size: 14px;
    font-weight: 600;
    color: #cccccc;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `

  const title = document.createElement('span')
  title.textContent = '大纲'

  const closeBtn = document.createElement('button')
  closeBtn.innerHTML = '✕'
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: #cccccc;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  `
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
    if (window.editor) {
      const content = window.editor.state.doc.toString()
      const headings = parseOutline(content)
      renderOutline(headings)
    }
  }
}