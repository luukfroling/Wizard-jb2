import { redo, undo } from "prosemirror-history";
import {
  blockquoteActive,
  decreaseIndent,
  increaseIndent,
  toggleBlockquote,
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
  toggleSubscript,
  toggleSuperscript,
  toggleCodeBlock,
} from "./toolbar_commands";
import { copyFormatPainter, applyFormatPainter, FormatPainterState } from "./toolbar_utils";
import { EditorContextType, useDispatchCommand, useEditorState } from "../../components/Editor";
import { ToolbarButton } from "../../components/toolbar/ToolbarButton";
import { createSignal, JSX } from "solid-js";
import { Mark } from "prosemirror-model";
import { markActive } from "./toolbar_utils";

function buttonValuesToJSXElement(buttonValues: {
  icon: string;
  label: string;
  onClick: () => boolean | void;
  active: () => boolean | undefined;
}) {
  return (
    <ToolbarButton
      icon={buttonValues.icon}
      label={buttonValues.label}
      onClick={buttonValues.onClick}
      active={buttonValues.active?.()}
    />
  );
}

export const toolbarButtons: {
  undoButton?: JSX.Element;
  redoButton?: JSX.Element;
  formatButton?: JSX.Element;
  boldButton?: JSX.Element;
  italicsButton?: JSX.Element;
  strikeThroughButton?: JSX.Element;
  superscriptButton?: JSX.Element;
  subscriptButton?: JSX.Element;
  indentButton?: JSX.Element;
  outdentButton?: JSX.Element;
  quoteButton?: JSX.Element;
  codeButton?: JSX.Element;
  createButtons: (ctx: EditorContextType) => void;
} = {
  createButtons(ctx: EditorContextType) {
    const { state, formatPainter, setFormatPainter } = ctx;
    const dispatchCommand = useDispatchCommand();

    // Handles Format Painter button: copy or apply formatting
    function handleFormatPainter() {
      const s = state();
      if (!s) return;

      if (formatPainter() === null) {
        setFormatPainter(copyFormatPainter(s));
      } else {
        dispatchCommand((state: any, dispatch: any) =>
          applyFormatPainter(formatPainter(), state, dispatch)
        );
        setFormatPainter(null);
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
      active: () => formatPainter() !== null,
    });
    this.boldButton = buttonValuesToJSXElement({
      icon: "bi-type-bold",
      label: "Bold",
      onClick: () => dispatchCommand(toggleBold),
      active: () => markActive(state(), state().schema.marks.strong),
    });
    this.italicsButton = buttonValuesToJSXElement({
      icon: "bi-type-italic",
      label: "Italic",
      onClick: () => dispatchCommand(toggleItalic),
      active: () => markActive(state(), state().schema.marks.emphasis),
    });
    this.strikeThroughButton = buttonValuesToJSXElement({
      icon: "bi-type-strikethrough",
      label: "Strikethrough",
      onClick: () => dispatchCommand(toggleStrikethrough),
      active: () => markActive(state(), state().schema.marks.strikethrough),
    });
    this.superscriptButton = buttonValuesToJSXElement({
      icon: "bi-superscript",
      label: "Superscript",
      onClick: () => dispatchCommand(toggleSuperscript),
      active: () => markActive(state(), state().schema.marks.superscript),
    });
    this.subscriptButton = buttonValuesToJSXElement({
      icon: "bi-subscript",
      label: "Subscript",
      onClick: () => dispatchCommand(toggleSubscript),
      active: () => markActive(state(), state().schema.marks.subscript),
    });
    this.indentButton = buttonValuesToJSXElement({
      icon: "bi-caret-right",
      label: "Increase Indent",
      onClick: () => dispatchCommand(increaseIndent()),
      active: () => undefined,
    });
    this.outdentButton = buttonValuesToJSXElement({
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
        state ? blockquoteActive(state()) : false,
    });
    this.codeButton = buttonValuesToJSXElement({
      icon: "bi-code",
      label: "Code Block",
      onClick: () => dispatchCommand(toggleCodeBlock),
      active: () =>
        state
          ? state().selection.$from.parent.type.name === "code_block"
          : false,
    });
  },
};
