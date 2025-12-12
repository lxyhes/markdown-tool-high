import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import anchor from 'markdown-it-anchor'
import toc from 'markdown-it-table-of-contents'
import katex from 'markdown-it-katex'
import hljs from 'highlight.js'
import mermaid from 'mermaid'
import { convertFileSrc } from '@tauri-apps/api/tauri'

// 初始化 Mermaid config
mermaid.initialize({
  startOnLoad: false, // We render manually
  theme: 'dark', // Should be dynamic based on app theme, but default to dark for now
  securityLevel: 'loose',
})



// 初始化 Markdown 解析器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
  highlight: function (str, lang) {
    if (lang && lang.toLowerCase() === 'mermaid') {
      const id = 'mermaid-' + Math.random().toString(36).substr(2, 9)
      return `<div class="mermaid" id="${id}" data-code="${md.utils.escapeHtml(str)}">${md.utils.escapeHtml(str)}</div>`
    }
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
      } catch (__) { }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  }
})

// Custom Image Renderer for Tauri Asset Protocol
const defaultImageRender = md.renderer.rules.image || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const srcIndex = token.attrIndex('src');

  if (srcIndex >= 0) {
    let src = token.attrs[srcIndex][1];

    // Only process if in Tauri and not an external URL
    if (window.__TAURI_IPC__ && !src.startsWith('http') && !src.startsWith('data:')) {
      try {
        // Handle file protocol
        if (src.startsWith('file://')) {
          // Remove file:// prefix. Note: Windows paths might become /C:/... or C:/...
          // convertFileSrc expects the absolute system path.
          src = src.replace(/^file:\/\/\/?/, '');

          // Decode URI components (e.g., %5C -> \)
          src = decodeURIComponent(src);

          // Fix windows styling if needed (e.g. leading slash removal if naive replace left it?)
          // Usually convertFileSrc is robust.
        }

        token.attrs[srcIndex][1] = convertFileSrc(src);
      } catch (e) {
        console.warn('Image path conversion failed:', e);
      }
    }
  }

  return defaultImageRender(tokens, idx, options, env, self);
};


md.use(taskLists)
md.use(katex, { throwOnError: false, errorColor: '#cc0000' })
md.use(anchor, { permalink: anchor.permalink.headerLink() })
md.use(toc, { includeLevel: [1, 2, 3, 4] })

// 更新预览
export function updatePreview(content) {
  const previewPane = document.getElementById('previewPane')
  if (previewPane) {
    // 渲染 Markdown
    const html = md.render(content || '')
    previewPane.innerHTML = html

    // 渲染 Mermaid
    const mermaidElements = previewPane.querySelectorAll('.mermaid')
    mermaidElements.forEach(async (element) => {
      const id = element.id;
      const code = element.getAttribute('data-code') || element.textContent;
      // Decode HTML entities if needed (md.render escapes it)
      const txt = document.createElement("textarea");
      txt.innerHTML = code;
      const decodedLocation = txt.value;

      try {
        const { svg } = await mermaid.render(id, decodedLocation);
        element.innerHTML = svg;
      } catch (error) {
        console.error('Mermaid Render Error:', error);
        element.innerHTML = `<div class="mermaid-error">Mermaid Error: ${error.message}</div>`;
      }
    });

    // Handle internal links manually if needed
    // ...
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

// 监听内容变化 (Debounce)
let updateTimeout = null
export function scheduleUpdate(content) {
  clearTimeout(updateTimeout)
  updateTimeout = setTimeout(() => {
    updatePreview(content)
  }, 150)
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

// Load Styles (Highlight.js & KaTeX)
// Since we use importing logic, we still need the CSS. Check if we can import CSS in JS.
// Assuming standard Vite setup, we should link them in index.html, but injecting here is safer for single-file logic.
window.addEventListener('DOMContentLoaded', () => {
  // Highlight.js CSS
  if (!document.getElementById('hljs-style')) {
    const link = document.createElement('link')
    link.id = 'hljs-style'
    link.rel = 'stylesheet'
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css' // Use Dark by default or dynamic?
    document.head.appendChild(link)
  }

  // KaTeX CSS
  if (!document.getElementById('katex-style')) {
    const katexLink = document.createElement('link')
    katexLink.id = 'katex-style'
    katexLink.rel = 'stylesheet'
    katexLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css'
    document.head.appendChild(katexLink)
  }
})
