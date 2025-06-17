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
    class="toolbar-btn btn btn-sm px-1"
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