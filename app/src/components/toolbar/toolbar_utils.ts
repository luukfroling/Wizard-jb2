import type { EditorState } from "prosemirror-state";
import type { MarkType } from "prosemirror-model";

/**
 * Get the current text alignment from the selection's parent node.
 * Defaults to "left" if not set.
 */
export function getCurrentAlignment(
    state: EditorState,
): "left" | "center" | "right" | "justify" {
    const { $from } = state.selection;
    const node = $from.parent;
    return (node.attrs && node.attrs.align) || "left";
}

/**
 * Get the current font size from the selection.
 * Returns the font size if a fontSize mark is present, otherwise null.
 */
export function getCurrentFontSize(state: EditorState) {
    const { from, $from, to, empty } = state.selection;
    if (empty) {
        // Cursor: check stored marks or marks at cursor
        const marks = state.storedMarks || $from.marks();
        const fontSizeMark = marks.find(
            (mark) => mark.type.name === "fontSize",
        );
        return fontSizeMark ? fontSizeMark.attrs.size : null;
    } else {
        // Selection: check all nodes in range for a fontSize mark
        let found = null;
        state.doc.nodesBetween(from, to, (node) => {
            if (node.marks) {
                node.marks.forEach((mark) => {
                    if (mark.type.name === "fontSize") {
                        found = mark.attrs.size;
                    }
                });
            }
        });
        return found;
    }
}

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
