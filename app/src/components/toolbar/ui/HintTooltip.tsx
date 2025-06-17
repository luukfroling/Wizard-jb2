import { createSignal, Show, onCleanup } from "solid-js";

export const [hintTooltip, setHintTooltip] = createSignal<{
  text: string;
  top: number;
  left: number;
  visible: boolean;
  showLabel?: boolean;
}>({ text: "", top: 0, left: 0, visible: false, showLabel: true });

export function showHintTooltip(
  text: string,
  top: number,
  left: number,
  showLabel = true,
) {
  setHintTooltip({ text, top, left, visible: true, showLabel });
}

export function hideHintTooltip() {
  setHintTooltip((t) => ({ ...t, visible: false }));
}

export function HintTooltip() {
  // Hide on scroll
  window.addEventListener("scroll", hideHintTooltip);
  onCleanup(() => window.removeEventListener("scroll", hideHintTooltip));

  return (
    <Show when={hintTooltip().visible}>
      <div
        style={{
          position: "absolute",
          top: `${hintTooltip().top}px`,
          left: `${hintTooltip().left}px`,
          "z-index": 99999,
          "pointer-events": "none",
        }}
      >
        {/* Black label (cover) */}
        <Show when={hintTooltip().showLabel}>
          <div
            style={{
              background: "#111",
              color: "#fff",
              "border-radius": "4px 4px 0 0",
              padding: "2px 10px",
              "font-size": "12px",
              "font-weight": 600,
              "margin-bottom": "0px",
              "text-align": "center",
              "box-shadow": "0 2px 8px 0 #0002",
              "pointer-events": "none",
              width: "100%",
              "max-width": "260px",
            }}
          >
            Editor usage hints
          </div>
        </Show>
        <div
          style={{
            background: "#fff",
            color: "#1a237e",
            border: "1px solid #d7e1ff",
            "border-radius": hintTooltip().showLabel ? "0 0 6px 6px" : "6px",
            "box-shadow": "0 2px 8px 0 #d7e1ff55",
            padding: "8px 14px",
            "font-size": "13px",
            "white-space": "pre-line",
            "pointer-events": "none",
            "max-width": "260px",
          }}
        >
          {hintTooltip().text}
        </div>
      </div>
    </Show>
  );
}
