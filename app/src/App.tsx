import type { Component } from "solid-js";
import { Editor } from "./components/Editor";
import { schema } from "./lib/schema";
import "prosemirror-view/style/prosemirror.css";

const App: Component = () => {
  const doc = schema.node("root", null, [
    schema.node("heading", { level: 1 }, [schema.text("This is a test.")]),
    schema.node("paragraph", null, [schema.text("Try editing me!")]),
    schema.node("paragraph", null, [
      schema.text("You can use ctrl-z and ctrl-y to undo and redo"),
    ]),
  ]);
  return (
    <div>
      <Editor schema={schema} initialDocument={doc!} />
    </div>
  );
};

export default App;
