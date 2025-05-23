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
import { createSignal, JSX } from "solid-js";
import { Mark } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";

type ButtonValues = {
  icon: string;
  label: string;
  onClick: () => boolean | void;
  active: () => boolean | undefined;
};

function buttonValuesToJSXElement(buttonValues: ButtonValues) {
    return <ToolbarButton
        icon={buttonValues.icon}
        label={buttonValues.label}
        onClick={buttonValues.onClick}
        active={buttonValues.active?.()}
      />;
  }

export const toolbarButtons: {
  undoButton?: JSX.Element;
  redoButton?: JSX.Element;
  formatButton?: JSX.Element;
  boldButton?: JSX.Element;
  italicsButton?: JSX.Element;
  underlineButton?: JSX.Element;
  strikeThroughButton?: JSX.Element;
  superscriptButton?: JSX.Element;
  subscriptButton?: JSX.Element;
  indentButton?: JSX.Element;
  outdentButton?: JSX.Element;
  quoteButton?: JSX.Element;
  codeButton?: JSX.Element;
  createButtons: () => void;
} = {
  createButtons() {
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

    this.undoButton = buttonValuesToJSXElement({
      icon: "bi-arrow-counterclockwise",
      label: "Undo",
      onClick: () => dispatchCommand(undo),
      active: () => undefined,
    });
    this.redoButton = buttonValuesToJSXElement({
      icon: "bi-arrow-clockwise",
      label: "Redo",
      onClick: () => dispatchCommand(redo),
      active: () => undefined,
    });
    this.formatButton = buttonValuesToJSXElement({
      icon: "bi-brush",
      label: "Format Painter",
      onClick: () => handleFormatPainter(),
      active: () => !!formatMarks(),
    });
    this.boldButton = buttonValuesToJSXElement({
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
    });
    this.italicsButton = buttonValuesToJSXElement({
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
    });
    this.underlineButton = buttonValuesToJSXElement({
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
    });
    this.strikeThroughButton = buttonValuesToJSXElement({
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
    });
    this.superscriptButton = buttonValuesToJSXElement({
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
    });
    this.subscriptButton = buttonValuesToJSXElement({
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
    });
    this.indentButton = buttonValuesToJSXElement({ //TODO indents do not work
      icon: "bi-caret-right",
      label: "Increase Indent",
      onClick: () => dispatchCommand(increaseIndent()),
      active: () => undefined,
    });
    this.outdentButton = buttonValuesToJSXElement({ //TODO indents do not work
      icon: "bi-caret-left",
      label: "Decrease Indent",
      onClick: () => dispatchCommand(decreaseIndent()),
      active: () => undefined,
    });
    this.quoteButton = buttonValuesToJSXElement({
      icon: "bi-blockquote-left",
      label: "Blockquote",
      onClick: () => dispatchCommand(toggleBlockquote),
      active: () =>
        editorStateAccessor ? blockquoteActive(editorStateAccessor()) : false,
    });
    this.codeButton = buttonValuesToJSXElement({
      icon: "bi-code",
      label: "Code Block",
      onClick: () => dispatchCommand(toggleCodeBlock),
      active: () =>
        editorStateAccessor ? codeBlockActive(editorStateAccessor()) : false,
    });
  }
}


