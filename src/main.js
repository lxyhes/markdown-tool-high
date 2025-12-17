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
import { showExportMenu } from './export.js'
import { initTheme } from './themes.js'
import { initTableEditor, showTableEditor } from './tableEditor.js'
import { headerPlugin, editorEnhancementsTheme } from './editorEnhancements.js'
import { showCommandPalette } from './commandPalette.js'
import {
  toggleSourceMode,
  insertCodeBlock,
  insertMathBlock,
  insertImage,
  insertLink,
  toggleBold,
  toggleItalic,
  toggleQuote,
  insertHorizontalRule
} from './editorActions.js'
import { slashCommandExtension } from './slashCommands.js'
import { livePreviewExtension } from './livePreview.js'
import {
  typewriterState,
  typewriterScrollPlugin,
  toggleTypewriter
} from './viewModes.js'
import { initAIAssistant, showAIAssistant } from './aiAssistant.js'
import { TabManager } from './tabManager.js'
import { wysiwygPlugin } from './wysiwyg.js'
import { initGitPanel } from './gitPanel.js'
// 新增功能模块
import { showRecentFilesPanel, addRecentFile } from './recentFiles.js'
import { showEmojiPicker } from './emojiPicker.js'
import { showTemplateSelector } from './templates.js'
import { showShortcutsPanel } from './shortcuts.js'
import { showStatsPanel } from './wordStats.js'
import { checkRecovery, startAutoRecover, clearRecoveryData } from './autoRecover.js'
import { showGlobalSearch, showGoToLine } from './globalSearch.js'
import { showBookmarksPanel, toggleBookmark, nextBookmark, prevBookmark, loadBookmarks } from './bookmarks.js'
import { setupSmartPaste } from './smartPaste.js'
import { toggleReadingMode } from './readingMode.js'
import { showPomodoro } from './pomodoro.js'
import { showClipboardHistory, setupClipboardListener } from './clipboardHistory.js'
import { toggleZenMode } from './zenMode.js'
import { showWritingGoal, initWritingGoal, updateWrittenCount } from './writingGoal.js'
import { applyFormat, formatSelection } from './formatMarkdown.js'
import { toggleLineNumbers } from './lineNumbers.js'
import { showTOCGenerator } from './tocGenerator.js'
import { setupImagePaste } from './imagePaste.js'
import { setupLinkPreview } from './linkPreview.js'
import { initPrintStyles, printDocument } from './printStyles.js'
import { duplicateLine, deleteLine, moveLineUp, moveLineDown, selectLine } from './duplicateLine.js'
import { showTransformMenu } from './textTransform.js'
import { showSnippetsPanel, insertSnippet, getSnippets } from './snippets.js'

let editor = null
let tabManager = null
let isPreviewVisible = false
let isSideBySide = false
let autoSaveInterval = null
let typewriterEnabled = false
let focusModeEnabled = false
// WYSIWYG State (Compartment ideally, but for now fixed plugin)
// To make it toggleable, we should put it in a Compartment like typewriter.
// But user requested "like Typora", usually implies always on or mode switch.
// Let's add it to extensions directly first.

// 获取基础插件配置
function getEditorExtensions() {
  return [
    basicSetup,
    markdown(),
    dynamicTheme,
    dynamicHighlighter,
    headerPlugin,
    editorEnhancementsTheme,
    slashCommandExtension,
    livePreviewExtension,
    wysiwygPlugin, // Enable WYSIWYG by default
    typewriterState,
    typewriterScrollPlugin,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        batchUpdate(update.state.doc.toString())
        updateStatusBar(update.state.doc, update.state.selection)
        
        // 更新写作目标字数
        const wordCount = update.state.doc.toString().replace(/\s/g, '').length
        updateWrittenCount(wordCount)
        
        // Notify Tab Manager of changes
        if (tabManager) tabManager.setDirty(true);

        const content = update.state.doc.toString()
        const headings = parseOutline(content)
        renderOutline(headings)

        const currentLine = update.state.doc.lineAt(update.state.selection.main.head).number
        updateActiveHeading(headings, currentLine)
      }
    }),
    keymap.of([
      { key: "Ctrl-s", run: () => { saveFileHandler(); return true } },
      { key: "Ctrl-o", run: () => { window.openFile(); return true } }, // Use window wrapper
      { key: "Ctrl-Shift-o", run: () => { openFolder(); return true } },
      { key: "Ctrl-p", run: () => { togglePreviewMode(); return true } },
      { key: "Ctrl-Shift-p", run: () => { showCommandPalette(); return true } },
      { key: "Ctrl-Shift-k", run: () => { insertCodeBlock(); return true } },
      { key: "Ctrl-Shift-m", run: () => { insertMathBlock(); return true } },
      { key: "Ctrl-Shift-i", run: () => { insertImage(); return true } },
      { key: "Ctrl-k", run: () => { insertLink(); return true } },
      { key: "Ctrl-b", run: () => { toggleBold(); return true } },
      { key: "Ctrl-i", run: () => { toggleItalic(); return true } },
      { key: "Ctrl-Shift-q", run: () => { toggleQuote(); return true } },
      ...searchKeymap
    ])
  ]
}

