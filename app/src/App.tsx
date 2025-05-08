import type { Component } from "solid-js";
<<<<<<< HEAD

import logo from "./logo.svg";
import styles from "./App.module.css";
=======
import { Editor } from "./components/Editor";
import { schema } from "./lib/prosemirror-schema";
import { Node } from "prosemirror-model";
>>>>>>> 38584ec (Add prosemirror support)

const App: Component = () => {
  const doc = schema.nodes.doc.createAndFill(null, schema.nodes.paragraph.createAndFill(null, schema.text("Hello world! Try editing me.")))
  return (
    <div>
      <Editor schema={schema} initialDocument={doc!} />
    </div>
  );
};

export default App;
