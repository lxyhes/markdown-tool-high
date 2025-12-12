import { showToast } from './utils.js'

// Simple helper to load scripts
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 渲染思维导图
export async function showMindmap(content) {
    showToast('正在生成思维导图...');

    try {
        await Promise.all([
            loadScript('https://cdn.jsdelivr.net/npm/d3@6'),
            loadScript('https://cdn.jsdelivr.net/npm/markmap-view@0.14.4')
        ]);

        // Transform Markdown to Markmap data
        const transformer = await loadTransformer();
        const { root } = transformer.transform(content);

        // Show Modal
        const modal = document.createElement('div');
        modal.id = 'mindmapModal';
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(30, 30, 30, 0.95);
            z-index: 3000;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
            border-bottom: 1px solid #333;
        `;
        toolbar.innerHTML = `
            <h3 style="margin:0; font-size: 18px;">💡 思维导图</h3>
            <div>
                <button id="closeMindmap" style="background:none; border:none; color:white; font-size:24px; cursor:pointer;">&times;</button>
            </div>
        `;

        // SVG Container
        const svgContainer = document.createElement('div');
        svgContainer.style.cssText = `flex: 1; overflow: hidden; width: 100%; height: 100%;`;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = `width: 100%; height: 100%;`;
        svg.id = 'markmap';
        svgContainer.appendChild(svg);

        modal.appendChild(toolbar);
        modal.appendChild(svgContainer);
        document.body.appendChild(modal);

        // Render
        setTimeout(() => {
            modal.style.opacity = '1';
            const { Markmap } = window.markmap;
            Markmap.create(svg, null, root);
        }, 50);

        // Close logic
        document.getElementById('closeMindmap').onclick = () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        };

    } catch (error) {
        console.error('Mindmap error:', error);
        showToast('思维导图生成失败', 'error');
    }
}

// Need separate transform lib which is larger, usually dynamic load is better
async function loadTransformer() {
    if (window.markmap && window.markmap.Transformer) {
        return new window.markmap.Transformer();
    }
    await loadScript('https://cdn.jsdelivr.net/npm/markmap-lib@0.14.4/dist/browser/index.min.js');
    return new window.markmap.Transformer();
}
