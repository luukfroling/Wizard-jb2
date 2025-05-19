import { mystParse } from "myst-parser";
import { schema } from "../schema";
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
} from "myst-spec";
import type { GenericNode, GenericParent } from "myst-common";
import { Node } from "prosemirror-model";

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

export function parseMyst(source: string): Node {
    const parsed = mystParse(source);
    // console.log(parsed);
    return mystToProseMirror(parsed);
}

export function mystToProseMirror(myst: GenericParent): Node {
    const definitions = findDefinitions(myst);
    return parseTreeRecursively(myst, definitions);
}

function children(node: GenericNode, defs: DefinitionMap): Node[] | undefined {
    return node.children?.map((x) => parseTreeRecursively(x, defs));
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

const handlers = {
    root: (node: Root, defs: DefinitionMap) =>
        schema.node("root", {}, children(node, defs)),
    block: (node: Block, defs: DefinitionMap) =>
        schema.node("block", { meta: node.meta }, children(node, defs)),
    paragraph: (node: Paragraph, defs: DefinitionMap) =>
        schema.node("paragraph", {}, children(node, defs)),
    definition: (node: Definition) =>
        schema.node("definition", { url: node.url, type: node.type }),
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
            "code",
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
    mystTarget: (node: Target) =>
        schema.node("target", { label: node.label?.trim()?.toLowerCase() }),
    mystDirective: (node: Directive, defs: DefinitionMap) =>
        schema.node(
            "directive",
            pick(node, "name", "value", "args"),
            children(node, defs),
        ),
    admonition: (node: Admonition, defs: DefinitionMap) =>
        schema.node("admonition", { kind: node.kind }, children(node, defs)),
    admonitionTitle: (node: AdmonitionTitle, defs: DefinitionMap) =>
        schema.node("admonitionTitle", {}, children(node, defs)),
    container: (node: Container, defs: DefinitionMap) =>
        schema.node("container", { kind: node.kind }, children(node, defs)),
    emphasis: (node: Emphasis, defs: DefinitionMap) =>
        parseTreeRecursively(node, defs).mark([schema.mark("emphasis")]),
    strong: (node: Strong, defs: DefinitionMap) =>
        parseTreeRecursively(node, defs).mark([schema.mark("strong")]),
    link: (node: Link, defs: DefinitionMap) =>
        parseTreeRecursively(node, defs).mark([
            schema.mark("link", { url: node.url, title: node.title }),
        ]),
    linkReference: (node: LinkReference, defs: DefinitionMap) =>
        parseTreeRecursively(node, defs).mark([
            schema.mark("link", {
                url: defs.get(node.identifier!.trim().toLowerCase()),
                reference: {
                    referenceType: node.referenceType,
                },
            }),
        ]),
};

function parseTreeRecursively(
    myst: MystNode,
    definitions: Map<string, Definition>,
): Node {
    if (!(myst.type in handlers))
        throw new RangeError(`Unknown node type '${myst.type}'`);
    const handler = (
        handlers as unknown as Record<
            string,
            (node: MystNode, definitions: DefinitionMap) => Node
        >
    )[myst.type];
    return handler(myst, definitions);
}
