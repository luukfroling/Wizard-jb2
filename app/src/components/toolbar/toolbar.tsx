 
import { Component } from "solid-js";
import "prosemirror-view/style/prosemirror.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { ToolbarSeparator } from "./toolbar_components";
import { toolbarButtons } from "./toolbar_buttons";
import { toolbarDropdowns } from "./toolbar_dropdowns";
import { GitHubDropdown } from "../github/GitHubDropdown";

// --- Main Toolbar Component ---
// The main toolbar with all formatting and insert controls
export const Toolbar: Component = () => {
  // Initialise all toolbar elements
  toolbarButtons.createButtons();
  toolbarDropdowns.createDropdowns();

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
    </div>
  );
};

export default Toolbar;
