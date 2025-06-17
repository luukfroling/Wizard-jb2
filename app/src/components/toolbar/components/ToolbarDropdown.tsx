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
        class="toolbar-btn btn btn-sm dropdown-toggle d-flex align-items-center justify-content-center px-2"
        title={props.title}
        aria-expanded={open()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open());
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "var(--accent)")}
        onMouseOut={(e) =>
          !open() && (e.currentTarget.style.background = "#fff")
        }
      >
        <i class={`bi ${props.icon} fs-5`} />
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
            >
              <i class={`bi ${opt.icon}`} style={{ color: "#212529" }} />
              {opt.label && (
                <span class="toolbar-dropdown-label">{opt.label}</span>
              )}
            </button>
          </li>
        ))}
        {props.children}
      </ul>
    </div>
  );
};