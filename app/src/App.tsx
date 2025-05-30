import { Editor } from "./components/Editor";
import Toolbar from "./components/toolbar_alternative";
import { schema } from "./lib/schema";
//import "prosemirror-view/style/prosemirror.css";

export default function App() {
  const initialDocument = schema.node("root", undefined, [
    schema.node("paragraph"),
  ]);
  return (
    <>
      <Editor schema={schema} initialDocument={initialDocument}>
        <Toolbar />
      </Editor>
    </>
  );
}
