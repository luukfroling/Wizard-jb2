import { ACCENT } from "../logic/toolbar_options";
import { Component } from "solid-js";

export const ToolbarButton: Component<{
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  onMouseOver?: (e: MouseEvent) => void;
  onMouseOut?: (e: MouseEvent) => void;
}> = (props) => (
  <button
    type="button"
    class="btn btn-sm px-1"
    style={{
      background: props.active ? ACCENT : "transparent",
      color: props.active ? "#1a237e" : "#212529",
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
    aria-pressed={props.active ? "true" : "false"}
    disabled={props.disabled}
    onClick={(e) => {
      e.preventDefault();
      props.onClick();
      (e.currentTarget as HTMLButtonElement).blur();
    }}
    onMouseUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
    onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).blur()}
    onMouseOver={(e) => props.onMouseOver?.(e)}
    onMouseOut={(e) => props.onMouseOut?.(e)}
  >
    <i class={`bi ${props.icon} fs-5`} />
    <span class="visually-hidden">{props.label}</span>
  </button>
);