import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

// CSS Variable Theme (Layout & Colors)
// This theme bridges CodeMirror with our CSS variables
export const dynamicTheme = EditorView.theme({
    "&": {
        color: "var(--color-text)",
        backgroundColor: "var(--color-background)",
        fontFamily: "var(--font-sans)" // Use Sans-Serif by default
    },
    ".cm-content": {
        caretColor: "var(--color-accent)"
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--color-accent)"
    },
    "&.cm-focused .cm-cursor": {
        borderLeftColor: "var(--color-accent)"
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: "var(--color-active)"
    },
    ".cm-gutters": {
        backgroundColor: "var(--color-sidebar)",
        color: "var(--color-text-secondary)",
        borderRight: "1px solid var(--color-border)",
        fontFamily: "var(--font-mono)"
    },
    ".cm-activeLine": {
        backgroundColor: "var(--color-hover)"
    },
    ".cm-activeLineGutter": {
        backgroundColor: "var(--color-hover)"
    }
}, { dark: false }) // Allow outside CSS to control dark/light via variables

// Syntax Highlighting (Tokens)
// Syntax Highlighting (Tokens)
export const dynamicHighlightStyle = HighlightStyle.define([
    { tag: tags.heading, color: "var(--color-text-primary)", fontWeight: "bold" },

    // Syntax (Muted) behavior
    { tag: tags.keyword, color: "var(--color-accent)" },
    { tag: tags.string, color: "var(--text-tertiary)" },

    { tag: tags.strong, fontWeight: "bold", color: "var(--color-text-primary)" },
    { tag: tags.emphasis, fontStyle: "italic" },

    { tag: tags.link, color: "var(--color-accent)", textDecoration: "underline" },
    { tag: tags.url, color: "var(--text-tertiary)" },

    // Code
    { tag: tags.monospace, color: "var(--color-accent)", fontFamily: "var(--font-mono)", backgroundColor: "var(--bg-tertiary)", borderRadius: "3px" },
    { tag: tags.labelName, color: "var(--text-tertiary)" }, // Code info string often maps here

    // Blockquote
    { tag: tags.quote, color: "var(--text-secondary)", fontStyle: "italic" }
])

export const dynamicHighlighter = syntaxHighlighting(dynamicHighlightStyle)
