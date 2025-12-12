// 表格编辑器
export function createTableEditor() {
  const tableEditor = document.createElement('div')
  tableEditor.id = 'tableEditor'
  tableEditor.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    display: none;
    min-width: 300px;
  `

  // 标题
  const title = document.createElement('h3')
  title.textContent = '插入表格'
  title.style.cssText = 'margin: 0 0 24px 0; color: var(--text-primary); font-size: 16px; font-weight: 600;'
  tableEditor.appendChild(title)

  // 行数和列数输入
  const rowInput = createInput('行数', '5', 'number', '1', '100')
  const colInput = createInput('列数', '3', 'number', '1', '20')

  tableEditor.appendChild(rowInput)
  tableEditor.appendChild(colInput)

  // 按钮组
  const buttonGroup = document.createElement('div')
  buttonGroup.style.cssText = 'margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;'

  const cancelBtn = document.createElement('button')
  cancelBtn.textContent = '取消'
  cancelBtn.style.cssText = `
    padding: 8px 16px;
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: var(--transition-fast);
  `
  cancelBtn.onmouseenter = () => { cancelBtn.style.color = 'var(--text-primary)'; cancelBtn.style.borderColor = 'var(--text-secondary)'; }
  cancelBtn.onmouseleave = () => { cancelBtn.style.color = 'var(--text-secondary)'; cancelBtn.style.borderColor = 'var(--border-color)'; }

  const insertBtn = document.createElement('button')
  insertBtn.textContent = '插入'
  insertBtn.style.cssText = `
    padding: 8px 16px;
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-weight: 500;
    transition: var(--transition-fast);
  `
  insertBtn.onmouseenter = () => insertBtn.style.background = 'var(--accent-hover)'
  insertBtn.onmouseleave = () => insertBtn.style.background = 'var(--accent-color)'

  insertBtn.onclick = () => {
    const rows = parseInt(rowInput.querySelector('input').value)
    const cols = parseInt(colInput.querySelector('input').value)

    if (rows > 0 && cols > 0) {
      insertTable(rows, cols)
      tableEditor.style.display = 'none'
    }
  }

  cancelBtn.onclick = () => {
    tableEditor.style.display = 'none'
  }

  buttonGroup.appendChild(cancelBtn)
  buttonGroup.appendChild(insertBtn)
  tableEditor.appendChild(buttonGroup)

  document.body.appendChild(tableEditor)

  return tableEditor
}

// 创建输入框
function createInput(label, value, type, min, max) {
  const container = document.createElement('div')
  container.style.cssText = 'margin-bottom: 16px;'

  const labelEl = document.createElement('label')
  labelEl.textContent = label
  labelEl.style.cssText = 'display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 13px;'

  const input = document.createElement('input')
  input.type = type
  input.value = value
  input.min = min
  input.max = max
  input.style.cssText = `
    width: 100%;
    padding: 10px;
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    outline: none;
    transition: var(--transition-fast);
  `
  input.onfocus = () => input.style.borderColor = 'var(--accent-color)'
  input.onblur = () => input.style.borderColor = 'var(--border-color)'

  container.appendChild(labelEl)
  container.appendChild(input)

  return container
}

// 插入表格
function insertTable(rows, cols) {
  if (!window.editor) return

  let table = '|'
  let separator = '|'

  // 创建表头
  for (let i = 0; i < cols; i++) {
    table += ' 标题 |'
    separator += ' --- |'
  }

  table += '\n' + separator + '\n'

  // 创建数据行
  for (let i = 0; i < rows; i++) {
    table += '|'
    for (let j = 0; j < cols; j++) {
      table += '  |'
    }
    table += '\n'
  }

  const editor = window.editor
  const cursor = editor.state.selection.main.head

  editor.dispatch({
    changes: {
      from: cursor,
      insert: '\n' + table + '\n'
    },
    selection: { anchor: cursor + table.length + 2 }
  })

  editor.focus()
}

// 显示表格编辑器
export function showTableEditor() {
  const tableEditor = document.getElementById('tableEditor')
  if (tableEditor) {
    tableEditor.style.display = 'block'
    // Focus first input
    const input = tableEditor.querySelector('input')
    if (input) input.focus()
  }
}

// 智能表格编辑（在表格内时提供编辑功能）
export function setupTableEditing(editor) {
  if (!editor || !editor.contentDOM) return

  editor.contentDOM.addEventListener('dblclick', (e) => {
    const line = e.target.closest('.cm-line')
    if (!line) return

    const text = line.textContent

    // 检查是否在表格行内
    if (text.includes('|') && !text.startsWith('#')) {
      // 显示表格编辑选项
      showTableContextMenu(e, line)
    }
  })
}

// 显示表格上下文菜单
function showTableContextMenu(e, line) {
  e.preventDefault()

  const menu = document.createElement('div')
  menu.style.cssText = `
    position: fixed;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 6px;
    z-index: 1000;
    box-shadow: var(--shadow-lg);
    min-width: 120px;
  `
  menu.style.left = e.clientX + 'px'
  menu.style.top = e.clientY + 'px'

  const options = [
    { text: '添加行', action: () => addTableRow(line) },
    { text: '添加列', action: () => addTableColumn(line) },
    { text: '删除行', action: () => deleteTableRow(line) },
    { text: '删除列', action: () => deleteTableColumn(line) }
  ]

  options.forEach(option => {
    const menuItem = document.createElement('div')
    menuItem.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-primary);
      white-space: nowrap;
      border-radius: var(--radius-sm);
      transition: var(--transition-fast);
    `
    menuItem.textContent = option.text
    menuItem.onmouseenter = () => menuItem.style.background = 'var(--bg-tertiary)'
    menuItem.onmouseleave = () => menuItem.style.background = 'transparent'
    menuItem.onclick = () => {
      option.action()
      menu.remove()
    }
    menu.appendChild(menuItem)
  })

  document.body.appendChild(menu)

  setTimeout(() => {
    document.addEventListener('click', function closeMenu() {
      menu.remove()
      document.removeEventListener('click', closeMenu)
    })
  }, 100)
}

