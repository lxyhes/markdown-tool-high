// 主题配置
const themes = {
  dark: {
    name: '深色主题',
    colors: {
      background: '#1e1e1e',
      sidebar: '#252526',
      editor: '#1e1e1e',
      text: '#d4d4d4',
      accent: '#007acc',
      border: '#3e3e42',
      hover: '#2a2d2e',
      active: '#37373d'
    }
  },
  light: {
    name: '浅色主题',
    colors: {
      background: '#ffffff',
      sidebar: '#f7f7f7',
      editor: '#ffffff',
      text: '#333333',
      accent: '#0066cc',
      border: '#e0e0e0',
      hover: '#f0f0f0',
      active: '#e6f3ff'
    }
  },
  github: {
    name: 'GitHub',
    colors: {
      background: '#ffffff',
      sidebar: '#f6f8fa',
      editor: '#ffffff',
      text: '#24292e',
      accent: '#0366d6',
      border: '#e1e4e8',
      hover: '#f1f3f4',
      active: '#e7f3ff'
    }
  },
  night: {
    name: '夜间模式',
    colors: {
      background: '#0d1117',
      sidebar: '#161b22',
      editor: '#0d1117',
      text: '#c9d1d9',
      accent: '#58a6ff',
      border: '#30363d',
      hover: '#21262d',
      active: '#1f2937'
    }
  }
}

let currentTheme = 'dark'

// 应用主题
export function applyTheme(themeName) {
  if (!themes[themeName]) return

  const theme = themes[themeName]
  const root = document.documentElement

  // 设置 CSS 变量
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value)
  })

  // 更新 CodeMirror 主题
  if (window.editor) {
    // 保存当前内容和光标位置
    const content = window.editor.state.doc.toString()
    const cursor = window.editor.state.selection.main.head

    // 销毁并重新创建编辑器
    window.editor.destroy()

    // 重新初始化编辑器
    setTimeout(() => {
      initEditor()
      // 恢复内容
      window.editor.dispatch({
        changes: {
          from: 0,
          to: window.editor.state.doc.length,
          insert: content
        },
        selection: { anchor: cursor }
      })
    }, 100)
  }

  currentTheme = themeName
  showToast(`已切换到 ${theme.name}`)
}

// 创建主题切换器
export function createThemeSwitcher() {
  const themeSwitcher = document.createElement('div')
  themeSwitcher.id = 'themeSwitcher'
  themeSwitcher.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: var(--color-sidebar);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1000;
  `

  // 创建主题按钮
  Object.entries(themes).forEach(([key, theme]) => {
    const button = document.createElement('button')
    button.textContent = theme.name
    button.style.cssText = `
      display: block;
      width: 100px;
      padding: 8px;
      margin: 4px 0;
      background: var(--color-background);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    `

    button.onmouseenter = () => {
      button.style.background = 'var(--color-hover)'
    }

    button.onmouseleave = () => {
      button.style.background = 'var(--color-background)'
    }

    button.onclick = () => {
      applyTheme(key)
    }

    themeSwitcher.appendChild(button)
  })

  // 添加切换按钮
  const toggleButton = document.createElement('button')
  toggleButton.innerHTML = '🎨'
  toggleButton.title = '切换主题'
  toggleButton.style.cssText = `
    position: absolute;
    bottom: 100%;
    left: 0;
    background: var(--color-sidebar);
    border: 1px solid var(--color-border);
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    padding: 8px;
    cursor: pointer;
    font-size: 16px;
  `

  let isOpen = false
  toggleButton.onclick = () => {
    isOpen = !isOpen
    themeSwitcher.style.display = isOpen ? 'block' : 'none'
  }

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 1000;'
  wrapper.appendChild(toggleButton)
  wrapper.appendChild(themeSwitcher)

  themeSwitcher.style.display = 'none'
  document.body.appendChild(wrapper)

  return wrapper
}

// 初始化主题
export function initTheme() {
  // 创建主题样式
  const style = document.createElement('style')
  style.textContent = `
    :root {
      --color-background: #1e1e1e;
      --color-sidebar: #252526;
      --color-editor: #1e1e1e;
      --color-text: #d4d4d4;
      --color-accent: #007acc;
      --color-border: #3e3e42;
      --color-hover: #2a2d2e;
      --color-active: #37373d;
    }

    body {
      background: var(--color-background);
      color: var(--color-text);
      transition: background 0.3s ease, color 0.3s ease;
    }

    .sidebar {
      background: var(--color-sidebar);
      border-right-color: var(--color-border);
    }

    .file-item:hover {
      background: var(--color-hover);
    }

    .file-item.active {
      background: var(--color-active);
    }

    .toolbar {
      background: var(--color-sidebar);
      border-bottom-color: var(--color-border);
    }

    .status-bar {
      background: var(--color-accent);
    }

    .preview-pane {
      background: var(--color-background);
      color: #333;
    }

    .cm-editor {
      background: var(--color-editor);
    }

    .cm-content {
      color: var(--color-text);
    }

    .context-menu {
      background: var(--color-sidebar);
      border-color: var(--color-border);
    }

    .toast {
      background: var(--color-accent);
    }
  `
  document.head.appendChild(style)

  // 创建主题切换器
  createThemeSwitcher()
}

// 获取当前主题
export function getCurrentTheme() {
  return currentTheme
}

// 获取所有主题
export function getAllThemes() {
  return themes
}