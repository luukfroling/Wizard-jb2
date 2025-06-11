import {
  Accessor,
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
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
import { customListKeymap, preserveMarksPlugin, tableAndCodeExitKeymap, mathDeleteKeymap } from "./toolbar/editor_plugins";
import { MathNodeView } from "./MathNodeView";

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

export const Editor: ParentComponent<EditorProps> = (props) => {
  const [ref, setRef] = createSignal<HTMLDivElement>();
  const editorState = createMemo(() =>
    EditorState.create({
      schema: props.schema,
      doc: props.initialDocument,
      plugins: [
        history(),
        customListKeymap(props.schema),
        keymap({
          "Mod-z": undo,
          "Mod-y": redo,
          "Mod-Shift-z": redo,
        }),
        keymap(baseKeymap),
        preserveMarksPlugin(),
        tableAndCodeExitKeymap(props.schema),
        mathDeleteKeymap(props.schema),
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
    () =>
      new EditorView(ref()!, {
        state: editorState(),
        nodeViews: {
          math(node, view, getPos) {
            const safeGetPos = () => {
              const pos = getPos?.();
              if (typeof pos !== "number") {
                throw new Error("getPos is undefined or not a number");
              }
              return pos;
            };
            return new MathNodeView(node, view, safeGetPos);
          },
        },
      }),
  );
  onCleanup(() => view().destroy());

  onMount(() => {
    const el = ref();
    if (!el) return;
    el.addEventListener("click", (event) => {
      const e = event as MouseEvent;
      // Check for Ctrl (Windows/Linux) or Meta (Mac)
      if ((e.ctrlKey || e.metaKey) && e.target instanceof HTMLElement) {
        const link = e.target.closest("a");
        if (link && link.href) {
          window.open(link.href, "_blank");
          e.preventDefault();
        }
      }
    });
  });

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
