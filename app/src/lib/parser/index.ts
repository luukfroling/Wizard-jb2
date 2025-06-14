import { mystParse } from "myst-parser";
import { schema } from "../schema";
import { visit } from "unist-util-visit";
import { unified } from "unified";
import { buttonRole } from "myst-ext-button";
import { cardDirective } from "myst-ext-card";
import { gridDirective } from "myst-ext-grid";
import { tabDirectives } from "myst-ext-tabs";
import { proofDirective } from "myst-ext-proof";
import { exerciseDirectives } from "myst-ext-exercise";
import { PageFrontmatter, validatePageFrontmatter } from "myst-frontmatter";
import {
    mathPlugin,
    footnotesPlugin,
    keysPlugin,
    htmlPlugin,
    reconstructHtmlPlugin,
    basicTransformationsPlugin,
    enumerateTargetsPlugin,
    resolveReferencesPlugin,
    WikiTransformer,
    GithubTransformer,
    DOITransformer,
    RRIDTransformer,
    RORTransformer,
    linksPlugin,
    ReferenceState,
    abbreviationPlugin,
    glossaryPlugin,
    joinGatesPlugin,
    getFrontmatter,
} from "myst-transforms";

import type {
    Node as MystNode,
    Block,
    Paragraph,
    Text,
    Emphasis,
    Strong,
    Link,
    LinkReference,
    Definition,
    Parent as MystParent,
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
    Image,
    Caption,
    Subscript,
    Superscript,
    Underline,
} from "myst-spec";
import type { GenericNode, GenericParent } from "myst-common";
import { Mark, Node } from "prosemirror-model";
import { VFile } from "vfile";
import { Aside, CaptionNumber, Delete } from "myst-spec-ext";

type DefinitionMap = Map<string, Definition>;

export function findDefinitions(
    myst: MystNode,
    map: DefinitionMap = new Map(),
): Map<string, Definition> {
    if (myst.type === "definition") {
        // MyST spec conversion to typescript types is unfortunately far from perfect, so we have to use some casting.
        const def = myst as Definition;
        map.set(def.identifier!.trim().toLowerCase(), def);
    } else if ("children" in myst) {
        for (const child of (myst as MystParent).children) {
            findDefinitions(child, map);
        }
    }
    return map;
}

/** Parse raw MyST into a ProseMirror document.
 */
export async function parseMyst(source: string): Promise<Node> {
    const parsed = await parseToMystAST(source);
    return mystToProseMirror(parsed);
}

/** Parse MyST abstract syntax tree into a ProseMirror document.
 */
export function mystToProseMirror(myst: GenericParent): Node {
    const definitions = findDefinitions(myst);
    const res = transformAst(myst, definitions);
    if (Array.isArray(res)) {
        throw new TypeError("Final parse result should not be array");
    }
    return res;
}

/** Utility function to recursively convert children in a handler function.
 */
function children(node: GenericNode, defs: DefinitionMap): Node[] | undefined {
    return node.children?.flatMap((x) => {
        const res = transformAst(x, defs);
        return Array.isArray(res) ? res : [res];
    });
}

/** Utility function to recursively mark children in a handler function.
 * This is used to mark inline content as
 */
function markChildren(
    node: GenericNode,
    defs: DefinitionMap,
    ...marks: Mark[]
): Node[] | undefined {
    return node?.children
        ?.flatMap((n) => transformAst(n, defs))
        ?.map((x) => x.mark([...x.marks, ...marks]));
}

function pick<T extends object, A extends keyof T>(
    src: T,
    ...attrs: A[]
): Pick<T, A> {
    const obj: Record<PropertyKey, unknown> = {};
    for (const attr of attrs) {
        obj[attr] = src[attr];
    }
    return obj as Pick<T, A>;
}

/** List of supported directives
 *
 * This is the list of directives we currently render into editable content.
 * Other directives remain untouched and their code will be shown in the editor.
 */
const SUPPORTED_DIRECTIVES = [
    "admonition",
    "attention", // alias of 'admonition'
    "caution", // alias of 'admonition'
    "danger", // alias of 'admonition'
    "error", // alias of 'admonition'
    "important", // alias of 'admonition'
    "hint", // alias of 'admonition'
    "note", // alias of 'admonition'
    "seealso", // alias of 'admonition'
    "tip", // alias of 'admonition'
    "warning", // alias of 'admonition'
];

