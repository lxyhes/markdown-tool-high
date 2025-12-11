// 更新状态栏
export function updateStatusBar(doc, selection) {
  // 更新字数统计
  const text = doc.toString()
  const wordCount = countWords(text)
  document.getElementById('wordCount').textContent = `字数: ${wordCount}`

  // 更新光标位置
  if (selection) {
    const cursor = selection.main.head
    const line = doc.lineAt(cursor)
    const lineNumber = line.number
    const column = cursor - line.from + 1
    document.getElementById('cursorPosition').textContent = `行 ${lineNumber}, 列 ${column}`
  }
}

// 统计字数
function countWords(text) {
  if (!text) return 0

  // 移除 Markdown 标记
  const cleanText = text
    .replace(/^#+\s+/gm, '') // 标题
    .replace(/\*\*(.*?)\*\*/g, '$1') // 粗体
    .replace(/\*(.*?)\*/g, '$1') // 斜体
    .replace(/`(.*?)`/g, '$1') // 行内代码
    .replace(/```[\s\S]*?```/g, '') // 代码块
    .replace(/!\[.*?\]\(.*?\)/g, '') // 图片
    .replace(/\[.*?\]\(.*?\)/g, '$1') // 链接
    .replace(/\s+/g, ' ')
    .trim()

  return cleanText.length
}

// 更新文件路径显示
export function updateFilePathDisplay(path) {
  const fileName = path ? path.split(/[/\\]/).pop() : '未命名.md'
  document.getElementById('filePath').textContent = fileName
}