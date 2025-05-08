import { Component, onCleanup, onMount } from "solid-js";
import type { Node, Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export interface EditorProps {
  schema: Schema;
  initialDocument?: Node;
}

export const Editor: Component<EditorProps> = (props) => {
  // eslint-disable-next-line prefer-const
  let ref: HTMLDivElement | undefined = undefined;
  onMount(() => {
    const state = EditorState.create({
      schema: props.schema,
      doc: props.initialDocument
    });
    const view = new EditorView(ref!, { state });
    onCleanup(() => view.destroy());
  });

  return <div ref={ref} />;
};
