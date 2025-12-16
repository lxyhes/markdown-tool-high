import { EditorView } from "@codemirror/view"
import { EditorState, StateField, StateEffect } from "@codemirror/state"

// --- Typewriter Mode ---
// Implemented via a StateField that controls whether the transaction extender is active.

// Effect to toggle typewriter mode
export const setTypewriterMode = StateEffect.define();

// StateField to hold the enabled state
export const typewriterState = StateField.define({
    create() { return false; },
    update(value, tr) {
        for (let effect of tr.effects) {
            if (effect.is(setTypewriterMode)) return effect.value;
        }
        return value;
    }
});

// Transaction Extender that only works when state is true
export const typewriterScrollPlugin = EditorState.transactionExtender.of(tr => {
    const isEnabled = tr.startState.field(typewriterState);
    
    // Only scroll if enabled AND (selection changed OR doc changed)
    if (isEnabled && (tr.selection || tr.docChanged)) {
        const head = tr.newSelection.main.head;
        return {
            effects: EditorView.scrollIntoView(head, { y: "center" })
        }
    }
    return null;
});

// Helper to toggle
export function toggleTypewriter(view, enable) {
    view.dispatch({
        effects: setTypewriterMode.of(enable)
    });
}

