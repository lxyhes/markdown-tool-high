// 标签页管理器
import { EditorState } from '@codemirror/state'
import { MarkDraw } from './whiteboard.js'

export class TabManager {
  constructor(editorView, callbacks) {
    this.editor = editorView;
    this.tabs = []; // Array of { id, path, name, content, state, isDirty, type (md|draw), drawInstance }
    this.activeTabId = null;
    this.container = document.getElementById('tab-bar');
    
    // UI Elements
    this.editorPane = document.getElementById('editorPane');
    this.drawPane = document.getElementById('drawPane'); // Need to create this in index.html
    
    // Callbacks provided by main.js to handle editor actions
    // createNewState: (content) => EditorState
    this.callbacks = callbacks || {};
    
    this.render();
  }

  // Generate a unique ID
  generateId() {
    return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // Determine file type
  getFileType(path) {
      if (!path) return 'md';
      return path.endsWith('.draw') || path.endsWith('.excalidraw') ? 'draw' : 'md';
  }

  // Add a new tab or switch to existing
  openTab(fileInfo) {
    // fileInfo: { path, content, name }
    const existing = this.tabs.find(t => t.path === fileInfo.path);
    if (existing) {
      this.switchTab(existing.id);
      return;
    }

    this.saveCurrentState();
    
    const type = this.getFileType(fileInfo.path);

    const newTab = {
      id: this.generateId(),
      path: fileInfo.path,
      name: fileInfo.name || (fileInfo.path ? fileInfo.path.split(/[/\\]/).pop() : (type === 'draw' ? '绘图.draw' : '未命名')),
      content: fileInfo.content || (type === 'draw' ? '[]' : ''),
      type: type,
      state: null, 
      drawInstance: null,
      isDirty: false
    };

    this.tabs.push(newTab);
    this.switchTab(newTab.id);
  }

  newTab(type = 'md') {
    this.saveCurrentState();
    const newTab = {
      id: this.generateId(),
      path: null,
      name: type === 'draw' ? '未命名.draw' : '未命名',
      content: type === 'draw' ? '[]' : '',
      type: type,
      state: null,
      drawInstance: null,
      isDirty: false
    };
    this.tabs.push(newTab);
    this.switchTab(newTab.id);
  }

  closeTab(id, e) {
    if (e) e.stopPropagation();

    const index = this.tabs.findIndex(t => t.id === id);
    if (index === -1) return;
    
    // Cleanup
    const tab = this.tabs[index];
    if (tab.drawInstance) {
        // Cleanup if needed
    }

    this.tabs.splice(index, 1);

    if (this.activeTabId === id) {
      if (this.tabs.length > 0) {
        const nextTab = this.tabs[index] || this.tabs[this.tabs.length - 1];
        this.switchTab(nextTab.id);
      } else {
        this.newTab();
      }
    } else {
      this.render();
    }
  }

  switchTab(id) {
    const tab = this.tabs.find(t => t.id === id);
    if (!tab) return;

    if (this.activeTabId && this.activeTabId !== id) {
      this.saveCurrentState();
    }

    this.activeTabId = id;
    this.render();
    
    // Switch View based on Type
    if (tab.type === 'draw') {
        // Show Whiteboard
        this.editorPane.classList.add('hidden');
        if (this.drawPane) this.drawPane.classList.remove('hidden');
        
        // Hide Preview if open? Usually whiteboard takes full space
        // For simplicity, let's just show drawPane in place of editor
        
        // Init MarkDraw if not exists
        if (!this.drawPane) return; // Error safety
        
        // Clear previous draw content to avoid ghosting or create new container?
        // Better: One drawPane, re-init MarkDraw instance.
        
        // Check if we need to re-create instance
        // Actually MarkDraw is simple, we can just re-mount it.
        // Or keep instance in tab object?
        // DOM nodes can't be easily detached/reattached without losing state sometimes (canvas ok).
        // Let's re-create MarkDraw for now for simplicity.
        
        tab.drawInstance = new MarkDraw(this.drawPane, tab.content, (newData) => {
            tab.content = newData;
            if (!tab.isDirty) {
                tab.isDirty = true;
                this.render();
            }
        });
        
    } else {
        // Show Editor
        this.editorPane.classList.remove('hidden');
        if (this.drawPane) this.drawPane.classList.add('hidden');
        
        // Restore Editor State
        if (tab.state) {
          this.editor.setState(tab.state);
        } else {
          if (this.callbacks.createNewState) {
            const newState = this.callbacks.createNewState(tab.content);
            tab.state = newState;
            this.editor.setState(newState);
          }
        }
    }
    
    if (this.callbacks.onTabSwitched) {
      this.callbacks.onTabSwitched(tab);
    }
  }

  saveCurrentState() {
    if (!this.activeTabId) return;
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    if (tab) {
        if (tab.type === 'draw') {
            // Content is updated via callback in real-time or here?
            // MarkDraw saves to tab.content on change.
            // So we are good.
        } else {
            tab.state = this.editor.state;
            tab.content = this.editor.state.doc.toString();
        }
    }
  }

  setDirty(isDirty) {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    if (tab && tab.isDirty !== isDirty) {
      tab.isDirty = isDirty;
      this.render();
    }
  }

  updateCurrentTab(path) {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    if (tab) {
      tab.path = path;
      tab.name = path.split(/[/\\]/).pop();
      tab.isDirty = false;
      this.render();
    }
  }
  
  getCurrentTab() {
      return this.tabs.find(t => t.id === this.activeTabId);
  }

  render() {
    this.container.innerHTML = '';
    
    this.tabs.forEach(tab => {
      const el = document.createElement('div');
      el.className = `tab-item ${tab.id === this.activeTabId ? 'active' : ''}`;
      el.title = tab.path || '未保存文件';
      
      let icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
      
      if (tab.type === 'draw') {
          icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
      }

      el.innerHTML = `
        <span class="tab-icon">${icon}</span>
        <span class="tab-name">${tab.name}</span>
        ${tab.isDirty ? '<span class="tab-dirty">●</span>' : ''}
        <span class="tab-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </span>
      `;
      
      el.onclick = () => this.switchTab(tab.id);
      el.querySelector('.tab-close').onclick = (e) => this.closeTab(tab.id, e);
      el.onauxclick = (e) => {
          if (e.button === 1) {
              e.preventDefault(); 
              this.closeTab(tab.id, e);
          }
      };

      this.container.appendChild(el);
    });
    
    const activeEl = this.container.querySelector('.tab-item.active');
    if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}