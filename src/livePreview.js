import { syntaxTree } from "@codemirror/language"
import { RangeSetBuilder } from "@codemirror/state"
import { Decoration, ViewPlugin, WidgetType, EditorView } from "@codemirror/view"
import katex from 'katex'
// Ensure CSS is loaded either here or global. Assuming global or main.js covers it. 
// If not, text logic works, style missing.

// --- Widgets ---

class ImageWidget extends WidgetType {
    constructor(url, alt) {
        super();
        this.url = url;
        this.alt = alt;
    }

    toDOM(view) {
        const div = document.createElement("div");
        div.className = "cm-image-container";
        div.style.textAlign = "center";

        const img = document.createElement("img");
        img.src = this.url;
        img.alt = this.alt;
        img.style.maxWidth = "100%";
        // Limit height to avoid massive layout shift
        img.style.maxHeight = "400px";
        img.style.borderRadius = "4px";
        img.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";

        // Handle error/broken link
        img.onerror = () => { img.style.display = 'none'; };

        div.appendChild(img);
        return div;
    }
}

class HRWidget extends WidgetType {
    toDOM() {
        const hr = document.createElement("hr");
        hr.className = "cm-hr-widget";
        return hr;
    }
}

class CheckboxWidget extends WidgetType {
    constructor(checked, pos) {
        super();
        this.checked = checked;
        this.pos = pos;
    }

    toDOM(view) {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = this.checked;
        input.className = "cm-checkbox-widget";
        input.style.marginRight = "0.5em";
        input.style.cursor = "pointer";

        input.onclick = (e) => {
            const charPos = this.pos + 1;
            const newChar = this.checked ? " " : "x";
            view.dispatch({
                changes: { from: charPos, to: charPos + 1, insert: newChar }
            });
            return true;
        }
        return input;
    }
}

class BulletWidget extends WidgetType {
    toDOM() {
        const span = document.createElement("span");
        span.textContent = "•";
        span.style.marginRight = "0.5em";
        span.style.fontWeight = "bold";
        span.style.color = "var(--accent-color)";
        return span;
    }
}

class MathWidget extends WidgetType {
    constructor(latex, displayMode) {
        super();
        this.latex = latex;
        this.displayMode = displayMode;
    }

    toDOM() {
        const span = document.createElement("span");
        span.className = this.displayMode ? "cm-math-block" : "cm-math-inline";
        span.style.cursor = "pointer"; // Indicate interactivity

        try {
            katex.render(this.latex, span, {
                displayMode: this.displayMode,
                throwOnError: false
            });
        } catch (e) {
            span.textContent = this.latex; // Fallback
            span.style.color = "red";
        }
        return span;
    }
}

// --- Live Preview Plugin ---

