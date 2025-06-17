/* eslint-disable solid/prefer-for */
import { createSignal, JSX, Show } from "solid-js";
import { useEditorState, useDispatchCommand } from "../../Editor";
import {
  setParagraph,
  setHeading,
  toggleBulletList,
  toggleOrderedList,
  insertLink,
  insertImage,
  insertMath,
  insertTable,
} from "./toolbar_commands";
import { ToolbarDropdownWithLabels } from "../components/ToolbarDropdownWithLabels";
import { ToolbarDropdown } from "../components/ToolbarDropdown";
import { HEADER_OPTIONS } from "./toolbar_options";
import { getCurrentListType } from "./toolbar_utils";

// --- Signals for Table Grid Selector popup state and position ---
const [showTableSelector, setShowTableSelector] = createSignal(false);
const [hoverX, setHoverX] = createSignal(0);
const [hoverY, setHoverY] = createSignal(0);
let insertButtonRef: HTMLButtonElement | undefined;
const [_selectorPos, setSelectorPos] = createSignal<{
  top: number;
  left: number;
}>({ top: 0, left: 0 });

// --- Toolbar Dropdowns Object ---
export const toolbarDropdowns: {
  headerDropdown?: JSX.Element;
  listDropdown?: JSX.Element;
  insertDropdown?: JSX.Element;
  createDropdowns: () => void;
} = {
  createDropdowns() {
    // --- Accessors for editor state and command dispatcher ---
    const editorStateAccessor = useEditorState();
    const dispatchCommand = useDispatchCommand();

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
            onClick: () => {
              const state = editorStateAccessor && editorStateAccessor();
              if (state) {
                dispatchCommand(toggleBulletList(state.schema));
              }
            },
          },
          {
            label: "Numbered List",
            icon: "bi-list-ol",
            onClick: () => {
              const state = editorStateAccessor && editorStateAccessor();
              if (state) {
                dispatchCommand(toggleOrderedList(state.schema));
              }
            },
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
              if (!url) return;
              const text = prompt("Enter link text (displayed):", url) || url;
              dispatchCommand(insertLink(url, text));
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
            label: "Insert Equation",
            icon: "bi-calculator", // Use a valid Bootstrap icon
            onClick: () => {
              const equation = prompt("Enter LaTeX equation:", "E=mc^2");
              if (equation !== null) dispatchCommand(insertMath(equation));
            },
          },
          {
            label: "Insert Table",
            icon: "bi-table",
            onClick: () => {
              if (insertButtonRef) {
                const rect = insertButtonRef.getBoundingClientRect();
                setSelectorPos({
                  top: rect.bottom + window.scrollY + 4,
                  left: rect.left + window.scrollX,
                });
              }
              setShowTableSelector(true);
            },
          },
        ]}
        title="Insert"
        setButtonRef={(el) => {
          insertButtonRef = el;
        }}
      >
        <Show when={showTableSelector()}>
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "0",
              background: "#fff",
              padding: "8px",
              border: "1px solid #d7e1ff",
              "border-radius": "10px",
              "box-shadow": "0 2px 8px 0 #d7e1ff55",
              "z-index": 10000,
              display: "inline-block",
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseLeave={() => {
              setShowTableSelector(false);
            }}
          >
            <div style={{ display: "flex", "flex-direction": "column" }}>
              {[...Array(8)].map((_, r) => (
                <div style={{ display: "flex" }}>
                  {[...Array(8)].map((_, c) => {
                    const selected = r <= hoverY() && c <= hoverX();
                    return (
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          border: "1px solid #d7e1ff",
                          background: selected ? "#D7E1FF" : "#fff",
                          cursor: "pointer",
                          "border-radius": "4px",
                          margin: "1px",
                          transition: "background 0.1s",
                          display: "flex",
                          "align-items": "center",
                          "justify-content": "center",
                        }}
                        onMouseEnter={() => {
                          setHoverY(r);
                          setHoverX(c);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("Selected", r + 1, c + 1);
                          setShowTableSelector(false);
                          dispatchCommand(insertTable(r + 1, c + 1));
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div
              style={{
                "text-align": "center",
                "margin-top": "6px",
                "font-size": "13px",
                color: "#333",
              }}
            >
              {hoverY() + 1} × {hoverX() + 1}
            </div>
          </div>
        </Show>
      </ToolbarDropdown>
    );
  },
};
