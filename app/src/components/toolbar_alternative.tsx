import {
  Component,
  createSignal,
  onMount,
  onCleanup,
  For,
  JSX,
} from "solid-js";
import { undo, redo } from "prosemirror-history";
import "prosemirror-view/style/prosemirror.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
// import "bootstrap/dist/js/bootstrap.bundle.min.js"; // 1. Bootstrap JS commented out for manual control
import { useDispatchCommand, useEditorState } from "./Editor";
import { Mark, MarkType } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";
import {
  toggleBold,
  toggleItalic,
  toggleSuperscript,
  toggleSubscript,
  wrapBulletList,
  wrapOrderedList,
  setFontSize,
  setAlign,
  increaseIndent,
  decreaseIndent,
  toggleUnderline,
  insertLink,
  toggleStrikethrough,
  setFontFamily,
  toggleBlockquote,
  toggleCodeBlock,
  blockquoteActive,
  codeBlockActive,
  insertImage,
  setHeading,
  setParagraph,
} from "./toolbar_commands";

// --- Constants and Options ---

const ACCENT = "#D7E1FF";

// Font size options for the dropdown
const FONT_SIZES = [
  "8px",
  "9px",
  "10px",
  "11px",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "22px",
  "24px",
  "26px",
  "28px",
  "36px",
  "48px",
  "72px",
  "96px",
];

// Font family options for the dropdown
const FONT_OPTIONS = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
];

// Header (heading) options for the dropdown, with live preview
const HEADER_OPTIONS = [
  {
    label: (
      <span style={{ "font-size": "32px", "font-weight": 700, margin: 0 }}>
        Heading 1
      </span>
    ),
    value: 1,
  },
  {
    label: (
      <span style={{ "font-size": "24px", "font-weight": 700, margin: 0 }}>
        Heading 2
      </span>
    ),
    value: 2,
  },
  {
    label: (
      <span style={{ "font-size": "18.72px", "font-weight": 700, margin: 0 }}>
        Heading 3
      </span>
    ),
    value: 3,
  },
  {
    label: (
      <span style={{ "font-size": "16px", "font-weight": 400, margin: 0 }}>
        Normal
      </span>
    ),
    value: "paragraph",
  },
];

// Icons for alignment options
const ALIGN_ICON_MAP = {
  left: "bi-text-left",
  center: "bi-text-center",
  right: "bi-text-right",
  justify: "bi-justify",
};

// --- Toolbar Button Component ---
// Renders a single toolbar button with optional active/disabled state
const ToolbarButton: Component<{
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}> = (props) => (
  <button
    type="button"
    class="btn btn-sm px-2"
    style={{
      background: props.active ? ACCENT : "transparent",
      color: props.active ? "#1a237e" : "#212529",
      transition: "background 0.1s, color 0.1s",
      "box-shadow": "none",
      "margin-right": "2px",
      "margin-bottom": "2px",
      border: "none",
      "border-radius": "4px",
    }}
    title={props.label}
    aria-pressed={props.active ? "true" : "false"}
    disabled={props.disabled}
    onClick={(e) => {
      e.preventDefault();
      props.onClick();
      (e.currentTarget as HTMLButtonElement).blur();
    }}
    onMouseUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
    onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).blur()}
    onMouseOver={(e) => {
      if (!props.active) {
        (e.currentTarget as HTMLButtonElement).style.background = ACCENT;
      }
    }}
    onMouseOut={(e) => {
      if (!props.active) {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }
    }}
  >
    <i class={`bi ${props.icon} fs-5`} />
    <span class="visually-hidden">{props.label}</span>
  </button>
);

