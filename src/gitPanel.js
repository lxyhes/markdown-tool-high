import { gitService } from './gitService.js';
import { showToast } from './utils.js';

export class GitPanel {
    constructor() {
        this.container = document.getElementById('sidebar-content-git');
        this.fileListEl = document.getElementById('git-file-list');
        this.commitInput = document.getElementById('git-commit-message');
        this.refreshBtn = document.getElementById('git-refresh-btn');
        this.stageBtn = document.getElementById('git-stage-btn');
        this.commitBtn = document.getElementById('git-commit-btn');
        this.pushBtn = document.getElementById('git-push-btn');
        this.pullBtn = document.getElementById('git-pull-btn');
        
        this.initEvents();
    }

    initEvents() {
        this.refreshBtn.onclick = () => this.refreshStatus();
        this.stageBtn.onclick = () => this.stageAll();
        this.commitBtn.onclick = () => this.commit();
        this.pushBtn.onclick = () => this.push();
        this.pullBtn.onclick = () => this.pull();
    }

    async refreshStatus() {
        try {
            this.fileListEl.innerHTML = '<div class="loading">正在加载状态...</div>';
            const files = await gitService.getStatus();
            this.renderFileList(files);
        } catch (e) {
            this.fileListEl.innerHTML = `<div class="error">获取状态失败: ${e.message}</div>`;
        }
    }

    renderFileList(files) {
        this.fileListEl.innerHTML = '';
        if (files.length === 0) {
            this.fileListEl.innerHTML = '<div class="empty">暂无变动</div>';
            return;
        }

        files.forEach(f => {
            const item = document.createElement('div');
            item.className = 'git-file-item';
            
            let statusColor = 'var(--text-secondary)';
            if (f.status === 'M') statusColor = '#e2c08d'; // Yellow
            if (f.status === '??') statusColor = '#73c991'; // Green
            if (f.status === 'D') statusColor = '#f0883e'; // Red

            item.innerHTML = `
                <span class="git-status" style="color:${statusColor}">${f.status}</span>
                <span class="git-path" title="${f.file}">${f.file}</span>
            `;
            this.fileListEl.appendChild(item);
        });
    }

    async stageAll() {
        try {
            await gitService.stageAll();
            showToast('已暂存所有更改');
            this.refreshStatus();
        } catch (e) {
            showToast('暂存失败: ' + e.message, 'error');
        }
    }

    async commit() {
        const msg = this.commitInput.value.trim();
        if (!msg) {
            showToast('请输入提交信息', 'error');
            return;
        }
        try {
            await gitService.commit(msg);
            showToast('提交成功');
            this.commitInput.value = '';
            this.refreshStatus();
        } catch (e) {
            showToast('提交失败: ' + e.message, 'error');
        }
    }

    async push() {
        try {
            await gitService.push();
            showToast('推送成功');
        } catch (e) {
            showToast('推送失败: ' + e.message, 'error');
        }
    }
    
    async pull() {
        try {
            await gitService.pull();
            showToast('拉取成功');
            this.refreshStatus(); // Files might change
        } catch (e) {
            showToast('拉取失败: ' + e.message, 'error');
        }
    }
}

let panelInstance = null;
export function initGitPanel() {
    if (!panelInstance) {
        panelInstance = new GitPanel();
        panelInstance.refreshStatus(); // Initial load
    }
    return panelInstance;
}
