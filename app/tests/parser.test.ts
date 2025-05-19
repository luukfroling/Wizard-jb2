import { describe, expect, it } from "vitest";
import { parseMyst } from "../src/lib/parser";
import { Node } from "prosemirror-model";
import { schema } from "../src/lib/schema";

describe("Markdown parser", () => {
    it("parses a basic paragraph", () => {
        const parsed = parseMyst("Hello, world!");
        expect(parsed).toBeInstanceOf(Node);
        expect(parsed.children).toHaveLength(1);
        expect(parsed.children[0]).toBeInstanceOf(Node);
        expect(parsed.children[0].textContent).toBe("Hello, world!");
    });
    it.for([
        { heading: "#", level: 1 },
        { heading: "##", level: 2 },
        { heading: "###", level: 3 },
        { heading: "####", level: 4 },
        { heading: "#####", level: 5 },
        { heading: "######", level: 6 },
    ])("parses a heading level $level and paragraph", ({ heading, level }) => {
        const parsed = parseMyst(
            heading + " Hello, world!\n\nNice to see you!",
        );
        expect(parsed).toBeInstanceOf(Node);
        expect(parsed.children).toHaveLength(2);
        expect(parsed.children[0]).toBeInstanceOf(Node);
        expect(parsed.children[0].type).toBe(schema.nodes.heading);
        expect(parsed.children[0].attrs).toHaveProperty("level", level);
    });
    it("parses thematic break", () => {
        const parsed = parseMyst("Paragraph 1\n\n---\n\nParagraph 2");

        expect(parsed).toBeInstanceOf(Node);
        expect(parsed.children).toHaveLength(3);
        expect(parsed.children[1].type).toBe(schema.nodes.thematicBreak);
    });
    it.for([1, 2, 3])("parses blockquote nested %i times", (nesting) => {
        const parsed = parseMyst("> ".repeat(nesting) + "Hello world");
        expect(parsed).toBeInstanceOf(Node);
        expect(parsed.children).toHaveLength(1);
        let node = parsed.children[0];
        do {
            expect(node.children).toHaveLength(1);
            expect(node.type).toBeOneOf([
                schema.nodes.blockquote,
                schema.nodes.paragraph,
            ]);
            node = node.children[0];
        } while (node.type === schema.nodes.blockquote);
        expect(node.type).toBe(schema.nodes.paragraph);
        expect(node.textContent).toBe("Hello world");
    });
    it("parses a list", () => {
        const parsed = parseMyst("- item 1\n- item 2\n- item 3");
        expect(parsed).toBeInstanceOf(Node);
        expect(parsed.children).toHaveLength(1);
        expect(parsed.children[0].type).toBe(schema.nodes.list);
        expect(parsed.children[0].children).toHaveLength(3);
        for (const child of parsed.children[0].children) {
            expect(child.type).toBe(schema.nodes.listItem);
            expect(child.textContent).toMatch(/^item \d$/);
        }
    });
    it("parses a code block", () => {
        const parsed = parseMyst(
            "```javascript\nconsole.log('Hello, world!');\n```",
        );
        expect(parsed).toBeInstanceOf(Node);
        expect(parsed.children).toHaveLength(1);
        expect(parsed.children[0].type).toBe(schema.nodes.code);
        expect(parsed.children[0].textContent).toBe(
            "console.log('Hello, world!');",
        );
        expect(parsed.children[0].attrs).toHaveProperty("lang", "javascript");
    });
    it("parses a target label", () => {
        const parsed = parseMyst("(test_123)=\n# Header");
        expect(parsed).toBeInstanceOf(Node);
        expect(parsed.children).toHaveLength(2);
        expect(parsed.children[0].type).toBe(schema.nodes.target);
        expect(parsed.children[1].type).toBe(schema.nodes.heading);
    });
    it.for([
        {
            name: "args_and_options",
            myst: "```{args_and_options} foo bar\n:a: one\n:b: two\n\nABC directive\n```",
            args: "foo bar",
            value: ":a: one\n:b: two\n\nABC directive",
        },
        {
            name: "only_options",
            myst: "```{only_options}\n:key1: metadata1\n:key2: metadata2\n\nMy directive content.\n```",
            args: undefined,
            value: ":key1: metadata1\n:key2: metadata2\n\nMy directive content.",
        },
        {
            name: "yaml_options",
            myst: "```{yaml_options}\n---\nkey: value\n---\nHello world!",
            args: undefined,
            value: ":key: value\n\nHello world!",
        },
    ])("parses directive $name", ({ myst, args, value, name }) => {
        const parsed = parseMyst(myst);
        expect(parsed).toBeInstanceOf(Node);
        expect(parsed.children).toHaveLength(1);
        const node = parsed.children[0];
        expect(node.type).toBe(schema.nodes.directive);
        expect(node.attrs).toHaveProperty("value", value);
        expect(node.attrs).toHaveProperty("args", args);
        expect(node.attrs).toHaveProperty("name", name);
    });
    it.for([
        {
            myst: "```{warning}\nHello world!\n```",
            kind: "warning",
            title: undefined,
        },
        {
            myst: "```{note} Hello\nHello 123!\n```",
            kind: "note",
            title: "Hello",
        },
    ])("parses admonition kind $kind", ({ myst, kind, title }) => {
        const parsed = parseMyst(myst);
        expect(parsed).toBeInstanceOf(Node);
        expect(parsed.children).toHaveLength(1);
        const node = parsed.children[0];
        expect(node.type).toBe(schema.nodes.directive);
        expect(node.children).toHaveLength(1);
        const admonition = node.children[0];
        expect(admonition.attrs).toHaveProperty("kind", kind);
        expect(admonition.children).toHaveLength(title === undefined ? 1 : 2);
        if (title !== undefined) {
            expect(admonition.children[0].type).toBe(
                schema.nodes.admonitionTitle,
            );
            expect(admonition.children[0].textContent).toBe(title);
        }
    });
});
