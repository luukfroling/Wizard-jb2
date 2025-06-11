import { createSignal } from "solid-js";

// Start with a fallback value (e.g. "main" or "")
const initialBranch = localStorage.getItem("currentBranch") || "main";
export const [currentBranch, setCurrentBranch] = createSignal(initialBranch);
