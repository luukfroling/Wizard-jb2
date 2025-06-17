import { NodeView, EditorView } from "prosemirror-view";
import { Node as ProseMirrorNode } from "prosemirror-model";

export class ImageNodeView implements NodeView {
    dom: HTMLElement;
    img: HTMLImageElement;
    view: EditorView;
    getPos: () => number;

    constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number) {
        this.view = view;
        this.getPos = getPos;

        this.dom = document.createElement("span");
        this.dom.className = "image-node";
        this.dom.style.display = "inline-block";
        this.dom.style.position = "relative";

        this.img = document.createElement("img");
        this.img.src = node.attrs.url;
        this.img.alt = node.attrs.alt || "";
        this.img.title = node.attrs.title || "";
        this.img.style.width = node.attrs.width || "50%";
        this.img.style.maxWidth = "100%";
        this.img.style.height = "auto";
        this.img.style.display = "block";
        this.img.style.cursor = "pointer";
        this.dom.appendChild(this.img);

        // Create resize handle
        const handle = document.createElement("div");
        handle.className = "resize-handle";
        handle.style.position = "absolute";
        handle.style.right = "0";
        handle.style.bottom = "0";
        handle.style.width = "12px";
        handle.style.height = "12px";
        handle.style.background = "#1976d2";
        handle.style.cursor = "nwse-resize";
        handle.style.borderRadius = "50%";
        handle.style.zIndex = "10";
        handle.style.display = "none";
        this.dom.appendChild(handle);

        this.img.addEventListener("click", (e) => {
            e.stopPropagation();
            handle.style.display = "block";
        });
        document.addEventListener("click", (e) => {
            if (!this.dom.contains(e.target as Node)) {
                handle.style.display = "none";
            }
        });

        let startX = 0;
        let startWidth = 0;
        handle.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            startX = e.clientX;
            startWidth = this.img.offsetWidth;

            const onMouseMove = (moveEvent: MouseEvent) => {
                const diff = moveEvent.clientX - startX;
                const newWidth = Math.max(40, startWidth + diff);
                this.img.style.width = newWidth + "px";
            };

            const onMouseUp = (_upEvent: MouseEvent) => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                // Save new width to node attribute
                const pos = this.getPos();
                const node = this.view.state.doc.nodeAt(pos);
                if (node) {
                    const newWidth = this.img.offsetWidth + "px";
                    const tr = this.view.state.tr.setNodeMarkup(
                        pos,
                        undefined,
                        {
                            ...node.attrs,
                            width: newWidth,
                        },
                    );
                    this.view.dispatch(tr);
                }
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    update(node: ProseMirrorNode) {
        this.img.src = node.attrs.url;
        this.img.alt = node.attrs.alt || "";
        this.img.title = node.attrs.title || "";
        this.img.style.width = node.attrs.width || "50%";
        return true;
    }
}