/** Handlers for MyST AST types
 *
 * These are the handlers that convert the MyST abstract syntax tree into
 * ProseMirror nodes. They are called by the transformAst function, and in turn
 * call the transformAst function again, to convert the AST recursively.
 *
 * Some nodes cannot be directly converted to ProseMirror nodes, because,
 * according to the MyST spec, they can include block (flow) or inline
 * (phrasing) content. This is not supported by ProseMirror, which only allows
 * a certain node type to support flow xor phrasing content. We get around this
 * by wrapping inline children in a paragraph. For an example, see listItem
 *
 * TODO: Right now, typing is messy, with casting and all. Figure out a way to
 * have better typing.
 *
 * TODO: It seems keeping track of definitions is not necessary, since the
 * parser seemingly handles this already. It doesn't emit the linkReference
 * node, even though it is defined in the MyST specification.
 */
const handlers = {
    root: (node: Root, defs: DefinitionMap) =>
        schema.node("root", {}, children(node, defs)),
    block: (node: Block, defs: DefinitionMap) =>
        schema.node("block", { meta: node.meta }, children(node, defs)),
    paragraph: (node: Paragraph, defs: DefinitionMap) =>
        schema.node("paragraph", {}, children(node, defs)),
    definition: (node: Definition) =>
        schema.node("definition", {
            url: node.url,
            identifier: node.identifier,
        }),
    heading: (node: Heading, defs: DefinitionMap) =>
        schema.node(
            "heading",
            {
                level: node.depth,
                enumerated: node.enumerated,
                enumerator: node.enumerator,
                identifier: node.identifier,
                label: node.label,
            },
            children(node, defs),
        ),
    thematicBreak: (_node: ThematicBreak) => schema.node("thematicBreak"),
    blockquote: (node: Blockquote, defs: DefinitionMap) =>
        schema.node("blockquote", {}, children(node, defs)),
    list: (node: List, defs: DefinitionMap) =>
        schema.node(
            "list",
            { spread: node.spread, ordered: node.ordered },
            children(node, defs),
        ),
    listItem: (node: ListItem, defs: DefinitionMap) => {
        let myChildren = children(node, defs);
        if (myChildren !== undefined && myChildren.every((x) => x.isInline)) {
            myChildren = [schema.node("paragraph", {}, myChildren)];
        }
        return schema.node("listItem", { spread: node.spread }, myChildren);
    },
    text: (node: Text) => schema.text(node.value),
    html: (node: HTML) => schema.node("html", { value: node.value }),
    code: (node: Code) =>
        schema.node(
            "code_block",
            pick(
                node,
                "lang",
                "meta",
                "class",
                "showLineNumbers",
                "emphasizeLines",
                "identifier",
                "label",
            ),
            schema.text(node.value),
        ),
    inlineCode: (node: { value: string }) =>
        schema.text(node.value, [schema.mark("code")]),
    mystTarget: (node: Target) =>
        schema.node("target", { label: node.label?.trim()?.toLowerCase() }),
    mystDirective: (node: Directive, defs: DefinitionMap) =>
        schema.node(
            "directive",
            pick(node, "name", "value", "args"),
            SUPPORTED_DIRECTIVES.includes(node.name)
                ? children(node, defs)
                : undefined,
        ),
    admonition: (node: Admonition, defs: DefinitionMap) =>
        schema.node("admonition", { kind: node.kind }, children(node, defs)),
    admonitionTitle: (node: AdmonitionTitle, defs: DefinitionMap) =>
        schema.node("admonitionTitle", {}, children(node, defs)),
    container: (node: Container, defs: DefinitionMap) =>
        schema.node(
            "container",
            { kind: node.kind },
            node.children?.flatMap((x) => {
                const res =
                    x.type === "image"
                        ? schema.node("imageWrapper", {}, transformAst(x, defs))
                        : transformAst(x, defs);
                return Array.isArray(res) ? res : [res];
            }),
        ),
    emphasis: (node: Emphasis, defs: DefinitionMap) =>
        markChildren(node, defs, schema.mark("emphasis")),
    strong: (node: Strong, defs: DefinitionMap) =>
        markChildren(node, defs, schema.mark("strong")),
    link: (node: Link, defs: DefinitionMap) =>
        markChildren(
            node,
            defs,
            schema.mark("link", pick(node, "url", "title")),
        ),
    superscript: (node: Superscript, defs: DefinitionMap) =>
        markChildren(node, defs, schema.mark("superscript")),

    subscript: (node: Subscript, defs: DefinitionMap) =>
        markChildren(node, defs, schema.mark("subscript")),

    underline: (node: Underline, defs: DefinitionMap) =>
        markChildren(node, defs, schema.mark("underline")),

    delete: (node: Delete, defs: DefinitionMap) =>
        markChildren(node, defs, schema.mark("strikethrough")),
    linkReference: (node: LinkReference, defs: DefinitionMap) =>
        markChildren(
            node,
            defs,
            schema.mark("link", {
                url: defs.get(node.identifier!.trim().toLowerCase()),
                reference: {
                    referenceType: node.referenceType,
                },
            }),
        ),
    math: (node: Math) =>
        schema.node(
            "math",
            pick(node, "identifier", "label"),
            schema.text(node.value),
        ),
    inlineMath: (node: InlineMath) =>
        schema.node("inlineMath", {}, schema.text(node.value)),

    image: (node: Image) =>
        schema.node(
            "image",
            pick(node, "class", "width", "align", "url", "title", "alt"),
        ),

    caption: (node: Caption, defs: DefinitionMap) =>
        schema.node("caption", {}, children(node, defs)),
    captionNumber: (node: CaptionNumber, defs: DefinitionMap) =>
        schema.node(
            "captionNumber",
            pick(node, "identifier", "kind", "label", "html_id", "enumerator"),
            children(node, defs),
        ),
    // Extension types
    aside: (node: Aside, defs: DefinitionMap) =>
        schema.node(
            "aside",
            { kind: node.kind, class: node.class },
            children(node, defs),
        ),

    default: (node: Text) => schema.text(node.value),
};

