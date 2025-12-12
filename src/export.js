import { dialog, fs } from '@tauri-apps/api'
import { showToast } from './utils.js'
import MarkdownIt from 'markdown-it'

// Initialize MarkdownIt for export
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false
})

// Simple check for Tauri environment
const isTauri = !!window.__TAURI_IPC__;

// Helper for browser download
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`${filename} 已开始下载`);
}

// 导出 HTML
export async function exportHTML(content, title = 'Document') {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fff;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    p { margin-bottom: 16px; }
    code {
      background: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 85%;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
    }
    pre {
      background: #f6f8fa;
      padding: 16px;
      overflow: auto;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
      margin-bottom: 16px;
    }
    table {
      border-collapse: collapse;
      margin-bottom: 16px;
      width: 100%;
    }
    table th, table td {
      border: 1px solid #dfe2e5;
      padding: 6px 13px;
    }
    table th {
      background: #f6f8fa;
      font-weight: 600;
    }
    img { max-width: 100%; height: auto; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
${md.render(content)}
</body>
</html>`;

    if (!isTauri) {
      downloadFile(htmlContent, `${title}.html`, 'text/html');
      return;
    }

    const filePath = await dialog.save({
      defaultPath: `${title}.html`,
      filters: [{
        name: 'HTML',
        extensions: ['html', 'htm']
      }]
    });

    if (filePath) {
      await fs.writeTextFile(filePath, htmlContent);
      showToast(`HTML 导出成功: ${filePath}`);
    }
  } catch (error) {
    console.error('导出 HTML 失败:', error);
    showToast('导出 HTML 失败: ' + error.message);
  }
}

// 导出 PDF（需要额外的库，这里先提供基本框架）
export async function exportPDF(content, title = 'Document') {
  try {
    // 由于浏览器安全限制，这里使用打印功能模拟 PDF 导出
    const printWindow = window.open('', '_blank');
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    @media print {
      body { margin: 0; }
      @page { margin: 1in; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
      page-break-after: avoid;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    p { margin-bottom: 16px; }
    pre {
      background: #f6f8fa;
      padding: 16px;
      overflow: auto;
      border-radius: 6px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    img { max-width: 100%; height: auto; }
    table { page-break-inside: avoid; }
  </style>
</head>
<body>
${md.render(content)}
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    showToast('正在准备打印，请在打印对话框中选择保存为 PDF');
  } catch (error) {
    console.error('导出 PDF 失败:', error);
    showToast('导出 PDF 失败: ' + error.message);
  }
}

// 导出 Word（使用 HTML 格式）
export async function exportWord(content, title = 'Document') {
  try {
    const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>90</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page { margin: 1in; }
    body { font-family: Calibri, sans-serif; }
    h1 { font-size: 24pt; color: #2E74B5; }
    h2 { font-size: 18pt; color: #2E74B5; }
    h3 { font-size: 14pt; color: #2E74B5; }
    pre { background: #F2F2F2; padding: 10px; }
    table { border-collapse: collapse; }
    table, th, td { border: 1px solid #000; }
    th { background: #2E74B5; color: white; }
  </style>
</head>
<body>
${md.render(content)}
</body>
</html>`;

    if (!isTauri) {
      downloadFile(htmlContent, `${title}.doc`, 'application/msword');
      return;
    }

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Word 文档已生成并开始下载');
  } catch (error) {
    console.error('导出 Word 失败:', error);
    showToast('导出 Word 失败: ' + error.message);
  }
}

// 导出为纯 Markdown
export async function exportMarkdown(content, title = 'Document') {
  try {
    if (!isTauri) {
      downloadFile(content, `${title}.md`, 'text/markdown');
      return;
    }

    const filePath = await dialog.save({
      defaultPath: `${title}.md`,
      filters: [{
        name: 'Markdown',
        extensions: ['md', 'markdown']
      }]
    });

    if (filePath) {
      await fs.writeTextFile(filePath, content);
      showToast(`Markdown 导出成功: ${filePath}`);
    }
  } catch (error) {
    console.error('导出 Markdown 失败:', error);
    showToast('导出 Markdown 失败: ' + error.message);
  }
}

