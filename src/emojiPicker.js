// Emoji 选择器
const emojiCategories = {
  '😀 表情': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  '👋 手势': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪'],
  '❤️ 符号': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '⭐', '🌟', '✨', '💫', '🔥', '💯', '✅', '❌', '⚠️', '💡', '📌', '🎯', '🏆', '🎉', '🎊'],
  '🐱 动物': ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜'],
  '🍎 食物': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕'],
  '⚽ 活动': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂'],
  '💻 物品': ['💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📱', '📲', '☎️', '📞', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📃', '📜', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '✉️', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️']
}

let currentCategory = Object.keys(emojiCategories)[0]

export function showEmojiPicker(editor) {
  // 移除已存在的
  const existing = document.getElementById('emojiPicker')
  if (existing) existing.remove()
  
  const picker = document.createElement('div')
  picker.id = 'emojiPicker'
  picker.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 380px;
    max-height: 450px;
    z-index: 9999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `
  
  // 搜索框
  const searchBox = document.createElement('div')
  searchBox.style.cssText = `padding: 12px; border-bottom: 1px solid var(--border-color);`
  searchBox.innerHTML = `
    <input type="text" id="emojiSearch" placeholder="搜索 Emoji..." style="
      width: 100%;
      padding: 8px 12px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
    ">
  `
  
  // 分类标签
  const tabs = document.createElement('div')
  tabs.style.cssText = `
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-color);
    overflow-x: auto;
  `
  
  Object.keys(emojiCategories).forEach(cat => {
    const tab = document.createElement('button')
    tab.textContent = cat.split(' ')[0]
    tab.title = cat
    tab.style.cssText = `
      padding: 6px 10px;
      border: none;
      background: ${cat === currentCategory ? 'var(--accent-light)' : 'transparent'};
      color: ${cat === currentCategory ? 'var(--accent-color)' : 'var(--text-secondary)'};
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.15s;
    `
    tab.onclick = () => {
      currentCategory = cat
      renderEmojis()
      // 更新标签样式
      tabs.querySelectorAll('button').forEach(b => {
        b.style.background = 'transparent'
        b.style.color = 'var(--text-secondary)'
      })
      tab.style.background = 'var(--accent-light)'
      tab.style.color = 'var(--accent-color)'
    }
    tabs.appendChild(tab)
  })
  
  // Emoji 网格
  const grid = document.createElement('div')
  grid.id = 'emojiGrid'
  grid.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
  `
  
  function renderEmojis(filter = '') {
    grid.innerHTML = ''
    const emojis = filter 
      ? Object.values(emojiCategories).flat().filter(e => e.includes(filter))
      : emojiCategories[currentCategory]
    
    emojis.forEach(emoji => {
      const btn = document.createElement('button')
      btn.textContent = emoji
      btn.style.cssText = `
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        font-size: 22px;
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.15s, transform 0.1s;
      `
      btn.onmouseenter = () => btn.style.background = 'var(--bg-tertiary)'
      btn.onmouseleave = () => btn.style.background = 'transparent'
      btn.onclick = () => {
        insertEmoji(editor, emoji)
        picker.remove()
      }
      grid.appendChild(btn)
    })
  }
  
  picker.appendChild(searchBox)
  picker.appendChild(tabs)
  picker.appendChild(grid)
  document.body.appendChild(picker)
  
  renderEmojis()
  
  // 搜索功能
  const searchInput = document.getElementById('emojiSearch')
  searchInput.focus()
  searchInput.oninput = (e) => renderEmojis(e.target.value)
  
  // 关闭
  const closeOnEsc = (e) => {
    if (e.key === 'Escape') {
      picker.remove()
      document.removeEventListener('keydown', closeOnEsc)
    }
  }
  document.addEventListener('keydown', closeOnEsc)
  
  // 点击外部关闭
  setTimeout(() => {
    const closeOnClick = (e) => {
      if (!picker.contains(e.target)) {
        picker.remove()
        document.removeEventListener('click', closeOnClick)
      }
    }
    document.addEventListener('click', closeOnClick)
  }, 100)
}

function insertEmoji(editor, emoji) {
  if (!editor) return
  const pos = editor.state.selection.main.head
  editor.dispatch({
    changes: { from: pos, insert: emoji },
    selection: { anchor: pos + emoji.length }
  })
  editor.focus()
}
