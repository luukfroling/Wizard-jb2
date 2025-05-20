import { Component, createSignal } from "solid-js";
import "prosemirror-view/style/prosemirror.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useDispatchCommand, useEditorState } from "../Editor";
import {
  wrapBulletList,
  wrapOrderedList,
  setFontSize,
  setAlign,
  increaseIndent,
  decreaseIndent,
  insertLink,
  setFontFamily,
  toggleBlockquote,
  toggleCodeBlock,
  blockquoteActive,
  codeBlockActive,
  insertImage,
  setHeading,
  setParagraph,
} from "./toolbar_commands";
import {
  ToolbarButton,
  ToolbarDropdown,
  ToolbarDropdownWithLabels,
  ToolbarSeparator,
} from "./toolbar_components";
import {
  getCurrentAlignment,
  getCurrentFontSize,
  getCurrentListType,
} from "./toolbar_utils";
import {
  FONT_SIZES,
  FONT_OPTIONS,
  HEADER_OPTIONS,
  ALIGN_ICON_MAP,
} from "./toolbar_options";
import {
  boldButton,
  buildButtons,
  createButton,
  formatButton,
  italicsButton,
  redoButton,
  strikeThroughButton,
  subscriptButton,
  superscriptButton,
  underlineButton,
  undoButton,
} from "./toolbar_buttons";

