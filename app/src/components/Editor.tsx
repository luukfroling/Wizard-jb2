import { Accessor, createContext, createMemo, createSignal, onCleanup, ParentComponent, untrack, useContext } from "solid-js";
import type { Node, Schema } from "prosemirror-model";
import { Command, EditorState, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { history, redo, undo } from "prosemirror-history";
import { baseKeymap } from "prosemirror-commands";

export interface EditorProps {
  schema: Schema;
  initialDocument?: Node;
}

const editorContext = createContext<{ state: Accessor<EditorState>, view: Accessor<EditorView> }>();

export function useEditorState() {
  return useContext(editorContext)?.state;
}

export function useCommand(cmd: Command) {
  const output = createMemo(() => {
    const ctx = useContext(editorContext);
    if (!ctx) throw new Error("Editor state used outside of editor context");

    const res = cmd(ctx.state(), undefined, ctx.view());
    console.log("a", res);
    return res;
  });
  return output;
}

export function dispatchCommand(cmd: Command) {
  const ctx = useContext(editorContext)
  if (!ctx) throw new Error("Editor context used outside of editor");

  const state = ctx.state();
  const view = ctx.view();
  return cmd(state, view.dispatch, view);
}


export const Editor: ParentComponent<EditorProps> = (props) => {
  const [ref, setRef] = createSignal<HTMLDivElement>();
  const editorState = createMemo(() => EditorState.create({
    schema: props.schema,
    doc: props.initialDocument,
    plugins: [
      history(),
      keymap({ "Mod-z": undo, "Mod-y": redo }),
      keymap(baseKeymap),
      new Plugin({
        view() {
          return {
            update(_view, prevState) {
              setState(prevState);
            },
          }
        },
      })
    ],
  }));

  // editorState is just used to initialize the value. Because this is not a reactive scope,
  // this function never reruns. To make this explicit, solidjs recommends to use `untrack' here.
  const [state, setState] = createSignal<EditorState>(untrack(editorState), { equals: false });

  const view = createMemo(() => new EditorView(ref()!, { state: editorState() }));
  onCleanup(() => view().destroy());

  return <>
    <editorContext.Provider value={{ state, view }}>
      {props.children}
    </editorContext.Provider>
    <div ref={setRef} />
  </>;
};
