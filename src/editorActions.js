import { showToast } from './utils.js'
import { openFile } from './fileManager.js' // We might need fs access or dialog. 
// Actually openFile is for opening DOCUMENT. 
// For image, we need dialog.open.
import { dialog } from '@tauri-apps/api'

const isTauri = !!window.__TAURI_IPC__;

// --- Source Mode ---
let isSourceMode = false

export function toggleSourceMode() {
    isSourceMode = !isSourceMode
    const body = document.body

    if (isSourceMode) {
        body.classList.add('source-mode')
        showToast('已切换到源代码模式')

        if (!document.getElementById('source-mode-style')) {
            const style = document.createElement('style')
            style.id = 'source-mode-style'
            style.textContent = `
            body.source-mode .cm-content {
                font-family: var(--font-mono) !important;
            }
            body.source-mode .cm-line {
                font-family: var(--font-mono) !important;
                font-size: 14px !important;
                font-weight: normal !important;
                padding: 0 !important;
            }
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

// --- Editor Helpers ---
function getEditor() {
    return window.editor;
}

function insertText(text, cursorOffset = 0) {
    const editor = getEditor();
    if (!editor) return;

    editor.dispatch({
        changes: {
            from: editor.state.selection.main.head,
            insert: text
        },
        selection: { anchor: editor.state.selection.main.head + cursorOffset }
    })
    editor.focus()
}

function wrapSelection(before, after) {
    const editor = getEditor();
    if (!editor) return;

    const selection = editor.state.selection.main;
    const selectedText = editor.state.sliceDoc(selection.from, selection.to);

    editor.dispatch({
        changes: {
            from: selection.from,
            to: selection.to,
            insert: before + selectedText + after
        },
        selection: {
            anchor: selection.from + before.length,
            head: selection.from + before.length + selectedText.length
        }
    })
    editor.focus()
}

// --- Features ---

export function insertCodeBlock() {
    const editor = getEditor();
    if (!editor) return;

    // Check if selection exists
    const selection = editor.state.selection.main;
    const hasSelection = !selection.empty;
    const selectedText = editor.state.sliceDoc(selection.from, selection.to);

    if (hasSelection) {
        // Wrap existing text
        editor.dispatch({
            changes: {
                from: selection.from,
                to: selection.to,
                insert: "```\n" + selectedText + "\n```"
            }
        });
    } else {
        // Insert empty block and move cursor inside
        insertText("```\n\n```", 4); // Move cursor to middle line
    }
}

export function insertMathBlock() {
    const editor = getEditor();
    if (!editor) return;
    insertText("$$\n\n$$", 3);
}

export function insertLink() {
    wrapSelection("[", "](url)");
}

export function insertImage() {
    // If Tauri, offer file picker?
    if (isTauri) {
        // Implement Tauri image picker
        dialog.open({
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }]
        }).then(selected => {
            if (selected) {
                // Convert to relative or absolute path
                // For local files, we use absolute path. Preview handles it.
                const path = typeof selected === 'string' ? selected : selected[0];
                insertText(`![](${path})`);
            }
        })
    } else {
        // Simple fallback
        insertText("![](http://)");
    }
}

export function toggleBold() {
    wrapSelection("**", "**");
}

export function toggleItalic() {
    wrapSelection("*", "*");
}

export function toggleStrike() {
    wrapSelection("~~", "~~");
}

export function toggleQuote() {
    const editor = getEditor();
    if (!editor) return;
    const line = editor.state.doc.lineAt(editor.state.selection.main.head);

    if (line.text.startsWith('> ')) {
        // Remove
        editor.dispatch({
            changes: { from: line.from, to: line.from + 2, insert: '' }
        })
    } else {
        // Add
        editor.dispatch({
            changes: { from: line.from, insert: '> ' }
        })
    }
}

export function insertHorizontalRule() {
    const editor = getEditor();
    if (!editor) return;
    // ensure new line before
    insertText("\n---\n");
}
