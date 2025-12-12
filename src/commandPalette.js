import { openFile, saveFile, openFolder, refreshFileTree } from './fileManager.js'
import { togglePreview, toggleSideBySide } from './preview.js'
import { toggleFocusMode, toggleTypewriterMode } from './focusMode.js'
import { showTableEditor } from './tableEditor.js'
import { applyTheme } from './themes.js'
import { exportHTML, exportPDF, exportWord, exportMarkdown, showExportMenu } from './export.js'
import { toggleOutline } from './outline.js'
import { showMindmap } from './mindmap.js'
import { toggleSourceMode, insertCodeBlock, insertMathBlock, insertImage, insertLink, toggleQuote, insertHorizontalRule } from './editorActions.js'


export function showCommandPalette() {
    // Check if exists
    if (document.getElementById('commandPalette')) {
        document.getElementById('commandPalette').remove();
        return;
    }

    const palette = document.createElement('div')
    palette.id = 'commandPalette'
    palette.style.cssText = `
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    max-width: 90%;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    z-index: 2000;
    overflow: hidden;
    animation: slideUpFade 0.2s ease-out;
    display: flex;
    flex-direction: column;
  `

    const input = document.createElement('input')
    input.placeholder = '输入命令...'
    input.style.cssText = `
    width: 100%;
    padding: 16px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 16px;
    outline: none;
  `

    const resultsContainer = document.createElement('div')
    resultsContainer.style.cssText = `
    max-height: 400px;
    overflow-y: auto;
    padding: 8px 0;
  `

    palette.appendChild(input)
    palette.appendChild(resultsContainer)
    document.body.appendChild(palette)

    input.focus()

    // Commands Definition
    const commands = [
        { id: 'open', name: '打开文件 (Open File)', icon: '📂', action: () => window.openFile() },
        { id: 'folder', name: '打开文件夹 (Open Folder)', icon: '📁', action: () => openFolder() },
        { id: 'save', name: '保存文件 (Save)', icon: '💾', action: () => saveFile(window.currentFilePath, window.editor.state.doc.toString()) },
        { id: 'export-pdf', name: '导出 PDF (Export PDF)', icon: '📄', action: () => exportPDF() },
        { id: 'source-mode', name: '切换源代码模式 (Toggle Source Mode)', icon: '📝', action: () => toggleSourceMode() },

        { id: 'insert-code', name: '插入代码块 (Insert Code Block)', icon: '💻', action: () => insertCodeBlock() },
        { id: 'insert-image', name: '插入图片 (Insert Image)', icon: '🖼️', action: () => insertImage() },
        { id: 'insert-link', name: '插入链接 (Insert Link)', icon: '🔗', action: () => insertLink() },
        { id: 'insert-table', name: '插入表格 (Insert Table)', icon: '📊', action: () => showTableEditor() },
        { id: 'insert-math', name: '插入数学公式 (Insert Math)', icon: '∑', action: () => insertMathBlock() },
        { id: 'insert-quote', name: '插入引用 (Insert Quote)', icon: '❝', action: () => toggleQuote() },
        { id: 'insert-hr', name: '插入分割线 (Horizontal Rule)', icon: '➖', action: () => insertHorizontalRule() },

        { id: 'preview', name: '切换预览 (Toggle Preview)', icon: '👁️', action: () => togglePreview() },
        { id: 'side-by-side', name: '分屏模式 (Side by Side)', icon: '🌗', action: () => toggleSideBySide() },
        { id: 'focus', name: '专注模式 (Focus Mode)', icon: '🎯', action: () => toggleFocusMode() },
        { id: 'typewriter', name: '打字机模式 (Typewriter Mode)', icon: '⌨️', action: () => toggleTypewriterMode() },
        { id: 'theme-ocean', name: '主题: 深海 (Theme: Ocean)', icon: '🎨', action: () => applyTheme('ocean') },
        { id: 'theme-forest', name: '主题: 森林 (Theme: Forest)', icon: '🌲', action: () => applyTheme('forest') },
        { id: 'theme-dark', name: '主题: 暗黑 (Theme: Dark)', icon: '🌑', action: () => applyTheme('dark') },
        { id: 'theme-light', name: '主题: 明亮 (Theme: Light)', icon: '☀️', action: () => applyTheme('light') },
        { id: 'outline', name: '显示/隐藏大纲 (Toggle Outline)', icon: '📑', action: () => toggleOutline() },
        { id: 'mindmap', name: '查看思维导图 (View Mindmap)', icon: '🧠', action: () => showMindmap() }
    ]

    let selectedIndex = 0;

    function renderList(filterText = '') {
        resultsContainer.innerHTML = ''
        const filtered = commands.filter(cmd =>
            cmd.name.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filtered.length === 0) {
            selectedIndex = -1;
            const noResult = document.createElement('div');
            noResult.textContent = '无匹配命令';
            noResult.style.padding = '12px 16px';
            noResult.style.color = 'var(--text-tertiary)';
            resultsContainer.appendChild(noResult);
            return;
        }

        if (selectedIndex >= filtered.length) selectedIndex = 0;
        if (selectedIndex < 0) selectedIndex = 0;

        filtered.forEach((cmd, index) => {
            const item = document.createElement('div')
            item.className = 'command-item' // for cleanup hooks if needed
            item.style.cssText = `
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 14px;
            background: ${index === selectedIndex ? 'var(--bg-tertiary)' : 'transparent'};
          `
            if (index === selectedIndex) {
                item.style.color = 'var(--text-primary)';
            }

            item.innerHTML = `<span style="font-size: 16px;">${cmd.icon}</span><span>${cmd.name}</span>`

            item.onmouseenter = () => {
                selectedIndex = index;
                renderList(filterText); // Re-render to update highlights
            }
            item.onclick = () => {
                cmd.action();
                closePalette();
            }

            resultsContainer.appendChild(item)
        })
    }

    function closePalette() {
        palette.remove();
        document.removeEventListener('click', onClickOutside);
    }

    function onClickOutside(e) {
        if (!palette.contains(e.target)) {
            closePalette();
        }
    }

    renderList();

    // Events
    input.addEventListener('input', (e) => {
        renderList(e.target.value);
    })

    input.addEventListener('keydown', (e) => {
        const filtered = commands.filter(cmd =>
            cmd.name.toLowerCase().includes(input.value.toLowerCase())
        );

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex++;
            if (selectedIndex >= filtered.length) selectedIndex = 0;
            renderList(input.value);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex--;
            if (selectedIndex < 0) selectedIndex = filtered.length - 1;
            renderList(input.value);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[selectedIndex]) {
                filtered[selectedIndex].action();
                closePalette();
            }
        } else if (e.key === 'Escape') {
            closePalette();
        }
    })

    setTimeout(() => document.addEventListener('click', onClickOutside), 100);
}
