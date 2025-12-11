import { dialog, fs } from '@tauri-apps/api'
import { homeDir } from '@tauri-apps/api/path'
import { invoke } from '@tauri-apps/api/tauri'
import { showToast, isMarkdownFile, formatDate } from './utils.js'

// 当前打开的文件夹路径
let currentFolderPath = ''

// 打开文件
export async function openFile() {
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
      refreshFileTree()
      return {
        path: selected,
        content: content
      }
    }
  } catch (error) {
    console.error('打开文件失败:', error)
    alert('打开文件失败: ' + error.message)
  }
  return null
}

// 保存文件
export async function saveFile(filePath, content) {
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
    console.log('文件已保存:', savePath)
    return savePath
  } catch (error) {
    console.error('保存文件失败:', error)
    alert('保存文件失败: ' + error.message)
    return null
  }
}

// 打开文件夹
export async function openFolder() {
  try {
    const selected = await dialog.open({
      directory: true,
      multiple: false,
      defaultPath: await homeDir()
    })

    if (selected) {
      await refreshFileTree(selected)
    }
  } catch (error) {
    console.error('打开文件夹失败:', error)
    alert('打开文件夹失败: ' + error.message)
  }
}

// 刷新文件树
export async function refreshFileTree(folderPath) {
  try {
    const files = await invoke('read_directory', { path: folderPath })
    renderFileTree(files, folderPath)
  } catch (error) {
    console.error('读取目录失败:', error)
  }
}

// 渲染文件树
function renderFileTree(files, basePath) {
  const fileTree = document.getElementById('fileTree')
  fileTree.innerHTML = ''

  files.forEach(file => {
    const item = document.createElement('div')
    item.className = 'file-item'
    item.onclick = () => handleFileClick(file)
    item.oncontextmenu = (e) => showContextMenu(e, file)

    const icon = document.createElement('svg')
    icon.className = 'file-icon'
    icon.viewBox = '0 0 24 24'
    icon.fill = 'currentColor'

    if (file.is_dir) {
      icon.innerHTML = '<path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>'
    } else {
      icon.innerHTML = '<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>'
    }

    const name = document.createElement('span')
    name.textContent = file.name

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
  menu.style.cssText = `
    position: fixed;
    background: #2d2d30;
    border: 1px solid #3e3e42;
    border-radius: 4px;
    padding: 4px 0;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `
  menu.style.left = e.clientX + 'px'
  menu.style.top = e.clientY + 'px'

  // 菜单项
  const menuItems = []

  if (!file.is_dir) {
    menuItems.push(
      { text: '打开', action: () => handleFileClick(file) },
      { text: '重命名', action: () => renameFile(file) },
      { text: '删除', action: () => deleteFileItem(file) }
    )
  } else {
    menuItems.push(
      { text: '打开文件夹', action: () => refreshFileTree(file.path) },
      { text: '重命名', action: () => renameFile(file) },
      { text: '删除', action: () => deleteFileItem(file) }
    )
  }

  menuItems.forEach(item => {
    const menuItem = document.createElement('div')
    menuItem.style.cssText = `
      padding: 6px 12px;
      cursor: pointer;
      font-size: 13px;
      color: #cccccc;
      white-space: nowrap;
    `
    menuItem.textContent = item.text
    menuItem.onmouseenter = () => menuItem.style.background = '#3e3e42'
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
  const newName = prompt('请输入新名称:', file.name)
  if (newName && newName !== file.name) {
    try {
      const dirPath = file.path.substring(0, file.path.lastIndexOf('/'))
      const newPath = dirPath + '/' + newName

      await invoke('rename_file', {
        old_path: file.path,
        new_path: newPath
      })

      // 刷新文件树
      refreshFileTree(dirPath)
    } catch (error) {
      console.error('重命名失败:', error)
      alert('重命名失败: ' + error.message)
    }
  }
}

// 删除文件
async function deleteFileItem(file) {
  if (confirm(`确定要删除 "${file.name}" 吗？`)) {
    try {
      await invoke('delete_file', { path: file.path })

      // 如果是当前打开的文件，清空编辑器
      if (window.currentFilePath === file.path) {
        window.newFile()
      }

      // 刷新文件树
      const dirPath = file.path.substring(0, file.path.lastIndexOf('/'))
      refreshFileTree(dirPath)
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败: ' + error.message)
    }
  }
}

// 处理文件点击
async function handleFileClick(file) {
  if (!file.is_dir) {
    try {
      const content = await fs.readTextFile(file.path)
      window.currentFilePath = file.path

      // 更新编辑器内容
      if (window.editor) {
        window.editor.dispatch({
          changes: {
            from: 0,
            to: window.editor.state.doc.length,
            insert: content
          }
        })
      }

      // 更新预览
      if (window.updatePreview) {
        window.updatePreview(content)
      }

      // 更新状态栏
      if (window.updateFilePathDisplay) {
        window.updateFilePathDisplay(file.path)
      }

      // 更新活动状态
      document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('active')
      })
      event.currentTarget.classList.add('active')
    } catch (error) {
      console.error('读取文件失败:', error)
      alert('读取文件失败: ' + error.message)
    }
  }
}

// 初始化时加载主目录
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      const home = await homeDir()
      showToast('文件夹打开成功')
      refreshFileTree(home)
    } catch (error) {
      console.error('无法加载主目录:', error)
    }
  })
}