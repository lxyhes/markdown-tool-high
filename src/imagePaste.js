// 截图粘贴 - 直接粘贴图片转 base64
import { showToast } from './utils.js'

export function setupImagePaste(editor) {
  if (!editor) return
  
  editor.dom.addEventListener('paste', async (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        
        const file = item.getAsFile()
        if (!file) continue
        
        showToast('正在处理图片...')
        
        try {
          const base64 = await fileToBase64(file)
          const markdown = `![image](${base64})`
          
          const pos = editor.state.selection.main.head
          editor.dispatch({
            changes: { from: pos, insert: markdown },
            selection: { anchor: pos + markdown.length }
          })
          
          showToast('图片已插入')
        } catch (err) {
          showToast('图片处理失败', 'error')
        }
        
        return
      }
    }
  })
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 压缩图片（可选）
export async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = URL.createObjectURL(file)
  })
}
