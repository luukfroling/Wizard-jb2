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
    Subscript,
    Superscript,
    Underline,
} from "myst-spec";
import { Mark, Node, Schema } from "prosemirror-model";
import { unified } from "unified";
import mystToMd from "myst-to-md";
import { Aside, CaptionNumber, Delete } from "myst-spec-ext";

type ChildrenOf<T extends MystNode> = T extends { children: infer C }
    ? C
    : never;

type NodeName = typeof schema extends Schema<infer T> ? T : never;

/**
 * Convert all ProseMirror child nodes of node into corresponding MyST nodes.
 * @param node - A ProseMirror node
 * @returns Array of MyST AST nodes for each child
 */
function mystChildren(node: Node): MystNode[] {
    return node.children.map((x) => proseMirrorToMyst(x));
}

/**
 * Wrap a sequence of MyST phrasing content with a single mark.
 * @param mark - ProseMirror mark to convert
 * @param children - Array of existing PhrasingContent nodes
 * @returns A new PhrasingContent node with the given mark applied
 */
function wrapMark(mark: Mark, children: PhrasingContent[]): PhrasingContent {
    switch (mark.type.name) {
        case "strong":
            return { type: "strong", children } as Strong;

        case "em":
        case "emphasis":
            return { type: "emphasis", children } as Emphasis;

        case "superscript":
            return { type: "superscript", children } as Superscript;

        case "subscript":
            return { type: "subscript", children } as Subscript;

        case "underline":
            return { type: "underline", children } as Underline;

        case "strikethrough":
        case "delete":
            return {
                type: "delete",
                children,
            } as Delete as unknown as PhrasingContent;

        case "link": {
            const url = (mark.attrs.href ?? mark.attrs.url) as string;
            const title = (mark.attrs.title ?? "") as string;
            return { type: "link", url, title, children } as Link;
        }

        default:
            // fallback to plain text
            return {
                type: "text",
                value: children.map((c) => (c as Text).value).join(""),
            };
    }
}

function handleChildren<T extends MystNode>(node: Node): ChildrenOf<T> {
    // if this is an inline container (paragraph, heading, etc.)
    if (
        node.isInline ||
        /^(paragraph|heading|blockquote|link|emphasis|strong|delete|subscript|superscript|underline)$/.test(
            node.type.name,
        )
    ) {
        return handleInline(node) as ChildrenOf<T>;
    } else {
        // block‐level
        return node.children.map((x) => proseMirrorToMyst(x)) as ChildrenOf<T>;
    }
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

/**
 * Convert a ProseMirror node into its corresponding MyST AST node.
 * @param node - ProseMirror Node
 * @returns A MyST AST node
 */
export function proseMirrorToMyst(node: Node): MystNode {
    return proseMirrorToMystHandlers[node.type.name as NodeName](node);
}

/**
 * Serialize a ProseMirror node back to MyST Markdown.
 * @param node - ProseMirror AST node
 * @returns Markdown string in MyST syntax
 */
export function prosemirrorToMarkdown(node: Node): string {
    const mystAst = proseMirrorToMyst(node);
    const processor = unified().use(mystToMd);
    const mdast = processor.runSync(mystAst as Root);
    const result = processor.stringify(mdast).result as string;
    if (typeof result !== "string") {
        throw new Error("invalid result from remark-stringify");
    }
    return result;
}

const MARK_PRECEDENCE: string[] = [
    "link", 
    "strong",
    "emphasis",
    "underline",
    "delete",
    "superscript",
    "subscript",
    "inlineCode",
] as const;

/**
 * Should handle inline content, but does not work with complex nesting. TODO
 * For an example of how this breaks, run tests and look at the output of the deep nesting round trip:
 *    Expected: *one **two *three*** four*
 *    Received: *one **two ****three** four*
 *                        ^
 * This would render the same if not for the fact that the space in "**two **" doesn't allow "two" to become bold.
 * I think this can be fixed by replacing the sort by precedence approach with an approach that tracks the original nesting structure.
 * I am too tired to do that right now though.
 */
function handleInline(node: Node): PhrasingContent[] {
    const out: PhrasingContent[] = [];
    const tokens = Array.from(node.content.content);
    let idx = 0;

    while (idx < tokens.length) {
        const tok = tokens[idx]!;
        const marks = tok.marks.slice();

        if (marks.length === 0) {
            if (tok.isText) out.push({ type: "text", value: tok.text! });
            else out.push(proseMirrorToMyst(tok) as PhrasingContent);
            idx++;
            continue;
        }

        // Sort by precedence
        marks.sort(
            (a, b) =>
                MARK_PRECEDENCE.indexOf(a.type.name) -
                MARK_PRECEDENCE.indexOf(b.type.name),
        );
        const outer = marks.shift()!;

        // Collect all consecutive tokens that also have *outer* in their marks
        const innerChildren: PhrasingContent[] = [];

        while (
            idx < tokens.length &&
            tokens[idx].marks.some((m) => m.eq(outer))
        ) {
            const t = tokens[idx]!;
            let childNode: PhrasingContent = t.isText
                ? ({ type: "text", value: t.text! } as Text)
                : (proseMirrorToMyst(t) as PhrasingContent);

            const others = t.marks
                .filter((m) => !m.eq(outer))
                .sort(
                    (a, b) =>
                        MARK_PRECEDENCE.indexOf(b.type.name) -
                        MARK_PRECEDENCE.indexOf(a.type.name),
                );
            for (const m of others) {
                childNode = wrapMark(m, [childNode]) as PhrasingContent;
            }
            innerChildren.push(childNode);
            idx++;
        }
        out.push(wrapMark(outer, innerChildren) as PhrasingContent);
    }
    return out;
}
