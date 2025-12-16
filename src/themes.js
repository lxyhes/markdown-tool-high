// 主题配置
const themes = {
  dark: {
    name: '深色模式',
    colors: {
      'bg-primary': '#1e1e1e',
      'bg-secondary': '#252526',
      'bg-tertiary': '#37373d',
      'bg-hover': '#2a2d2e',
      'text-primary': '#d4d4d4',
      'text-secondary': '#a6a6a6',
      'text-tertiary': '#6e7681',
      'text-code': '#9cdcfe',
      'border-color': '#3e3e42',
      'accent-color': '#3794ff',
      'accent-hover': '#1e70bf',
      'accent-light': 'rgba(55, 148, 255, 0.15)',
      
      // Editor & Component Mappings
      'color-editor': '#1e1e1e',
      'color-sidebar': '#252526',
      'color-hover': '#2a2d2e',
      'color-active': '#264f78',
      'color-text': '#d4d4d4',
      'color-background': '#1e1e1e',
      'color-accent': '#3794ff',
      'color-border': '#3e3e42',
      'color-text-secondary': '#a6a6a6',
      'color-text-primary': '#d4d4d4'
    }
  },
  light: {
    name: '浅色模式',
    colors: {
      'bg-primary': '#ffffff',
      'bg-secondary': '#f3f3f3',
      'bg-tertiary': '#e5e5e5',
      'bg-hover': '#f0f0f0',
      'text-primary': '#3b3b3b',
      'text-secondary': '#666666',
      'text-tertiary': '#999999',
      'text-code': '#098658',
      'border-color': '#e5e5e5',
      'accent-color': '#007acc',
      'accent-hover': '#0062a3',
      'accent-light': 'rgba(0, 122, 204, 0.1)',
      
      // Editor & Component Mappings
      'color-editor': '#ffffff',
      'color-sidebar': '#f3f3f3',
      'color-hover': '#f0f0f0',
      'color-active': '#add6ff',
      'color-text': '#3b3b3b',
      'color-background': '#ffffff',
      'color-accent': '#007acc',
      'color-border': '#e5e5e5',
      'color-text-secondary': '#666666',
      'color-text-primary': '#333333'
    }
  },
  ocean: {
    name: '深海',
    colors: {
      'bg-primary': '#0f172a',
      'bg-secondary': '#1e293b',
      'bg-tertiary': '#334155',
      'text-primary': '#e2e8f0',
      'text-secondary': '#94a3b8',
      'text-tertiary': '#64748b',
      'text-code': '#f1f5f9',
      'border-color': '#1e293b',
      'accent-color': '#38bdf8',
      'accent-hover': '#0ea5e9',
      'accent-light': 'rgba(56, 189, 248, 0.1)',
      'color-editor': '#0f172a',
      'color-sidebar': '#1e293b',
      'color-hover': '#334155',
      'color-active': '#475569'
    }
  },
  forest: {
    name: '森林',
    colors: {
      'bg-primary': '#1c2e26',
      'bg-secondary': '#14211b',
      'bg-tertiary': '#2d4a3e',
      'text-primary': '#e8f5e9',
      'text-secondary': '#a5d6a7',
      'text-tertiary': '#66bb6a',
      'text-code': '#e8f5e9',
      'border-color': '#2d4a3e',
      'accent-color': '#4ade80',
      'accent-hover': '#22c55e',
      'accent-light': 'rgba(74, 222, 128, 0.1)',
      'color-editor': '#1c2e26',
      'color-sidebar': '#14211b',
      'color-hover': '#2d4a3e',
      'color-active': '#385c4d'
    }
  }
}

let currentTheme = 'light'

// 应用主题
export function applyTheme(themeName) {
  if (!themes[themeName]) return

  const theme = themes[themeName]
  const root = document.documentElement

  // 设置 CSS 变量 (Matches index.html :root)
  Object.entries(theme.colors).forEach(([key, value]) => {
    // If key has prefix '--', use as is (not in this map), ours don't have prefix in keys
    root.style.setProperty(`--${key}`, value)
  })

  // 设置 data-theme 属性
  root.setAttribute('data-theme', themeName)

  // 触发主题变更事件，让 main.js 处理编辑器刷新
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { themeName } }))

  currentTheme = themeName

  // 更新切换器 UI 状态
  const activeBtns = document.querySelectorAll('.theme-option.active')
  activeBtns.forEach(btn => btn.classList.remove('active'))

  const newActiveBtn = document.querySelector(`.theme-option[data-theme="${themeName}"]`)
  if (newActiveBtn) newActiveBtn.classList.add('active')

  if (window.showToast) {
    window.showToast(`已切换到 ${theme.name}`)
  }
}

// 创建主题切换器 UI
export function createThemeSwitcher() {
  // 如果已存在则不重复创建
  if (document.querySelector('.theme-switcher-container')) return

  const container = document.createElement('div')
  container.className = 'theme-switcher-container'

  const toggleBtn = document.createElement('button')
  toggleBtn.className = 'theme-toggle-btn'
  // Icon: Palette
  toggleBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="13.5" cy="6.5" r=".5"></circle>
      <circle cx="17.5" cy="10.5" r=".5"></circle>
      <circle cx="8.5" cy="7.5" r=".5"></circle>
      <circle cx="6.5" cy="12.5" r=".5"></circle>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
    </svg>
  `
  toggleBtn.title = '切换主题'

  const menu = document.createElement('div')
  menu.className = 'theme-menu'

  Object.entries(themes).forEach(([key, theme]) => {
    const btn = document.createElement('button')
    btn.className = `theme-option ${key === currentTheme ? 'active' : ''}`
    btn.dataset.theme = key
    btn.innerHTML = `<span class="theme-color-dot" style="background:${theme.colors['accent-color']}"></span>${theme.name}`
    btn.onclick = () => {
      applyTheme(key)
    }
    menu.appendChild(btn)
  })

  toggleBtn.onclick = (e) => {
    e.stopPropagation()
    const isShowing = menu.classList.contains('show')
    // Close others
    document.querySelectorAll('.theme-menu.show').forEach(m => m.classList.remove('show'))
    if (!isShowing) menu.classList.add('show')
  }

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      menu.classList.remove('show')
    }
  })

  container.appendChild(menu)
  container.appendChild(toggleBtn)

  document.body.appendChild(container)

  // Apply initial theme
  applyTheme(currentTheme)
}

// 初始化
export function initTheme() {
  // Inject style for CodeMirror specific mappings if needed, but since we map to global vars, 
  // dynamicTheme.js usually picks them up via var(--bg-primary).
  // However, we added strict mappings like --color-editor just in case old logic uses it.
  const style = document.createElement('style')
  style.textContent = `
    [data-theme] .cm-editor { background-color: var(--color-editor) !important; }
    [data-theme] .cm-gutters { background-color: var(--color-sidebar) !important; border-color: var(--border-color) !important; }
    [data-theme] .cm-content { color: var(--text-primary) !important; }
    [data-theme] .cm-activeLine { background-color: var(--color-hover) !important; }
    [data-theme] .cm-cursor { border-left-color: var(--accent-color) !important; }
    [data-theme] .cm-selectionBackground { background-color: var(--color-active) !important; }
    `
  document.head.appendChild(style)

  createThemeSwitcher()
}

export function getCurrentTheme() {
  return currentTheme
}