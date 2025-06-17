import { mystToProseMirror } from "./myst_to_prosemirror";
import { parseToMystAST } from "./parse_myst";
import type { Node } from "prosemirror-model";

export {
    proseMirrorToMyst,
    proseMirrorToMarkdown,
} from "./prosemirror_to_myst";

export function parseMyst(source: string): Node {
    const parsed = parseToMystAST(source);
    return mystToProseMirror(parsed);
}
