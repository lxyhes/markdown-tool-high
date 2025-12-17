// 快捷键帮助面板
const shortcuts = [
  { category: '文件操作', items: [
    { keys: 'Ctrl + S', desc: '保存文件' },
    { keys: 'Ctrl + O', desc: '打开文件' },
    { keys: 'Ctrl + Shift + O', desc: '打开文件夹' },
    { keys: 'Ctrl + N', desc: '新建文件' },
    { keys: 'Ctrl + W', desc: '关闭标签页' },
  ]},
  { category: '编辑操作', items: [
    { keys: 'Ctrl + Z', desc: '撤销' },
    { keys: 'Ctrl + Shift + Z', desc: '重做' },
    { keys: 'Ctrl + X', desc: '剪切' },
    { keys: 'Ctrl + C', desc: '复制' },
    { keys: 'Ctrl + V', desc: '粘贴' },
    { keys: 'Ctrl + A', desc: '全选' },
    { keys: 'Ctrl + L', desc: '选择当前行' },
    { keys: 'Ctrl + Shift + D', desc: '复制当前行' },
    { keys: 'Ctrl + Shift + K', desc: '删除当前行' },
    { keys: 'Alt + ↑', desc: '向上移动行' },
    { keys: 'Alt + ↓', desc: '向下移动行' },
  ]},
  { category: '格式化', items: [
    { keys: 'Ctrl + B', desc: '粗体' },
    { keys: 'Ctrl + I', desc: '斜体' },
    { keys: 'Ctrl + K', desc: '插入链接' },
    { keys: 'Ctrl + Shift + K', desc: '插入代码块' },
    { keys: 'Ctrl + Shift + M', desc: '插入数学公式' },
    { keys: 'Ctrl + Shift + I', desc: '插入图片' },
    { keys: 'Ctrl + Shift + Q', desc: '引用' },
  ]},
  { category: '视图切换', items: [
    { keys: 'Ctrl + P', desc: '切换预览' },
    { keys: 'Ctrl + \\', desc: '分屏预览' },
    { keys: 'Ctrl + Shift + P', desc: '命令面板' },
    { keys: 'Ctrl + Shift + E', desc: '切换侧边栏' },
    { keys: 'Ctrl + Shift + F', desc: '专注模式' },
    { keys: 'Ctrl + Alt + R', desc: '阅读模式' },
    { keys: 'Ctrl + Alt + Z', desc: '禅模式' },
  ]},
  { category: '搜索', items: [
    { keys: 'Ctrl + F', desc: '查找' },
    { keys: 'Ctrl + H', desc: '替换' },
    { keys: 'Ctrl + G', desc: '跳转到行' },
    { keys: 'F3', desc: '查找下一个' },
    { keys: 'Shift + F3', desc: '查找上一个' },
  ]},
  { category: '书签', items: [
    { keys: 'Ctrl + M', desc: '切换书签' },
    { keys: 'Ctrl + Shift + M', desc: '书签列表' },
    { keys: 'F2', desc: '下一个书签' },
    { keys: 'Shift + F2', desc: '上一个书签' },
  ]},
  { category: '其他', items: [
    { keys: '/', desc: '斜杠命令 (输入 / 触发)' },
    { keys: 'Ctrl + .', desc: 'Emoji 选择器' },
    { keys: 'Ctrl + Shift + R', desc: '最近文件' },
    { keys: 'Ctrl + G', desc: '跳转到行' },
    { keys: 'Ctrl + T', desc: '文本转换菜单' },
    { keys: 'Ctrl + Shift + S', desc: '代码片段' },
    { keys: 'Esc', desc: '关闭弹窗/取消' },
    { keys: 'F1', desc: '快捷键帮助' },
  ]},
]

export function showShortcutsPanel() {
  const existing = document.getElementById('shortcutsPanel')
  if (existing) {
    existing.remove()
    return
  }
  
  const overlay = document.createElement('div')
  overlay.id = 'shortcutsPanel'
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
  `
  
  const panel = document.createElement('div')
  panel.style.cssText = `
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 700px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
  `
  
  // 标题
  const header = document.createElement('div')
  header.style.cssText = `
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `
  header.innerHTML = `
    <span style="font-weight: 600; color: var(--text-primary); font-size: 16px;">⌨️ 快捷键</span>
    <button id="closeShortcutsPanel" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:20px;">&times;</button>
  `
  
  // 内容
  const content = document.createElement('div')
  content.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  `
  
  shortcuts.forEach(cat => {
    const section = document.createElement('div')
    section.innerHTML = `
      <h4 style="margin: 0 0 10px 0; color: var(--accent-color); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${cat.category}</h4>
    `
    
    const list = document.createElement('div')
    cat.items.forEach(item => {
      const row = document.createElement('div')
      row.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid var(--border-color);
      `
      row.innerHTML = `
        <span style="color: var(--text-secondary); font-size: 13px;">${item.desc}</span>
        <kbd style="
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 3px 8px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-primary);
          white-space: nowrap;
        ">${item.keys}</kbd>
      `
      list.appendChild(row)
    })
    
    section.appendChild(list)
    content.appendChild(section)
  })
  
  panel.appendChild(header)
  panel.appendChild(content)
  overlay.appendChild(panel)
  document.body.appendChild(overlay)
  
  // 关闭
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove()
  }
  document.getElementById('closeShortcutsPanel').onclick = () => overlay.remove()
  
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove()
      document.removeEventListener('keydown', escHandler)
    }
  }
  document.addEventListener('keydown', escHandler)
}
