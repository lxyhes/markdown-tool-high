import { dialog, fs } from '@tauri-apps/api'
import { showToast } from './utils.js'
import MarkdownIt from 'markdown-it'

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

// 批量导出菜单
export function showExportMenu(content, title) {
  const menu = document.createElement('div');
  menu.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #2d2d30;
    border: 1px solid #3e3e42;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    z-index: 1000;
  `;

  const titleEl = document.createElement('h3');
  titleEl.textContent = '选择导出格式';
  titleEl.style.cssText = 'margin: 0 0 20px 0; color: #cccccc;';
  menu.appendChild(titleEl);

  const formats = [
    { name: 'HTML', action: () => exportHTML(content, title) },
    { name: 'PDF (打印)', action: () => exportPDF(content, title) },
    { name: 'Word', action: () => exportWord(content, title) },
    { name: 'Markdown', action: () => exportMarkdown(content, title) }
  ];

  formats.forEach(format => {
    const button = document.createElement('button');
    button.textContent = format.name;
    button.style.cssText = `
      display: block;
      width: 100%;
      padding: 10px;
      margin: 5px 0;
      background: #007acc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    `;
    button.onmouseenter = () => button.style.background = '#106ebe';
    button.onmouseleave = () => button.style.background = '#007acc';
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
    margin-top: 10px;
    background: transparent;
    color: #cccccc;
    border: 1px solid #3e3e42;
    border-radius: 4px;
    cursor: pointer;
  `;
  cancelBtn.onclick = () => menu.remove();
  menu.appendChild(cancelBtn);

  document.body.appendChild(menu);

  // 点击外部关闭
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);
}