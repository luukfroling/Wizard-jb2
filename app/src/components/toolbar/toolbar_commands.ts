import { lift, toggleMark, wrapIn, setBlockType } from "prosemirror-commands";
import { schema } from "../../lib/schema";
import { EditorState, Transaction } from "prosemirror-state";
import { MarkType } from "prosemirror-model";
import {
    sinkListItem,
    liftListItem,
    wrapInList,
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
            // Optionally, insert placeholder text and apply link
            const text = state.schema.text(url);
            tr = tr.insert(from, text);
            tr = tr.addMark(
                from,
                from + url.length,
                markType.create({ url, title, reference: null }),
            );
        } else {
            tr = tr.addMark(from, to, markType.create({ url, title }));
        }

        if (dispatch) dispatch(tr.scrollIntoView());
        return true;
    };
}

// --- FONT FAMILY COMMAND ---

// Set font family mark for selection or cursor
export function setFontFamily(family: string) {
    return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        const { from, to, empty } = state.selection;
        const markType: MarkType = schema.marks.fontFamily;
        let tr = state.tr;

        if (!empty) {
            tr = tr.removeMark(from, to, markType);
            tr = tr.addMark(from, to, markType.create({ family }));
        } else {
            const marks = markType.isInSet(
                state.storedMarks || state.selection.$from.marks(),
            )
                ? (state.storedMarks || state.selection.$from.marks()).filter(
                      (m) => m.type !== markType,
                  )
                : state.storedMarks || state.selection.$from.marks();
            tr = tr.setStoredMarks([...marks, markType.create({ family })]);
        }

        if (dispatch) dispatch(tr);
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
        const { schema } = state; // removed 'selection'
        // Create a simple table: each row is a paragraph block
        const rowNodes = [];
        for (let r = 0; r < rows; r++) {
            const cellNodes = [];
            for (let c = 0; c < cols; c++) {
                cellNodes.push(schema.nodes.paragraph.create());
            }
            // For now, just use a block for each row (adjust if you add table_row/cell nodes)
            rowNodes.push(...cellNodes);
        }
        const table = schema.nodes.table.create(null, rowNodes);
        if (dispatch) {
            dispatch(state.tr.replaceSelectionWith(table).scrollIntoView());
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
