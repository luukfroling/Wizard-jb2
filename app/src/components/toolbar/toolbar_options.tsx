import { JSX } from "solid-js";

// Accent color used for toolbar highlights and active states
export const ACCENT = "#D7E1FF";

// Font size options for the font size dropdown in the toolbar
export const FONT_SIZES = [
  "8px",
  "9px",
  "10px",
  "11px",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "22px",
  "24px",
  "26px",
  "28px",
  "36px",
  "48px",
  "72px",
  "96px",
];

// Font family options for the font family dropdown in the toolbar
export const FONT_OPTIONS = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
];

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
