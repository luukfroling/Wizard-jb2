import { schema } from "../schema";

import type {
    Node as MystNode,
    Block,
    Paragraph,
    Text,
    Definition,
    HTML,
    Root,
    Heading,
    ThematicBreak,
    Blockquote,
    List,
    ListItem,
    Code,
    Target,
    Directive,
    Admonition,
    AdmonitionTitle,
    Container,
    Math,
    InlineMath,
    PhrasingContent,
    Break,
    BlockBreak,
    Table,
    FootnoteDefinition,
    Image,
    Caption,
} from "myst-spec";
import { Node, Schema } from "prosemirror-model";
import { unified } from "unified";
import mystToMd from "myst-to-md";
import { Aside, CaptionNumber } from "myst-spec-ext";

type NodeName = typeof schema extends Schema<infer T> ? T : never;

function mystChildren(node: Node): MystNode[] {
    return node.children.map((x) => proseMirrorToMyst(x));
}

const proseMirrorToMystHandlers = {
    code: (node: Node): Code => ({ type: "code", value: node.textContent }),
    root: (node: Node): Root => ({
        type: "root",
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: node.children.map((x) => proseMirrorToMyst(x)) as any,
    }),
    block: (node: Node): Block => ({
        type: "block",
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: node.children.map((x) => proseMirrorToMyst(x)) as any,
    }),
    paragraph: (node: Node): Paragraph => ({
        type: "paragraph",
        children: node.children.map((x) =>
            proseMirrorToMyst(x),
        ) as PhrasingContent[],
    }),
    definition: (node: Node): Definition => ({
        type: "definition",
        url: node.attrs.url as string,
        identifier: node.attrs.identifier as string,
    }),
    heading: (node: Node): Heading => ({
        type: "heading",
        depth: node.attrs.depth as number,
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
    thematicBreak: (_node: Node): ThematicBreak => ({
        type: "thematicBreak",
    }),
    blockquote: (node: Node): Blockquote => ({
        type: "blockquote",
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
    list: (node: Node): List => ({
        type: "list",
        start: node.attrs.start as number,
        spread: node.attrs.spread as boolean,
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
    listItem: (node: Node): ListItem => ({
        type: "listItem",
        spread: node.attrs.spread,
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
    text: (node: Node): Text => ({
        type: "text",
        value: node.text!,
    }),
    html: (node: Node): HTML => ({
        type: "html",
        value: node.textContent,
    }),
    target: (node: Node): Target => ({
        type: "mystTarget",
        label: node.attrs.label,
    }),
    directive: (node: Node): Directive => ({
        type: "mystDirective",
        name: node.attrs.name as string,
        args: node.attrs.args as string,
        value: node.attrs.value as string,
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
    admonition: (node: Node): Admonition => ({
        type: "admonition",
        kind: node.attrs.kind,
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
    admonitionTitle: (node: Node): AdmonitionTitle => ({
        type: "admonitionTitle",
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
    container: (node: Node): Container => ({
        type: "container",
        kind: node.attrs.kind,
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
    math: (node: Node): Math => ({
        type: "math",
        value: node.textContent,
        enumerated: node.attrs.enumerated,
        enumerator: node.attrs.enumerator,
    }),
    inlineMath: (node: Node): InlineMath => ({
        type: "inlineMath",
        value: node.textContent,
    }),
    blockBreak: (node: Node): BlockBreak => ({
        type: "blockBreak",
        meta: node.attrs.meta,
    }),
    table: (_node: Node): Table => {
        throw new Error("not yet supported");
    },
    footnoteDefinition: (node: Node): FootnoteDefinition => ({
        type: "footnoteDefinition",
        identifier: node.attrs.identifier,
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
    break: (_node: Node): Break => ({ type: "break" }),
    image: (node: Node): Image => ({
        type: "image",
        url: node.attrs.url,
        class: node.attrs.class,
        alt: node.attrs.alt,
        align: node.attrs.align,
        width: node.attrs.width,
        title: node.attrs.title,
    }),
    imageWrapper: (wrapper: Node): Image => {
        const node = wrapper.children[0];
        return {
            type: "image",
            url: node.attrs.url,
            class: node.attrs.class,
            alt: node.attrs.alt,
            align: node.attrs.align,
            width: node.attrs.width,
            title: node.attrs.title,
        };
    },
    aside: (node: Node): Aside => ({
        type: "aside",
        ...(node.attrs.label !== undefined ? { label: node.attrs.label } : {}),
        kind: node.attrs.kind,
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
    caption: (node: Node): Caption => ({
        type: "caption",
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
    captionNumber: (node: Node): CaptionNumber => ({
        type: "captionNumber",
        kind: node.attrs.kind,
        label: node.attrs.label,
        html_id: node.attrs.html_id,
        enumerator: node.attrs.enumerator,
        identifier: node.attrs.identifier,
        // FIXME: Types for mdast are not very nice, so use any for now
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: mystChildren(node) as any,
    }),
} satisfies Record<NodeName, (node: Node) => MystNode>;

export function proseMirrorToMyst(node: Node): MystNode {
    return proseMirrorToMystHandlers[node.type.name as NodeName](node);
}

export function prosemirrorToMarkdown(node: Node): string {
    const ast = proseMirrorToMyst(node);
    const result = unified()
        .use(mystToMd)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .stringify(ast as any).result;
    if (typeof result !== "string") {
        throw new Error("invalid result");
    }
    return result;
}
