import { Editor } from "./components/Editor";
import Toolbar from "./components/toolbar/toolbar";
import { schema } from "./lib/schema";
//import "prosemirror-view/style/prosemirror.css";

/** The [SolidJS] application. This is mounted to the DOM by the `render()` function.
 * This is the top-level entry point for the application.
 *
 * [SolidJS]: https://docs.solidjs.com
 */
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
