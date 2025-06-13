import {
  Accessor,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  ParentComponent,
  untrack,
  useContext,
} from "solid-js";
import type { Schema } from "prosemirror-model";
import { Command, EditorState, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { history, redo, undo } from "prosemirror-history";
import { baseKeymap } from "prosemirror-commands";
import { currentBranch } from "../lib/github/BranchSignal";
import {
  currentFileHref,
  getFilePathFromHref,
  repositoryHref,
  parseOwnerRepoFromHref,
  getFileContentFromRepo,
} from "../lib/github/GithubUtility";
import { database } from "../lib/localStorage/database";
import { parseMyst } from "../lib/parser";
import { prosemirrorToMarkdown } from "../lib/parser/to_markdown";
import { ImageNodeView } from "./ImageNodeView";
import { MathNodeView } from "./MathNodeView";
import {
  customListKeymap,
  tableAndCodeExitKeymap,
  codeBlockKeymap,
  mathDeleteKeymap,
  tableAfterDeleteKeymap,
  preserveMarksPlugin,
} from "./toolbar/editor_plugins";
import { tableEditing } from "prosemirror-tables";

export interface EditorProps {
  schema: Schema;
}

const editorContext = createContext<{
  state: Accessor<EditorState>;
  view: Accessor<EditorView>;
}>();

export function useEditorState() {
  return useContext(editorContext)?.state;
}

export function useEditorView() {
  return useContext(editorContext)?.view;
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
      plugins: [
        history(),
        customListKeymap(props.schema),
        preserveMarksPlugin(),
        tableAndCodeExitKeymap(props.schema),
        codeBlockKeymap(props.schema),
        mathDeleteKeymap(props.schema),
        tableAfterDeleteKeymap(props.schema),
        tableEditing(),
        keymap({
          "Mod-z": undo,
          "Mod-y": redo,
          "Mod-Shift-z": redo,
        }),
        keymap(baseKeymap),
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
          image(node, view, getPos) {
            const safeGetPos = () => {
              const pos = getPos?.();
              if (typeof pos !== "number")
                throw new Error("getPos is undefined or not a number");
              return pos;
            };
            return new ImageNodeView(node, view, safeGetPos);
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

    // Expose a function to get the editor content as markdown globally
    window.__getEditorMarkdown = () => {
      const doc = state().doc;
      try {
        return prosemirrorToMarkdown(doc);
      } catch (e) {
        return (
          (e instanceof Error ? e.toString() : String(e)) +
          " " +
          doc.textContent
        );
      }
    };

    // Load the current file into the editor on mount
    loadCurrentFileIntoEditor();
  });

  // Add this effect to reload file when branch changes
  createEffect(() => {
    currentBranch(); // Track the signal
    loadCurrentFileIntoEditor();
  });

  // Add this method to load and parse the current file into the editor
  async function loadCurrentFileIntoEditor() {
    const fileHref = currentFileHref();
    const filePath = getFilePathFromHref(fileHref);
    if (!filePath) return;

    // Try to load markdown content from the database for the current branch/repo
    let markdown = await database.load<string>("markdown", filePath);
    console.log("Loaded markdown:", markdown);

    // If not found or empty, try to fetch from GitHub
    if (!markdown) {
      const repoHref = repositoryHref();
      const repoInfo = parseOwnerRepoFromHref(repoHref);
      const branch = currentBranch(); // Use the signal here

      if (repoInfo && branch) {
        // Try to fetch from the current branch first (and fallback to default branch inside getFileContentFromRepo)
        let markdownTemp = await getFileContentFromRepo(
          repoInfo.owner,
          repoInfo.repo,
          branch,
          filePath,
        );
        if (markdownTemp == null) markdownTemp = undefined;
        markdown = markdownTemp;
      }
    }

    if (!markdown) return;

    // Parse markdown into a ProseMirror Node
    const doc = await parseMyst(markdown);

    // Debugging
    // console.log("Markdown: \n" + markdown)
    // console.log("Parsed: \n" + doc)

    // Get the current view instance
    const editorView = view();

    // Create new state
    const newState = EditorState.create({
      schema: editorView.state.schema,
      doc,
      plugins: editorView.state.plugins,
    });

    console.log("New doc created:", newState.doc);

    // Set the new state
    editorView.updateState(newState);
    setState(newState);
  }

  return (
    <>
      <editorContext.Provider value={{ state, view }}>
        {props.children}
      </editorContext.Provider>
      <div ref={setRef} />
    </>
  );
};

// Optionally export for use elsewhere
export async function loadCurrentFileIntoEditor() {
  // This function can be imported and called from outside if needed
  // (see above for implementation)
}
