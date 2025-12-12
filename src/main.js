import { EditorState } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { dynamicTheme, dynamicHighlighter } from './dynamicTheme.js'
import { keymap } from '@codemirror/view'
import { searchKeymap } from '@codemirror/search'
import { EditorView } from '@codemirror/view'
import { saveFile, openFile, openFolder, refreshFileTree } from './fileManager.js'
import { updatePreview, togglePreview, toggleSideBySide, batchUpdate } from './preview.js'
import { updateStatusBar } from './statusBar.js'
import { showToast } from './utils.js'
import { setupPasteHandler, setupDragDropHandler } from './imageManager.js'
import { parseOutline, renderOutline, updateActiveHeading, createOutlineContainer, toggleOutline } from './outline.js'
import { initFocusMode, toggleFocusMode, toggleTypewriterMode } from './focusMode.js'
import { showExportMenu } from './export.js'
import { initTheme } from './themes.js'
import { initTableEditor } from './tableEditor.js'
import { headerPlugin, editorEnhancementsTheme } from './editorEnhancements.js'
import { showCommandPalette } from './commandPalette.js'
import { toggleSourceMode } from './editorActions.js' // New Import

let editor = null
let currentFilePath = null
let isPreviewVisible = false
let isSideBySide = false
// isSourceMode moved to editorActions
let autoSaveInterval = null

// 初始化编辑器
function initEditor() {
  // ... (content same as before)
  // ...
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
      dynamicTheme,
      dynamicHighlighter,
      headerPlugin,
      editorEnhancementsTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          batchUpdate(update.state.doc.toString())
          updateStatusBar(update.state.doc, update.state.selection)

          const content = update.state.doc.toString()
          const headings = parseOutline(content)
          renderOutline(headings)

          const currentLine = update.state.doc.lineAt(update.state.selection.main.head).number
          updateActiveHeading(headings, currentLine)
        }
      }),
      keymap.of([
        {
          key: "Ctrl-s",
          run: () => {
            saveFileHandler()
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

  updatePreview(initialContent)
  updateStatusBar(editor.state.doc, editor.state.selection)
  renderOutline(parseOutline(initialContent))

  // Handlers setup handled globally now? 
  // No, image manager needs editor instance
  setupPasteHandler(editor)
  setupDragDropHandler(editor)
  startAutoSave()
}



function togglePreviewMode() {
  isPreviewVisible = !isPreviewVisible
  const previewPane = document.getElementById('previewPane')
  const editorPane = document.getElementById('editorPane')
  const button = document.getElementById('previewToggle')
  const sideBySideButton = document.getElementById('sideBySideToggle')

  document.querySelectorAll('.toolbar-button').forEach(btn => btn.classList.remove('active'))

  const setLabel = (btn, text) => {
    const label = btn.querySelector('.label')
    if (label) label.textContent = text
  }

  if (isPreviewVisible) {
    previewPane.classList.remove('hidden')
    editorPane.classList.add('hidden')
    setLabel(button, '编辑')
    button.classList.add('active')
    isSideBySide = false
    setLabel(sideBySideButton, '分屏')
  } else {
    previewPane.classList.add('hidden')
    editorPane.classList.remove('hidden')
    setLabel(button, '预览')
  }
}

function toggleSideBySideMode() {
  isSideBySide = !isSideBySide
  const editorContainer = document.querySelector('.editor-container')
  const previewPane = document.getElementById('previewPane')
  const editorPane = document.getElementById('editorPane')
  const button = document.getElementById('sideBySideToggle')
  const previewButton = document.getElementById('previewToggle')

  document.querySelectorAll('.toolbar-button').forEach(btn => btn.classList.remove('active'))

  const setLabel = (btn, text) => {
    const label = btn.querySelector('.label')
    if (label) label.textContent = text
  }

  if (isSideBySide) {
    editorContainer.style.flexDirection = 'row'
    editorPane.classList.remove('hidden')
    previewPane.classList.remove('hidden')
    previewPane.classList.add('preview-pane')
    editorPane.style.flex = '1'
    previewPane.style.flex = '1'

    setLabel(button, '单屏')
    button.classList.add('active')

    isPreviewVisible = false
    setLabel(previewButton, '预览')
  } else {
    editorPane.classList.remove('hidden')
    previewPane.classList.add('hidden')
    setLabel(button, '分屏')
  }
}

function updateFilePathDisplay(path) {
  document.getElementById('filePath').textContent = path || '未命名.md'
}

function newFile() {
  currentFilePath = null
  if (editor) {
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: '' }
    })
  }
  updateFilePathDisplay('未命名.md')
  updatePreview('')
}

function saveFileHandler() {
  if (!editor) return;
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

function exportPDFHandler() {
  if (!editor) return
  const content = editor.state.doc.toString()
  const title = currentFilePath ? currentFilePath.split(/[/\\]/).pop().replace(/\.[^/.]+$/, '') : 'Document'
  showExportMenu(content, title)
}

function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval)
  autoSaveInterval = setInterval(() => {
    if (currentFilePath && editor) {
      const content = editor.state.doc.toString()
      saveFile(currentFilePath, content).catch(err => { })
    }
  }, 30000)
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
    autoSaveInterval = null
  }
}

// 拖拽文件支持
function setupDragAndDrop() {
  const editorContainer = document.querySelector('.editor-container')
  editorContainer.addEventListener('dragover', (e) => {
    e.preventDefault(); e.stopPropagation();
    editorContainer.style.border = '2px dashed #007acc'
  })
  editorContainer.addEventListener('dragleave', (e) => {
    e.preventDefault(); e.stopPropagation();
    editorContainer.style.border = 'none'
  })
  editorContainer.addEventListener('drop', async (e) => {
    e.preventDefault(); e.stopPropagation();
    editorContainer.style.border = 'none'
    const files = Array.from(e.dataTransfer.files)
    const mdFile = files.find(file => file.name.endsWith('.md'))
    if (mdFile) {
      try {
        // In browser mock, we might not get path or full content same way but file object has text()
        const content = await mdFile.text()
        // If in Tauri, we might need path.
        // Assuming browser env for now or hybrid
        currentFilePath = mdFile.path || null
        editor.dispatch({
          changes: { from: 0, to: editor.state.doc.length, insert: content }
        })
        updatePreview(content)
        updateFilePathDisplay(mdFile.name)
      } catch (error) {
        showToast('读取文件失败: ' + error.message)
      }
    }
  })
}

// 统一初始化
window.addEventListener('DOMContentLoaded', () => {
  initEditor()

  // Expose globals
  window.editor = editor
  window.newFile = newFile
  window.saveFile = saveFileHandler
  window.openFile = () => { // Wrap to handle async properly if needed or just alias
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
  }
  window.refreshFileTree = refreshFileTree
  window.togglePreview = togglePreviewMode
  window.toggleSideBySide = toggleSideBySideMode
  window.showCommandPalette = showCommandPalette
  window.exportPDF = exportPDFHandler
  window.openFolder = openFolder
  window.toggleOutline = toggleOutline
  window.toggleSourceMode = toggleSourceMode

  window.toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar')
    sidebar.classList.toggle('collapsed')
  }

  // Event Listeners
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      showCommandPalette();
    }
  });

  createOutlineContainer()
  initFocusMode()
  initTheme()
  initTableEditor()
  setupDragAndDrop() // Use the local function
})