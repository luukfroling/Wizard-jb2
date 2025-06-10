import { Plugin, Transaction, Selection, EditorState } from "prosemirror-state";
import { keymap } from "prosemirror-keymap";
import {
    splitListItem,
    sinkListItem,
    liftListItem,
} from "prosemirror-schema-list";
import { Schema } from "prosemirror-model";
import { TableMap } from "prosemirror-tables";
import { chainCommands, exitCode } from "prosemirror-commands";

// When pressing Enter, the marks at the cursor are lost on the new line.
// This plugin preserves the marks

export function preserveMarksPlugin() {
    return new Plugin({
        appendTransaction(transactions, oldState, newState) {
            const lastTr = transactions[transactions.length - 1];
            if (!lastTr || !lastTr.docChanged) return null;

            // Only run for cursor selections
            const { $from, empty } = newState.selection;
            if (!empty) return null;

            // Only run if a new textblock was created (usually Enter)
            if ($from.parentOffset !== 0) return null;

            // Prefer stored marks from oldState, otherwise use marks at cursor
            const prevStored = oldState.storedMarks;
            const prevMarks =
                prevStored && prevStored.length
                    ? prevStored
                    : oldState.selection.$from.marks();

            if (!prevMarks || prevMarks.length === 0) return null;

            return newState.tr.setStoredMarks(prevMarks);
        },
    });
}

export function customListKeymap(schema: Schema) {
    return keymap({
        Enter: (state, dispatch) => {
            // Try to split the list item (new item)
            if (splitListItem(schema.nodes.listItem)(state, dispatch))
                return true;
            // If not possible (empty item), lift out of the list (end the list)
            return liftListItem(schema.nodes.listItem)(state, dispatch);
        },
        Tab: sinkListItem(schema.nodes.listItem),
        "Shift-Tab": liftListItem(schema.nodes.listItem),
    });
}

function inLastTableCell(state: EditorState) {
    const { $from } = state.selection;
    // Find the nearest table node and its position
    for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === "table") {
            const table = node;
            const tableMap = TableMap.get(table);
            // Find the cell position relative to the table
            const cellPos = $from.pos - $from.start(d);
            // Find the actual cell index in the table map
            const cellIndex = tableMap.map.findIndex((pos) => pos === cellPos);
            return cellIndex === tableMap.map.length - 1;
        }
    }
    return false;
}

function insertParagraphAfterCodeBlock() {
    return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        const { $from } = state.selection;
        for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === "code") {
                const pos = $from.after(d);
                if (dispatch) {
                    const paragraph = state.schema.nodes.paragraph.create();
                    let tr = state.tr.insert(pos, paragraph);
                    const sel = Selection.near(tr.doc.resolve(pos + 1));
                    tr = tr.setSelection(sel);
                    dispatch(tr.scrollIntoView());
                }
                return true;
            }
        }
        return false;
    };
}

function insertParagraphAfterTable() {
    return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        const { $from } = state.selection;
        for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === "table") {
                const pos = $from.after(d);
                if (dispatch && canInsertParagraph(state, pos)) {
                    const paragraph = state.schema.nodes.paragraph.create();
                    let tr = state.tr.insert(pos, paragraph);
                    const sel = Selection.near(tr.doc.resolve(pos + 1));
                    tr = tr.setSelection(sel);
                    dispatch(tr.scrollIntoView());
                }
                return true;
            }
        }
        return false;
    };
}

function canInsertParagraph(state: EditorState, pos: number) {
    const $pos = state.doc.resolve(pos);
    // Check if we can insert a paragraph at this position
    for (let d = $pos.depth; d >= 0; d--) {
        const index = $pos.index(d);
        const parent = $pos.node(d);
        if (
            parent &&
            parent.canReplaceWith(index, index, state.schema.nodes.paragraph)
        ) {
            return true;
        }
    }
    return false;
}
export function tableAndCodeExitKeymap(schema: Schema) {
    return keymap({
        "Shift-Enter": chainCommands(
            (state, dispatch) => {
                if (inLastTableCell(state)) {
                    return insertParagraphAfterTable()(state, dispatch);
                }
                if (state.selection.$from.parent.type.name === "code") {
                    return insertParagraphAfterCodeBlock()(state, dispatch);
                }
                return false;
            },
            exitCode,
            (state, dispatch) => {
                // fallback: insert hard_break
                if (dispatch) {
                    dispatch(
                        state.tr
                            .replaceSelectionWith(
                                schema.nodes.hard_break.create(),
                            )
                            .scrollIntoView(),
                    );
                }
                return true;
            },
        ),
    });
}
