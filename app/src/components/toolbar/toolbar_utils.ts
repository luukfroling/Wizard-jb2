import type { EditorState } from "prosemirror-state";
import type { MarkType } from "prosemirror-model";

/**
 * Determine if the current selection is inside a bullet or ordered list.
 * Returns "bullet", "ordered", or null if not in a list.
 */
export function getCurrentListType(
    state: EditorState,
): "bullet" | "ordered" | null {
    const { $from } = state.selection;
    for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === "list") {
            return node.attrs.ordered ? "ordered" : "bullet";
        }
    }
    return null;
}

/**
 * Check if a given mark type is active in the current selection.
 * Returns true if the mark is active, false otherwise.
 */
export function markActive(state: EditorState, type: MarkType) {
    const { from, $from, to, empty } = state.selection;
    if (empty) return !!type.isInSet(state.storedMarks || $from.marks());
    return state.doc.rangeHasMark(from, to, type);
}
