import { JSX } from "solid-js";

export interface TableGridSelectorProps {
  show: boolean;
  position: { top: number; left: number };
  hoverX: number;
  hoverY: number;
  setHoverX: (x: number) => void;
  setHoverY: (y: number) => void;
  onSelect: (rows: number, cols: number) => void;
  onClose: () => void;
}

export function TableGridSelector(props: TableGridSelectorProps): JSX.Element {
  if (!props.show) return null;
  return (
    <div
      class="table-grid-selector-popup"
      style={{
        top: `${props.position.top}px`,
        left: `${props.position.left}px`,
      }}
      onMouseDown={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseLeave={props.onClose}
    >
      <div class="table-grid-selector-grid">
        {[...Array(8)].map((_, r) => (
          <div class="table-grid-selector-row">
            {[...Array(8)].map((_, c) => {
              const selected = r <= props.hoverY && c <= props.hoverX;
              return (
                <div
                  class={`table-grid-selector-cell${selected ? " selected" : ""}`}
                  onMouseEnter={() => {
                    props.setHoverY(r);
                    props.setHoverX(c);
                  }}
                  onMouseDown={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    props.onSelect(r + 1, c + 1);
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div class="table-grid-selector-label">
        {props.hoverY + 1} × {props.hoverX + 1}
      </div>
    </div>
  );
}