// 添加表格行
function addTableRow(line) {
  if (!window.editor) return

  const editor = window.editor
  // Need to be careful to get actual EditorView via window object if passed editor is not valid view
  // Line object here is DOM element. CodeMirror logic uses state.

  // Logic from original file seems safely state-based:
  const lineNumber = editor.state.doc.lineAt(editor.state.selection.main.head).number
  const lineInfo = editor.state.doc.line(lineNumber)

  // 获取当前行的表格结构
  const columns = lineInfo.text.split('|').length - 2
  let newRow = '|'
  for (let i = 0; i < columns; i++) {
    newRow += '  |'
  }

  editor.dispatch({
    changes: {
      from: lineInfo.to,
      insert: '\n' + newRow
    }
  })
}

// 添加表格列
function addTableColumn(line) {
  if (!window.editor) return

  const editor = window.editor
  const doc = editor.state.doc

  // 找到表格的所有行
  const tableLines = []
  let currentLine = editor.state.doc.lineAt(editor.state.selection.main.head).number

  // 向上查找表格开始
  while (currentLine > 1) {
    const line = doc.line(currentLine - 1)
    if (line.text.includes('|')) {
      currentLine--
    } else {
      break
    }
  }

  // 向下处理所有表格行
  const changes = []
  let lineNum = currentLine
  while (lineNum <= doc.lines) {
    const line = doc.line(lineNum)
    if (line.text.includes('|')) {
      const parts = line.text.split('|')
      const isSeparator = parts.some(part => part.trim().match(/^-+$/))

      if (isSeparator) {
        parts.splice(parts.length - 1, 0, ' --- ')
      } else {
        parts.splice(parts.length - 1, 0, '  ')
      }

      changes.push({
        from: line.from,
        to: line.to,
        insert: parts.join('|')
      })
    } else {
      break
    }
    lineNum++
  }

  editor.dispatch({ changes })
}

// 删除表格行
function deleteTableRow(line) {
  if (!window.editor) return

  const editor = window.editor
  const lineInfo = editor.state.doc.lineAt(editor.state.selection.main.head)

  // 检查是否是分隔行
  const isSeparator = lineInfo.text.match(/^\s*\|\s*-+\s*\|/)

  if (!isSeparator) {
    editor.dispatch({
      changes: {
        from: lineInfo.from,
        to: lineInfo.to + 1 // 包括换行符
      }
    })
  }
}

// 删除表格列
function deleteTableColumn(line) {
  if (!window.editor) return

  const editor = window.editor
  const cursorPos = editor.state.selection.main.head
  const lineInfo = editor.state.doc.lineAt(cursorPos)
  const parts = lineInfo.text.split('|')
  const columnIndex = getColumnIndex(lineInfo.text, cursorPos - lineInfo.from)

  if (parts.length <= 3) return // 至少保留两列

  const doc = editor.state.doc
  const changes = []
  let lineNum = 1

  // 处理所有行
  while (lineNum <= doc.lines) {
    const line = doc.line(lineNum)
    if (line.text.includes('|')) {
      const lineParts = line.text.split('|')
      if (lineParts.length > columnIndex + 1) {
        lineParts.splice(columnIndex + 1, 1)
        changes.push({
          from: line.from,
          to: line.to,
          insert: lineParts.join('|')
        })
      }
    }
    lineNum++
  }

  editor.dispatch({ changes })
}

// 获取光标所在的列索引
function getColumnIndex(line, cursorPos) {
  let index = 0
  let pos = 0

  for (let i = 0; i < line.length; i++) {
    if (line[i] === '|') {
      if (pos < cursorPos) {
        index++
      } else {
        break
      }
    }
    pos++
  }

  return Math.max(0, index - 1)
}

// 初始化表格编辑器
export function initTableEditor() {
  createTableEditor()
  setupTableEditing(window.editor)

  // 添加表格快捷键
  document.addEventListener('keydown', (e) => {
    // Alt + T for table insert
    if (e.altKey && e.key === 't') {
      e.preventDefault()
      showTableEditor()
    }
  })
}