// 导出图片
export async function exportImage(content, title = 'Document') {
  showToast('正在生成长图...', 'info', 5000);

  // 动态加载 html2canvas
  if (!window.html2canvas) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  try {
    // 创建临时容器用于渲染
    const container = document.createElement('div');
    container.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 800px;
            padding: 40px;
            background: #ffffff; /* Always white/light for better reading in image */
            color: #333333;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            z-index: -1;
        `;

    // Use marked/markdown-it to render
    // Assuming we rely on the same renderer logic or just simple HTML structure
    // Since we are inside export.js which imports markdown-it instance 'md' (wait, export.js creates its own md instance in previous edits)
    // Let's check the file content... 
    // Yes, `const md = new MarkdownIt(...)` is at the top of export.js (added in previous edit)

    container.innerHTML = `
            <div style="margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <h1 style="margin: 0; font-size: 24px;">${title}</h1>
                <p style="margin: 5px 0 0; color: #666; font-size: 12px; display: flex; justify-content: space-between;">
                    <span>Generated by MarkFlow</span>
                    <span>${new Date().toLocaleDateString()}</span>
                </p>
            </div>
            <div class="markdown-body">
                ${md.render(content)}
            </div>
        `;

    // Inject Basic Markdown Styles for the image
    const style = document.createElement('style');
    style.textContent = `
            .markdown-body h1, .markdown-body h2 { border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
            .markdown-body code { background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
            .markdown-body pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: hidden; }
            .markdown-body blockquote { border-left: 0.25em solid #dfe2e5; color: #6a737d; padding: 0 1em; }
            .markdown-body img { max-width: 100%; }
            .markdown-body table { border-collapse: collapse; width: 100%; }
            .markdown-body table th, .markdown-body table td { border: 1px solid #dfe2e5; padding: 6px 13px; }
        `;
    container.appendChild(style);
    document.body.appendChild(container);

    // Wait for images to load if any
    const images = container.querySelectorAll('img');
    if (images.length > 0) {
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; // continue even if error
        });
      }));
    }

    const canvas = await window.html2canvas(container, {
      useCORS: true,
      scale: 2, // Retire display density
      backgroundColor: '#ffffff'
    });

    const dataUrl = canvas.toDataURL('image/png');

    // Download
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${title}_share.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Cleanup
    document.body.removeChild(container);
    showToast('长图导出成功');

  } catch (error) {
    console.error('导出图片失败:', error);
    showToast('导出图片失败: ' + error.message, 'error');
  }
}

// 批量导出菜单 - Modernized UI
export function showExportMenu(content, title) {
  // ... (keep existing showExportMenu, just add the new item)

  const menu = document.createElement('div');
  menu.className = 'export-menu-container';
  menu.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    min-width: 320px;
  `;

  const titleEl = document.createElement('h3');
  titleEl.textContent = '选择导出格式';
  titleEl.style.cssText = 'margin: 0 0 20px 0; color: var(--text-primary); font-size: 18px; font-weight:600; text-align:center;';
  menu.appendChild(titleEl);

  const formats = [
    { name: 'HTML 文件', icon: '🌐', action: () => exportHTML(content, title) },
    { name: 'PDF 文档', icon: '📄', action: () => exportPDF(content, title) },
    { name: 'Word 文档', icon: '📝', action: () => exportWord(content, title) },
    { name: 'Markdown 原文', icon: '📋', action: () => exportMarkdown(content, title) },
    { name: '生成长图 (Beta)', icon: '📸', action: () => exportImage(content, title) }
  ];

  formats.forEach(format => {
    const button = document.createElement('button');
    // button.textContent = format.name;
    button.innerHTML = `<span style="margin-right:8px">${format.icon}</span>${format.name}`
    button.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 12px;
      margin: 8px 0;
      background: var(--bg-primary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition-fast);
      font-size: 14px;
    `;
    button.onmouseenter = () => {
      button.style.borderColor = 'var(--accent-color)';
      button.style.color = 'var(--accent-color)';
      button.style.background = 'var(--bg-tertiary)';
    }
    button.onmouseleave = () => {
      button.style.borderColor = 'var(--border-color)';
      button.style.color = 'var(--text-primary)';
      button.style.background = 'var(--bg-primary)';
    }
    button.onclick = () => {
      format.action();
      menu.remove();
    };
    menu.appendChild(button);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '取消';
  cancelBtn.style.cssText = `
    display: block;
    width: 100%;
    padding: 10px;
    margin-top: 16px;
    background: transparent;
    color: var(--text-secondary);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 13px;
  `;
  cancelBtn.onmouseenter = () => cancelBtn.style.color = 'var(--text-primary)';
  cancelBtn.onmouseleave = () => cancelBtn.style.color = 'var(--text-secondary)';

  cancelBtn.onclick = () => menu.remove();
  menu.appendChild(cancelBtn);

  document.body.appendChild(menu);

  // Overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 999;
      backdrop-filter: blur(2px);
  `;
  document.body.appendChild(overlay);

  const cleanup = () => {
    menu.remove();
    overlay.remove();
  };

  cancelBtn.onclick = cleanup;
  overlay.onclick = cleanup;
}