// 初始化编辑器
function initEditor() {
  const initialContent = `# MarkFlow - 高性能 Markdown 编辑器

欢迎使用 MarkFlow！这是一个基于 Tauri + CodeMirror 6 的高性能 Markdown 编辑器。

## 功能特点

- 🚀 **高性能**：基于 Tauri，启动快，内存占用低
- 📑 **多标签页**：支持同时打开多个文件
- 🎨 **精美主题**：深色主题，护眼舒适
- 🤖 **AI 助手**：集成智能写作辅助
`

  // Create initial state
  const state = EditorState.create({
    doc: initialContent,
    extensions: getEditorExtensions()
  })

  editor = new EditorView({
    state,
    parent: document.getElementById('editor')
  })
  
  // Initialize AI
  initAIAssistant(editor)

  // Initialize Tab Manager
  tabManager = new TabManager(editor, {
    // Factory for creating new EditorState when opening a new tab
    createNewState: (content) => {
      return EditorState.create({
        doc: content,
        extensions: getEditorExtensions()
      });
    },
    // Callback when tab switches
    onTabSwitched: (tab) => {
       updateFilePathDisplay(tab.path);
       updatePreview(tab.content);
       // Re-sync AI assistant editor reference if needed (View stays same, State changes)
       // Since EditorView instance is persistent, AI assistant should be fine.
       // Sync Typewriter/Focus mode? They persist on View, but extensions are in State.
       // Since new State re-adds extensions, we might need to re-sync toggle buttons.
       const typewriterBtn = document.getElementById('typewriterModeBtn');
       if (typewriterBtn && typewriterBtn.classList.contains('active') !== typewriterEnabled) {
          // Sync UI to internal state? Or reset internal state?
          // Simplest: Reset or persist global toggle.
          // Global toggle `typewriterEnabled` is true, but new state starts with default false.
          // We should re-apply global settings.
          if (typewriterEnabled) toggleTypewriter(editor, true);
       }
    }
  });
  
  // Register the initial content as the first tab
  tabManager.openTab({ path: null, content: initialContent, name: '欢迎.md' });

  setupPasteHandler(editor)
  setupDragDropHandler(editor)
  setupSmartPaste(editor) // 智能粘贴
  setupImagePaste(editor) // 截图粘贴
  setupLinkPreview(editor) // 链接预览
  startAutoSave()
}

// ... UI Functions ...

function togglePreviewMode() {
  isPreviewVisible = !isPreviewVisible
  const previewPane = document.getElementById('previewPane')
  const editorPane = document.getElementById('editorPane')
  const button = document.getElementById('previewToggle')
  const sideBySideButton = document.getElementById('sideBySideToggle')

  document.querySelectorAll('.toolbar-button').forEach(btn => btn.classList.remove('active'))
  const setLabel = (btn, text) => { if(btn && btn.querySelector('.label')) btn.querySelector('.label').textContent = text }

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
  const setLabel = (btn, text) => { if(btn && btn.querySelector('.label')) btn.querySelector('.label').textContent = text }

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

// --- Modified Actions using TabManager ---

function newFile() {
  if (tabManager) tabManager.newTab('md');
}

function newDrawing() {
  if (tabManager) tabManager.newTab('draw');
}

function saveFileHandler() {
  if (!editor || !tabManager) return;
  const currentTab = tabManager.getCurrentTab();
  const content = editor.state.doc.toString();
  
  saveFile(currentTab.path, content).then(path => {
    if (path) {
      tabManager.updateCurrentTab(path);
      updateFilePathDisplay(path);
      showToast('文件保存成功');
    }
  }).catch(err => {
    console.error('保存失败:', err);
    showToast('文件保存失败', 'error');
  });
}

function exportPDFHandler() {
  if (!editor || !tabManager) return
  const currentTab = tabManager.getCurrentTab();
  const content = editor.state.doc.toString()
  const title = currentTab.path ? currentTab.path.split(/[/\]/).pop().replace(/\.[^/.]+$/, '') : 'Document'
  showExportMenu(content, title)
}

function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval)
  autoSaveInterval = setInterval(() => {
    if (tabManager) {
        const tab = tabManager.getCurrentTab();
        if (tab && tab.path && tab.isDirty) {
             const content = editor.state.doc.toString();
             saveFile(tab.path, content).then(() => {
                 tabManager.setDirty(false); // Auto-save clears dirty
             }).catch(err => { });
        }
    }
  }, 30000)
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
    autoSaveInterval = null
  }
}

