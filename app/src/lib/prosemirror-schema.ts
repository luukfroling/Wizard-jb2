import { Schema } from "prosemirror-model";

export const schema = new Schema({
    nodes: {
        root: { content: "paragraph+" },
        paragraph: {
            content: "text*",
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            toDOM(node) {
                return ["p", 0];
            },
        },
        text: { inline: true },
    },
    topNode: "root",
});
