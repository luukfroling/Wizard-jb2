/* eslint-disable solid/prefer-for */
import { Component, createSignal, Show } from "solid-js";
import "prosemirror-view/style/prosemirror.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { ToolbarButton, ToolbarSeparator } from "./toolbar_components";
import { toolbarButtons } from "./toolbar_buttons";
import { toolbarDropdowns } from "./toolbar_dropdowns";
import { GitHubDropdown } from "../github/GitHubDropdown";
import { useDispatchCommand } from "../Editor";
import { insertTable } from "./toolbar_commands";

// --- Main Toolbar Component ---
// The main toolbar with all formatting and insert controls
export const Toolbar: Component = () => {
  // Initialise all toolbar elements
  toolbarButtons.createButtons();
  toolbarDropdowns.createDropdowns();
  const dispatchCommand = useDispatchCommand();

  const [showTableSelector, setShowTableSelector] = createSignal(false);

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
      {toolbarButtons.undoButton}
      {toolbarButtons.redoButton}
      <ToolbarSeparator />
      {toolbarButtons.formatButton}
      <ToolbarSeparator />
      {toolbarButtons.boldButton}
      {toolbarButtons.italicsButton}
      {toolbarButtons.strikeThroughButton}
      {toolbarButtons.superscriptButton}
      {toolbarButtons.subscriptButton}
      <ToolbarSeparator />
      {toolbarDropdowns.fontFamilyDropdown}
      {toolbarDropdowns.headerDropdown}
      <ToolbarSeparator />
      {toolbarDropdowns.listDropdown}
      {toolbarButtons.indentButton}
      {toolbarButtons.outdentButton}
      {toolbarButtons.quoteButton}
      {toolbarButtons.codeButton}
      <ToolbarSeparator />
      {toolbarDropdowns.insertDropdown}
      <GitHubDropdown />

      <ToolbarButton
        icon="bi-table"
        label="Insert Table"
        onClick={() => setShowTableSelector(true)}
      />

      <Show when={showTableSelector()}>
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "10px",
            background: "#fff",
            padding: "8px",
            border: "1px solid #ccc",
            "z-index": 10000,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseLeave={() => {
            setShowTableSelector(false);
          }}
        >
          {[...Array(8)].map((_, r) => (
            <div style={{ display: "flex" }}>
              {[...Array(8)].map((_, c) => (
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "1px solid #aaa",
                    margin: "1px",
                    cursor: "pointer",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Selected", r + 1, c + 1);
                    setShowTableSelector(false);
                    dispatchCommand(insertTable(r + 1, c + 1));
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </Show>
    </div>
  );
};

export default Toolbar;
