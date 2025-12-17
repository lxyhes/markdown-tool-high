import { dialog, fs } from '@tauri-apps/api'
import { homeDir } from '@tauri-apps/api/path'
import { invoke } from '@tauri-apps/api/tauri'
import { showToast, isMarkdownFile, formatDate } from './utils.js'

// Simple check for Tauri environment
const isTauri = !!window.__TAURI_IPC__;

// Mocks for Browser Environment
const browserFS = {
  files: {
    'welcome.md': '# Welcome to MarkFlow (Browser Demo)\n\nThis is a browser-only demo mode.\nChanges are saved to localStorage.\n\n## Features\n- Edit Markdown\n- Preview\n- Change Themes',
    'notes/todo.md': '# To Do List\n- [ ] Fix bugs\n- [x] Add theme support'
  },
  get(path) {
    return localStorage.getItem(`markflow_file_${path}`) || this.files[path] || '';
  },
  set(path, content) {
    localStorage.setItem(`markflow_file_${path}`, content);
    // also update memory text
    this.files[path] = content;
  },
  list(dir) {
    // Return dummy structure
    return [
      { name: 'welcome.md', path: 'welcome.md', is_dir: false },
      { name: 'notes', path: 'notes', is_dir: true },
      { name: 'todo.md', path: 'notes/todo.md', is_dir: false }
    ];
  }
};

// 显示加载状态
function showLoadingState() {
  const fileTree = document.getElementById('fileTree')
  if (fileTree) {
    fileTree.innerHTML = `
        <div style="padding: 40px 24px; text-align: center; color: var(--text-tertiary);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               style="margin: 0 auto 16px; animation: spin 1s linear infinite;">
            <path d="M12 2v4m0 12v4m8-8h-4M8 12H4m15.364-6.364l-2.828 2.828M8.464 15.536l-2.828 2.828m12.728 0l-2.828-2.828M8.464 8.464L5.636 5.636"/>
          </svg>
          <p>正在加载...</p>
        </div>
      `
  }
}

// 当前打开的文件夹路径
let currentFolderPath = ''

// 添加图标到菜单项
function addMenuIcon(menuItem, iconSvg) {
  const icon = document.createElement('span')
  icon.innerHTML = iconSvg
  icon.style.cssText = 'width: 16px; height: 16px; display: flex; align-items: center;'
  menuItem.insertBefore(icon, menuItem.firstChild)
}

// 打开文件
export function openFile() {
  if (!isTauri) {
    // Browser: Use File Input API to open real local file
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown,.txt,.mdown';
      input.style.display = 'none';

      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            path: file.name, // Browser doesn't give full path, use name
            content: e.target.result
          });
          // Update recent files or mock fs if needed, but for now just return content
        };
        reader.onerror = () => {
          showToast('读取文件失败', 'error');
          resolve(null);
        };
        reader.readAsText(file);
        document.body.removeChild(input);
      };

      // Handle cancel? It's hard to detect cancel on input type=file in all browsers reliably. 
      // Unresolved promise is safer than resolving null immediately if we can't detect it.
      // But we should append to body to ensure it works.
      document.body.appendChild(input);
      input.click();
    });
  }

  return new Promise(async (resolve) => {
    try {
      const selected = await dialog.open({
        multiple: false,
        filters: [{
          name: 'Markdown',
          extensions: ['md', 'markdown', 'mdown', 'mkd', 'mkdn']
        }, {
          name: 'Text',
          extensions: ['txt']
        }, {
          name: 'All',
          extensions: ['*']
        }]
      })

      if (selected) {
        const content = await fs.readTextFile(selected)
        resolve({
          path: selected,
          content: content
        })
      } else {
        resolve(null)
      }
    } catch (error) {
      console.error('打开文件失败:', error)
      showToast('打开文件失败: ' + error.message, 'error')
      resolve(null)
    }
  });
}

