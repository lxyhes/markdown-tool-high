import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import anchor from 'markdown-it-anchor'
import toc from 'markdown-it-table-of-contents'
import katex from 'markdown-it-katex'
import hljs from 'highlight.js'
import mermaid from 'mermaid'

// 初始化 Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true
  }
})

// 初始化 Markdown 解析器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
  highlight: function (str, lang) {
    if (lang && lang.toLowerCase() === 'mermaid') {
      try {
        const id = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        return '<div class="mermaid" id="' + id + '">' + str + '</div>'
      } catch (__) {}
    }

    if (lang && hljs.default && hljs.default.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.default.highlight(str, { language: lang }).value +
               '</code></pre>'
      } catch (__) {}
    } else if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang }).value +
               '</code></pre>'
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  }
})

// 添加插件
md.use(taskLists)
md.use(katex)
md.use(anchor, {
  permalink: anchor.permalink.headerLink()
})
md.use(toc, {
  includeLevel: [1, 2, 3, 4, 5, 6]
})

// 更新预览
export function updatePreview(content) {
  const previewPane = document.getElementById('previewPane')
  if (previewPane) {
    const html = md.render(content || '')
    previewPane.innerHTML = html

    // 渲染 Mermaid 图表
    setTimeout(() => {
      const mermaidElements = previewPane.querySelectorAll('.mermaid')
      if (mermaidElements.length > 0) {
        mermaidElements.forEach((element) => {
          const id = element.id
          if (id) {
            mermaid.render(id, element.textContent).then((result) => {
              element.innerHTML = result.svg
            }).catch((error) => {
              console.error('Mermaid 渲染失败:', error)
            })
          }
        })
      }
    }, 100)
  }
}

// 切换预览模式
export function togglePreview() {
  if (window.togglePreviewMode) {
    window.togglePreviewMode()
  }
}

// 切换分屏模式
export function toggleSideBySide() {
  if (window.toggleSideBySide) {
    window.toggleSideBySide()
  }
}

// 监听内容变化
let updateTimeout = null
export function scheduleUpdate(content) {
  clearTimeout(updateTimeout)
  updateTimeout = setTimeout(() => {
    updatePreview(content)
  }, 150) // 增加防抖时间到150ms，减少渲染频率
}

// 批量更新优化
let pendingUpdates = []
let batchUpdateTimeout = null

export function batchUpdate(content) {
  pendingUpdates.push(content)

  if (batchUpdateTimeout) {
    clearTimeout(batchUpdateTimeout)
  }

  batchUpdateTimeout = setTimeout(() => {
    if (pendingUpdates.length > 0) {
      const latestContent = pendingUpdates[pendingUpdates.length - 1]
      updatePreview(latestContent)
      pendingUpdates = []
    }
  }, 200)
}

// 初始化时加载 highlight.js 和 KaTeX
window.addEventListener('DOMContentLoaded', () => {
  // 动态加载 highlight.js
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'
  script.onload = () => {
    // 加载常用语言
    const languages = ['javascript', 'python', 'java', 'c', 'cpp', 'csharp', 'php', 'ruby', 'go', 'rust', 'typescript', 'html', 'css', 'sql', 'bash', 'json', 'xml', 'yaml']
    languages.forEach(lang => {
      const langScript = document.createElement('script')
      langScript.src = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/${lang}.min.js`
      document.head.appendChild(langScript)
    })
  }
  document.head.appendChild(script)

  // 添加样式
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css'
  document.head.appendChild(link)

  // 加载 KaTeX 样式
  const katexLink = document.createElement('link')
  katexLink.rel = 'stylesheet'
  katexLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css'
  document.head.appendChild(katexLink)
})