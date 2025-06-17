import { Component } from "solid-js";
import "prosemirror-view/style/prosemirror.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { ToolbarSeparator } from "./components/ToolbarSeparator";
import { toolbarButtons } from "./logic/toolbar_buttons";
import { toolbarDropdowns } from "./logic/toolbar_dropdowns";
import { GitHubDropdown } from "../github/GitHubDropdown";
import { ToolbarHintButton } from "./components/ToolbarHintButton";
import { BranchDropdown } from "../github/BranchDropdown";

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
        top: "48px",
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
      {toolbarDropdowns.headerDropdown}
      <ToolbarSeparator />
      {toolbarDropdowns.listDropdown}
      {toolbarButtons.indentButton}
      {toolbarButtons.outdentButton}
      {toolbarButtons.quoteButton}
      {toolbarButtons.codeButton}
      <ToolbarSeparator />
      {toolbarDropdowns.insertDropdown}
      <ToolbarSeparator />
      <ToolbarHintButton
        label="Editor usage hints"
        hint={
          `Ctrl + Enter: Exit table in new line
          Ctrl + Enter: Exit quote/codeblock
          Double click math: Edit inline
          Ctrl + Backspace: Delete math equation
          Ctrl + Backspace: Delete codeblock`
        }
      />
      <div class="ms-auto d-flex align-items-right">
        <BranchDropdown />
        <GitHubDropdown />
      </div>
    </div>
  );
};

export default Toolbar;
