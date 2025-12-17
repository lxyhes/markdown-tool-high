// 增强的字数统计
export function getDocumentStats(text) {
  if (!text) {
    return {
      chars: 0,
      charsNoSpace: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
      readingTime: '0 分钟',
      codeBlocks: 0,
      links: 0,
      images: 0,
      headings: 0
    }
  }
  
  // 字符数
  const chars = text.length
  const charsNoSpace = text.replace(/\s/g, '').length
  
  // 行数
  const lines = text.split('\n').length
  
  // 段落数 (非空行)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length
  
  // 单词数 (中文按字符，英文按空格分词)
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = text
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0).length
  const words = chineseChars + englishWords
  
  // 阅读时间 (中文 300字/分钟，英文 200词/分钟)
  const readingMinutes = Math.ceil((chineseChars / 300) + ((englishWords) / 200))
  const readingTime = readingMinutes < 1 ? '< 1 分钟' : `${readingMinutes} 分钟`
  
  // Markdown 元素统计
  const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length
  const links = (text.match(/\[.*?\]\(.*?\)/g) || []).length
  const images = (text.match(/!\[.*?\]\(.*?\)/g) || []).length
  const headings = (text.match(/^#{1,6}\s/gm) || []).length
  
  return {
    chars,
    charsNoSpace,
    words,
    lines,
    paragraphs,
    readingTime,
    codeBlocks,
    links,
    images,
    headings
  }
}

// 显示详细统计面板
export function showStatsPanel(text) {
  const existing = document.getElementById('statsPanel')
  if (existing) existing.remove()
  
  const stats = getDocumentStats(text)
  
  const overlay = document.createElement('div')
  overlay.id = 'statsPanel'
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
    width: 400px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  `
  
  panel.innerHTML = `
    <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: 600; color: var(--text-primary); font-size: 16px;">📊 文档统计</span>
      <button id="closeStatsPanel" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:20px;">&times;</button>
    </div>
    <div style="padding: 20px;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        ${statItem('📝', '字符数', stats.chars.toLocaleString())}
        ${statItem('🔤', '字符(无空格)', stats.charsNoSpace.toLocaleString())}
        ${statItem('📖', '字/词数', stats.words.toLocaleString())}
        ${statItem('📄', '行数', stats.lines.toLocaleString())}
        ${statItem('¶', '段落数', stats.paragraphs.toLocaleString())}
        ${statItem('⏱️', '阅读时间', stats.readingTime)}
      </div>
      
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
        <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Markdown 元素</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          ${miniStat('标题', stats.headings)}
          ${miniStat('链接', stats.links)}
          ${miniStat('图片', stats.images)}
          ${miniStat('代码块', stats.codeBlocks)}
        </div>
      </div>
    </div>
  `
  
  overlay.appendChild(panel)
  document.body.appendChild(overlay)
  
  // 关闭
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove()
  }
  document.getElementById('closeStatsPanel').onclick = () => overlay.remove()
  
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove()
      document.removeEventListener('keydown', escHandler)
    }
  }
  document.addEventListener('keydown', escHandler)
}

function statItem(icon, label, value) {
  return `
    <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px;">
      <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 4px;">${icon} ${label}</div>
      <div style="font-size: 20px; font-weight: 600; color: var(--text-primary);">${value}</div>
    </div>
  `
}

function miniStat(label, value) {
  return `
    <div style="text-align: center;">
      <div style="font-size: 18px; font-weight: 600; color: var(--accent-color);">${value}</div>
      <div style="font-size: 11px; color: var(--text-tertiary);">${label}</div>
    </div>
  `
}
