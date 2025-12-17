// 行操作 - 复制行、移动行、删除行
import { showToast } from './utils.js'

// 复制当前行
export function duplicateLine(editor) {
  if (!editor) return
  
  const state = editor.state
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  
  editor.dispatch({
    changes: { from: line.to, insert: '\n' + line.text },
    selection: { anchor: line.to + 1 + (pos - line.from) }
  })
}

// 删除当前行
export function deleteLine(editor) {
  if (!editor) return
  
  const state = editor.state
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  
  const from = line.from
  const to = line.to < state.doc.length ? line.to + 1 : line.to
  const deleteFrom = line.from > 0 ? line.from - 1 : line.from
  
  editor.dispatch({
    changes: { from: deleteFrom, to: to, insert: '' }
  })
}

// 向上移动当前行
export function moveLineUp(editor) {
  if (!editor) return
  
  const state = editor.state
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  
  if (line.number === 1) return // 已经是第一行
  
  const prevLine = state.doc.line(line.number - 1)
  const cursorOffset = pos - line.from
  
  editor.dispatch({
    changes: [
      { from: prevLine.from, to: prevLine.to, insert: line.text },
      { from: line.from, to: line.to, insert: prevLine.text }
    ],
    selection: { anchor: prevLine.from + cursorOffset }
  })
}

// 向下移动当前行
export function moveLineDown(editor) {
  if (!editor) return
  
  const state = editor.state
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  
  if (line.number === state.doc.lines) return // 已经是最后一行
  
  const nextLine = state.doc.line(line.number + 1)
  const cursorOffset = pos - line.from
  
  editor.dispatch({
    changes: [
      { from: line.from, to: line.to, insert: nextLine.text },
      { from: nextLine.from, to: nextLine.to, insert: line.text }
    ],
    selection: { anchor: nextLine.from + cursorOffset }
  })
}

// 在上方插入空行
export function insertLineAbove(editor) {
  if (!editor) return
  
  const state = editor.state
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  
  editor.dispatch({
    changes: { from: line.from, insert: '\n' },
    selection: { anchor: line.from }
  })
}

// 在下方插入空行
export function insertLineBelow(editor) {
  if (!editor) return
  
  const state = editor.state
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  
  editor.dispatch({
    changes: { from: line.to, insert: '\n' },
    selection: { anchor: line.to + 1 }
  })
}

// 选择当前行
export function selectLine(editor) {
  if (!editor) return
  
  const state = editor.state
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  
  editor.dispatch({
    selection: { anchor: line.from, head: line.to }
  })
}