function transformAst(
    myst: MystNode,
    definitions: Map<string, Definition>,
): Node | Node[] {
    const handler = (
        handlers as unknown as Record<
            string,
            (node: MystNode, definitions: DefinitionMap) => Node
        >
    )[myst.type];
    if (!(myst.type in handlers)) {
        console.warn(`Unknown node type '${myst.type}'`);
        // console.log("Unsupported Debug: " + myst.data)

        // console.log(nodeContent)

        // We return a ProseMirror `code_block` or `code` node.
        if ("children" in myst) {
            // Likely a block Node because it has children
            let nodeContent: string;
            let editable = false;

            // If the Node has a string value make it editable
            if ("value" in myst && typeof myst.value === "string") {
                nodeContent = myst.value;
                editable = true;
            } else {
                // If Node has no string value make it not editable
                nodeContent = JSON.stringify(myst, null, 2);
            }

            // Return the unsupported MyST Node
            return schema.node(
                "unsupported_block",
                { myst: myst, editable: editable },
                schema.text(nodeContent),
            );
        } else {
            // No children so likely inline
            let nodeContent: string;
            let editable: boolean = false;
            // Transform unsupported node to text
            if (myst.data) {
                nodeContent = JSON.stringify(myst.data, null, 2);
                editable = true;
            } else {
                nodeContent =
                    "Directive not supported and no text content found";
            }

            return schema.text(nodeContent, [
                schema.mark("unsupported", {
                    myst: myst,
                    editable: editable,
                }),
            ]);
        }
    }
    return handler(myst, definitions);
}

export function parseToMystAST(
    text: string,
    defaultFrontmatter?: PageFrontmatter,
) {
    const vfile = new VFile();
    const parseMyst = (content: string) =>
        mystParse(content, {
            markdownit: { linkify: true },
            directives: [
                cardDirective,
                gridDirective,
                ...tabDirectives,
                proofDirective,
                ...exerciseDirectives,
            ],
            roles: [buttonRole],
            vfile,
        });
    const mdast = parseMyst(text);
    const linkTransforms = [
        new WikiTransformer(),
        new GithubTransformer(),
        new DOITransformer(),
        new RRIDTransformer(),
        new RORTransformer(),
    ];
    // const references: References = {
    //     cite: { order: [], data: {} },
    // };
    const frontmatterRaw = getFrontmatter(vfile, mdast, {
        keepTitleNode: true,
    });
    const frontmatter: Omit<PageFrontmatter, "parts"> = validatePageFrontmatter(
        frontmatterRaw,
        {
            property: "frontmatter",
            messages: {},
        },
    );
    const state = new ReferenceState("", {
        frontmatter: {
            ...frontmatter,
            numbering: frontmatter.numbering ?? defaultFrontmatter?.numbering,
        },
        vfile,
    });
    visit(mdast, (n) => {
        // Before we put in the citation render, we can mark them as errors
        if (n.type === "cite") {
            n.error = true;
        }
    });
    unified()
        .use(reconstructHtmlPlugin) // We need to group and link the HTML first
        .use(htmlPlugin) // Some of the HTML plugins need to operate on the transformed html, e.g. figure caption transforms
        .use(basicTransformationsPlugin, { parser: parseMyst })
        .use(mathPlugin, { macros: frontmatter?.math ?? {} }) // This must happen before enumeration, as it can add labels
        .use(glossaryPlugin) // This should be before the enumerate plugins
        .use(abbreviationPlugin, { abbreviations: frontmatter.abbreviations })
        .use(enumerateTargetsPlugin, { state })
        .use(linksPlugin, { transformers: linkTransforms })
        .use(footnotesPlugin)
        .use(joinGatesPlugin)
        .use(resolveReferencesPlugin, { state })
        .use(keysPlugin)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .runSync(mdast as any, vfile);

    return mdast;
}
