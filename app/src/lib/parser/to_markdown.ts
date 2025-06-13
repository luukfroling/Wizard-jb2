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

type ChildrenOf<T extends MystNode> = T extends { children: infer C }
    ? C
    : never;

type NodeName = typeof schema extends Schema<infer T> ? T : never;

function mystChildren(node: Node): MystNode[] {
    return node.children.map((x) => proseMirrorToMyst(x));
}

const proseMirrorToMystHandlers = {
    code: (node: Node): Code => ({ type: "code", value: node.textContent }),
    root: (node: Node): Root => ({
        type: "root",
        children: node.children.map((x) =>
            proseMirrorToMyst(x),
        ) as ChildrenOf<Root>,
    }),
    block: (node: Node): Block => ({
        type: "block",
        children: node.children.map((x) =>
            proseMirrorToMyst(x),
        ) as ChildrenOf<Block>,
    }),
    paragraph: (node: Node): Paragraph => ({
        type: "paragraph",
        children: node.children.map((x) =>
            proseMirrorToMyst(x),
        ) as ChildrenOf<Paragraph>,
    }),
    definition: (node: Node): Definition => ({
        type: "definition",
        url: node.attrs.url as string,
        identifier: node.attrs.identifier as string,
    }),
    heading: (node: Node): Heading => ({
        type: "heading",
        depth: node.attrs.depth as number,
        children: mystChildren(node) as ChildrenOf<Heading>,
    }),
    thematicBreak: (_node: Node): ThematicBreak => ({
        type: "thematicBreak",
    }),
    blockquote: (node: Node): Blockquote => ({
        type: "blockquote",
        children: mystChildren(node) as ChildrenOf<Blockquote>,
    }),
    list: (node: Node): List => ({
        type: "list",
        start: node.attrs.start as number,
        spread: node.attrs.spread as boolean,
        children: mystChildren(node) as ChildrenOf<List>,
    }),
    listItem: (node: Node): ListItem => ({
        type: "listItem",
        spread: node.attrs.spread,
        children: mystChildren(node) as ChildrenOf<ListItem>,
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
        children: mystChildren(node) as ChildrenOf<Directive>,
    }),
    admonition: (node: Node): Admonition => ({
        type: "admonition",
        kind: node.attrs.kind,
        children: mystChildren(node) as ChildrenOf<Admonition>,
    }),
    admonitionTitle: (node: Node): AdmonitionTitle => ({
        type: "admonitionTitle",
        children: mystChildren(node) as ChildrenOf<AdmonitionTitle>,
    }),
    container: (node: Node): Container => ({
        type: "container",
        kind: node.attrs.kind,
        children: mystChildren(node) as ChildrenOf<Container>,
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
        children: mystChildren(node) as ChildrenOf<FootnoteDefinition>,
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
        children: mystChildren(node) as ChildrenOf<Aside>,
    }),
    caption: (node: Node): Caption => ({
        type: "caption",
        children: mystChildren(node) as ChildrenOf<Caption>,
    }),
    captionNumber: (node: Node): CaptionNumber => ({
        type: "captionNumber",
        kind: node.attrs.kind,
        label: node.attrs.label,
        html_id: node.attrs.html_id,
        enumerator: node.attrs.enumerator,
        identifier: node.attrs.identifier,
        children: mystChildren(node) as ChildrenOf<CaptionNumber>,
    }),
} satisfies Record<NodeName, (node: Node) => MystNode>;

export function proseMirrorToMyst(node: Node): MystNode {
    return proseMirrorToMystHandlers[node.type.name as NodeName](node);
}

export function prosemirrorToMarkdown(node: Node): string {
    const ast = proseMirrorToMyst(node);
    const result = unified()
        .use(mystToMd)
        .stringify(ast as Root).result;
    if (typeof result !== "string") {
        throw new Error("invalid result");
    }
    return result;
}
