/* @refresh reload */
import { Schema, Mark } from "prosemirror-model";

import { boolean, integer, oneOf, string } from "./utils";

// NOTE: Schema inspired by [prosemirror-markdown](https://github.com/ProseMirror/prosemirror-markdown/blob/master/src/schema.ts).
// Copyright (C) 2015-2017 by Marijn Haverbeke <marijn@haverbeke.berlin> and others
// Licensed under the MIT (Expat) License; SPDX identifier: MIT.

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
            attrs: {
                align: { default: "left" },
            },
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
            toDOM() {
                return ["div", { class: "definition" }, 0];
            },
        },
        heading: {
            defining: true,
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
            content: "block+",
            toDOM() {
                return ["blockquote", 0];
            },
        },
        list: {
            attrs: {
                ordered: boolean({ default: false }),
                start: integer({ default: 1 }),
                spread: boolean({ default: false }),
            },
            group: "flowContent",
            content: "listContent",
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
        code: {
            attrs: {
                lang: string({ default: "text" }),
                meta: string({ optional: true }),
                class: string({ default: "" }),
                showLineNumbers: boolean({ default: false }),
                startingLineNumber: integer({ default: 1 }),
                emphasizeLines: {
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
            content: "phrasingContent*",
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
            content: "text*",
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
                    ] as const,
                }),
                class: string(),
            },
            group: "flowContent",
            toDOM(node) {
                return ["div", { class: `admonition ${node.attrs.kind}` }, 0];
            },
            content: "block+",
        },
        container: {
            attrs: { kind: oneOf({ values: ["figure", "table"] as const }) },
            group: "flowContent",
            toDOM(node) {
                return ["div", { class: `container ${node.attrs.kind}` }, 0];
            },
            content: "block+",
        },
        math: {
            attrs: { enumerated: boolean() },
            group: "flowContent",
            toDOM() {
                return ["span", { class: "math" }, 0];
            },
            content: "text*",
        },
        table: {
            group: "flowContent",
            toDOM() {
                return ["table", 0];
            },
            content: "block+",
        },
        footnoteDefinition: {
            group: "flowContent",
            toDOM() {
                return ["div", { class: "footnote-definition" }, 0];
            },
            content: "block+",
        },
        text: {
            group: "phrasingContent",
            inline: true,
        },
        image: {
            group: "phrasingContent",
            inline: true,
            draggable: true,
            parseDOM: [
                {
                    tag: "img[src]",
                    getAttrs(node: HTMLElement) {
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
                width: string({ default: "50%" }), // <-- default to 50%
                align: oneOf({
                    values: ["left", "right", "center"] as const,
                    default: "left",
                }),
                url: string(),
                title: string({ default: "" }),
                alt: string({ default: "" }),
                reference: {
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
        break: {
            group: "phrasingContent",
            inline: true,
            selectable: false,
            toDOM() {
                return ["br"];
            },
            parseDOM: [{ tag: "br" }],
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
                    getAttrs: (n: HTMLElement) =>
                        n.style.fontWeight !== "normal" && null,
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
                    validate(value: unknown) {
                        return (
                            value === null ||
                            (typeof value === "object" &&
                                value !== null &&
                                "referenceType" in value &&
                                typeof (value as { referenceType?: unknown })
                                    .referenceType === "string" &&
                                (
                                    [
                                        "shortcut",
                                        "collapsed",
                                        "full",
                                    ] as string[]
                                ).includes(
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
        fontSize: {
            attrs: { size: {} },
            parseDOM: [
                { style: "font-size", getAttrs: (value) => ({ size: value }) },
            ],
            toDOM(node) {
                return ["span", { style: `font-size: ${node.attrs.size}` }, 0];
            },
        },
        fontFamily: {
            attrs: { family: {} },
            parseDOM: [
                {
                    style: "font-family",
                    getAttrs: (value) => ({ family: value }),
                },
            ],
            toDOM(node) {
                return [
                    "span",
                    { style: `font-family: ${node.attrs.family}` },
                    0,
                ];
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