// --- Main Toolbar Component ---
// The main toolbar with all formatting and insert controls
export const Toolbar: Component = () => {
  const editorStateAccessor = useEditorState();
  const dispatchCommand = useDispatchCommand();
  const [_fontSizeInput, setFontSizeInput] = createSignal(
    editorStateAccessor
      ? getCurrentFontSize(editorStateAccessor()) || "11"
      : "11",
  );

  // Change font size and update input state
  function changeFontSize(size: string) {
    dispatchCommand(setFontSize(size));
    setFontSizeInput(size);
  }

  buildButtons();

  // --- Render Toolbar ---
  return (
    <div
      class="d-flex align-items-center p-2 bg-light border-bottom flex-wrap"
      style={{
        position: "sticky",
        top: 0,
        "z-index": 100,
        background: "#fff",
      }}
    >
      {createButton(undoButton)}
      {createButton(redoButton)}
      <ToolbarSeparator />
      {createButton(formatButton)}
      <ToolbarSeparator />
      {createButton(boldButton)}
      {createButton(italicsButton)}
      {createButton(underlineButton)}
      {createButton(strikeThroughButton)}
      {createButton(superscriptButton)}
      {createButton(subscriptButton)}
      <ToolbarSeparator />

      {/* Font Family Dropdown */}
      <ToolbarDropdownWithLabels
        icon=""
        title={(() => {
          if (editorStateAccessor && editorStateAccessor()) {
            const state = editorStateAccessor();
            const marks = state.storedMarks || state.selection.$from.marks();
            const fontMark = marks.find(
              (mark) => mark.type.name === "fontFamily",
            );
            if (fontMark) {
              const found = FONT_OPTIONS.find(
                (f) => f.value === fontMark.attrs.family,
              );
              return found ? found.label : FONT_OPTIONS[0].label;
            }
          }
          return FONT_OPTIONS[0].label;
        })()}
        options={FONT_OPTIONS.map((font) => ({
          label: font.label,
          icon: "",
          onClick: () => {
            dispatchCommand(setFontFamily(font.value));
          },
        }))}
      />

      {/* Header Dropdown */}
      <ToolbarDropdownWithLabels
        icon=""
        title={(() => {
          if (editorStateAccessor && editorStateAccessor()) {
            const { $from } = editorStateAccessor().selection;
            const node = $from.parent;
            if (node.type.name === "heading") {
              return `Heading ${node.attrs.level}`;
            }
            return "Normal";
          }
          return "Normal";
        })()}
        options={HEADER_OPTIONS.map((opt) => ({
          label: opt.label,
          icon: "",
          onClick: () => {
            if (opt.value === "paragraph") {
              dispatchCommand(setParagraph());
            } else {
              dispatchCommand(setHeading(opt.value as number));
            }
          },
        }))}
      />

      {/* Font Size Dropdown */}
      <ToolbarDropdownWithLabels
        icon=""
        title={(() => {
          const size =
            editorStateAccessor && editorStateAccessor()
              ? getCurrentFontSize(editorStateAccessor())
              : null;
          return size ? size.replace("px", "") : "11";
        })()}
        options={FONT_SIZES.map((size) => ({
          label: size.replace("px", ""),
          icon: "",
          onClick: () => changeFontSize(size),
        }))}
      />
      <ToolbarSeparator />

      {/* Alignment Dropdown */}
      <ToolbarDropdown
        icon={
          ALIGN_ICON_MAP[
            editorStateAccessor && editorStateAccessor()
              ? getCurrentAlignment(editorStateAccessor())
              : "left"
          ]
        }
        options={[
          {
            label: "Left Align",
            icon: "bi-text-left",
            onClick: () => dispatchCommand(setAlign("left")),
          },
          {
            label: "Center Align",
            icon: "bi-text-center",
            onClick: () => dispatchCommand(setAlign("center")),
          },
          {
            label: "Right Align",
            icon: "bi-text-right",
            onClick: () => dispatchCommand(setAlign("right")),
          },
          {
            label: "Justify",
            icon: "bi-justify",
            onClick: () => dispatchCommand(setAlign("justify")),
          },
        ]}
        title="Text Alignment"
      />
      <ToolbarSeparator />

      {/* List Dropdown */}
      <ToolbarDropdown
        icon={(() => {
          if (editorStateAccessor && editorStateAccessor()) {
            const type = getCurrentListType(editorStateAccessor());
            return type === "ordered" ? "bi-list-ol" : "bi-list-ul";
          }
          return "bi-list-ul";
        })()}
        options={[
          {
            label: "Bullet List",
            icon: "bi-list-ul",
            onClick: () => dispatchCommand(wrapBulletList),
          },
          {
            label: "Numbered List",
            icon: "bi-list-ol",
            onClick: () => dispatchCommand(wrapOrderedList),
          },
        ]}
        title={(() => {
          if (editorStateAccessor && editorStateAccessor()) {
            const type = getCurrentListType(editorStateAccessor());
            return type === "ordered" ? "Numbered List" : "Bullet List";
          }
          return "Bullet List";
        })()}
      />

      {/* Indent/Outdent */}
      <ToolbarButton
        icon="bi-caret-right"
        label="Increase Indent"
        onClick={() => dispatchCommand(increaseIndent())}
      />
      <ToolbarButton
        icon="bi-caret-left"
        label="Decrease Indent"
        onClick={() => dispatchCommand(decreaseIndent())}
      />
      <ToolbarSeparator />

      {/* Blockquote and Code Block */}
      <ToolbarButton
        icon="bi-blockquote-left"
        label="Blockquote"
        onClick={() => dispatchCommand(toggleBlockquote)}
        active={
          editorStateAccessor ? blockquoteActive(editorStateAccessor()) : false
        }
      />
      <ToolbarButton
        icon="bi-code"
        label="Code Block"
        onClick={() => dispatchCommand(toggleCodeBlock)}
        active={
          editorStateAccessor ? codeBlockActive(editorStateAccessor()) : false
        }
      />
      <ToolbarSeparator />

      {/* Insert Dropdown (Link, Image, Table, Equation) */}
      <ToolbarDropdown
        icon="bi-plus-lg"
        options={[
          {
            label: "Insert Link",
            icon: "bi-link-45deg",
            onClick: () => {
              const url = prompt("Enter link URL:");
              if (url) dispatchCommand(insertLink(url));
            },
          },
          {
            label: "Insert Image",
            icon: "bi-image",
            onClick: () => {
              const url = prompt("Enter image URL:");
              if (url) dispatchCommand(insertImage(url));
            },
          },
          { label: "Insert Table", icon: "bi-table", onClick: () => {} },
          { label: "Insert Equation", icon: "bi-sigma", onClick: () => {} },
        ]}
        title="Insert"
      />
    </div>
  );
};

export default Toolbar;
