import { redo, undo } from "prosemirror-history";
import {
    blockquoteActive,
    codeBlockActive,
    decreaseIndent,
    increaseIndent,
    toggleBlockquote,
  toggleBold,
  toggleCodeBlock,
  toggleItalic,
  toggleStrikethrough,
  toggleSubscript,
  toggleSuperscript,
  toggleUnderline,
} from "./toolbar_commands";
import { markActive } from "./toolbar_utils";
import { useDispatchCommand, useEditorState } from "../Editor";
import { ToolbarButton } from "./toolbar_components";
import { createSignal } from "solid-js";
import { Mark } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";

let buttonsCreated: boolean = false;

type ButtonValues = {
  icon: string;
  label: string;
  onClick: () => boolean | void;
  active: () => boolean | undefined;
};

export let undoButton: ButtonValues;
export let redoButton: ButtonValues;
export let formatButton: ButtonValues;
export let boldButton: ButtonValues;
export let italicsButton: ButtonValues;
export let underlineButton: ButtonValues;
export let strikeThroughButton: ButtonValues;
export let superscriptButton: ButtonValues;
export let subscriptButton: ButtonValues;
export let indentButton: ButtonValues;
export let outdentButton: ButtonValues;
export let quoteButton: ButtonValues;
export let codeButton: ButtonValues;

function buttonValuesToHtml(
  iconString: string,
  labelString: string,
  onClickFunction: () => boolean | void,
  activeBoolean: () => boolean | undefined,
) {
  return (
    <ToolbarButton
      icon={iconString}
      label={labelString}
      onClick={onClickFunction}
      active={activeBoolean?.()}
    />
  );
}
export function buttonToHtml(buttonValues: ButtonValues) {
    if(!buttonsCreated) throw new Error("Buttons not initialised");
  return buttonValuesToHtml(
    buttonValues.icon,
    buttonValues.label,
    buttonValues.onClick,
    buttonValues.active,
  );
}

export function createButtons() {
  const editorStateAccessor = useEditorState();
  const dispatchCommand = useDispatchCommand();
  const [formatMarks, setFormatMarks] = createSignal<Mark[] | null>(null);

  // Handles Format Painter button: copy or apply formatting
  function handleFormatPainter() {
    const state = editorStateAccessor && editorStateAccessor();
    if (!state) return;

    if (!formatMarks()) {
      // Copy: Save current marks at cursor or selection start
      const marks = state.storedMarks || state.selection.$from.marks();
      setFormatMarks(marks.length ? Array.from(marks) : null);
    } else {
      // Paste: Apply saved marks to selection or cursor
      const marks = formatMarks();
      if (!marks) return;
      const { from, to, empty } = state.selection;
      if (empty) {
        // Set stored marks for next input
        dispatchCommand(
          (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            if (dispatch) dispatch(state.tr.setStoredMarks(marks));
            return true;
          },
        );
      } else {
        // Add marks to selection
        dispatchCommand(
          (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            let tr = state.tr;
            marks.forEach((mark) => {
              tr = tr.addMark(from, to, mark);
            });
            if (dispatch) dispatch(tr);
            return true;
          },
        );
      }
      setFormatMarks(null); // Reset painter after applying
    }
  }

  undoButton = {
    icon: "bi-arrow-counterclockwise",
    label: "Undo",
    onClick: () => dispatchCommand(undo),
    active: () => undefined,
  };
  redoButton = {
    icon: "bi-arrow-clockwise",
    label: "Redo",
    onClick: () => dispatchCommand(redo),
    active: () => undefined,
  };
  formatButton = {
    icon: "bi-brush",
    label: "Format Painter",
    onClick: () => handleFormatPainter(),
    active: () => !!formatMarks(),
  };
  boldButton = {
    icon: "bi-type-bold",
    label: "Bold",
    onClick: () => dispatchCommand(toggleBold),
    active: () =>
      editorStateAccessor
        ? markActive(
            editorStateAccessor(),
            editorStateAccessor().schema.marks.strong,
          )
        : false,
  };
  italicsButton = {
    icon: "bi-type-italic",
    label: "Italic",
    onClick: () => dispatchCommand(toggleItalic),
    active: () =>
      editorStateAccessor
        ? markActive(
            editorStateAccessor(),
            editorStateAccessor().schema.marks.emphasis,
          )
        : false,
  };
  underlineButton = {
    icon: "bi-type-underline",
    label: "Underline",
    onClick: () => dispatchCommand(toggleUnderline),
    active: () =>
      editorStateAccessor
        ? markActive(
            editorStateAccessor(),
            editorStateAccessor().schema.marks.underline,
          )
        : false,
  };
  strikeThroughButton = {
    icon: "bi-type-strikethrough",
    label: "Strikethrough",
    onClick: () => dispatchCommand(toggleStrikethrough),
    active: () =>
      editorStateAccessor
        ? markActive(
            editorStateAccessor(),
            editorStateAccessor().schema.marks.strikethrough,
          )
        : false,
  };
  superscriptButton = {
    icon: "bi-superscript",
    label: "Superscript",
    onClick: () => dispatchCommand(toggleSuperscript),
    active: () =>
      editorStateAccessor
        ? markActive(
            editorStateAccessor(),
            editorStateAccessor().schema.marks.superscript,
          )
        : false,
  };
  subscriptButton = {
    icon: "bi-subscript",
    label: "Subscript",
    onClick: () => dispatchCommand(toggleSubscript),
    active: () =>
      editorStateAccessor
        ? markActive(
            editorStateAccessor(),
            editorStateAccessor().schema.marks.subscript,
          )
        : false,
  };
  
    indentButton = {
        icon: "bi-caret-right",
        label: "Increase Indent",
        onClick: () => dispatchCommand(increaseIndent()),
        active: () => undefined
    }
    outdentButton = {
        icon: "bi-caret-left",
        label: "Decrease Indent",
        onClick: () => dispatchCommand(decreaseIndent()),
        active: () => undefined
    }
    quoteButton = {
        icon: "bi-blockquote-left",
        label: "Blockquote",
        onClick: () => dispatchCommand(toggleBlockquote),
        active: () => editorStateAccessor ? blockquoteActive(editorStateAccessor()) : false
    }
    codeButton = {
        icon: "bi-code",
        label: "Code Block",
        onClick: () => dispatchCommand(toggleCodeBlock),
        active: () => editorStateAccessor ? codeBlockActive(editorStateAccessor()) : false
    }

  buttonsCreated = true;
}
