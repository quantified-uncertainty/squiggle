import { Input, NodeType, Tree, TreeCursor } from "@lezer/common";

enum Color {
  Red = 31,
  Green = 32,
  Yellow = 33,
}

function colorize(value: any, color: number): string {
  return String(value);
  // return "\u001b[" + color + "m" + String(value) + "\u001b[39m"
}

function focusedNode(cursor: TreeCursor): {
  readonly type: NodeType;
  readonly from: number;
  readonly to: number;
} {
  const { type, from, to } = cursor;
  return { type, from, to };
}

export function printTree(
  tree: Tree,
  input: Input | string,
  options: {
    from?: number;
    to?: number;
    start?: number;
    includeParents?: boolean;
  } = {}
): string {
  const cursor = tree.cursor();
  if (typeof input === "string") {
    const bind = input;
    input = {
      read: (a, b) => bind.substring(a, b),
      length: bind.length,
    } as Input;
  }
  const {
    from = 0,
    to = input.length,
    start = 0,
    includeParents = false,
  } = options;
  let output = "";
  const prefixes: string[] = [];
  for (;;) {
    const node = focusedNode(cursor);
    let leave = false;
    if (node.from <= to && node.to >= from) {
      const enter =
        !node.type.isAnonymous &&
        (includeParents || (node.from >= from && node.to <= to));
      if (enter) {
        leave = true;
        const isTop = output === "";
        if (!isTop || node.from > 0) {
          output += (!isTop ? "\n" : "") + prefixes.join("");
          const hasNextSibling = cursor.nextSibling() && cursor.prevSibling();
          if (hasNextSibling) {
            output += " ├─ ";
            prefixes.push(" │  ");
          } else {
            output += " └─ ";
            prefixes.push("    ");
          }
        }
        output += node.type.isError
          ? colorize(node.type.name, Color.Red)
          : node.type.name;
      }
      const isLeaf = !cursor.firstChild();
      if (enter) {
        const hasRange = node.from !== node.to;
        output +=
          " " +
          (hasRange
            ? "[" +
              colorize(start + node.from, Color.Yellow) +
              ".." +
              colorize(start + node.to, Color.Yellow) +
              "]"
            : colorize(start + node.from, Color.Yellow));
        if (hasRange && isLeaf) {
          output +=
            ": " +
            colorize(
              JSON.stringify(input.read(node.from, node.to)),
              Color.Green
            );
        }
      }
      if (!isLeaf) continue;
    }
    for (;;) {
      if (leave) prefixes.pop();
      leave = cursor.type.isAnonymous;
      if (cursor.nextSibling()) break;
      if (!cursor.parent()) return output;
      leave = true;
    }
  }
}
