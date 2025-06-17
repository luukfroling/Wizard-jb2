import {
    lift,
    toggleMark,
    wrapIn,
    setBlockType,
    autoJoin,
} from "prosemirror-commands";
import { schema } from "../../../lib/schema";
import { EditorState, Transaction } from "prosemirror-state";
import { MarkType, Schema, NodeType } from "prosemirror-model";
import {
    wrapInList,
    liftListItem,
    sinkListItem,
} from "prosemirror-schema-list";
// --- MARK COMMANDS ---

// Toggle strong/bold mark
export const toggleBold = toggleMark(schema.marks.strong);
// Toggle emphasis/italic mark
export const toggleItalic = toggleMark(schema.marks.emphasis);
// Toggle underline mark
export const toggleSuperscript = toggleMark(schema.marks.superscript);
// Toggle subscript mark
export const toggleSubscript = toggleMark(schema.marks.subscript);
// Toggle strikethrough mark
export const toggleStrikethrough = toggleMark(schema.marks.strikethrough);
// Toggle inline code
export const toggleInlineCode = toggleMark(schema.marks.code);

// --- BLOCK COMMANDS ---

// Wrap selection in blockquote
export const setBlockquote = wrapIn(schema.nodes.blockquote);
// Set selection as code block
export const setCodeBlock = setBlockType(schema.nodes.code);

// --- LIST COMMANDS ---

// Wrap selection in bullet (unordered) list
export const wrapBulletList = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
) => wrapInList(schema.nodes.list, { ordered: false })(state, dispatch);

// Wrap selection in ordered (numbered) list
export const wrapOrderedList = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
) => wrapInList(schema.nodes.list, { ordered: true })(state, dispatch);

// --- INDENT/OUTDENT COMMANDS ---

// Increase indent (sink list item)
export const increaseIndent = () => sinkListItem(schema.nodes.listItem);
// Decrease indent (lift list item)
export const decreaseIndent = () => liftListItem(schema.nodes.listItem);

// --- LINK COMMAND ---

// Toggle link mark for selection or cursor
export function insertLink(url = "", title = "") {
    return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        const { from, to, empty } = state.selection;
        const markType: MarkType = schema.marks.link;
        let tr = state.tr;

        if (empty) {
            const textNode = state.schema.text(title || url);
            tr = tr.insert(from, textNode);
            tr = tr.addMark(
                from,
                from + (title || url).length,
                markType.create({ url, title, reference: null }),
            );
        } else {
            tr = tr.addMark(from, to, markType.create({ url, title }));
        }

        if (dispatch) dispatch(tr.scrollIntoView());
        return true;
    };
}

// --- BLOCKQUOTE TOGGLE COMMAND ---

// Toggle blockquote for selection (multi-paragraph)
export function toggleBlockquote(
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
) {
    const { schema } = state;
    const { from, to } = state.selection;
    let inBlockquote = false;

    state.doc.nodesBetween(from, to, (node) => {
        if (node.type === schema.nodes.blockquote) inBlockquote = true;
    });

    if (inBlockquote) {
        // If already in blockquote, lift out
        return lift(state, dispatch);
    } else {
        // Otherwise, wrap in blockquote
        return wrapIn(schema.nodes.blockquote)(state, dispatch);
    }
}

// --- CODE BLOCK TOGGLE COMMAND ---

// Toggle code block for selection (multi-paragraph)
export function toggleCodeBlock(
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
) {
    const { schema } = state;
    const { from, to } = state.selection;
    let allCode = true;

    state.doc.nodesBetween(from, to, (node) => {
        if (node.isTextblock && node.type !== schema.nodes.code)
            allCode = false;
    });

    if (allCode) {
        // If all are code blocks, set them back to paragraph
        return setBlockType(schema.nodes.paragraph)(state, dispatch);
    } else {
        // Otherwise, set all to code block
        return setBlockType(schema.nodes.code)(state, dispatch);
    }
}

// --- ACTIVE STATE HELPERS ---

// Returns true if selection is inside a blockquote
export function blockquoteActive(state: EditorState) {
    const { from, to } = state.selection;
    let active = false;
    state.doc.nodesBetween(from, to, (node) => {
        if (node.type === state.schema.nodes.blockquote) active = true;
    });
    return active;
}

// Returns true if selection is inside a code block
export function codeBlockActive(state: EditorState) {
    const { from, to } = state.selection;
    let active = false;
    state.doc.nodesBetween(from, to, (node) => {
        if (node.type === state.schema.nodes.code) active = true;
    });
    return active;
}

// --- IMAGE COMMAND ---

