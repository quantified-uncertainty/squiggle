import { SyntaxNode } from "@lezer/common";

import { getNameNodes } from "../src/components/CodeEditor/languageSupport/autocomplete.js";
import { parser } from "../src/components/CodeEditor/languageSupport/generated/squiggle.js";

function getText(code: string, node: SyntaxNode) {
  return code.slice(node.from, node.to);
}

describe("Autocompletion", () => {
  test("Basic", () => {
    const code = `
foo = 5
bar = 6
1+`;
    const tree = parser.parse(code);

    const nodes = getNameNodes(tree, code.length);
    expect(nodes.length).toBe(2);
    expect(getText(code, nodes[0].node)).toBe("bar"); // code is traversed backwards
    expect(getText(code, nodes[1].node)).toBe("foo");
  });

  test("Parameter names", () => {
    const code = `
myFun(arg1, arg2) = 1+`;
    const tree = parser.parse(code);

    const nodes = getNameNodes(tree, code.length);
    expect(nodes.length).toBe(2);
    expect(getText(code, nodes[0].node)).toBe("arg1");
    expect(getText(code, nodes[1].node)).toBe("arg2");
  });

  test("Parameter names at the start of function body", () => {
    const code = `
myFun(arg1, arg2) = `;
    const tree = parser.parse(code);

    const nodes = getNameNodes(tree, code.length);
    expect(nodes.length).toBe(2);
    expect(getText(code, nodes[0].node)).toBe("arg1");
    expect(getText(code, nodes[1].node)).toBe("arg2");
  });

  test("Don't suggest current binding", () => {
    const code = `
foo = 5
bar = {`;
    const tree = parser.parse(code);

    const nodes = getNameNodes(tree, code.length);
    expect(nodes.length).toBe(1);
    expect(getText(code, nodes[0].node)).toBe("foo");
  });

  test("Don't suggest parameters of sibling functions", () => {
    const code = `
fun1(arg1) = 1
fun2(arg2) =`;
    const tree = parser.parse(code);

    const nodes = getNameNodes(tree, code.length);
    expect(nodes.length).toBe(2);
    expect(getText(code, nodes[0].node)).toBe("arg2");
    expect(getText(code, nodes[1].node)).toBe("fun1");
  });

  test("Don't suggest bindings declared later", () => {
    const code1 = `
foo = 1
x = f`;
    const code2 = `
bar = 2
`;
    const code = code1 + code2;
    const tree = parser.parse(code);

    const nodes = getNameNodes(tree, code1.length);
    expect(nodes.length).toBe(1);
    expect(getText(code, nodes[0].node)).toBe("foo");
  });
});
