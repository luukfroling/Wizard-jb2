import { JSX } from "solid-js";

// Accent color used for toolbar highlights and active states
export const ACCENT = "#D7E1FF";

// Header (heading) options for the header dropdown, with live preview labels
export const HEADER_OPTIONS: { label: JSX.Element; value: number | string }[] =
  [
    {
      label: (
        <span style={{ "font-size": "32px", "font-weight": 700, margin: 0 }}>
          Heading 1
        </span>
      ),
      value: 1,
    },
    {
      label: (
        <span style={{ "font-size": "24px", "font-weight": 700, margin: 0 }}>
          Heading 2
        </span>
      ),
      value: 2,
    },
    {
      label: (
        <span style={{ "font-size": "18.72px", "font-weight": 700, margin: 0 }}>
          Heading 3
        </span>
      ),
      value: 3,
    },
    {
      label: (
        <span style={{ "font-size": "16px", "font-weight": 400, margin: 0 }}>
          Normal
        </span>
      ),
      value: "paragraph",
    },
  ];

// Mapping of alignment options to their corresponding icon class names
export const ALIGN_ICON_MAP = {
  left: "bi-text-left",
  center: "bi-text-center",
  right: "bi-text-right",
  justify: "bi-justify",
};
