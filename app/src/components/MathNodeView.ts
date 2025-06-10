import katex from "katex";
import { NodeView } from "prosemirror-view";

export class MathNodeView implements NodeView {
  dom: HTMLElement;

  constructor(node: any) {
    this.dom = document.createElement("div");
    this.dom.className = "math";
    try {
      this.dom.innerHTML = katex.renderToString(node.textContent, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (e) {
      this.dom.textContent = node.textContent;
    }
  }

  update(node: any) {
    try {
      this.dom.innerHTML = katex.renderToString(node.textContent, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (e) {
      this.dom.textContent = node.textContent;
    }
    return true;
  }
}