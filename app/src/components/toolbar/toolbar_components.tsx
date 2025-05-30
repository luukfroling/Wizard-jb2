import { FONT_OPTIONS, ACCENT } from "./toolbar_options";

import {
  Component,
  createSignal,
  onMount,
  onCleanup,
  For,
  JSX,
} from "solid-js";

// --- Toolbar Button Component ---
// Renders a single toolbar button with optional active/disabled state
export const ToolbarButton: Component<{
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
export const ToolbarDropdown: Component<{
  icon: string;
  options: { label: string; icon: string; onClick: () => void }[];
  title?: string;
}> = (props) => {
  const [open, setOpen] = createSignal(false);
  let buttonRef: HTMLButtonElement | undefined;

  // Close dropdown when clicking outside
  onMount(() => {
    const handler = (e: MouseEvent) => {
      if (open() && buttonRef && !buttonRef.contains(e.target as Node)) {
        setOpen(false);
        buttonRef.style.background = "#fff";
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
        data-bs-toggle="dropdown"
        aria-expanded={open()}
        onClick={() => setOpen(!open())}
        onMouseOver={(e) => (e.currentTarget.style.background = ACCENT)}
        onMouseOut={(e) =>
          !open() && (e.currentTarget.style.background = "#fff")
        }
      >
        <i class={`bi ${props.icon} fs-5`} style={{ color: "#212529" }} />
      </button>
      <ul class="dropdown-menu p-0" style={{ "min-width": "40px" }}>
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
export const ToolbarDropdownWithLabels: Component<{
  icon: string;
  options: { label: JSX.Element | string; icon: string; onClick: () => void }[];
  title?: string | JSX.Element;
}> = (props) => {
  const [open, setOpen] = createSignal(false);
  let buttonRef: HTMLButtonElement | undefined;

  // Close dropdown when clicking outside
  onMount(() => {
    const handler = (e: MouseEvent) => {
      if (open() && buttonRef && !buttonRef.contains(e.target as Node)) {
        setOpen(false);
        buttonRef.style.background = "#fff";
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
        data-bs-toggle="dropdown"
        aria-expanded={open()}
        onClick={() => setOpen(!open())}
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
      <ul class="dropdown-menu p-0" style={{ "min-width": "40px" }}>
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
export const ToolbarSeparator = () => (
  <div
    style={{
      width: "1px",
      height: "24px",
      background: ACCENT,
      margin: "0 8px",
    }}
  />
);

// --- Table Grid Selector Component ---
// A component for selecting a table grid size (rows x cols)
export function TableGridSelector(props: {
  maxRows?: number;
  maxCols?: number;
  onSelect: (rows: number, cols: number) => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = createSignal<[number, number]>([0, 0]);

  return (
    <div
      style={{
        border: "1px solid #ccc",
        background: "#fff",
        padding: "8px",
        "box-shadow": "0 2px 8px rgba(0,0,0,0.15)",
        position: "absolute",
        "z-index": 1000,
      }}
      onMouseLeave={() => props.onClose()}
    >
      <div>
        <For each={Array.from({ length: props.maxRows ?? 8 })}>
          {(_, row) => (
            <div style={{ display: "flex" }}>
              <For each={Array.from({ length: props.maxCols ?? 8 })}>
                {(_, col) => {
                  const selected =
                    row() <= hovered()[0] && col() <= hovered()[1];
                  return (
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        border: "1px solid #ccc",
                        background: selected ? "#D7E1FF" : "#fff",
                        cursor: "pointer",
                      }}
                      onMouseEnter={() => setHovered([row(), col()])}
                      onClick={() => props.onSelect(row() + 1, col() + 1)}
                    />
                  );
                }}
              </For>
            </div>
          )}
        </For>
      </div>
      <div style={{ "margin-top": "8px", "text-align": "center" }}>
        {hovered()[0] + 1} × {hovered()[1] + 1}
      </div>
    </div>
  );
}
