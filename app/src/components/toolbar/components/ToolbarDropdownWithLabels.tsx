import { Component, createSignal, onMount, onCleanup, JSX } from "solid-js";

export const ToolbarDropdownWithLabels: Component<{
  icon: string;
  options: { label: JSX.Element | string; icon: string; onClick: () => void }[];
  title?: string | JSX.Element;
}> = (props) => {
  const [open, setOpen] = createSignal(false);
  let buttonRef: HTMLButtonElement | undefined;
  let menuRef: HTMLUListElement | undefined;

  // Close dropdown when clicking outside
  onMount(() => {
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
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        class="toolbar-btn btn btn-sm dropdown-toggle d-flex align-items-center justify-content-center px-2"
        title={typeof props.title === "string" ? props.title : undefined}
        aria-expanded={open()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open());
        }}
      >
        <i class={`bi ${props.icon} fs-5`} />
        {props.title && (
          <span class="toolbar-dropdown-label">
            {props.title}
          </span>
        )}
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
              title={typeof opt.label === "string" ? opt.label : undefined}
              onClick={() => {
                opt.onClick();
                setOpen(false);
                if (buttonRef) buttonRef.style.background = "#fff";
              }}
            >
              <i class={`bi ${opt.icon}`} style={{ color: "#212529" }} />
              <span class="toolbar-dropdown-label">{opt.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};