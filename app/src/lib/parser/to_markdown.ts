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
    Emphasis,
    Link,
    PhrasingContent,
    Strong,
} from "myst-spec";
import { Fragment, Mark, Node, Schema } from "prosemirror-model";
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

function applyMarks(textNode: Node): PhrasingContent[] {
    const base: PhrasingContent = { type: "text", value: textNode.text! };

    const priority: Record<string, number> = {
        emphasis: 0,
        em: 0,
        strong: 1,
        link: 2,
    };

    const sorted = [...textNode.marks].sort(
        (a, b) => (priority[a.type.name] ?? 99) - (priority[b.type.name] ?? 99),
    );

    return sorted.reduce<PhrasingContent[]>(
        (children, mark) => {
            const wrapped = wrapMark(mark, children);
            return [wrapped];
        },
        [base],
    );
}

function wrapMark(mark: Mark, children: PhrasingContent[]): PhrasingContent {
    switch (mark.type.name) {
        case "strong":
            return { type: "strong", children } as Strong;
        case "em":
        case "emphasis":
            return { type: "emphasis", children } as Emphasis;
        case "link": {
            const url = (mark.attrs.href ?? mark.attrs.url) as string;
            const title = (mark.attrs.title ?? "") as string;
            return { type: "link", url, title, children } as Link;
        }
        default:
            return {
                type: "text",
                value: children.map((c) => (c as Text).value).join(""),
            };
    }
}

function handleChildren<T extends MystNode>(node: Node): ChildrenOf<T> {
    // first get all phrasing‐content items
    const items = fragmentToArray(node.content).flatMap((child) => {
        if (child.isText) {
            return applyMarks(child);
        }
        return proseMirrorToMyst(child);
    });

    // now merge any adjacent <strong> nodes back into one node TODO maybe do this for all types if needed?
    const merged: PhrasingContent[] = [];
    for (const item of items as PhrasingContent[]) {
        if (
            item.type === "strong" &&
            merged.length > 0 &&
            merged[merged.length - 1].type === "strong"
        ) {
            const prev = merged[merged.length - 1] as Strong;
            prev.children = prev.children.concat((item as Strong).children);
        } else {
            merged.push(item);
        }
    }

    return merged as ChildrenOf<T>;
}

function fragmentToArray(fragment: Fragment): Node[] {
    const arr: Node[] = [];
    fragment.forEach((child) => arr.push(child as Node));
    return arr;
}

const proseMirrorToMystHandlers = {
    code: (node: Node): Code => ({ type: "code", value: node.textContent }),
    root: (node: Node): Root => ({
        type: "root",
        children: handleChildren<Root>(node),
    }),
    block: (node: Node): Block => ({
        type: "block",
        children: handleChildren<Block>(node),
    }),
    paragraph: (node: Node): Paragraph => ({
        type: "paragraph",
        children: handleChildren<Paragraph>(node),
    }),
    definition: (node: Node): Definition => ({
        type: "definition",
        url: node.attrs.url as string,
        identifier: node.attrs.identifier as string,
    }),
    heading: (node: Node): Heading => ({
        type: "heading",
        depth: node.attrs.depth as number,
        children: handleChildren<Heading>(node),
    }),
    thematicBreak: (_node: Node): ThematicBreak => ({
        type: "thematicBreak",
    }),
    blockquote: (node: Node): Blockquote => ({
        type: "blockquote",
        children: handleChildren<Blockquote>(node),
    }),
    list: (node: Node): List => ({
        type: "list",
        start: node.attrs.start as number,
        spread: node.attrs.spread as boolean,
        children: handleChildren<List>(node),
    }),
    listItem: (node: Node): ListItem => ({
        type: "listItem",
        spread: node.attrs.spread,
        children: handleChildren<ListItem>(node),
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
        children: handleChildren<Directive>(node),
    }),
    admonition: (node: Node): Admonition => ({
        type: "admonition",
        kind: node.attrs.kind,
        children: mystChildren(node) as ChildrenOf<Admonition>,
    }),
    admonitionTitle: (node: Node): AdmonitionTitle => ({
        type: "admonitionTitle",
        children: handleChildren<AdmonitionTitle>(node),
    }),
    container: (node: Node): Container => ({
        type: "container",
        kind: node.attrs.kind,
        children: handleChildren<Container>(node),
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
        children: handleChildren<FootnoteDefinition>(node),
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
        children: handleChildren<Aside>(node),
    }),
    caption: (node: Node): Caption => ({
        type: "caption",
        children: handleChildren<Caption>(node),
    }),
    captionNumber: (node: Node): CaptionNumber => ({
        type: "captionNumber",
        kind: node.attrs.kind,
        label: node.attrs.label,
        html_id: node.attrs.html_id,
        enumerator: node.attrs.enumerator,
        identifier: node.attrs.identifier,
        children: handleChildren<CaptionNumber>(node),
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