// 保存文件
export async function saveFile(filePath, content) {
  if (!isTauri) {
    // Browser: 使用 File System Access API 或 下载方式保存
    try {
      // 尝试使用现代 File System Access API (Chrome/Edge 支持)
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filePath || 'untitled.md',
          types: [{
            description: 'Markdown Files',
            accept: { 'text/markdown': ['.md'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        showToast('文件已保存到本地');
        return handle.name;
      } else {
        // 降级方案：使用下载方式
        const fileName = filePath || prompt("输入文件名:", "untitled.md");
        if (!fileName) return null;
        
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.endsWith('.md') ? fileName : fileName + '.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('文件已下载');
        return fileName;
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // 用户取消
        return null;
      }
      console.error('保存失败:', err);
      showToast('保存失败: ' + err.message, 'error');
      return null;
    }
  }

  try {
    let savePath = filePath

    if (!savePath) {
      const selected = await dialog.save({
        defaultPath: '未命名.md',
        filters: [{
          name: 'Markdown',
          extensions: ['md']
        }]
      })

      if (!selected) {
        return null
      }
      savePath = selected
    }

    await fs.writeTextFile(savePath, content)

    showToast('文件已保存', 'success');

    console.log('文件已保存:', savePath)
    return savePath
  } catch (error) {
    console.error('保存文件失败:', error)
    showToast('保存文件失败: ' + error.message, 'error')
    return null
  }
}

// 打开文件夹
export function openFolder() {
  if (!isTauri) {
    // Browser: Use webkitdirectory
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.style.display = 'none';

    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      // Convert FileList to internal file structure
      // Note: We can't actually "read" them all immediately without performance hit,
      // but we can list them. Reading happens on click.
      // We need to store these file objects in memory to read them later!

      // We'll create a simple virtual FS from these files
      const rootPath = files[0].webkitRelativePath.split('/')[0];

      // Store files in a global map for retrieval
      window.browserFileMap = window.browserFileMap || {};
      const fileList = [];

      files.forEach(file => {
        // file.webkitRelativePath e.g. "folder/sub/file.md"
        // We want to display them.
        // For simplicity in this demo, we'll just show the top-level files or flat list?
        // Let's just mock the tree with these files.
        window.browserFileMap[file.webkitRelativePath] = file;

        // Allow reading
        // We need a way to pass the actual File object to read it later.
        // Our file tree renderer usually takes a path.
        // We'll use the relative path as the ID.

        // Only add markdown/txt files to list to avoid clutter
        if (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.markdown')) {
          fileList.push({
            name: file.name, // Display name
            path: file.webkitRelativePath, // ID for retrieval
            is_dir: false,
            fileObject: file // Store reference
          });
        }
      });

      // Render this custom list directly?
      // Reuse renderFileTree logic?
      // renderFileTree expects a specific struct.
      renderFileTree(fileList, rootPath);

      // Update global state
      currentFolderPath = rootPath;
      showToast(`已加载文件夹: ${rootPath} (${fileList.length} files)`);

      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
    return;
  }

  return new Promise(async (resolve) => {
    try {
      const selected = await dialog.open({
        directory: true,
        multiple: false,
        defaultPath: await homeDir()
      })

      if (selected) {
        currentFolderPath = selected
        await refreshFileTree(selected)
      }
    } catch (error) {
      console.error('打开文件夹失败:', error)
      showToast('打开文件夹失败: ' + error.message, 'error')
    }
  });
}

// Helper to read browser file object
function readBrowserFile(path) {
  const file = window.browserFileMap ? window.browserFileMap[path] : null;
  if (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
  // Fallback to mock text if not found (e.g. welcome.md)
  return browserFS.get(path);
}

// 刷新文件树
export async function refreshFileTree(folderPath) {
  try {
    showLoadingState()

    let files = [];
    if (!isTauri) {
      // Mock files
      await new Promise(r => setTimeout(r, 500)); // Simulate delay
      files = browserFS.list(folderPath || 'root');
    } else {
      files = await invoke('read_directory', { path: folderPath || currentFolderPath })
    }

    renderFileTree(files, folderPath)
  } catch (error) {
    console.error('读取目录失败:', error)
    showToast('读取目录失败', 'error')
  }
}

// 渲染文件树
function renderFileTree(files, basePath) {
  const fileTree = document.getElementById('fileTree')
  if (!fileTree) return
  fileTree.innerHTML = ''

  if (!files || files.length === 0) {
    const emptyState = document.createElement('div')
    emptyState.style.cssText = `
      padding: 40px 24px;
      text-align: center;
      color: var(--text-tertiary);
      font-size: 13px;
    `
    emptyState.innerHTML = `
      <p>暂无文件</p>
    `
    fileTree.appendChild(emptyState)
    return
  }

  // Sort: directories first, then files
  files.sort((a, b) => {
    if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
    return a.is_dir ? -1 : 1;
  });

  files.forEach((file, index) => {
    const item = document.createElement('div')
    item.className = 'file-item'
    item.onclick = (e) => handleFileClick(file, e)
    item.oncontextmenu = (e) => showContextMenu(e, file)
    item.style.animation = `fadeIn 0.2s ease forwards`
    item.style.animationDelay = `${index * 0.02}s`

    const icon = document.createElement('span')
    icon.className = 'file-icon'
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';

    if (file.is_dir) {
      // Folder Icon
      icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
    } else {
      // File Icon
      const extension = file.name.split('.').pop().toLowerCase()
      if (['md', 'markdown'].includes(extension)) {
        icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
      } else {
        icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`
      }
    }

    const name = document.createElement('span')
    name.textContent = file.name
    name.style.cssText = `
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    `

    item.appendChild(icon)
    item.appendChild(name)
    fileTree.appendChild(item)
  })
}

// 显示右键菜单
function showContextMenu(e, file) {
  e.preventDefault()

  // 移除现有菜单
  const existingMenu = document.querySelector('.context-menu')
  if (existingMenu) {
    existingMenu.remove()
  }

  // 创建菜单
  const menu = document.createElement('div')
  menu.className = 'context-menu'
  // Styles handled by CSS class in updated index.html, but ensuring positioning
  menu.style.cssText = `
    position: fixed;
    left: ${e.clientX}px;
    top: ${e.clientY}px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 6px;
    z-index: 1000;
    box-shadow: var(--shadow-lg);
    min-width: 120px;
  `

  // 菜单项
  const menuItems = []

  if (!file.is_dir) {
    menuItems.push(
      { text: '打开', action: () => handleFileClick(file) },
      { text: '重命名', action: () => renameFile(file) },
      { text: '删除', action: () => deleteFileItem(file) }
    )
  } else {
    // Directories (limited support in browser mock)
    if (isTauri) {
      menuItems.push(
        { text: '打开', action: () => refreshFileTree(file.path) }
      )
    }
  }

  menuItems.forEach(item => {
    const menuItem = document.createElement('div')
    menuItem.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-primary);
      border-radius: var(--radius-sm);
      transition: background 0.1s;
    `
    menuItem.textContent = item.text
    menuItem.onmouseenter = () => menuItem.style.background = 'var(--bg-tertiary)'
    menuItem.onmouseleave = () => menuItem.style.background = 'transparent'
    menuItem.onclick = () => {
      item.action()
      menu.remove()
    }
    menu.appendChild(menuItem)
  })

  document.body.appendChild(menu)

  // 点击其他地方关闭菜单
  setTimeout(() => {
    document.addEventListener('click', function closeMenu() {
      menu.remove()
      document.removeEventListener('click', closeMenu)
    })
  }, 100)
}

// 重命名文件
async function renameFile(file) {
  if (!isTauri) { showToast("Renaming not supported in demo"); return; }
  const newName = prompt('请输入新名称:', file.name)
  if (newName && newName !== file.name) {
    try {
      const dirPath = file.path.substring(0, file.path.lastIndexOf('/'))
      const newPath = dirPath + '/' + newName

      await invoke('rename_file', {
        old_path: file.path,
        new_path: newPath
      })

      refreshFileTree(dirPath)
    } catch (error) {
      console.error('重命名失败:', error)
      showToast('重命名失败: ' + error.message, 'error')
    }
  }
}

// 删除文件
async function deleteFileItem(file) {
  if (!isTauri) { showToast("Deleting not supported in demo"); return; }
  if (confirm(`确定要删除 "${file.name}" 吗？`)) {
    try {
      await invoke('delete_file', { path: file.path })

      if (window.currentFilePath === file.path) {
        window.newFile()
      }

      const dirPath = file.path.substring(0, file.path.lastIndexOf('/'))
      refreshFileTree(dirPath)
    } catch (error) {
      console.error('删除失败:', error)
      showToast('删除失败: ' + error.message, 'error')
    }
  }
}

// 处理文件点击
async function handleFileClick(file, event) {
  if (!file.is_dir) {
    try {
      let content = '';
      if (isTauri) {
        content = await fs.readTextFile(file.path)
      } else {
        // Updated to use helper which supports both mock and real files
        content = await readBrowserFile(file.path);
      }

      window.currentFilePath = file.path

      // 更新编辑器内容
      if (window.editor && window.editor.state && window.editor.state.doc) {
        window.editor.dispatch({
          changes: {
            from: 0,
            to: window.editor.state.doc.length,
            insert: content
          }
        })
      } else {
        console.warn('编辑器未初始化，无法更新内容')
      }

      // 更新预览
      if (window.updatePreview) {
        window.updatePreview(content)
      }

      // 更新状态栏
      const filePathEl = document.getElementById('filePath');
      if (filePathEl) filePathEl.textContent = file.name;

      // 更新活动状态
      document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('active')
      })
      if (event && event.currentTarget) {
        event.currentTarget.classList.add('active')
      }
    } catch (error) {
      console.error('读取文件失败:', error)
      showToast('读取文件失败: ' + error.message, 'error')
    }
  }
}

// 初始化时加载主目录
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      if (isTauri) {
        const home = await homeDir()
        refreshFileTree(home)
      } else {
        // Browser Init
        console.log("MarkFlow running in browser mode.");
        refreshFileTree('root'); // load mock
      }
    } catch (error) {
      console.error('无法加载主目录:', error)
    }
  })
}