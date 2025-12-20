/* @refresh reload */
import { Schema, Mark } from "prosemirror-model";
import { boolean, integer, oneOf, string } from "./utils";

export const schema = new Schema({
    nodes: {
        root: {
            content: "(block | blockBreak | flowContent)* | listContent*",
            toDOM() {
                return ["div", 0];
            },
        },
        block: {
            content: "flowContent+ | listContent+",
            toDOM() {
                return ["div", 0];
            },
        },
        blockBreak: {
            toDOM() {
                return ["hr"];
            },
        },
        paragraph: {
            group: "flowContent",
            content: "phrasingContent*",
            marks: "_",
            attrs: { align: { default: "left" } },
            parseDOM: [
                {
                    tag: "p",
                    getAttrs: (node) => ({
                        align:
                            node.style && node.style.textAlign
                                ? node.style.textAlign
                                : "left",
                    }),
                },
            ],
            toDOM(node) {
                const { align } = node.attrs;
                return ["p", { style: `text-align: ${align}` }, 0];
            },
        },
        definition: {
            group: "flowContent",
            attrs: {
                url: string({ optional: false }),
                identifier: string({ optional: false }),
            },
            toDOM() {
                return ["div", { class: "definition" }, 0];
            },
        },
        heading: {
            content: "phrasingContent*",
            marks: "_",
            attrs: {
                level: {
                    default: 1,
                    validate(val: number) {
                        return Number.isInteger(val) && val >= 1 && val <= 6;
                    },
                },
                align: { default: "left" },
            },
            parseDOM: [
                { tag: "h1", attrs: { level: 1 } },
                { tag: "h2", attrs: { level: 2 } },
                { tag: "h3", attrs: { level: 3 } },
                { tag: "h4", attrs: { level: 4 } },
                { tag: "h5", attrs: { level: 5 } },
                { tag: "h6", attrs: { level: 6 } },
            ],
            group: "flowContent",
            toDOM(node) {
                const { level, align } = node.attrs;
                return [`h${level}`, { style: `text-align: ${align}` }, 0];
            },
        },
        thematicBreak: {
            group: "flowContent",
            parseDOM: [{ tag: "hr" }],
            toDOM() {
                return ["hr"];
            },
        },
        blockquote: {
            group: "flowContent",
            content: "flowContent+",
            toDOM() {
                return ["blockquote", 0];
            },
        },
        list: {
            attrs: {
                ordered: boolean({ default: false }),
                start: integer({ default: undefined }),
                spread: boolean({ default: false }),
            },
            group: "flowContent",
            content: "listContent+",
            parseDOM: [
                {
                    tag: "ol",
                    getAttrs(dom: HTMLElement) {
                        return {
                            start: dom.hasAttribute("start")
                                ? +dom.getAttribute("start")!
                                : 1,
                            spread: dom.hasAttribute("data-spread"),
                            ordered: true,
                        };
                    },
                },
                {
                    tag: "ul",
                    getAttrs(dom: HTMLElement) {
                        return {
                            spread: dom.hasAttribute("data-spread"),
                            ordered: false,
                        };
                    },
                },
            ],
            toDOM({ attrs }) {
                return [
                    attrs.ordered ? "ol" : "ul",
                    { "data-spread": attrs.spread ? "true" : null },
                    0,
                ];
            },
        },
        listItem: {
            defining: true,
            content: "flowContent*",
            parseDOM: [{ tag: "li" }],
            group: "listContent",
            toDOM() {
                return ["li", 0];
            },
        },
        html: {
            group: "flowContent",
            toDOM() {
                return ["div", { class: "html" }, 0];
            },
            content: "phrasingContent*",
        },
        code_block: {
            attrs: {
                lang: string({ default: "text" }),
                meta: string({ optional: true }),
                class: string({ default: "" }),
                showLineNumbers: boolean({ default: false }),
                startingLineNumber: integer({ default: 1 }),
                emphasizeLines: {
                    default: [],
                    validate(val: unknown) {
                        return (
                            Array.isArray(val) &&
                            val.find((x) => !Number.isInteger(x)) === undefined
                        );
                    },
                },
            },
            parseDOM: [
                {
                    tag: "pre",
                    preserveWhitespace: "full",
                    getAttrs(node: HTMLElement) {
                        return {
                            lang: [...node.classList]
                                .find((x) => x.startsWith("language-"))
                                ?.replace("language-", ""),
                            meta: node.getAttribute("data-meta") ?? undefined,
                            emphasizeLines:
                                node
                                    .getAttribute("data-emphasize-lines")
                                    ?.split(",")
                                    .map((x: string) => parseInt(x)) ?? [],
                        };
                    },
                },
            ],
            code: true,
            defining: true,
            toDOM(node) {
                return [
                    "pre",
                    { class: `language-${node.attrs.lang}` },
                    ["code", 0],
                ];
            },
            group: "flowContent",
            content: "text*",
        },
        // Code block with hidden MyST for saving
        // For now not editable
        unsupported_block: {
            attrs: {
                myst: { default: null },
                editable: { default: false },
            },
            toDOM(_node) {
                return ["pre", { class: `unsupported_block` }, ["code", 0]];
            },
            group: "flowContent",
            content: "text*",
        },
        target: {
            attrs: { label: string() },
            group: "flowContent",
            toDOM(node) {
                return ["span", { "data-label": node.attrs.label }, 0];
            },
            content: "text*",
        },
        directive: {
            attrs: { name: string(), args: string(), value: string() },
            group: "flowContent",
            toDOM(node) {
                return ["div", { "data-directive": node.attrs.name }, 0];
            },
            content: "flowContent*",
        },
        admonition: {
            attrs: {
                kind: oneOf({
                    values: [
                        "attention",
                        "caution",
                        "danger",
                        "error",
                        "hint",
                        "important",
                        "note",
                        "seealso",
                        "tip",
                        "warning",
                        "topic", // <-- add "topic" if needed
                    ] as const,
                }),
                class: string(),
            },
            group: "flowContent",
            toDOM(node) {
                return ["div", { class: `admonition ${node.attrs.kind}` }, 0];
            },
            content: "admonitionTitle? flowContent*",
        },
        admonitionTitle: {
            toDOM(_node) {
                return ["h2", 0];
            },
            content: "text*",
        },
        container: {
            attrs: { kind: oneOf({ values: ["figure", "table"] as const }) },
            group: "flowContent",
            toDOM(node) {
                return [node.attrs.kind, 0];
            },
            content: "flowContent*",
        },
        math: {
            attrs: {
                enumerated: boolean({ default: false }),
                enumerator: string({ optional: true }),
                label: string({ optional: true }),
            },
            group: "flowContent",
            toDOM() {
                return ["div", { class: "math" }, 0];
            },
            content: "text*",
        },
        table: {
            group: "flowContent",
            content: "tableRow+",
            tableRole: "table",
            isolating: true,
            toDOM() {
                return ["table", ["tbody", 0]];
            },
            parseDOM: [{ tag: "table" }],
        },
        tableRow: {
            content: "tableCell+",
            tableRole: "row",
            toDOM() {
                return ["tr", 0];
            },
            parseDOM: [{ tag: "tr" }],
        },
        tableCell: {
            content: "flowContent+",
            attrs: { style: { default: null } },
            tableRole: "cell",
            isolating: true,
            toDOM(node) {
                return [
                    "td",
                    node.attrs.style ? { style: node.attrs.style } : {},
                    0,
                ];
            },
            parseDOM: [
                {
                    tag: "td",
                    getAttrs: (node) => ({
                        style: (node as HTMLElement).getAttribute("style"),
                    }),
                },
            ],
        },
        footnoteDefinition: {
            group: "flowContent",
            toDOM() {
                return ["div", { class: "footnote-definition" }, 0];
            },
            content: "flowContent*",
        },
        text: {
            group: "phrasingContent",
            inline: true,
        },
        imageWrapper: {
            group: "flowContent",
            content: "image",
            toDOM(node) {
                const img = node.children[0];
                return [
                    "img",
                    {
                        src: img.attrs.url,
                        title: img.attrs.title,
                        style: `width: ${img.attrs.width}`,
                        alt: img.attrs.alt,
                        class: img.attrs.class,
                    },
                ];
            },
        },
        image: {
            group: "phrasingContent",
            inline: true,
            draggable: true,
            parseDOM: [
                {
                    tag: "img[src]",
                    getAttrs(node) {
                        return {
                            url: node.getAttribute("src"),
                            title: node.getAttribute("title") ?? "",
                            width:
                                node.style.width !== ""
                                    ? node.style.width
                                    : "50%",
                            alt: node.getAttribute("alt") ?? "",
                            class: node.getAttribute("class") ?? "",
                        };
                    },
                },
            ],
            toDOM(node) {
                return [
                    "img",
                    {
                        src: node.attrs.url,
                        title: node.attrs.title,
                        style: `width: ${node.attrs.width}`,
                        alt: node.attrs.alt,
                        class: node.attrs.class,
                    },
                ];
            },
            attrs: {
                class: string({ default: "" }),
                width: string(),
                align: oneOf({
                    values: ["left", "right", "center"] as const,
                    default: "left",
                }),
                url: string(),
                title: string({ default: "" }),
                alt: string({ default: "" }),
                reference: {
                    default: null,
                    validate(value: unknown) {
                        return (
                            value === null ||
                            (typeof value === "object" &&
                                value !== null &&
                                "referenceType" in value &&
                                typeof (value as { referenceType?: unknown })
                                    .referenceType === "string" &&
                                ["shortcut", "collapsed", "full"].includes(
                                    (value as { referenceType: string })
                                        .referenceType,
                                ))
                        );
                    },
                },
            },
        },
        inlineMath: {
            group: "phrasingContent",
            content: "text*",
            inline: true,
            toDOM() {
                return ["span", { class: "math" }, 0];
            },
            parseDOM: [{ tag: "span[class=math]" }],
        },
        break: {
            group: "phrasingContent",
            inline: true,
            selectable: false,
            toDOM() {
                return ["br"];
            },
            parseDOM: [{ tag: "br" }],
        },
        aside: {
            group: "flowContent",
            content: "admonitionTitle? flowContent*",
            attrs: {
                kind: oneOf({
                    values: ["sidebar", "margin", "topic"] as const,
                    optional: true,
                }),
                class: string({ optional: true }),
            },
            toDOM(node) {
                return [
                    "aside",
                    {
                        class:
                            (node.attrs.class || "") +
                            " aside-" +
                            node.attrs.kind,
                    },
                    0,
                ];
            },
        },
        caption: {
            group: "flowContent",
            content: "flowContent",
            toDOM() {
                return ["p", { class: "caption" }, 0];
            },
        },
        captionNumber: {
            group: "phrasingContent",
            content: "phrasingContent+",
            inline: true,
            atom: true,
            toDOM(node) {
                const captionKind =
                    node.attrs.kind?.charAt(0).toUpperCase() +
                    node.attrs.kind?.slice(1);
                return [
                    "span",
                    { class: "caption-number" },
                    `${captionKind} ${node.textContent}`,
                ];
            },
        },
    },
    marks: {
        emphasis: {
            parseDOM: [
                { tag: "em" },
                { tag: "i" },
                { style: "font-style=italic" },
                {
                    style: "font-style=normal",
                    clearMark: (m: Mark) => m.type.name === "em",
                },
            ],
            toDOM() {
                return ["em"];
            },
        },
        strong: {
            parseDOM: [
                { tag: "strong" },
                {
                    tag: "b",
                    getAttrs: (n) => n.style.fontWeight !== "normal" && null,
                },
                {
                    style: "font-weight=400",
                    clearMark: (m: Mark) => m.type.name === "strong",
                },
                {
                    style: "font-weight",
                    getAttrs: (v: string) =>
                        /^(bold(er)?|[5-9]\d{2,})$/.test(v) && null,
                },
            ],
            toDOM() {
                return ["strong"];
            },
        },
        // Inline code
        code: {
            parseDOM: [{ tag: "code" }],
            toDOM() {
                return ["code"];
            },
        },
        // Unsupported type
        unsupported: {
            attrs: {
                myst: { default: null },
                editable: { default: false },
            },
            toDOM() {
                return ["code", { class: "unsupported-inline" }];
            },
        },
        subscript: {
            parseDOM: [{ tag: "sub" }],
            toDOM() {
                return ["sub"];
            },
        },
        superscript: {
            parseDOM: [{ tag: "sup" }],
            toDOM() {
                return ["sup"];
            },
        },
        link: {
            attrs: {
                url: string(),
                title: string({ optional: true }),
                reference: {
                    default: null,
                    validate(value: unknown) {
                        return (
                            value === null ||
                            (typeof value === "object" &&
                                value !== null &&
                                "referenceType" in value &&
                                typeof (value as { referenceType?: unknown })
                                    .referenceType === "string" &&
                                ["shortcut", "collapsed", "full"].includes(
                                    (value as { referenceType: string })
                                        .referenceType,
                                ))
                        );
                    },
                },
            },
            toDOM(node) {
                return [
                    "a",
                    {
                        href: node.attrs.url,
                        title: node.attrs.title,
                    },
                    0,
                ];
            },
        },
        underline: {
            parseDOM: [{ tag: "u" }, { style: "text-decoration=underline" }],
            toDOM() {
                return ["u"];
            },
        },
        strikethrough: {
            parseDOM: [
                { tag: "s" },
                { tag: "del" },
                { style: "text-decoration=line-through" },
            ],
            toDOM() {
                return ["s", 0];
            },
        },
    },
    topNode: "root",
});