// Insert image node at selection
export function insertImage(url: string, alt = "", title = "") {
    return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        const { schema, selection } = state;
        const imageNode = schema.nodes.image.create({
            url,
            alt,
            title,
            reference: null,
        });

        // If selection is empty, try to insert as a block
        if (selection.empty) {
            // Insert image as a new block after the current block
            const { $from } = selection;
            const pos = $from.after();
            if (dispatch) {
                dispatch(state.tr.insert(pos, imageNode).scrollIntoView());
            }
            return true;
        } else {
            // Replace selection with image
            if (dispatch) {
                dispatch(
                    state.tr.replaceSelectionWith(imageNode).scrollIntoView(),
                );
            }
            return true;
        }
    };
}

// --- HEADING/PARAGRAPH COMMANDS ---

// Set block type to heading with given level
export function setHeading(level: number) {
    return setBlockType(schema.nodes.heading, { level });
}

// Set block type to paragraph
export function setParagraph() {
    return setBlockType(schema.nodes.paragraph);
}

// --- TABLE COMMAND ---
// Insert a table with the given number of rows and columns
export function insertTable(rows: number, cols: number) {
    return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        const { schema } = state;
        const { table, table_row, table_cell, paragraph } = schema.nodes;

        const rowNodes = [];

        for (let r = 0; r < rows; r++) {
            const cellNodes = [];
            for (let c = 0; c < cols; c++) {
                const cellContent = paragraph.create();
                cellNodes.push(table_cell.create(null, cellContent));
            }
            rowNodes.push(table_row.create(null, cellNodes));
        }

        const tableNode = table.create(null, rowNodes);
        const before = paragraph.create();
        const after = paragraph.create();

        const content = state.schema.nodes.root
            ? state.schema.nodes.root.create(null, [before, tableNode, after])
            : state.schema.nodes.doc.create(null, [before, tableNode, after]);

        if (dispatch) {
            const tr = state.tr.replaceSelectionWith(content).scrollIntoView();
            dispatch(tr);
        }

        return true;
    };
}

// --- MATH COMMAND ---

// Insert math (equation) node at selection
export function insertMath(equation: string = "") {
    return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        const { schema } = state; // removed 'selection'
        const mathNode = schema.nodes.math.create(
            { enumerated: false },
            schema.text(equation),
        );
        if (dispatch) {
            dispatch(state.tr.replaceSelectionWith(mathNode).scrollIntoView());
        }
        return true;
    };
}

// Helper: check if selection is in a list and what type
function getListType(state: EditorState): boolean | null {
    const { $from } = state.selection;
    for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === "list") {
            return node.attrs.ordered; // true for ordered, false for bullet
        }
    }
    return null;
}

// Toggle bullet list
export function toggleBulletList(schema: Schema) {
    return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        const { listItem, list } = schema.nodes;
        if (selectionHasList(state, listItem)) {
            // Remove all lists in selection
            return liftListItems(state, dispatch) || false;
        } else {
            // Wrap all blocks in a bullet list and auto-join adjacent lists
            return autoJoin(
                wrapInList(list, { ordered: false }),
                (before, after) =>
                    before.type === after.type &&
                    before.type === list &&
                    before.attrs.ordered === after.attrs.ordered,
            )(state, dispatch);
        }
    };
}

// Toggle ordered list
export function toggleOrderedList(schema: Schema) {
    return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        const listType = getListType(state);
        if (listType === true) {
            // Already in ordered list: remove
            return liftListItem(schema.nodes.listItem)(state, dispatch);
        } else if (listType === false) {
            // In bullet list: lift out, then wrap as ordered
            if (dispatch) {
                liftListItem(schema.nodes.listItem)(state, dispatch);
                autoJoin(
                    wrapInList(schema.nodes.list, { ordered: true }),
                    (before, after) =>
                        before.type === after.type &&
                        before.type === schema.nodes.list &&
                        before.attrs.ordered === after.attrs.ordered,
                )(state, dispatch);
            }
            return true;
        } else {
            // Not in a list: wrap as ordered
            return autoJoin(
                wrapInList(schema.nodes.list, { ordered: true }),
                (before, after) =>
                    before.type === after.type &&
                    before.type === schema.nodes.list &&
                    before.attrs.ordered === after.attrs.ordered,
            )(state, dispatch);
        }
    };
}

// Helper: check if any listItem is in the selection
function selectionHasList(state: EditorState, listItemType: NodeType) {
    let found = false;
    state.doc.nodesBetween(state.selection.from, state.selection.to, (node) => {
        if (node.type === listItemType) found = true;
    });
    return found;
}

// Helper: lift all listItems in selection
function liftListItems(
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
) {
    const { tr, selection, schema } = state;
    let modified = false;
    state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.type === schema.nodes.listItem) {
            const $pos = tr.doc.resolve(tr.mapping.map(pos));
            const range = $pos.blockRange();
            if (range) {
                tr.lift(range, 0);
                modified = true;
            }
        }
    });
    if (modified && dispatch) dispatch(tr.scrollIntoView());
    return modified;
}
