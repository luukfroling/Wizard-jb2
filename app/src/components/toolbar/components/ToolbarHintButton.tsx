import { Component } from "solid-js";
import { showHintTooltip, hideHintTooltip } from "../ui/HintTooltip";

export const ToolbarHintButton: Component<{
  label: string;
  hint: string;
}> = (props) => (
  <button
    type="button"
    class="btn btn-sm px-1"
    style={{
      background: "transparent",
      color: "#212529",
      transition: "background 0.1s, color 0.1s",
      "box-shadow": "none",
      "margin-right": "1px",
      "margin-bottom": "1px",
      border: "none",
      "border-radius": "4px",
      height: "28px",
      padding: "2px 4px",
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
    }}
    title={props.label}
    aria-label={props.label}
    tabIndex={-1}
    onMouseOver={(e) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      showHintTooltip(
        props.hint,
        rect.bottom + window.scrollY + 8,
        rect.left + window.scrollX,
      );
    }}
    onMouseOut={hideHintTooltip}
    onFocus={hideHintTooltip}
    onClick={hideHintTooltip}
  >
    <i class="bi bi-question-circle fs-5" />
    <span class="visually-hidden">{props.label}</span>
  </button>
);