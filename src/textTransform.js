// 文本转换工具
import { showToast } from './utils.js'

// 转换为大写
export function toUpperCase(editor) {
  transformSelection(editor, text => text.toUpperCase(), '已转换为大写')
}

// 转换为小写
export function toLowerCase(editor) {
  transformSelection(editor, text => text.toLowerCase(), '已转换为小写')
}

// 首字母大写
export function toTitleCase(editor) {
  transformSelection(editor, text => {
    return text.replace(/\b\w/g, char => char.toUpperCase())
  }, '已转换为首字母大写')
}

// 中文标点转英文
export function toEnglishPunctuation(editor) {
  const map = {
    '\uff0c': ',', '\u3002': '.', '\uff01': '!', '\uff1f': '?',
    '\uff1a': ':', '\uff1b': ';', '\u201c': '"', '\u201d': '"',
    '\u2018': "'", '\u2019': "'", '\uff08': '(', '\uff09': ')',
    '\u3010': '[', '\u3011': ']', '\u300a': '<', '\u300b': '>',
    '\u3001': ',', '\uff5e': '~', '\u2014\u2014': '--', '\u2026': '...'
  }
  transformSelection(editor, text => {
    let result = text
    for (const [cn, en] of Object.entries(map)) {
      result = result.split(cn).join(en)
    }
    return result
  }, '已转换为英文标点')
}

// 英文标点转中文
export function toChinesePunctuation(editor) {
  const map = {
    ',': '\uff0c', '.': '\u3002', '!': '\uff01', '?': '\uff1f',
    ':': '\uff1a', ';': '\uff1b', '"': '\u201c', "'": '\u2018',
    '(': '\uff08', ')': '\uff09', '[': '\u3010', ']': '\u3011',
    '<': '\u300a', '>': '\u300b', '~': '\uff5e'
  }
  transformSelection(editor, text => {
    let result = text.replace(/--/g, '\u2014\u2014')
    for (const [en, cn] of Object.entries(map)) {
      result = result.split(en).join(cn)
    }
    return result
  }, '已转换为中文标点')
}

// 移除多余空格
export function removeExtraSpaces(editor) {
  transformSelection(editor, text => {
    return text.replace(/  +/g, ' ').replace(/\n\n\n+/g, '\n\n').trim()
  }, '已移除多余空格')
}

// 行排序（升序）
export function sortLinesAsc(editor) {
  transformSelection(editor, text => {
    const lines = text.split('\n')
    return lines.sort((a, b) => a.localeCompare(b, 'zh-CN')).join('\n')
  }, '已按升序排列')
}

// 行排序（降序）
export function sortLinesDesc(editor) {
  transformSelection(editor, text => {
    const lines = text.split('\n')
    return lines.sort((a, b) => b.localeCompare(a, 'zh-CN')).join('\n')
  }, '已按降序排列')
}

// 反转行顺序
export function reverseLines(editor) {
  transformSelection(editor, text => {
    return text.split('\n').reverse().join('\n')
  }, '已反转行顺序')
}

// 去除重复行
export function removeDuplicateLines(editor) {
  transformSelection(editor, text => {
    const lines = text.split('\n')
    return [...new Set(lines)].join('\n')
  }, '已去除重复行')
}

// 添加行号
export function addLineNumbers(editor) {
  transformSelection(editor, text => {
    const lines = text.split('\n')
    return lines.map((line, i) => `${i + 1}. ${line}`).join('\n')
  }, '已添加行号')
}

// 移除行号
export function removeLineNumbers(editor) {
  transformSelection(editor, text => {
    return text.replace(/^\d+\.\s*/gm, '')
  }, '已移除行号')
}

// 转换为引用
export function toBlockquote(editor) {
  transformSelection(editor, text => {
    return text.split('\n').map(line => `> ${line}`).join('\n')
  }, '已转换为引用')
}

