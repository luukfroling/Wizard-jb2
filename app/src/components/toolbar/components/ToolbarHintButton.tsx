import { Component } from "solid-js";
import { showHintTooltip, hideHintTooltip } from "../ui/HintTooltip";

export const ToolbarHintButton: Component<{
  label: string;
  hint: string;
}> = (props) => (
  <button
    type="button"
    class="toolbar-btn btn btn-sm px-1"
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