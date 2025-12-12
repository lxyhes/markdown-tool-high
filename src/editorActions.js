import { showToast } from './utils.js'

let isSourceMode = false

export function toggleSourceMode() {
    isSourceMode = !isSourceMode
    const body = document.body

    if (isSourceMode) {
        body.classList.add('source-mode')
        showToast('已切换到源代码模式')

        // Inject source mode styles if not present
        if (!document.getElementById('source-mode-style')) {
            const style = document.createElement('style')
            style.id = 'source-mode-style'
            style.textContent = `
            body.source-mode .cm-content {
                font-family: var(--font-mono) !important;
            }
            body.source-mode .cm-line {
                font-family: var(--font-mono) !important;
                font-size: 14px !important; /* Reset header sizes */
                font-weight: normal !important; /* Reset bold */
                padding: 0 !important; /* Reset padding */
            }
            /* Reset specific header line classes from editorEnhancements */
            body.source-mode .cm-h1-line,
            body.source-mode .cm-h2-line,
            body.source-mode .cm-h3-line {
                font-size: 14px !important;
                font-weight: normal !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
            }
        `
            document.head.appendChild(style)
        }
    } else {
        body.classList.remove('source-mode')
        showToast('已切换到所见即所得模式')
    }
}

export function isSourceModeActive() {
    return isSourceMode
}
