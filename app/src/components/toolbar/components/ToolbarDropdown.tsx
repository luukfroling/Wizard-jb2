import { ACCENT } from "../logic/toolbar_options";
import { Component, createSignal, onMount, onCleanup, JSX } from "solid-js";

export const ToolbarDropdown: Component<{
  icon: string;
  options: { label: string; icon: string; onClick: () => void }[];
  title?: string;
  children?: JSX.Element;
  showTableSelector?: () => boolean;
  setOpenRef?: (fn: (open: boolean) => void) => void;
  setButtonRef?: (el: HTMLButtonElement) => void;
}> = (props) => {
  const [open, setOpen] = createSignal(false);

  let buttonRef: HTMLButtonElement | undefined;
  let menuRef: HTMLUListElement | undefined;

  // Close dropdown when clicking outside
  onMount(() => {
    if (props.setOpenRef) props.setOpenRef(setOpen);

    const handler = (e: MouseEvent) => {
      if (
        open() &&
        buttonRef &&
        !buttonRef.contains(e.target as Node) &&
        menuRef &&
        !menuRef.contains(e.target as Node)
      ) {
        setOpen(false);
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
        position: "relative",
      }}
    >
      <button
        ref={(el) => {
          buttonRef = el;
          props.setButtonRef?.(el);
        }}
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
        title={props.title}
        aria-expanded={open()}
        onClick={(e) => {
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
        ref={menuRef}
        class="dropdown-menu p-0"
        classList={{ show: open() }}
        style={{
          "min-width": "40px",
          top: "100%",
          left: "0",
        }}
      >
        {props.options.map((opt) => (
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
              {opt.label && (
                <span style={{ "margin-left": "6px" }}>{opt.label}</span>
              )}
            </button>
          </li>
        ))}
        {props.children}
      </ul>
    </div>
  );
};