import { createSignal, JSX } from "solid-js";
import { useEditorState, useDispatchCommand } from "../Editor";
import {
  setFontFamily,
  setParagraph,
  setHeading,
  wrapBulletList,
  wrapOrderedList,
  insertLink,
  insertImage,
  insertTable,
  insertMath,
} from "./toolbar_commands";
import {
  ToolbarDropdownWithLabels,
  ToolbarDropdown,
} from "./toolbar_components";
import { FONT_OPTIONS, HEADER_OPTIONS } from "./toolbar_options";
import { getCurrentListType } from "./toolbar_utils";

// --- Signals for Table Grid Selector popup state and position ---
export const [showTableSelector, setShowTableSelector] = createSignal(false);
export const [selectorPos, setSelectorPos] = createSignal<{
  top: number;
  left: number;
}>({ top: 0, left: 0 });

// --- Ref to the Insert Dropdown button, used for positioning the grid selector ---
let insertButtonRef: HTMLButtonElement | undefined;

// --- Toolbar Dropdowns Object ---
export const toolbarDropdowns: {
  fontFamilyDropdown?: JSX.Element;
  headerDropdown?: JSX.Element;
  listDropdown?: JSX.Element;
  insertDropdown?: JSX.Element;
  createDropdowns: () => void;
} = {
  createDropdowns() {
    // --- Accessors for editor state and command dispatcher ---
    const editorStateAccessor = useEditorState();
    const dispatchCommand = useDispatchCommand();

    // --- Font Family Dropdown ---
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

    // --- Header (Paragraph/Heading) Dropdown ---
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

    // --- List Dropdown (Bullet/Numbered) ---
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

    // --- Insert Dropdown (Link, Image, Table, Equation) ---
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
          {
            label: "Insert Table",
            icon: "bi-table",
            onClick: () => {
              // Position the grid selector under the Insert button
              if (insertButtonRef) {
                const rect = insertButtonRef.getBoundingClientRect();
                setSelectorPos({
                  top: rect.bottom + window.scrollY,
                  left: rect.left + window.scrollX,
                });
                setShowTableSelector(true);
              }
            },
          },
          {
            label: "Insert Equation",
            icon: "bi-calculator", // Use a valid Bootstrap icon
            onClick: () => {
              const equation = prompt("Enter LaTeX equation:", "E=mc^2");
              if (equation !== null) dispatchCommand(insertMath(equation));
            },
          },
        ]}
        title="Insert"
        ref={(el: HTMLButtonElement | undefined) => (insertButtonRef = el)}
      />
    );
  },
};
