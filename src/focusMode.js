import { EditorView } from '@codemirror/view'
import { showToast } from './utils.js'

// 专注模式配置
let focusModeEnabled = false
let typewriterModeEnabled = false

// 切换专注模式
export function toggleFocusMode() {
  focusModeEnabled = !focusModeEnabled
  applyFocusMode()
  return focusModeEnabled
}

// 切换打字机模式
export function toggleTypewriterMode() {
  typewriterModeEnabled = !typewriterModeEnabled
  applyTypewriterMode()
  return typewriterModeEnabled
}

// 应用专注模式
function applyFocusMode() {
  const editor = document.querySelector('.cm-editor')
  if (!editor) return

  if (focusModeEnabled) {
    editor.classList.add('focus-mode')
  } else {
    editor.classList.remove('focus-mode')
  }
}

// 应用打字机模式
function applyTypewriterMode() {
  const editor = window.editor
  if (!editor) return

  if (typewriterModeEnabled) {
    // 监听光标位置变化
    editor.dispatch({
      effects: EditorView.updateListener.of((update) => {
        if (update.selectionSet) {
          scrollToCenter(update.state.selection.main.head)
        }
      })
    })
  }
}

// 滚动到中心位置
function scrollToCenter(position) {
  const editor = window.editor
  if (!editor) return

  const coords = editor.coordsAtPos(position)
  const editorElement = editor.contentDOM
  const rect = editorElement.getBoundingClientRect()
  const centerY = rect.height / 2

  // 计算需要滚动的距离
  const scrollTop = editorElement.scrollTop
  const targetScroll = scrollTop + (coords.top - rect.top - centerY)

  // 平滑滚动到中心
  editorElement.scrollTo({
    top: targetScroll,
    behavior: 'smooth'
  })
}

// 创建专注模式样式
export function createFocusModeStyles() {
  const style = document.createElement('style')
  style.textContent = `
    /* 专注模式样式 */
    .cm-editor.focus-mode .cm-line {
      opacity: 0.3;
      transition: opacity 0.3s ease;
    }

    .cm-editor.focus-mode .cm-line.cm-active {
      opacity: 1;
    }

    .cm-editor.focus-mode .cm-line.cm-active ~ .cm-line {
      opacity: 0.3;
    }

    .cm-editor.focus-mode .cm-line.cm-active + .cm-line {
      opacity: 0.6;
    }

    .cm-editor.focus-mode .cm-line.cm-active - .cm-line {
      opacity: 0.6;
    }

    /* 打字机模式样式 */
    .typewriter-mode .cm-content {
      padding-top: 50vh !important;
      padding-bottom: 50vh !important;
    }

    /* 淡化非文本元素 */
    .cm-editor.focus-mode .cm-gutters {
      opacity: 0.5;
    }

    .cm-editor.focus-mode .cm-activeLineGutter {
      opacity: 1;
    }

    /* 隐藏滚动条在专注模式下 */
    .cm-editor.focus-mode::-webkit-scrollbar {
      width: 4px;
    }

    .cm-editor.focus-mode::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
    }
  `
  document.head.appendChild(style)
}

// 初始化专注模式
export function initFocusMode() {
  createFocusModeStyles()

  // 添加键盘快捷键
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + F 切换专注模式
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault()
      const enabled = toggleFocusMode()
      showToast(enabled ? '专注模式已开启' : '专注模式已关闭')
    }

    // Ctrl/Cmd + Shift + T 切换打字机模式
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
      e.preventDefault()
      const enabled = toggleTypewriterMode()
      showToast(enabled ? '打字机模式已开启' : '打字机模式已关闭')
    }
  })
}

// 获取当前模式状态
export function getFocusModeStatus() {
  return {
    focusMode: focusModeEnabled,
    typewriterMode: typewriterModeEnabled
  }
}