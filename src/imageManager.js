import { invoke } from '@tauri-apps/api/tauri'
import { showToast } from './utils.js'

// 处理粘贴事件
export function setupPasteHandler(editor) {
  editor.contentDOM.addEventListener('paste', async (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        e.preventDefault()

        const file = item.getAsFile()
        if (file) {
          await handleImageFile(file, editor)
        }
      }
    }
  })
}

// 处理拖拽图片
export function setupDragDropHandler(editor) {
  editor.contentDOM.addEventListener('dragover', (e) => {
    if (Array.from(e.dataTransfer.items).some(item => item.type.startsWith('image/'))) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  })

  editor.contentDOM.addEventListener('drop', async (e) => {
    e.preventDefault()

    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await handleImageFile(file, editor)
      }
    }
  })
}

// 处理图片文件
async function handleImageFile(file, editor) {
  try {
    showToast('正在处理图片...')

    // Check Tauri environment
    if (window.__TAURI_IPC__) {
      // 生成文件名
      const timestamp = new Date().getTime()
      const ext = file.name.split('.').pop() || 'png'
      const fileName = `image_${timestamp}.${ext}`

      // 读取文件数据
      const arrayBuffer = await file.arrayBuffer()
      const imageData = Array.from(new Uint8Array(arrayBuffer))

      // 保存图片
      // Assumes invoke('save_image') is implemented in backend to save to app_data or relative path
      const imagePath = await invoke('save_image', {
        image_data: imageData,
        file_name: fileName,
        save_path: null
      })

      // Convert local absolute path to asset URL if needed (handled by markdown-it image rule we added)
      // or ensure backend returns a usable path.

      insertAtCursor(editor, `![${file.name}](${imagePath})`)
      showToast('图片已保存并插入')
    } else {
      // Browser Mode: Use Base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result
        insertAtCursor(editor, `![${file.name}](${base64})`)
        showToast('浏览器模式: 已插入 Base64 图片')
      }
      reader.readAsDataURL(file)
    }
  } catch (error) {
    console.error('图片处理失败:', error)
    showToast('图片插入失败: ' + error.message, 'error')
  }
}

function insertAtCursor(editor, text) {
  const cursor = editor.state.selection.main.head
  editor.dispatch({
    changes: {
      from: cursor,
      insert: text
    },
    selection: { anchor: cursor + text.length }
  })
  editor.focus()
}

// 图片上传服务（可选）
export async function uploadImageToService(imageFile, service = 'imgur') {
  // 这里可以实现上传到图床服务的功能
  // 比如 Imgur、SM.MS、GitHub 等

  const formData = new FormData()
  formData.append('image', imageFile)

  try {
    let response

    switch (service) {
      case 'imgur':
        // 需要 Imgur API key
        response = await fetch('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            'Authorization': 'Client-ID YOUR_CLIENT_ID'
          },
          body: formData
        })
        break

      case 'smms':
        response = await fetch('https://sm.ms/api/v2/upload', {
          method: 'POST',
          body: formData
        })
        break

      default:
        throw new Error('不支持的上传服务')
    }

    if (response.ok) {
      const data = await response.json()
      return data.data?.link || data.data?.url
    } else {
      throw new Error('上传失败')
    }
  } catch (error) {
    console.error('上传到图床失败:', error)
    throw error
  }
}