// Markdown 格式化工具
import { showToast } from './utils.js'

// 格式化 Markdown 文档
export function formatMarkdown(text) {
  if (!text) return text
  
  let result = text
  
  // 1. 标准化换行符
  result = result.replace(/\r\n/g, '\n')
  
  // 2. 标题前后添加空行
  result = result.replace(/^(#{1,6}\s.+)$/gm, '\n$1\n')
  
  // 3. 列表项格式化
  result = result.replace(/^(\s*)[-*+]\s+/gm, '$1- ')
  
  // 4. 有序列表重新编号
  result = formatOrderedLists(result)
  
  // 5. 代码块前后添加空行
  result = result.replace(/(```[\s\S]*?```)/g, '\n$1\n')
  
  // 6. 引用块格式化
  result = result.replace(/^>\s*/gm, '> ')
  
  // 7. 表格格式化
  result = formatTables(result)
  
  // 8. 移除多余空行（超过2个连续空行变为2个）
  result = result.replace(/\n{3,}/g, '\n\n')
  
  // 9. 移除行尾空格
  result = result.replace(/[ \t]+$/gm, '')
  
  // 10. 确保文件末尾有换行
  if (!result.endsWith('\n')) {
    result += '\n'
  }
  
  // 11. 移除文件开头的空行
  result = result.replace(/^\n+/, '')
  
  return result
}

// 格式化有序列表
function formatOrderedLists(text) {
  const lines = text.split('\n')
  let counter = 0
  let inList = false
  let indent = ''
  
  return lines.map(line => {
    const match = line.match(/^(\s*)\d+\.\s+(.*)$/)
    if (match) {
      const currentIndent = match[1]
      const content = match[2]
      
      if (!inList || currentIndent !== indent) {
        counter = 1
        indent = currentIndent
        inList = true
      } else {
        counter++
      }
      
      return `${indent}${counter}. ${content}`
    } else {
      if (line.trim() === '') {
        // 空行不重置计数器
      } else if (!line.match(/^\s/)) {
        // 非缩进行重置
        inList = false
        counter = 0
      }
      return line
    }
  }).join('\n')
}

// 格式化表格
function formatTables(text) {
  const tableRegex = /(\|.+\|[\r\n]+\|[-:\s|]+\|[\r\n]+(?:\|.+\|[\r\n]*)+)/g
  
  return text.replace(tableRegex, (table) => {
    const lines = table.trim().split('\n')
    if (lines.length < 2) return table
    
    // 解析表格
    const rows = lines.map(line => 
      line.split('|').slice(1, -1).map(cell => cell.trim())
    )
    
    // 计算每列最大宽度
    const colWidths = []
    rows.forEach(row => {
      row.forEach((cell, i) => {
        const width = getStringWidth(cell)
        colWidths[i] = Math.max(colWidths[i] || 3, width)
      })
    })
    
    // 重建表格
    return rows.map((row, rowIndex) => {
      if (rowIndex === 1) {
        // 分隔行
        return '| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |'
      }
      return '| ' + row.map((cell, i) => 
        padString(cell, colWidths[i])
      ).join(' | ') + ' |'
    }).join('\n') + '\n'
  })
}

// 获取字符串显示宽度（中文算2）
function getStringWidth(str) {
  let width = 0
  for (const char of str) {
    width += char.charCodeAt(0) > 255 ? 2 : 1
  }
  return width
}

// 填充字符串到指定宽度
function padString(str, width) {
  const currentWidth = getStringWidth(str)
  const padding = width - currentWidth
  return str + ' '.repeat(Math.max(0, padding))
}

// 应用格式化到编辑器
export function applyFormat(editor) {
  if (!editor) return
  
  const content = editor.state.doc.toString()
  const formatted = formatMarkdown(content)
  
  if (content !== formatted) {
    editor.dispatch({
      changes: { from: 0, to: content.length, insert: formatted }
    })
    showToast('文档已格式化')
  } else {
    showToast('文档格式良好，无需调整')
  }
}

// 格式化选中内容
export function formatSelection(editor) {
  if (!editor) return
  
  const selection = editor.state.selection.main
  if (selection.from === selection.to) {
    showToast('请先选择要格式化的内容')
    return
  }
  
  const selectedText = editor.state.sliceDoc(selection.from, selection.to)
  const formatted = formatMarkdown(selectedText)
  
  editor.dispatch({
    changes: { from: selection.from, to: selection.to, insert: formatted }
  })
  showToast('选中内容已格式化')
}
