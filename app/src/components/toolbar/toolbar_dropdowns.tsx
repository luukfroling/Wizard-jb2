import { createSignal, JSX } from "solid-js";
import { useEditorState, useDispatchCommand } from "../Editor";
import {
  setFontFamily,
  setParagraph,
  setHeading,
  setAlign,
  wrapBulletList,
  wrapOrderedList,
  insertLink,
  insertImage,
  setFontSize,
} from "./toolbar_commands";
import {
  ToolbarDropdownWithLabels,
  ToolbarDropdown,
} from "./toolbar_components";
import {
  FONT_OPTIONS,
  HEADER_OPTIONS,
  FONT_SIZES,
  ALIGN_ICON_MAP,
} from "./toolbar_options";
import {
  getCurrentFontSize,
  getCurrentAlignment,
  getCurrentListType,
} from "./toolbar_utils";

export const toolbarDropdowns: {
  fontFamilyDropdown?: JSX.Element;
  headerDropdown?: JSX.Element;
  fontSizeDropdown?: JSX.Element;
  alignmentDropdown?: JSX.Element;
  listDropdown?: JSX.Element;
  insertDropdown?: JSX.Element;
  createDropdowns: () => void;
} = {
  createDropdowns() {
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

    this.fontFamilyDropdown = (
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
    );
    this.headerDropdown = (
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
    );
    this.fontSizeDropdown = (
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
    );
    this.alignmentDropdown = (
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
    );
    this.listDropdown = (
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
    );
    this.insertDropdown = (
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
    );
  },
};
