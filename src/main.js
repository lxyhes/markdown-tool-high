import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { searchKeymap } from '@codemirror/search'
import { saveFile, openFile, openFolder } from './fileManager.js'
import { updatePreview, togglePreview, toggleSideBySide, batchUpdate } from './preview.js'
import { updateStatusBar } from './statusBar.js'
import { showToast } from './utils.js'
import { setupPasteHandler, setupDragDropHandler } from './imageManager.js'
import { parseOutline, renderOutline, updateActiveHeading, createOutlineContainer, toggleOutline } from './outline.js'
import { initFocusMode, toggleFocusMode, toggleTypewriterMode } from './focusMode.js'
import { showExportMenu } from './export.js'
import { initTheme } from './themes.js'
import { initTableEditor } from './tableEditor.js'

let editor = null
let currentFilePath = null
let isPreviewVisible = false
let isSideBySide = false
let autoSaveInterval = null

// 初始化编辑器
function initEditor() {
  const initialContent = `# MarkFlow - 高性能 Markdown 编辑器

欢迎使用 MarkFlow！这是一个基于 Tauri + CodeMirror 6 的高性能 Markdown 编辑器。

## 功能特点

- 🚀 **高性能**：基于 Tauri，启动快，内存占用低
- 📝 **实时预览**：支持所见即所得的编辑体验
- 🎨 **精美主题**：深色主题，护眼舒适
- 📁 **文件管理**：侧边栏文件树，快速切换
- 🔍 **全文搜索**：支持正则表达式搜索
- ⌨️ **快捷键**：丰富的键盘快捷键支持

## 快捷键

- \`Ctrl/Cmd + S\`：保存文件
- \`Ctrl/Cmd + O\`：打开文件
- \`Ctrl/Cmd + Shift + O\`：打开文件夹
- \`Ctrl/Cmd + P\`：切换预览
- \`Ctrl/Cmd + B\`：粗体
- \`Ctrl/Cmd + I\`：斜体
- \`Ctrl/Cmd + K\`：链接

## 开始使用

开始编写你的 Markdown 文档吧！
`

  const state = EditorState.create({
    doc: initialContent,
    extensions: [
      basicSetup,
      markdown(),
      oneDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          // 使用批量更新优化性能
          batchUpdate(update.state.doc.toString())
          updateStatusBar(update.state.doc, update.state.selection)

          // 更新大纲
          const content = update.state.doc.toString()
          const headings = parseOutline(content)
          renderOutline(headings)

          // 更新当前标题高亮
          const currentLine = update.state.doc.lineAt(update.state.selection.main.head).number
          updateActiveHeading(headings, currentLine)
        }
      }),
      keymap.of([
        {
          key: "Ctrl-s",
          run: () => {
            saveFile(currentFilePath, editor.state.doc.toString())
            return true
          }
        },
        {
          key: "Ctrl-o",
          run: () => {
            openFile().then(content => {
              if (content && content.path && content.content !== undefined) {
                currentFilePath = content.path
                editor.dispatch({
                  changes: {
                    from: 0,
                    to: editor.state.doc.length,
                    insert: content.content
                  }
                })
                updatePreview(content.content)
                updateFilePathDisplay(content.path)
              }
            })
            return true
          }
        },
        {
          key: "Ctrl-Shift-o",
          run: () => {
            openFolder()
            return true
          }
        },
        {
          key: "Ctrl-p",
          run: () => {
            togglePreviewMode()
            return true
          }
        },
        ...searchKeymap
      ])
    ]
  })

  editor = new EditorView({
    state,
    parent: document.getElementById('editor')
  })

  // 初始化预览
  updatePreview(initialContent)
  updateStatusBar(editor.state.doc, editor.state.selection)

  // 初始化大纲
  renderOutline(parseOutline(initialContent))

  // 设置图片处理
  setupPasteHandler(editor)
  setupDragDropHandler(editor)

  // 启动自动保存
  startAutoSave()
}

// 切换预览模式
function togglePreviewMode() {
  isPreviewVisible = !isPreviewVisible
  const previewPane = document.getElementById('previewPane')
  const editorPane = document.getElementById('editorPane')
  const button = document.getElementById('previewToggle')

  if (isPreviewVisible) {
    previewPane.classList.remove('hidden')
    editorPane.classList.add('hidden')
    button.textContent = '编辑'
  } else {
    previewPane.classList.add('hidden')
    editorPane.classList.remove('hidden')
    button.textContent = '预览'
  }
}