// --- Toolbar Dropdown Component ---
// Generic dropdown for toolbar actions (icon + options)
const ToolbarDropdown: Component<{
  icon: string;
  options: { label: string; icon: string; onClick: () => void }[];
  title?: string;
}> = (props) => {
  const [open, setOpen] = createSignal(false);
  let buttonRef: HTMLButtonElement | undefined;
  let menuRef: HTMLUListElement | undefined; // 4. Added menuRef

  // Close dropdown when clicking outside
  onMount(() => {
    const handler = (e: MouseEvent) => {
      // 5. Updated mousedown handler condition
      if (
        open() &&
        buttonRef && !buttonRef.contains(e.target as Node) &&
        menuRef && !menuRef.contains(e.target as Node)
      ) {
        setOpen(false);
        // Retaining this style reset as it was in your original specific request
        if (buttonRef) buttonRef.style.background = "#fff";
      }
    };
    document.addEventListener("mousedown", handler);
    onCleanup(() => document.removeEventListener("mousedown", handler));
  });

  return (
    <div
      class="dropdown mx-1"
      style={{
        display: "flex",
        "align-items": "center",
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        class="btn btn-sm dropdown-toggle d-flex align-items-center justify-content-center px-2"
        style={{
          height: "30px",
          "box-shadow": "none",
          "border-radius": "4px",
          border: "1.5px solid #dee2e6",
          background: open() ? ACCENT : "#fff",
          color: "#212529",
          transition: "background 0.1s, color 0.1s, border 0.1s",
        }}
        title={typeof props.title === "string" ? props.title : undefined}
        // data-bs-toggle="dropdown" // 2. Removed data-bs-toggle
        aria-expanded={open()}
        onClick={(e) => { // 3. Added e.stopPropagation()
          e.stopPropagation();
          setOpen(!open());
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = ACCENT)}
        onMouseOut={(e) =>
          !open() && (e.currentTarget.style.background = "#fff")
        }
      >
        <i class={`bi ${props.icon} fs-5`} style={{ color: "#212529" }} />
      </button>
      <ul
        ref={menuRef} // 4. Assigned menuRef
        class="dropdown-menu p-0"
        classList={{ show: open() }} // 6. Added classList to toggle .show
        style={{ "min-width": "40px" }}
      >
        <For each={props.options}>
          {(opt) => (
            <li>
              <button
                type="button"
                class="dropdown-item d-flex align-items-center justify-content-center"
                title={opt.label}
                onClick={() => {
                  opt.onClick();
                  setOpen(false);
                  if (buttonRef) buttonRef.style.background = "#fff";
                }}
              >
                <i class={`bi ${opt.icon} fs-5`} style={{ color: "#212529" }} />
              </button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
};

// --- Toolbar Dropdown With Labels ---
// Dropdown for options with custom labels (e.g., font, header), supports JSX labels
const ToolbarDropdownWithLabels: Component<{
  icon: string;
  options: { label: JSX.Element | string; icon: string; onClick: () => void }[];
  title?: string | JSX.Element;
}> = (props) => {
  const [open, setOpen] = createSignal(false);
  let buttonRef: HTMLButtonElement | undefined;
  let menuRef: HTMLUListElement | undefined; // 4. Added menuRef

  // Close dropdown when clicking outside
  onMount(() => {
    const handler = (e: MouseEvent) => {
      // 5. Updated mousedown handler condition
      if (
        open() &&
        buttonRef && !buttonRef.contains(e.target as Node) &&
        menuRef && !menuRef.contains(e.target as Node)
      ) {
        setOpen(false);
        // Retaining this style reset as it was in your original specific request
        if (buttonRef) buttonRef.style.background = "#fff";
      }
    };
    document.addEventListener("mousedown", handler);
    onCleanup(() => document.removeEventListener("mousedown", handler));
  });

  return (
    <div
      class="dropdown mx-1"
      style={{
        display: "flex",
        "align-items": "center",
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        class="btn btn-sm dropdown-toggle d-flex align-items-center justify-content-center px-2"
        style={{
          height: "30px",
          "box-shadow": "none",
          "border-radius": "4px",
          border: "1.5px solid #dee2e6",
          background: open() ? ACCENT : "#fff",
          color: "#212529",
          transition: "background 0.1s, color 0.1s, border 0.1s",
        }}
        title={typeof props.title === "string" ? props.title : undefined}
        // data-bs-toggle="dropdown" // 2. Removed data-bs-toggle
        aria-expanded={open()}
        onClick={(e) => { // 3. Added e.stopPropagation()
          e.stopPropagation();
          setOpen(!open());
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = ACCENT)}
        onMouseOut={(e) =>
          !open() && (e.currentTarget.style.background = "#fff")
        }
      >
        <i class={`bi ${props.icon} fs-5`} style={{ color: "#212529" }} />
        <span
          style={{
            "margin-left": props.icon ? "6px" : "0",
            "font-weight": "normal",
            "font-size": "1em",
            display: "flex",
            "align-items": "center",
            "justify-content": "flex-start",
            height: "100%",
            "min-width": "0",
            "max-width": "120px",
            overflow: "hidden",
            width: "auto",
            "white-space": "nowrap",
            "text-overflow": "ellipsis",
            "text-align": "left",
          }}
        >
          {props.title}
        </span>
      </button>
      <ul
        ref={menuRef} // 4. Assigned menuRef
        class="dropdown-menu p-0"
        classList={{ show: open() }} // 6. Added classList to toggle .show
        style={{ "min-width": "40px" }}
      >
        <For each={props.options}>
          {(opt) => (
            <li>
              <button
                type="button"
                class="dropdown-item d-flex align-items-center justify-content-center"
                title={typeof opt.label === "string" ? opt.label : undefined}
                onClick={() => {
                  opt.onClick();
                  setOpen(false);
                  if (buttonRef) buttonRef.style.background = "#fff";
                }}
                // Accent color on hover/focus for dropdown items
                onMouseOver={(e) => {
                  e.currentTarget.style.background = ACCENT;
                  e.currentTarget.style.color = "#1a237e";
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = ACCENT;
                  e.currentTarget.style.color = "#1a237e";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#212529";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#212529";
                }}
              >
                <i class={`bi ${opt.icon}`} style={{ color: "#212529" }} />
                <span
                  style={{
                    "margin-left": "6px",
                    // For font dropdown, preview the font
                    "font-family":
                      typeof opt.label === "string"
                        ? FONT_OPTIONS.find((f) => f.label === opt.label)?.value
                        : undefined,
                  }}
                >
                  {opt.label}
                </span>
              </button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
};

// --- Toolbar Separator ---
// Vertical line between toolbar groups
const ToolbarSeparator = () => (
  <div
    style={{
      width: "1px",
      height: "24px",
      background: ACCENT,
      margin: "0 8px",
    }}
  />
);

// --- Utility Functions ---

// Get current alignment from the selected block node
function getCurrentAlignment(
  state: EditorState,
): "left" | "center" | "right" | "justify" {
  const { $from } = state.selection;
  const node = $from.parent;
  return (node.attrs && node.attrs.align) || "left";
}

// Get current font size from selection or cursor
function getCurrentFontSize(state: EditorState) {
  const { from, $from, to, empty } = state.selection;
  if (empty) {
    const marks = state.storedMarks || $from.marks();
    const fontSizeMark = marks.find((mark) => mark.type.name === "fontSize");
    return fontSizeMark ? fontSizeMark.attrs.size : null;
  } else {
    let found = null;
    state.doc.nodesBetween(from, to, (node) => {
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === "fontSize") {
            found = mark.attrs.size;
          }
        });
      }
    });
    return found;
  }
}

// Get current list type (bullet or ordered) from selection
function getCurrentListType(state: EditorState): "bullet" | "ordered" | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "list") {
      return node.attrs.ordered ? "ordered" : "bullet";
    }
  }
  return null;
}

// Check if a mark is active in the current selection
function markActive(state: EditorState, type: MarkType) {
  const { from, $from, to, empty } = state.selection;
  if (empty) return !!type.isInSet(state.storedMarks || $from.marks());
  return state.doc.rangeHasMark(from, to, type);
}

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

  // Format Painter state: stores copied marks
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

  // Change font size and update input state
  function changeFontSize(size: string) {
    dispatchCommand(setFontSize(size));
    setFontSizeInput(size);
  }

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
      {/* Undo/Redo */}
      <ToolbarButton
        icon="bi-arrow-counterclockwise"
        label="Undo"
        onClick={() => dispatchCommand(undo)}
      />
      <ToolbarButton
        icon="bi-arrow-clockwise"
        label="Redo"
        onClick={() => dispatchCommand(redo)}
      />
      <ToolbarSeparator />

      {/* Format Painter */}
      <ToolbarButton
        icon="bi-brush"
        label="Format Painter"
        onClick={handleFormatPainter}
        active={!!formatMarks()}
      />
      <ToolbarSeparator />

      {/* Text Formatting */}
      <ToolbarButton
        icon="bi-type-bold"
        label="Bold"
        onClick={() => dispatchCommand(toggleBold)}
        active={
          editorStateAccessor
            ? markActive(
                editorStateAccessor(),
                editorStateAccessor().schema.marks.strong,
              )
            : false
        }
      />
      <ToolbarButton
        icon="bi-type-italic"
        label="Italic"
        onClick={() => dispatchCommand(toggleItalic)}
        active={
          editorStateAccessor
            ? markActive(
                editorStateAccessor(),
                editorStateAccessor().schema.marks.emphasis,
              )
            : false
        }
      />
      <ToolbarButton
        icon="bi-type-underline"
        label="Underline"
        onClick={() => dispatchCommand(toggleUnderline)}
        active={
          editorStateAccessor
            ? markActive(
                editorStateAccessor(),
                editorStateAccessor().schema.marks.underline,
              )
            : false
        }
      />
      <ToolbarButton
        icon="bi-type-strikethrough"
        label="Strikethrough"
        onClick={() => dispatchCommand(toggleStrikethrough)}
        active={
          editorStateAccessor
            ? markActive(
                editorStateAccessor(),
                editorStateAccessor().schema.marks.strikethrough,
              )
            : false
        }
      />
      <ToolbarButton
        icon="bi-superscript"
        label="Superscript"
        onClick={() => dispatchCommand(toggleSuperscript)}
        active={
          editorStateAccessor
            ? markActive(
                editorStateAccessor(),
                editorStateAccessor().schema.marks.superscript,
              )
            : false
        }
      />
      <ToolbarButton
        icon="bi-subscript"
        label="Subscript"
        onClick={() => dispatchCommand(toggleSubscript)}
        active={
          editorStateAccessor
            ? markActive(
                editorStateAccessor(),
                editorStateAccessor().schema.marks.subscript,
              )
            : false
        }
      />
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
