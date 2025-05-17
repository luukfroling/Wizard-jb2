import { onCleanup, onMount, ParentComponent } from "solid-js";
import type { Node, Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { history, redo, undo } from "prosemirror-history";
import { baseKeymap } from "prosemirror-commands";

export interface EditorProps {
  schema: Schema;
  initialDocument?: Node;
}


export const Editor: ParentComponent<EditorProps> = (props) => {
  let ref: HTMLDivElement;
  onMount(() => {
    const editorState = EditorState.create({
      schema: props.schema,
      doc: props.initialDocument,
      plugins: [
        history(),
        keymap({ "Mod-z": undo, "Mod-y": redo }),
        keymap(baseKeymap),
      ],
    });
    const view = new EditorView(ref!, { state: editorState });
    onCleanup(() => view.destroy());
  });

  return <>
    <div ref={ref!} />
  </>;
};