// 更新文件路径显示
function updateFilePathDisplay(path) {
  document.getElementById('filePath').textContent = path || '未命名.md'
}

// 新建文件
function newFile() {
  currentFilePath = null
  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: ''
    }
  })
  updateFilePathDisplay('未命名.md')
  updatePreview('')
}

// 保存文件
function saveFileHandler() {
  const content = editor.state.doc.toString()
  saveFile(currentFilePath, content).then(path => {
    if (path) {
      currentFilePath = path
      updateFilePathDisplay(path)
      showToast('文件保存成功')
    }
  }).catch(err => {
    console.error('保存失败:', err)
    showToast('文件保存失败', 'error')
  })
}

// 导出 PDF
function exportPDFHandler() {
  if (!editor) return

  const content = editor.state.doc.toString()
  const title = currentFilePath ? currentFilePath.split(/[/\\]/).pop().replace(/\.[^/.]+$/, '') : 'Document'

  showExportMenu(content, title)
}

// 自动保存功能
function startAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
  }
  autoSaveInterval = setInterval(() => {
    if (currentFilePath && editor) {
      const content = editor.state.doc.toString()
      // 静默保存，不提示
      saveFile(currentFilePath, content).catch(err => {
        console.error('自动保存失败:', err)
        // 只在控制台记录，不显示错误提示
      })
    }
  }, 30000) // 30秒自动保存一次
}

// 停止自动保存
function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
    autoSaveInterval = null
  }
}

// 初始化应用
window.addEventListener('DOMContentLoaded', () => {
  initEditor()

  // 绑定全局函数
  window.newFile = newFile
  window.saveFile = saveFileHandler
  window.togglePreview = togglePreviewMode
  window.toggleSideBySide = () => {
    isSideBySide = !isSideBySide
    const editorContainer = document.querySelector('.editor-container')
    const previewPane = document.getElementById('previewPane')
    const editorPane = document.getElementById('editorPane')
    const button = document.getElementById('sideBySideToggle')

    if (isSideBySide) {
      editorContainer.style.flexDirection = 'row'
      editorPane.classList.remove('hidden')
      previewPane.classList.remove('hidden')
      previewPane.classList.add('preview-pane')
      editorPane.style.flex = '1'
      previewPane.style.flex = '1'
      button.textContent = '单屏'
      isPreviewVisible = false
      document.getElementById('previewToggle').textContent = '预览'
    } else {
      editorPane.classList.remove('hidden')
      previewPane.classList.add('hidden')
      button.textContent = '分屏'
    }
  }
  window.exportPDF = exportPDFHandler
  window.openFolder = openFolder
  window.toggleOutline = toggleOutline

  // 创建大纲容器
  createOutlineContainer()

  // 初始化专注模式
  initFocusMode()

  // 初始化主题
  initTheme()

  // 初始化表格编辑器
  initTableEditor()

  // 添加拖拽支持
  setupDragAndDrop()
})

// 拖拽文件支持
function setupDragAndDrop() {
  const editorContainer = document.querySelector('.editor-container')

  editorContainer.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
    editorContainer.style.border = '2px dashed #007acc'
  })

  editorContainer.addEventListener('dragleave', (e) => {
    e.preventDefault()
    e.stopPropagation()
    editorContainer.style.border = 'none'
  })

  editorContainer.addEventListener('drop', async (e) => {
    e.preventDefault()
    e.stopPropagation()
    editorContainer.style.border = 'none'

    const files = Array.from(e.dataTransfer.files)
    const mdFile = files.find(file => file.name.endsWith('.md'))

    if (mdFile) {
      try {
        const content = await mdFile.text()
        currentFilePath = mdFile.path

        editor.dispatch({
          changes: {
            from: 0,
            to: editor.state.doc.length,
            insert: content
          }
        })

        updatePreview(content)
        updateFilePathDisplay(mdFile.path)
      } catch (error) {
        console.error('读取文件失败:', error)
        showToast('读取文件失败: ' + error.message)
      }
    } else {
      showToast('请拖入 Markdown 文件（.md）')
    }
  })
}