const livePreviewPlugin = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = this.computeDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
            this.decorations = this.computeDecorations(update.view);
        }
    }

    computeDecorations(view) {
        const builder = new RangeSetBuilder();
        const { state } = view;
        const selectionFrom = state.selection.main.from;
        const selectionTo = state.selection.main.to;
        const cursor = state.selection.main.head;
        const hasFocus = view.hasFocus; // Check focus

        // Helper to check if cursor is strictly inside a range (not edges)
        // Only reveal if editor has focus!
        const isTouching = (from, to) => hasFocus && (selectionTo >= from && selectionFrom <= to);

        for (const { from, to } of view.visibleRanges) {
            syntaxTree(state).iterate({
                from,
                to,
                enter: (node) => {
                    const nodeName = node.name;
                    const nodeFrom = node.from;
                    const nodeTo = node.to;

                    // 1. Images
                    if (nodeName === "Image") {
                        if (!isTouching(nodeFrom, nodeTo)) {
                            const text = state.sliceDoc(nodeFrom, nodeTo);
                            const match = /!\[(.*?)\]\((.*?)\)/.exec(text);
                            if (match) {
                                builder.add(nodeFrom, nodeTo, Decoration.replace({
                                    widget: new ImageWidget(match[2], match[1]),
                                    inclusive: false
                                }));
                            }
                        }
                        return false; // skip children
                    }

                    // 2. Links: [text](url) -> hide brackets and url
                    if (nodeName === "Link") {
                        if (!isTouching(nodeFrom, nodeTo)) {
                            const text = state.sliceDoc(nodeFrom, nodeTo);
                            // Simple parser: [text](url)
                            // We want to hide `[` and `](url)`
                            // regex: /^\[(.*?)\]\((.*?)\)$/
                            // We need exact ranges relative to nodeFrom
                            const match = /^\[(.*?)\](\(.*\))$/.exec(text);
                            if (match) {
                                const label = match[1];
                                const urlPart = match[2];

                                // Hide [
                                builder.add(nodeFrom, nodeFrom + 1, Decoration.replace({}));
                                // Hide ](url)
                                // position of ] is nodeFrom + 1 + label.length
                                const midStart = nodeFrom + 1 + label.length;
                                builder.add(midStart, nodeTo, Decoration.replace({}));
                            }
                        }
                    }

                    // 3. Math (Inline and Block)
                    if (nodeName === "InlineMath" || nodeName === "BlockMath") {
                        if (!isTouching(nodeFrom, nodeTo)) {
                            const text = state.sliceDoc(nodeFrom, nodeTo);
                            // Strip delimiters $...$ or $$...$$
                            let latex = text;
                            let displayMode = nodeName === "BlockMath";

                            if (displayMode) {
                                if (latex.startsWith("$$")) latex = latex.slice(2);
                                if (latex.endsWith("$$")) latex = latex.slice(0, -2);
                            } else {
                                if (latex.startsWith("$")) latex = latex.slice(1);
                                if (latex.endsWith("$")) latex = latex.slice(0, -1);
                            }

                            builder.add(nodeFrom, nodeTo, Decoration.replace({
                                widget: new MathWidget(latex, displayMode),
                                inclusive: false
                            }));
                        }
                    }

                    // 4. Headers: Hide Hash Marks (#)
                    // We only hide the MARKER, not the whole line.
                    if (node.name === "HeaderMark") {
                        const line = state.doc.lineAt(node.from);
                        // Reveal if cursor is on the line AND has focus
                        const isCursorOnLine = hasFocus && (cursor >= line.from && cursor <= line.to);
                        if (!isCursorOnLine) {
                            builder.add(node.from, node.to, Decoration.replace({}));
                            // Hide following space if exists
                            if (state.sliceDoc(node.to, node.to + 1) === " ") {
                                builder.add(node.to, node.to + 1, Decoration.replace({}));
                            }
                        }
                    }

                    // 5. Emphasis (Bold/Italic) marks
                    if (nodeName === "EmphasisMark") {
                        // Strict hiding, reveal if touching mark
                        if (!isTouching(nodeFrom, nodeTo)) {
                            builder.add(nodeFrom, nodeTo, Decoration.replace({}));
                        }
                    }

                    // 6. Inline Code backticks
                    if (nodeName === "InlineCode") {
                        if (!isTouching(nodeFrom, nodeTo)) {
                            const text = state.sliceDoc(nodeFrom, nodeTo);
                            const match = /^(`+)(.*)(`+)$/s.exec(text);
                            if (match) {
                                const startLen = match[1].length;
                                const endLen = match[3].length;
                                builder.add(nodeFrom, nodeFrom + startLen, Decoration.replace({}));
                                builder.add(nodeTo - endLen, nodeTo, Decoration.replace({}));
                            }
                        }
                    }

                    // 7. Quotes (>)
                    if (nodeName === "QuoteMark") {
                        const line = state.doc.lineAt(nodeFrom);
                        if (!(cursor >= line.from && cursor <= line.to)) {
                            builder.add(nodeFrom, nodeTo, Decoration.replace({}));
                            // Hide following space if exists
                            if (state.sliceDoc(nodeTo, nodeTo + 1) === " ") {
                                builder.add(nodeTo, nodeTo + 1, Decoration.replace({}));
                            }
                        }
                    }

                    // 8. Horizontal Rule
                    if (nodeName === "HorizontalRule") {
                        if (!isTouching(nodeFrom, nodeTo)) {
                            builder.add(nodeFrom, nodeTo, Decoration.replace({
                                widget: new HRWidget()
                            }));
                        }
                    }

                    // 9. Task Checkbox
                    if (nodeName === "TaskMarker") {
                        const text = state.sliceDoc(nodeFrom, nodeTo);
                        const checked = text.toLowerCase().includes("x");
                        builder.add(nodeFrom, nodeTo, Decoration.replace({
                            widget: new CheckboxWidget(checked, nodeFrom),
                            inclusive: true
                        }));
                        return false;
                    }

                    // 10. List Bullets
                    if (nodeName === "ListMark") {
                        const text = state.sliceDoc(nodeFrom, nodeTo).trim();
                        if (text === "-" || text === "*") {
                            builder.add(nodeFrom, nodeTo, Decoration.replace({
                                widget: new BulletWidget()
                            }));
                        }
                    }

                    // 11. Fenced Code Block Delimiters
                    // Structure: FencedCode -> CodeMark (```), CodeInfo (lang), ... content ..., CodeMark (```)
                    // We want to hide the delimiters if cursor is not inside the block.
                    // But FencedCode is a huge block.
                    // If cursor is inside content, we usually want to see delimiters?
                    // Typora: Only hide if cursor is NOT in the block. 
                    // Let's hide the top/bottom lines if cursor is not strictly inside.

                    if (nodeName === "FencedCode") {
                        // Check if cursor inside block
                        if (!isTouching(nodeFrom, nodeTo)) {
                            // Find children: CodeMark (start), CodeInfo, CodeMark (end)
                            // We can't iterate children easily inside enter() without re-traversal or cursor.

                            // Hack: Regex the content? Dangerous for big blocks.
                            // Better: Just hide the whole block markers?
                            // CodeMark nodes are children. Iterate will find them.
                            // How do we distinguish block fence from inline backtick?
                            // FencedCode children CodeMarks are lines usually.
                            // Let's use a specialized check when we encounter `CodeMark`?
                            // Parent determination is hard.

                            // Let's manually parse the first line and last line of FencedCode text.
                            // Start: ```lang
                            // End: ```
                            // We can build decorations based on line offsets.

                            const text = state.sliceDoc(nodeFrom, nodeTo);
                            const lines = text.split('\n');
                            if (lines.length >= 2) {
                                // Hide first line (including lang info)
                                const firstLineLen = lines[0].length;
                                builder.add(nodeFrom, nodeFrom + firstLineLen, Decoration.replace({
                                    widget: new LanguageBadgeWidget(lines[0].replace(/`/g, '').trim())
                                }));

                                // Hide last line if it is just backticks
                                const lastLine = lines[lines.length - 1];
                                if (lastLine.trim().startsWith("`") || lastLine.trim().startsWith("~")) {
                                    const lastLineStart = nodeTo - lastLine.length;
                                    builder.add(lastLineStart, nodeTo, Decoration.replace({}));
                                }
                            }
                        }
                    }
                }
            });
        }
        return builder.finish();
    }
}, {
    decorations: v => v.decorations
});

class LanguageBadgeWidget extends WidgetType {
    constructor(lang) {
        super();
        this.lang = lang || "text";
    }
    toDOM() {
        const span = document.createElement("span");
        span.className = "cm-lang-badge";
        span.textContent = this.lang;
        span.style.fontSize = "0.7em";
        span.style.padding = "2px 6px";
        span.style.borderRadius = "4px";
        span.style.background = "var(--bg-tertiary)";
        span.style.color = "var(--text-secondary)";
        span.style.userSelect = "none";
        span.style.marginBottom = "4px";
        span.style.display = "block";
        span.style.width = "fit-content";
        return span;
    }
}

export const livePreviewExtension = [
    livePreviewPlugin,
    EditorView.baseTheme({
        ".cm-image-container": {
            display: "block",
            margin: "0.5em 0",
            cursor: "default"
        },
        ".cm-hr-widget": {
            border: "none",
            borderTop: "2px solid var(--border-color)",
            margin: "1em 0"
        },
        ".cm-math-block": {
            display: "block",
            textAlign: "center",
            margin: "1em 0"
        }
    })
];
