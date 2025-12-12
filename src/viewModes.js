import { ViewPlugin, EditorView, Decoration } from "@codemirror/view"
import { RangeSetBuilder, Compartment, EditorState } from "@codemirror/state"

// --- Typewriter Mode ---
// Keeps the cursor centered vertically in the viewport.
// We use a transaction extender to append the scroll effect to every relevant transaction.

export const typewriterScrollPlugin = EditorState.transactionExtender.of(tr => {
    // Scroll to center on every selection change or document change
    if (tr.selection || tr.docChanged) {
        const head = tr.newSelection.main.head;
        return {
            effects: EditorView.scrollIntoView(head, { y: "center" })
        }
    }
    return null;
});

// --- Focus Mode ---
// Dims all lines except the active one.

const focusModeTheme = EditorView.baseTheme({
    ".cm-content": {
        // We can't simply dim .cm-content because active line is inside it.
        // We need to dim all NON-active lines.
        // This requires styling active line differently or using opacity on lines.
    },
    ".cm-line": {
        transition: "opacity 0.2s ease",
        opacity: "0.3" // Default dimmed state for all lines in Focus Mode
    },
    ".cm-activeLine": {
        opacity: "1 !important" // Active line is fully visible
    },
    // Ensure active line background is subtle or transparent to focus on text
    ".cm-activeLine.cm-line": {
        opacity: "1 !important"
    }
});

// To implement Focus Mode, we simply add a Class to the top editor element?
// Or we wrap the Theme.
// Better: We export a Compartment that holds the Theme Extension for Focus.
// If enabled, we add the Theme.

// But CodeMirror's `activeLine` extension adds `.cm-activeLine` class to the WRAPPING div of the line.
// The `.cm-line` is inside or equivalent? 
// CodeMirror 6: `.cm-line` is user content. `.cm-activeLine` is added to the line wrapper usually.
// Let's verify structure. `cm-content > cm-line`.
// `highlightActiveLine` extension adds `cm-activeLine` class to the line DOM element.
// So `.cm-line.cm-activeLine` exists.
// So setting `.cm-line { opacity: 0.3 }` and `.cm-line.cm-activeLine { opacity: 1 }` should work!

// Compartments for toggling
export const typewriterCompartment = new Compartment();
export const focusModeCompartment = new Compartment();

// Functions to create the extensions
export function getTypewriterExtension(enabled) {
    return enabled ? typewriterScrollPlugin : [];
}

export function getFocusModeExtension(enabled) {
    return enabled ? focusModeTheme : [];
}
