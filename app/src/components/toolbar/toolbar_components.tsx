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
  let menuRef: HTMLUListElement | undefined; // 4. Added menuRef

  // Close dropdown when clicking outside
  onMount(() => {
    const handler = (e: MouseEvent) => {
      // 5. Updated mousedown handler condition
      if (
        open() &&
        buttonRef &&
        !buttonRef.contains(e.target as Node) &&
        menuRef &&
        !menuRef.contains(e.target as Node)
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
        aria-expanded={open()}
        onClick={(e) => {
          // 2. Added e.stopPropagation()
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
export const ToolbarDropdownWithLabels: Component<{
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
        buttonRef &&
        !buttonRef.contains(e.target as Node) &&
        menuRef &&
        !menuRef.contains(e.target as Node)
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
        aria-expanded={open()}
        onClick={(e) => {
          // 2. Added e.stopPropagation()
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
