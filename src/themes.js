// 主题配置
const themes = {
  dark: {
    name: '深色模式',
    colors: {
      'bg-primary': '#1a1b1e',
      'bg-secondary': '#25262b',
      'bg-tertiary': '#2c2e33',
      'text-primary': '#c1c2c5',
      'text-secondary': '#909296',
      'text-tertiary': '#5c5f66',
      'text-code': '#e0e0e0',
      'border-color': '#2c2e33',
      'accent-color': '#228be6',
      'accent-hover': '#1971c2',
      'accent-light': 'rgba(34, 139, 230, 0.1)',
      // Specific for editor connection
      'color-editor': '#1a1b1e',
      'color-sidebar': '#25262b',
      'color-hover': '#2c2e33',
      'color-active': '#373a40'
    }
  },
  light: {
    name: '浅色模式',
    colors: {
      'bg-primary': '#ffffff',
      'bg-secondary': '#f8f9fa',
      'bg-tertiary': '#e9ecef',
      'text-primary': '#212529',
      'text-secondary': '#868e96',
      'text-tertiary': '#adb5bd',
      'text-code': '#24292e',
      'border-color': '#dee2e6',
      'accent-color': '#228be6',
      'accent-hover': '#1971c2',
      'accent-light': 'rgba(34, 139, 230, 0.1)',
      'color-editor': '#ffffff',
      'color-sidebar': '#f8f9fa',
      'color-hover': '#f1f3f5',
      'color-active': '#e7f5ff'
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