// 拖拽文件支持 (Revised for Tabs)
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
    
    // Open all dropped markdown files as tabs
    for (const file of files) {
        if (file.name.endsWith('.md')) {
            try {
                const content = await file.text();
                // Pass path if available (electron/tauri), else null
                const path = file.path || null;
                tabManager.openTab({ path, content, name: file.name });
            } catch (error) {
                showToast('读取文件失败: ' + error.message);
            }
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
  window.newDrawing = newDrawing
  window.saveFile = saveFileHandler
  
  // Revised Open File (Using Tabs)
  window.openFile = () => {
    openFile().then(content => {
      if (content && content.path && content.content !== undefined) {
        tabManager.openTab(content);
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
  window.showAIAssistant = showAIAssistant

  window.toggleTypewriterMode = () => {
    if (!editor) return;
    typewriterEnabled = !typewriterEnabled;
    toggleTypewriter(editor, typewriterEnabled);
    const btn = document.getElementById('typewriterModeBtn');
    if (btn) btn.classList.toggle('active', typewriterEnabled);
  };

  window.toggleFocusMode = () => {
    if (!editor) return;
    focusModeEnabled = !focusModeEnabled;
    if (focusModeEnabled) {
      editor.dom.classList.add('focus-mode');
    } else {
      editor.dom.classList.remove('focus-mode');
    }
    const btn = document.getElementById('focusModeBtn');
    if (btn) btn.classList.toggle('active', focusModeEnabled);
  };

  // Insert Actions
  window.insertCodeBlock = insertCodeBlock
  window.insertMathBlock = insertMathBlock
  window.insertImage = insertImage
  window.insertLink = insertLink
  window.showTableEditor = showTableEditor
  window.toggleQuote = toggleQuote
  window.insertHorizontalRule = insertHorizontalRule
  window.toggleBold = toggleBold
  window.toggleItalic = toggleItalic

  window.toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar')
    sidebar.classList.toggle('collapsed')
  }

  // 新增功能暴露到全局
  window.showRecentFiles = showRecentFilesPanel
  window.showEmojiPicker = () => showEmojiPicker(editor)
  window.showTemplates = () => {
    showTemplateSelector((content) => {
      if (tabManager) {
        tabManager.newTab('md')
        // 设置内容
        setTimeout(() => {
          if (editor && content) {
            editor.dispatch({
              changes: { from: 0, to: editor.state.doc.length, insert: content }
            })
          }
        }, 50)
      }
    })
  }
  window.showShortcuts = showShortcutsPanel
  window.showStats = () => {
    if (editor) {
      showStatsPanel(editor.state.doc.toString())
    }
  }
  
  // 搜索和书签
  window.showSearch = () => showGlobalSearch(editor)
  window.showGoToLine = () => showGoToLine(editor)
  window.showBookmarks = () => showBookmarksPanel(editor)
  window.toggleBookmark = () => toggleBookmark(editor)
  
  // 新增模式
  window.toggleReadingMode = () => toggleReadingMode(editor)
  window.toggleZenMode = () => toggleZenMode(editor)
  window.showPomodoro = showPomodoro
  window.showClipboardHistory = () => showClipboardHistory(editor)
  
  // 新增工具
  window.showWritingGoal = showWritingGoal
  window.formatDocument = () => applyFormat(editor)
  window.formatSelection = () => formatSelection(editor)
  window.toggleLineNumbers = toggleLineNumbers
  window.showTOCGenerator = () => showTOCGenerator(editor)
  window.printDocument = printDocument
  
  // 行操作
  window.duplicateLine = () => duplicateLine(editor)
  window.deleteLine = () => deleteLine(editor)
  window.moveLineUp = () => moveLineUp(editor)
  window.moveLineDown = () => moveLineDown(editor)
  window.selectLine = () => selectLine(editor)
  
  // 文本转换和代码片段
  window.showTransformMenu = () => showTransformMenu(editor)
  window.showSnippets = () => showSnippetsPanel(editor)
  
  // 通过路径打开文件 (供最近文件使用)
  window.openFileByPath = async (filePath) => {
    try {
      const { readTextFile } = await import('@tauri-apps/api/fs')
      const content = await readTextFile(filePath)
      const name = filePath.split(/[/\\]/).pop()
      tabManager.openTab({ path: filePath, content, name })
      addRecentFile(filePath, name)
    } catch (err) {
      showToast('打开文件失败: ' + err.message, 'error')
    }
  }

  // 全局快捷键
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+P - 命令面板
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      showCommandPalette();
    }
    // Ctrl+. - Emoji 选择器
    if ((e.ctrlKey || e.metaKey) && e.key === '.') {
      e.preventDefault();
      showEmojiPicker(editor);
    }
    // Ctrl+Shift+R - 最近文件
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      showRecentFilesPanel();
    }
    // F1 - 快捷键帮助
    if (e.key === 'F1') {
      e.preventDefault();
      showShortcutsPanel();
    }
    // Ctrl+N - 新建文件 (带模板选择)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
      e.preventDefault();
      window.showTemplates();
    }
    // Ctrl+F - 搜索
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && !e.shiftKey) {
      e.preventDefault();
      showGlobalSearch(editor);
    }
    // Ctrl+G - 跳转到行
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      showGoToLine(editor);
    }
    // Ctrl+M - 切换书签
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm' && !e.shiftKey) {
      e.preventDefault();
      toggleBookmark(editor);
    }
    // Ctrl+Shift+M - 书签面板
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      showBookmarksPanel(editor);
    }
    // F2 - 下一个书签
    if (e.key === 'F2' && !e.shiftKey) {
      e.preventDefault();
      nextBookmark(editor);
    }
    // Shift+F2 - 上一个书签
    if (e.key === 'F2' && e.shiftKey) {
      e.preventDefault();
      prevBookmark(editor);
    }
    // Ctrl+Alt+R - 阅读模式
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      toggleReadingMode(editor);
    }
    // Ctrl+Alt+Z - 禅模式
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      toggleZenMode(editor);
    }
    // Ctrl+Shift+V - 剪贴板历史
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      showClipboardHistory(editor);
    }
    // Ctrl+Shift+D - 复制当前行
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      duplicateLine(editor);
    }
    // Ctrl+Shift+K - 删除当前行
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      deleteLine(editor);
    }
    // Alt+Up - 向上移动行
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      moveLineUp(editor);
    }
    // Alt+Down - 向下移动行
    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      moveLineDown(editor);
    }
    // Ctrl+L - 选择当前行
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      selectLine(editor);
    }
    // Ctrl+T - 文本转换菜单
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      showTransformMenu(editor);
    }
    // Ctrl+Shift+S - 代码片段 (注意：不覆盖 Ctrl+S 保存)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      showSnippetsPanel(editor);
    }
    // Ctrl+P (无Shift) - 打印
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && !e.shiftKey) {
      // 不阻止默认行为，让浏览器打印
    }
  });

  createOutlineContainer()
  initTheme()
  initTableEditor()
  initGitPanel()
  setupClipboardListener() // 剪贴板历史监听
  initWritingGoal() // 写作目标初始化
  initPrintStyles() // 打印样式
  
  // 自动恢复检查
  setTimeout(() => {
    checkRecovery((content) => {
      if (tabManager && content) {
        tabManager.newTab('md')
        setTimeout(() => {
          if (editor) {
            editor.dispatch({
              changes: { from: 0, to: editor.state.doc.length, insert: content }
            })
          }
        }, 50)
      }
    })
  }, 1000)
  
  // 启动自动恢复保存
  startAutoRecover(() => editor ? editor.state.doc.toString() : null)
  
  // 保存成功后清除恢复数据
  window.addEventListener('file-saved', () => clearRecoveryData())
})