// 转换为列表
export function toList(editor) {
  transformSelection(editor, text => {
    return text.split('\n').map(line => `- ${line}`).join('\n')
  }, '已转换为列表')
}

// 转换为任务列表
export function toTaskList(editor) {
  transformSelection(editor, text => {
    return text.split('\n').map(line => `- [ ] ${line}`).join('\n')
  }, '已转换为任务列表')
}

// 通用转换函数
function transformSelection(editor, transformer, message) {
  if (!editor) return
  
  const selection = editor.state.selection.main
  
  // 如果没有选中，选择整个文档
  const from = selection.from === selection.to ? 0 : selection.from
  const to = selection.from === selection.to ? editor.state.doc.length : selection.to
  
  const text = editor.state.sliceDoc(from, to)
  const transformed = transformer(text)
  
  if (text !== transformed) {
    editor.dispatch({
      changes: { from, to, insert: transformed },
      selection: { anchor: from, head: from + transformed.length }
    })
    showToast(message)
  } else {
    showToast('无需转换')
  }
}


// 显示转换菜单
export function showTransformMenu(editor) {
  const existing = document.getElementById('transformMenu')
  if (existing) {
    existing.remove()
    return
  }
  
  const menu = document.createElement('div')
  menu.id = 'transformMenu'
  menu.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 9999;
    min-width: 200px;
  `
  
  const items = [
    { label: '\ud83d\udd20 转为大写', action: () => toUpperCase(editor) },
    { label: '\ud83d\udd21 转为小写', action: () => toLowerCase(editor) },
    { label: '\ud83d\udd24 首字母大写', action: () => toTitleCase(editor) },
    { divider: true },
    { label: '\ud83d\udd04 中文标点\u2192英文', action: () => toEnglishPunctuation(editor) },
    { label: '\ud83d\udd04 英文标点\u2192中文', action: () => toChinesePunctuation(editor) },
    { divider: true },
    { label: '\ud83d\udcca 行排序 (升序)', action: () => sortLinesAsc(editor) },
    { label: '\ud83d\udcca 行排序 (降序)', action: () => sortLinesDesc(editor) },
    { label: '\ud83d\udd00 反转行顺序', action: () => reverseLines(editor) },
    { label: '\ud83d\uddd1\ufe0f 去除重复行', action: () => removeDuplicateLines(editor) },
    { divider: true },
    { label: '\ud83d\udd22 添加行号', action: () => addLineNumbers(editor) },
    { label: '\u274c 移除行号', action: () => removeLineNumbers(editor) },
    { label: '\ud83d\udcac 转为引用', action: () => toBlockquote(editor) },
    { label: '\ud83d\udcdd 转为列表', action: () => toList(editor) },
    { label: '\u2611\ufe0f 转为任务列表', action: () => toTaskList(editor) },
  ]
  
  items.forEach(item => {
    if (item.divider) {
      const divider = document.createElement('div')
      divider.style.cssText = 'height: 1px; background: var(--border-color); margin: 4px 0;'
      menu.appendChild(divider)
    } else {
      const btn = document.createElement('button')
      btn.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px 12px;
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-size: 13px;
        text-align: left;
        cursor: pointer;
        border-radius: 4px;
      `
      btn.textContent = item.label
      btn.onmouseenter = () => btn.style.background = 'var(--bg-tertiary)'
      btn.onmouseleave = () => btn.style.background = 'transparent'
      btn.onclick = () => {
        item.action()
        menu.remove()
      }
      menu.appendChild(btn)
    }
  })
  
  document.body.appendChild(menu)
  
  // 点击外部关闭
  setTimeout(() => {
    document.addEventListener('click', function close(e) {
      if (!menu.contains(e.target)) {
        menu.remove()
        document.removeEventListener('click', close)
      }
    })
  }, 100)
  
  // ESC 关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      menu.remove()
      document.removeEventListener('keydown', escHandler)
    }
  }
  document.addEventListener('keydown', escHandler)
}
