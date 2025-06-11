import { createResource } from "solid-js";
import { EXAMPLE_1 } from "../tests/parser_constants";
import { Editor } from "./components/Editor";
import Toolbar from "./components/toolbar/toolbar";
import { parseMyst } from "./lib/parser";
import { schema } from "./lib/schema";
//import "prosemirror-view/style/prosemirror.css";

/** The [SolidJS] application. This is mounted to the DOM by the `render()` function.
 * This is the top-level entry point for the application.
 *
 * [SolidJS]: https://docs.solidjs.com
 */
export default function App() {
  const [initialDocument] = createResource(() => parseMyst(EXAMPLE_1));
  return (
    <>
      <Editor schema={schema} initialDocument={initialDocument()}>
        <Toolbar />
      </Editor>
    </>
  );
}
