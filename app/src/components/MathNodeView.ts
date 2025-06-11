import katex from "katex";
import { NodeView, EditorView } from "prosemirror-view";
import { Node as ProseMirrorNode } from "prosemirror-model";

export class MathNodeView implements NodeView {
  dom: HTMLElement;
  renderSpan: HTMLElement;
  input: HTMLTextAreaElement | null = null;
  editing = false;
  view: EditorView;
  getPos: () => number;

  constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number) {
    this.view = view;
    this.getPos = getPos;

    this.dom = document.createElement("span");
    this.dom.className = "math-node";
    this.renderSpan = document.createElement("span");
    this.renderSpan.className = "math-render";
    this.dom.appendChild(this.renderSpan);

    this.renderMath(node.textContent);

    this.renderSpan.addEventListener("dblclick", () => this.startEdit(node));
  }

  startEdit(node: ProseMirrorNode) {
    if (this.editing) return;
    this.editing = true;
    const textarea = document.createElement("textarea");
    textarea.value = node.textContent;
    textarea.className = "math-input";
    textarea.style.marginRight = "8px";
    textarea.style.width = "100%";
    textarea.style.maxWidth = "100%";
    textarea.style.minWidth = "200px";
    textarea.style.boxSizing = "border-box";
    textarea.style.overflowX = "hidden"; // No horizontal scroll
    textarea.style.overflowY = "auto";   // Only vertical scroll
    textarea.style.resize = "none";
    textarea.style.whiteSpace = "pre-wrap";
    textarea.style.wordBreak = "break-all";
    textarea.rows = 1;

    // Auto-grow up to 3 lines
    const autoGrow = () => {
      textarea.rows = 1;
      const lines = textarea.value.split("\n").length;
      textarea.rows = Math.min(3, Math.max(1, lines));
    };
    textarea.addEventListener("input", autoGrow);
    autoGrow();

    this.dom.replaceChild(textarea, this.renderSpan);
    textarea.focus();
    textarea.select();

    textarea.addEventListener("blur", () => this.finishEdit());
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.finishEdit();
      }
    });

    this.input = textarea;
  }

  finishEdit() {
    if (!this.input) return;
    const latex = this.input.value;
    const pos = this.getPos();
    const nodeSize = this.input.value.length;
    this.view.dispatch(
      this.view.state.tr.replaceWith(
        pos + 1,
        pos + this.view.state.doc.nodeAt(pos)!.nodeSize - 1,
        this.view.state.schema.text(latex)
      )
    );
    this.dom.replaceChild(this.renderSpan, this.input);
    this.input = null;
    this.editing = false;
    this.renderMath(latex);
  }

  renderMath(latex: string) {
    try {
      this.renderSpan.innerHTML = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (e) {
      this.renderSpan.textContent = latex;
    }
  }

  update(node: ProseMirrorNode) {
    if (!this.editing) {
      this.renderMath(node.textContent);
    }
    return true;
  }
}