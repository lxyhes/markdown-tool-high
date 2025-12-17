// 智能粘贴 - 自动识别并格式化内容

// 检测粘贴内容类型并转换
export function processSmartPaste(text, editor) {
  if (!text || !editor) return text
  
  // 检测 URL
  if (isURL(text)) {
    return handleURL(text, editor)
  }
  
  // 检测表格数据 (Tab 分隔)
  if (isTableData(text)) {
    return convertToMarkdownTable(text)
  }
  
  // 检测 JSON
  if (isJSON(text)) {
    return formatJSON(text)
  }
  
  // 检测代码
  if (looksLikeCode(text)) {
    return wrapInCodeBlock(text)
  }
  
  return text
}

// URL 检测
function isURL(text) {
  const trimmed = text.trim()
  return /^https?:\/\/[^\s]+$/.test(trimmed)
}

// 处理 URL - 如果有选中文本，创建链接
function handleURL(url, editor) {
  const selection = editor.state.selection.main
  const selectedText = editor.state.sliceDoc(selection.from, selection.to)
  
  if (selectedText) {
    // 有选中文本，创建链接
    return `[${selectedText}](${url.trim()})`
  }
  
  // 没有选中文本，尝试获取页面标题（简化处理，直接返回链接格式）
  const domain = new URL(url.trim()).hostname
  return `[${domain}](${url.trim()})`
}

// 表格数据检测 (Tab 或多个空格分隔的多行)
function isTableData(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return false
  
  // 检查是否有 Tab 分隔
  const hasTab = lines.every(line => line.includes('\t'))
  if (hasTab) return true
  
  // 检查是否有一致的列数（用多空格分隔）
  const columnCounts = lines.map(line => line.split(/\t|  +/).length)
  return columnCounts.every(c => c === columnCounts[0] && c > 1)
}

// 转换为 Markdown 表格
function convertToMarkdownTable(text) {
  const lines = text.trim().split('\n')
  const rows = lines.map(line => line.split(/\t|  +/).map(cell => cell.trim()))
  
  if (rows.length === 0) return text
  
  const colCount = Math.max(...rows.map(r => r.length))
  
  // 补齐列数
  rows.forEach(row => {
    while (row.length < colCount) row.push('')
  })
  
  // 生成表格
  let table = '| ' + rows[0].join(' | ') + ' |\n'
  table += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n'
  
  for (let i = 1; i < rows.length; i++) {
    table += '| ' + rows[i].join(' | ') + ' |\n'
  }
  
  return table
}

// JSON 检测
function isJSON(text) {
  const trimmed = text.trim()
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return false
  try {
    JSON.parse(trimmed)
    return true
  } catch {
    return false
  }
}

// 格式化 JSON
function formatJSON(text) {
  try {
    const obj = JSON.parse(text.trim())
    const formatted = JSON.stringify(obj, null, 2)
    return '```json\n' + formatted + '\n```'
  } catch {
    return text
  }
}

// 代码检测 (简单启发式)
function looksLikeCode(text) {
  const codeIndicators = [
    /^(import|export|const|let|var|function|class|def|public|private)\s/m,
    /[{};]\s*$/m,
    /^\s*(if|for|while|switch|try|catch)\s*\(/m,
    /=>\s*{/,
    /<\/?[a-z]+[^>]*>/i, // HTML tags
    /^\s*#include/m,
    /^\s*package\s+/m,
    /^\s*using\s+/m,
  ]
  
  const lines = text.split('\n')
  // 多行且有缩进
  if (lines.length > 3 && lines.some(l => l.startsWith('  ') || l.startsWith('\t'))) {
    return codeIndicators.some(pattern => pattern.test(text))
  }
  
  return false
}

// 包装为代码块
function wrapInCodeBlock(text) {
  // 尝试检测语言
  const lang = detectLanguage(text)
  return '```' + lang + '\n' + text.trim() + '\n```'
}

// 简单语言检测
function detectLanguage(text) {
  if (/^import .* from ['"]/.test(text) || /^(const|let|var)\s/.test(text)) return 'javascript'
  if (/^(def |class |import |from .* import)/.test(text)) return 'python'
  if (/<\?php/.test(text)) return 'php'
  if (/^package\s+\w+;/.test(text)) return 'java'
  if (/^#include\s*</.test(text)) return 'cpp'
  if (/^using\s+System;/.test(text)) return 'csharp'
  if (/<[a-z]+[^>]*>.*<\/[a-z]+>/is.test(text)) return 'html'
  if (/^\s*\{[\s\S]*"[\w]+":\s*/.test(text)) return 'json'
  if (/^---\n/.test(text)) return 'yaml'
  return ''
}

// 设置智能粘贴处理器
export function setupSmartPaste(editor) {
  if (!editor) return
  
  // 监听粘贴事件
  editor.dom.addEventListener('paste', (e) => {
    // 检查是否按住 Shift（Shift+粘贴 = 纯文本粘贴）
    if (e.shiftKey) return
    
    const text = e.clipboardData?.getData('text/plain')
    if (!text) return
    
    // 只处理特定类型的内容
    if (isURL(text) || isTableData(text) || isJSON(text)) {
      e.preventDefault()
      
      const processed = processSmartPaste(text, editor)
      const pos = editor.state.selection.main
      
      editor.dispatch({
        changes: { from: pos.from, to: pos.to, insert: processed },
        selection: { anchor: pos.from + processed.length }
      })
    }
    // 代码检测可能误判，不自动处理
  })
}
