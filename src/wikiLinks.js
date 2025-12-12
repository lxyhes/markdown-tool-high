import { syntaxTree } from "@codemirror/language"
import { CompletionContext } from "@codemirror/autocomplete"
import { MatchDecorator, ViewPlugin, Decoration, WidgetType, EditorView } from "@codemirror/view"

// Mock file list
let fileListCache = ["README.md", "Todo.md", "Notes.md"];

export function updateWikiLinkFiles(files) {
    fileListCache = files;
}

// --- Wiki Link Widget ---
class WikiLinkWidget extends WidgetType {
    constructor(linkText) {
        super();
        this.linkText = linkText;
    }
    eq(other) { return this.linkText === other.linkText; }
    toDOM(view) {
        const span = document.createElement("span");
        span.className = "cm-wiki-link";
        span.textContent = this.linkText;
        span.style.color = "var(--accent-color)";
        span.style.textDecoration = "underline";
        span.style.cursor = "pointer";
        span.onclick = (e) => {
            e.preventDefault();
            console.log("Opening Wiki Link:", this.linkText);
            // TODO: Connect to main.js openFile
            if (window.openFileByName) {
                window.openFileByName(this.linkText);
            }
        };
        return span;
    }
}

// --- Live Preview Plugin (Regex Match) ---
const wikiLinkDecorator = new MatchDecorator({
    regexp: /\[\[(.*?)\]\]/g,
    decoration: match => Decoration.replace({
        widget: new WikiLinkWidget(match[1])
    })
})

export const wikiLinkPlugin = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorator = wikiLinkDecorator
        this.decorations = this.decorator.createDeco(view)
    }
    update(update) {
        this.decorations = this.decorator.updateDeco(update, this.decorations)
    }
}, {
    decorations: v => v.decorations
})


// --- Autocomplete ---
export function wikiLinkCompletion(context) {
    let word = context.matchBefore(/\[\[[^\]]*/)
    if (!word) return null
    if (word.from == word.to && !context.explicit) return null

    // remove [[ from start
    const text = word.text.slice(2);

    return {
        from: word.from + 2,
        options: fileListCache.map(file => ({
            label: file,
            type: "file",
            apply: file + "]]"
        }))
    }
}
