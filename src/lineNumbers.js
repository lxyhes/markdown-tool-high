// 行号显示控制
import { showToast } from './utils.js'

let lineNumbersVisible = false

export function toggleLineNumbers() {
  lineNumbersVisible = !lineNumbersVisible
  
  const style = document.getElementById('lineNumbersStyle')
  
  if (lineNumbersVisible) {
    if (!style) {
      const newStyle = document.createElement('style')
      newStyle.id = 'lineNumbersStyle'
      newStyle.textContent = `
        .cm-lineNumbers {
          display: flex !important;
        }
        .cm-gutters {
          padding-left: 8px !important;
        }
      `
      document.head.appendChild(newStyle)
    }
    showToast('行号已显示')
  } else {
    if (style) {
      style.remove()
    }
    showToast('行号已隐藏')
  }
  
  return lineNumbersVisible
}

export function isLineNumbersVisible() {
  return lineNumbersVisible
}
