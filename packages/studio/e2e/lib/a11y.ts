import type { Page, SerializedAXNode } from "puppeteer-core";

// Accessibility helpers: a plain-text dump of Chrome's accessibility tree
// (`a11y/<id>.txt` in e2e:shoot output, readable by agents), and the "every
// button has an accessible name" invariant, computed by Chrome itself.

const FLAGS = [
  "checked",
  "pressed",
  "expanded",
  "selected",
  "disabled",
  "focused",
  "modal",
  "multiselectable",
  "readonly",
  "required",
] as const;

function formatNode(node: SerializedAXNode, depth: number, out: string[]) {
  const parts = [node.role];
  if (node.name) parts.push(JSON.stringify(node.name));
  if (node.value !== undefined && node.value !== "") {
    parts.push(`value=${JSON.stringify(node.value)}`);
  }
  if (node.description) parts.push(`desc=${JSON.stringify(node.description)}`);
  if (node.level !== undefined) parts.push(`level=${node.level}`);
  for (const flag of FLAGS) {
    const value = node[flag];
    if (value === true) parts.push(flag);
    else if (value === "mixed") parts.push(`${flag}=mixed`);
  }
  if (node.keyshortcuts) parts.push(`keys=${node.keyshortcuts}`);
  out.push(`${"  ".repeat(depth)}${parts.join(" ")}`);
  for (const child of node.children ?? []) formatNode(child, depth + 1, out);
}

// One line per interesting node: `role "name" flags`, indented by depth.
export async function accessibilityText(page: Page): Promise<string> {
  const tree = await page.accessibility.snapshot({ interestingOnly: true });
  if (!tree) return "";
  const out: string[] = [];
  formatNode(tree, 0, out);
  return `${out.join("\n")}\n`;
}

// Buttons (role "button", not ignored) whose computed accessible name is
// empty, as short outerHTML snippets.
export async function unnamedButtons(page: Page): Promise<string[]> {
  const session = await page.createCDPSession();
  try {
    await session.send("DOM.getDocument", { depth: 0 });
    const { nodes } = await session.send("Accessibility.getFullAXTree");
    const found: string[] = [];
    for (const node of nodes) {
      if (node.ignored || node.role?.value !== "button") continue;
      const name = node.name?.value;
      if (typeof name === "string" && name.trim() !== "") continue;
      let snippet = `(AX node ${node.nodeId})`;
      if (node.backendDOMNodeId !== undefined) {
        const { object } = await session.send("DOM.resolveNode", {
          backendNodeId: node.backendDOMNodeId,
        });
        if (object.objectId) {
          const { result } = await session.send("Runtime.callFunctionOn", {
            objectId: object.objectId,
            functionDeclaration:
              "function () { return this.outerHTML ? this.outerHTML.replace(/\\s+/g, ' ').slice(0, 200) : String(this.nodeName); }",
            returnByValue: true,
          });
          if (typeof result.value === "string") snippet = result.value;
        }
      }
      found.push(snippet);
    }
    return found;
  } finally {
    await session.detach();
  }
}
