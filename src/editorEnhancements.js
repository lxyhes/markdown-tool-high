import { Decoration, ViewPlugin, MatchDecorator, EditorView } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'

// Header Styling Plugin
// Adds classes to header lines to allow for variable font sizes and spacing
export const headerPlugin = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = this.getDecorations(view)
    }

    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = this.getDecorations(update.view)
        }
    }

    getDecorations(view) {
        const builder = new RangeSetBuilder()

        for (const { from, to } of view.visibleRanges) {
            for (let pos = from; pos <= to;) {
                const line = view.state.doc.lineAt(pos)
                const text = line.text

                let className = ''
                if (text.startsWith('# ')) className = 'cm-h1-line'
                else if (text.startsWith('## ')) className = 'cm-h2-line'
                else if (text.startsWith('### ')) className = 'cm-h3-line'
                else if (text.startsWith('#### ')) className = 'cm-h4-line'
                else if (text.startsWith('##### ')) className = 'cm-h5-line'
                else if (text.startsWith('###### ')) className = 'cm-h6-line'
                else if (text.match(/^[-*+]\s/)) className = 'cm-list-line'
                else if (text.startsWith('> ')) className = 'cm-quote-line'
                else if (text.startsWith('```')) className = 'cm-codehead-line'

                if (className) {
                    builder.add(line.from, line.from, Decoration.line({ class: className }))
                }

                pos = line.to + 1
            }
        }

        return builder.finish()
    }
}, {
    decorations: v => v.decorations
})

// Checkbox Plugin (Interactive Task Lists)
// Replaces '- [ ]' with a real checkbox widget? 
// For now, let's just style them. Interactive widgets are complex to sync back to doc.

// Styling for the enhancements
export const editorEnhancementsTheme = EditorView.baseTheme({
    ".cm-h1-line": {
        fontSize: "2.2em",
        fontWeight: "bold",
        paddingTop: "0.8em",
        paddingBottom: "0.4em",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)"
    },
    ".cm-h2-line": {
        fontSize: "1.8em",
        fontWeight: "bold",
        paddingTop: "0.6em",
        paddingBottom: "0.3em",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)"
    },
    ".cm-h3-line": {
        fontSize: "1.4em",
        fontWeight: "bold",
        paddingTop: "0.5em",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)"
    },
    ".cm-h4-line": {
        fontSize: "1.2em",
        fontWeight: "bold",
        color: "var(--text-primary)"
    },
    ".cm-quote-line": {
        borderLeft: "4px solid var(--accent-color)",
        paddingLeft: "1em",
        color: "var(--text-secondary)",
        fontStyle: "italic",
        background: "var(--bg-tertiary)",
        margin: "0.4em 0"
    },
    ".cm-list-line": {
        paddingLeft: "0.5em"
    },
    ".cm-codehead-line": {
        color: "var(--text-tertiary)",
        fontFamily: "var(--font-mono)"
    }
})
