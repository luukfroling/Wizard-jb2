import { createEffect, createSignal, JSX, Show } from "solid-js";
import { render } from "solid-js/web";

type ToastOptions = {
  duration?: number; // ms
};

const toastContainerId = "solid-toast-container";

function ensureToastContainer(): HTMLElement {
  let container = document.getElementById(toastContainerId);
  if (!container) {
    container = document.createElement("div");
    container.id = toastContainerId;
    Object.assign(container.style, {
      position: "fixed",
      top: "16px",
      right: "16px",
      display: "flex",
      "flex-direction": "column",
      gap: "12px",
      "z-index": "9999",
    });
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message: JSX.Element | string, options: ToastOptions = {}) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");

  const Toast = () => {
  const [visible, setVisible] = createSignal(true);

  const duration = options.duration ?? 30000;

  const close = () => setVisible(false);

  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(close, duration);
  }

  // When visible becomes false, remove toast DOM node
  createEffect(() => {
    if (!visible()) {
      toast.remove();
    }
  });

  return (
    <Show when={visible()}>
      <div
        style={{
          padding: "12px 16px",
          background: "#333",
          color: "#fff",
          "border-radius": "6px",
          "box-shadow": "0 2px 6px rgba(0,0,0,0.2)",
          "font-size": "14px",
          "min-width": "180px",
          display: "flex",
          "justify-content": "space-between",
          "align-items": "center",
          gap: "8px",
        }}
      >
        <span>{message}</span>
        <button
          style={{
            background: "transparent",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            "font-size": "16px",
          }}
          onClick={close}
        >
          ×
        </button>
      </div>
    </Show>
  );
};

  render(() => <Toast />, toast);
  container.appendChild(toast);
}
