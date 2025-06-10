import { Plugin, Transaction, Selection, EditorState, NodeSelection } from "prosemirror-state";
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
            let cellPos = $from.pos - $from.start(d);
            // Find the actual cell index in the table map
            let cellIndex = tableMap.map.findIndex((pos) => pos === cellPos);
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
        // 1. If selection is inside a table, delete it
        for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === "table") {
                const pos = $from.before(d);
                if (dispatch) {
                    let tr = state.tr.delete(pos, pos + node.nodeSize);
                    // Try to set selection after the deleted table, or insert a paragraph if needed
                    let selPos = Math.min(pos, tr.doc.content.size - 1);
                    // If there's no valid node to select, insert a paragraph if allowed
                    if (tr.doc.nodeAt(selPos)?.type.name === "table") {
                        // Still a table, move after it
                        selPos = selPos + tr.doc.nodeAt(selPos)!.nodeSize;
                    }
                    // If selection is not valid, try to insert a paragraph
                    if (!tr.doc.nodeAt(selPos) || tr.doc.nodeAt(selPos)?.type.isTextblock === false) {
                        const paragraph = state.schema.nodes.paragraph.create();
                        if (canInsertParagraph(tr, selPos)) {
                            tr = tr.insert(selPos, paragraph);
                        }
                    }
                    tr = tr.setSelection(Selection.near(tr.doc.resolve(selPos)));
                    dispatch(tr.scrollIntoView());
                }
                return true;
            }
        }
        // 2. If selection is just after a table, delete the table before the cursor
        const indexBefore = $from.index($from.depth - 1);
        if (indexBefore > 0) {
            const beforePos = $from.before($from.depth - 1);
            const nodeBefore = state.doc.nodeAt(beforePos);
            if (nodeBefore && nodeBefore.type.name === "table") {
                if (dispatch) {
                    let tr = state.tr.delete(beforePos, beforePos + nodeBefore.nodeSize);
                    let selPos = Math.min(beforePos, tr.doc.content.size - 1);
                    if (!tr.doc.nodeAt(selPos) || tr.doc.nodeAt(selPos)?.type.isTextblock === false) {
                        const paragraph = state.schema.nodes.paragraph.create();
                        if (canInsertParagraph(tr, selPos)) {
                            tr = tr.insert(selPos, paragraph);
                        }
                    }
                    tr = tr.setSelection(Selection.near(tr.doc.resolve(selPos)));
                    dispatch(tr.scrollIntoView());
                }
                return true;
            }
        }
        return false;
    };
}

// Helper: accepts a Transaction as first arg
function canInsertParagraph(stateOrTr: EditorState | Transaction, pos: number) {
    const $pos = stateOrTr.doc.resolve(pos);
    // Get schema from EditorState or Transaction
    const schema = (stateOrTr as EditorState).schema ?? (stateOrTr as Transaction).doc.type.schema;
    for (let d = $pos.depth; d >= 0; d--) {
        const index = $pos.index(d);
        const parent = $pos.node(d);
        if (parent && parent.canReplaceWith(index, index, schema.nodes.paragraph)) {
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
                    dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView());
                }
                return true;
            }
        ),
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
            let tr = state.tr.setSelection(NodeSelection.create(state.doc, pos));
            tr = tr.deleteSelection();
            dispatch(tr.scrollIntoView());
          }
          return true;
        }
      }
      return false;
    },
    "Mod-Delete": (state, dispatch) => {
      // Same as above
      const { $from } = state.selection;
      for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type === schema.nodes.math) {
          const pos = $from.before(d);
          if (dispatch) {
            let tr = state.tr.setSelection(NodeSelection.create(state.doc, pos));
            tr = tr.deleteSelection();
            dispatch(tr.scrollIntoView());
          }
          return true;
        }
      }
      return false;
    }
  });
}

