import "katex/dist/katex.min.css";
import { Editor } from "./components/Editor";
import Toolbar from "./components/toolbar/toolbar";
import { schema } from "./lib/schema";
import { HintTooltip } from "./components/toolbar/HintTooltip";
//import "prosemirror-view/style/prosemirror.css";

/** The [SolidJS] application. This is mounted to the DOM by the `render()` function.
 * This is the top-level entry point for the application.
 *
 * [SolidJS]: https://docs.solidjs.com
 */
// Base styles for typography and layout
import "@myst-theme/styles";

import { mystToHtml } from 'myst-to-html';

const node = {
  type: 'admonition',
  kind: 'warning',
  children: [
    { type: 'admonitionTitle', children: [{ type: 'text', value: 'Heads Up!' }] },
    { type: 'paragraph', children: [{ type: 'text', value: 'This is the content.' }] }
  ]
};

const html = mystToHtml(node);
console.log(html);

export default function App() {
  return (
    <>
      <Editor schema={schema}>
        <Toolbar />
      </Editor>
      <HintTooltip />
    </>
  );
}
