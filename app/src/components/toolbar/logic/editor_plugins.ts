import {
    Plugin,
    Transaction,
    Selection,
    EditorState,
    NodeSelection,
} from "prosemirror-state";
import { keymap } from "prosemirror-keymap";
import {
    splitListItem,
    sinkListItem,
    liftListItem,
} from "prosemirror-schema-list";
import { Schema } from "prosemirror-model";
import { TableMap } from "prosemirror-tables";
import { chainCommands } from "prosemirror-commands";
import { TextSelection } from "prosemirror-state";

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

function deleteTable(): import("prosemirror-state").Command {
    return (state, dispatch) => {
        const { $from } = state.selection;
        for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === "table") {
                const pos = $from.before(d);
                if (dispatch) {
                    let tr = state.tr.delete(pos, pos + node.nodeSize);

                    // After deletion, try to place the selection in a paragraph
                    let selPos = Math.min(pos, tr.doc.content.size - 1);
                    const nodeAtSel = tr.doc.nodeAt(selPos);

                    // If not a textblock, insert a paragraph
                    if (!nodeAtSel || !nodeAtSel.type.isTextblock) {
                        const paragraph = state.schema.nodes.paragraph.create();
                        tr = tr.insert(selPos, paragraph);
                        selPos++; // Move inside the new paragraph
                    }

                    tr = tr.setSelection(
                        Selection.near(tr.doc.resolve(selPos)),
                    );
                    dispatch(tr.scrollIntoView());
                }
                return true;
            }
        }
        const indexBefore = $from.index($from.depth - 1);
        if (indexBefore > 0) {
            const beforePos = $from.before($from.depth - 1);
            const nodeBefore = state.doc.nodeAt(beforePos);
            if (nodeBefore && nodeBefore.type.name === "table") {
                if (dispatch) {
                    let tr = state.tr.delete(
                        beforePos,
                        beforePos + nodeBefore.nodeSize,
                    );
                    const selPos = Math.min(beforePos, tr.doc.content.size - 1);
                    if (
                        !tr.doc.nodeAt(selPos) ||
                        tr.doc.nodeAt(selPos)?.type.isTextblock === false
                    ) {
                        const paragraph = state.schema.nodes.paragraph.create();
                        if (canInsertParagraph(tr, selPos)) {
                            tr = tr.insert(selPos, paragraph);
                        }
                    }
                    tr = tr.setSelection(
                        Selection.near(tr.doc.resolve(selPos)),
                    );
                    dispatch(tr.scrollIntoView());
                }
                return true;
            }
        }
        return false;
    };
}

function canInsertParagraph(stateOrTr: EditorState | Transaction, pos: number) {
    const $pos = stateOrTr.doc.resolve(pos);
    const schema =
        (stateOrTr as EditorState).schema ??
        (stateOrTr as Transaction).doc.type.schema;
    for (let d = $pos.depth; d >= 0; d--) {
        const index = $pos.index(d);
        const parent = $pos.node(d);
        if (
            parent &&
            parent.canReplaceWith(index, index, schema.nodes.paragraph)
        ) {
            return true;
        }
    }
    return false;
}

export function tableAndCodeExitKeymap(schema: Schema) {
    return keymap({
        "Shift-Enter": (state, dispatch) => {
            if (dispatch) {
                dispatch(
                    state.tr
                        .replaceSelectionWith(schema.nodes.hard_break.create())
                        .scrollIntoView(),
                );
            }
            return true;
        },
        "Mod-Enter": chainCommands((state, dispatch) => {
            if (inLastTableCell(state)) {
                return insertParagraphAfterTable()(state, dispatch);
            }
            if (state.selection.$from.parent.type.name === "code") {
                return insertParagraphAfterCodeBlock()(state, dispatch);
            }
            return false;
        }),
    });
}

export function tableDeleteKeymap() {
    return keymap({
        "Mod-Backspace": deleteTable(),
        "Mod-Delete": deleteTable(),
    });
}

export function mathDeleteKeymap(schema: Schema) {
    return keymap({
        "Mod-Backspace": (state, dispatch) => {
            const { $from } = state.selection;
            for (let d = $from.depth; d > 0; d--) {
                const node = $from.node(d);
                if (node.type === schema.nodes.math) {
                    const pos = $from.before(d);
                    if (dispatch) {
                        let tr = state.tr.setSelection(
                            NodeSelection.create(state.doc, pos),
                        );
                        tr = tr.deleteSelection();
                        dispatch(tr.scrollIntoView());
                    }
                    return true;
                }
            }
            return false;
        },
        "Mod-Delete": (state, dispatch) => {
            const { $from } = state.selection;
            for (let d = $from.depth; d > 0; d--) {
                const node = $from.node(d);
                if (node.type === schema.nodes.math) {
                    const pos = $from.before(d);
                    if (dispatch) {
                        let tr = state.tr.setSelection(
                            NodeSelection.create(state.doc, pos),
                        );
                        tr = tr.deleteSelection();
                        dispatch(tr.scrollIntoView());
                    }
                    return true;
                }
            }
            return false;
        },
    });
}

