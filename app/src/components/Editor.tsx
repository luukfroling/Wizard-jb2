import {
  Accessor,
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  ParentComponent,
  untrack,
  useContext,
} from "solid-js";
import type { Node, Schema } from "prosemirror-model";
import { Command, EditorState, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { history, redo, undo } from "prosemirror-history";
import { baseKeymap } from "prosemirror-commands";
import { sinkListItem, liftListItem } from "prosemirror-schema-list";

export interface EditorProps {
  schema: Schema;
  initialDocument?: Node;
}

const editorContext = createContext<{
  state: Accessor<EditorState>;
  view: Accessor<EditorView>;
}>();

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
  const ctx = useContext(editorContext);
  if (!ctx) throw new Error("Editor context used outside of editor");

  const state = ctx.state();
  const view = ctx.view();
  return cmd(state, view.dispatch, view);
}

// This is a wrapper around dispatchCommand that returns a function
export function useDispatchCommand() {
  const ctx = useContext(editorContext);
  if (!ctx) throw new Error("Editor context used outside of editor");
  return (cmd: Command) => {
    const state = ctx.state();
    const view = ctx.view();
    const result = cmd(state, view.dispatch, view);

    view.focus();
    return result;
  };
}

// When pressing Enter, the marks at the cursor are lost on the new line.
// This plugin preserves the marks

function preserveMarksPlugin() {
  return new Plugin({
    appendTransaction(transactions, oldState, newState) {
      const lastTr = transactions[transactions.length - 1];
      if (!lastTr || !lastTr.docChanged) return null;

      // Only run for cursor selections
      const { $from, empty } = newState.selection;
      if (!empty) return null;

      // Only run if a new textblock was created (usually Enter)
      if ($from.parentOffset !== 0) return null;

      // Prefer stored marks from oldState, otherwise use marks at cursor
      const prevStored = oldState.storedMarks;
      const prevMarks =
        prevStored && prevStored.length
          ? prevStored
          : oldState.selection.$from.marks();

      if (!prevMarks || prevMarks.length === 0) return null;

      return newState.tr.setStoredMarks(prevMarks);
    },
  });
}

export const Editor: ParentComponent<EditorProps> = (props) => {
  const [ref, setRef] = createSignal<HTMLDivElement>();
  const editorState = createMemo(() =>
    EditorState.create({
      schema: props.schema,
      doc: props.initialDocument,
      plugins: [
        history(),
        keymap({
          "Mod-z": undo,
          "Mod-y": redo,
          "Mod-Shift-z": redo,
          Tab: sinkListItem(props.schema.nodes.listItem),
          "Shift-Tab": liftListItem(props.schema.nodes.listItem),
        }),
        keymap(baseKeymap),
        preserveMarksPlugin(),
        new Plugin({
          view() {
            return {
              update(view, _prevState) {
                setState(view.state);
              },
            };
          },
        }),
      ],
    }),
  );

  // editorState is just used to initialize the value. Because this is not a reactive scope,
  // this function never reruns. To make this explicit, solidjs recommends to use `untrack' here.
  const [state, setState] = createSignal<EditorState>(untrack(editorState), {
    equals: false,
  });

  const view = createMemo(
    () => new EditorView(ref()!, { state: editorState() }),
  );
  onCleanup(() => view().destroy());

  return (
    <>
      <editorContext.Provider value={{ state, view }}>
        {props.children}
      </editorContext.Provider>
      <div ref={setRef} />
    </>
  );
};

export function useEditorView() {
  return useContext(editorContext)?.view;
}