export function codeBlockKeymap(schema: Schema) {
    return keymap({
        "Shift-Enter": (state, dispatch) => {
            const { $from } = state.selection;
            for (let d = $from.depth; d > 0; d--) {
                if ($from.node(d).type === schema.nodes.code) {
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
                }
            }
            return false;
        },
        Tab: (state, dispatch) => {
            const { $from, $to } = state.selection;
            for (let d = $from.depth; d > 0; d--) {
                if ($from.node(d).type === schema.nodes.code) {
                    if (dispatch) {
                        let tr = state.tr;
                        if (state.selection.empty) {
                            tr = tr.insertText("  ");
                        } else {
                            const start = $from.pos;
                            const end = $to.pos;
                            let text = state.doc.textBetween(start, end, "\n");
                            text = text.replace(/^/gm, "  ");
                            tr = tr.replaceSelectionWith(
                                state.schema.text(text),
                            );
                            tr = tr.setSelection(
                                TextSelection.create(
                                    tr.doc,
                                    start,
                                    start + text.length,
                                ),
                            );
                        }
                        dispatch(tr.scrollIntoView());
                    }
                    return true;
                }
            }
            return false;
        },
        "Shift-Tab": (state, dispatch) => {
            const { $from, $to } = state.selection;
            for (let d = $from.depth; d > 0; d--) {
                if ($from.node(d).type === schema.nodes.code) {
                    if (dispatch) {
                        let tr = state.tr;
                        const start = $from.pos;
                        const end = $to.pos;
                        let text = state.doc.textBetween(start, end, "\n");
                        text = text.replace(/^ {1,2}/gm, "");
                        tr = tr.replaceSelectionWith(state.schema.text(text));
                        tr = tr.setSelection(
                            TextSelection.create(
                                tr.doc,
                                start,
                                start + text.length,
                            ),
                        );
                        dispatch(tr.scrollIntoView());
                    }
                    return true;
                }
            }
            return false;
        },
        "(": autoClosePair("(", ")", schema),
        "[": autoClosePair("[", "]", schema),
        "{": autoClosePair("{", "}", schema),
        '"': autoClosePair('"', '"', schema),
        "'": autoClosePair("'", "'", schema),
        "`": autoClosePair("`", "`", schema),
    });
}

function autoClosePair(open: string, close: string, schema: Schema) {
    return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        const { $from } = state.selection;
        for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type === schema.nodes.code) {
                if (dispatch) {
                    const tr = state.tr.insertText(open + close);
                    // Move cursor between the pair
                    const pos = state.selection.from + 1;
                    dispatch(
                        tr.setSelection(TextSelection.create(tr.doc, pos)),
                    );
                }
                return true;
            }
        }
        return false;
    };
}

export function tableAfterDeleteKeymap(schema: Schema) {
    return keymap({
        "Mod-Backspace": (state, dispatch) => {
            const { $from } = state.selection;
            if (!state.selection.empty) return false;
            if ($from.parent.type !== schema.nodes.paragraph) return false;
            const parentDepth = $from.depth - 1;
            if (parentDepth < 1) return false;
            const indexBefore = $from.index(parentDepth);
            if (indexBefore === 0) return false;
            const beforePos = $from.before(parentDepth);
            const nodeBefore = state.doc.nodeAt(beforePos);
            if (nodeBefore && nodeBefore.type.name === "table") {
                if (dispatch) {
                    let tr = state.tr.delete(
                        beforePos,
                        beforePos + nodeBefore.nodeSize,
                    );
                    // Ensure a paragraph remains for the cursor
                    const insertPos = beforePos;
                    if (
                        !tr.doc.nodeAt(insertPos) ||
                        !tr.doc.nodeAt(insertPos)?.type.isTextblock
                    ) {
                        tr = tr.insert(
                            insertPos,
                            schema.nodes.paragraph.create(),
                        );
                    }
                    const selPos = Math.min(insertPos, tr.doc.content.size - 1);
                    tr = tr.setSelection(
                        Selection.near(tr.doc.resolve(selPos)),
                    );
                    dispatch(tr.scrollIntoView());
                }
                return true;
            }
            // Prevent default join with table
            if (
                indexBefore > 0 &&
                nodeBefore &&
                nodeBefore.type.name === "table"
            )
                return true;
            // Otherwise, allow default
            return false;
        },
        Backspace: (state, dispatch) => {
            // Same as above, for plain Backspace
            const { $from } = state.selection;
            if (!state.selection.empty) return false;
            if ($from.parent.type !== schema.nodes.paragraph) return false;
            const parentDepth = $from.depth - 1;
            if (parentDepth < 1) return false;
            const indexBefore = $from.index(parentDepth);
            if (indexBefore === 0) return false;
            const beforePos = $from.before(parentDepth);
            const nodeBefore = state.doc.nodeAt(beforePos);
            if (nodeBefore && nodeBefore.type.name === "table") {
                if (dispatch) {
                    let tr = state.tr.delete(
                        beforePos,
                        beforePos + nodeBefore.nodeSize,
                    );
                    const insertPos = beforePos;
                    if (
                        !tr.doc.nodeAt(insertPos) ||
                        !tr.doc.nodeAt(insertPos)?.type.isTextblock
                    ) {
                        tr = tr.insert(
                            insertPos,
                            schema.nodes.paragraph.create(),
                        );
                    }
                    const selPos = Math.min(insertPos, tr.doc.content.size - 1);
                    tr = tr.setSelection(
                        Selection.near(tr.doc.resolve(selPos)),
                    );
                    dispatch(tr.scrollIntoView());
                }
                return true;
            }
            if (
                indexBefore > 0 &&
                nodeBefore &&
                nodeBefore.type.name === "table"
            )
                return true;
            return false;
        },
    });
}
