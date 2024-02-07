import { ASTNode } from "../ast/parse.js";
import { locationContains } from "../ast/utils.js";

// Note that 'exports' is shown separately, but is not a valid path root.
export type ValuePathRoot = "result" | "bindings" | "imports";

export type ValuePathEdge =
  | { type: "key"; value: string }
  | { type: "index"; value: number }
  | { type: "cellAddress"; value: { row: number; column: number } }
  | {
      type: "calculator";
    };

function valuePathEdgeIsEqual(a: ValuePathEdge, b: ValuePathEdge): boolean {
  if (a.type === "key" && b.type === "key") {
    return a.value === b.value;
  } else if (a.type === "index" && b.type === "index") {
    return a.value === b.value;
  } else if (a.type === "cellAddress" && b.type === "cellAddress") {
    return a.value.row === b.value.row && a.value.column === b.value.column;
  } else if (a.type === "calculator" && b.type === "calculator") {
    return true;
  } else {
    return false;
  }
}

function escapeParentheses(str: string): string {
  return str.replace(/[()]/g, (match) => `\\${match}`);
}

export class SqValuePathEdge {
  private constructor(public value: ValuePathEdge) {}
  static fromKey(str: string): SqValuePathEdge {
    return new SqValuePathEdge({ type: "key", value: str });
  }
  static fromIndex(num: number): SqValuePathEdge {
    return new SqValuePathEdge({ type: "index", value: num });
  }
  static fromCalculator(): SqValuePathEdge {
    return new SqValuePathEdge({ type: "calculator" });
  }
  static fromCellAddress(row: number, column: number): SqValuePathEdge {
    return new SqValuePathEdge({ type: "cellAddress", value: { row, column } });
  }

  get type() {
    return this.value.type;
  }

  isEqual(other: SqValuePathEdge) {
    return valuePathEdgeIsEqual(this.value, other.value);
  }

  toDisplayString(): string {
    const edge = this.value;
    switch (edge.type) {
      case "key":
        return edge.value;
      case "index":
        return String(edge.value);
      case "cellAddress":
        return `Cell(${edge.value.row},${edge.value.column})`;
      case "calculator":
        return "Calculator";
    }
  }

  uid(): string {
    const edge = this.value;
    switch (edge.type) {
      case "key":
        return `Key:(${escapeParentheses(edge.value)})`;
      case "index":
        return `Index:(${edge.value})`;
      case "cellAddress":
        return `CellAddress:(${edge.value.row}:${edge.value.column})`;
      case "calculator":
        return "Calculator";
    }
  }

  toString(): string {
    return this.toDisplayString();
  }
}

// There might be a better place for this to go, nearer to the ASTNode type.
function astOffsetToPathEdges(ast: ASTNode, offset: number): SqValuePathEdge[] {
  function buildRemainingPathEdges(ast: ASTNode): SqValuePathEdge[] {
    switch (ast.type) {
      case "Program": {
        for (const statement of ast.statements) {
          if (locationContains(statement.location, offset)) {
            return buildRemainingPathEdges(statement);
          }
        }
        return [];
      }
      case "Dict": {
        for (const pair of ast.elements) {
          if (
            !locationContains(
              {
                source: ast.location.source,
                start: pair.location.start,
                end: pair.location.end,
              },
              offset
            )
          ) {
            continue;
          }

          if (
            pair.type === "KeyValue" &&
            pair.key.type === "String" // only string keys are supported
          ) {
            return [
              SqValuePathEdge.fromKey(pair.key.value),
              ...buildRemainingPathEdges(pair.value),
            ];
          } else if (pair.type === "Identifier") {
            return [SqValuePathEdge.fromKey(pair.value)]; // this is a final node, no need to buildRemainingPathEdges recursively
          }
        }
        return [];
      }
      case "Array": {
        for (let i = 0; i < ast.elements.length; i++) {
          const element = ast.elements[i];
          if (locationContains(element.location, offset)) {
            return [
              SqValuePathEdge.fromIndex(i),
              ...buildRemainingPathEdges(element),
            ];
          }
        }
        return [];
      }
      case "LetStatement": {
        return [
          SqValuePathEdge.fromKey(ast.variable.value),
          ...buildRemainingPathEdges(ast.value),
        ];
      }
      case "DefunStatement": {
        return [
          SqValuePathEdge.fromKey(ast.variable.value),
          ...buildRemainingPathEdges(ast.value),
        ];
      }
      case "Block": {
        if (
          ast.statements.length === 1 &&
          ["Array", "Dict"].includes(ast.statements[0].type)
        ) {
          return buildRemainingPathEdges(ast.statements[0]);
        }
      }
    }
    return [];
  }
  return buildRemainingPathEdges(ast);
}

export class SqValuePath {
  public root: ValuePathRoot;
  public edges: SqValuePathEdge[];

  constructor(props: { root: ValuePathRoot; edges: SqValuePathEdge[] }) {
    this.root = props.root;
    this.edges = props.edges;
  }

  static findByAstOffset({
    ast,
    offset,
  }: {
    ast: ASTNode;
    offset: number;
  }): SqValuePath | undefined {
    return new SqValuePath({
      root: "bindings",
      edges: astOffsetToPathEdges(ast, offset),
    });
  }

  isRoot() {
    return this.edges.length === 0;
  }

  lastItem() {
    return this.edges.at(-1);
  }

  parent() {
    if (this.edges.length === 0) {
      return undefined;
    } else {
      return new SqValuePath({
        root: this.root,
        edges: this.edges.slice(0, -1),
      });
    }
  }

  extend(edge: SqValuePathEdge) {
    return new SqValuePath({
      root: this.root,
      edges: [...this.edges, edge],
    });
  }

  uid(): string {
    return `${this.root}/${this.edges.map((edge) => edge.uid()).join("/")}`;
  }

  toString(): string {
    return `${this.root}/${this.edges
      .map((edge) => edge.toDisplayString())
      .join("/")}`;
  }

  // Checks if this SqValuePath completely contains all of the nodes in this other one.
  hasPrefix(prefix: SqValuePath) {
    if (this.root !== prefix.root) {
      return false;
    }
    if (this.edges.length < prefix.edges.length) {
      return false;
    }
    for (let i = 0; i < prefix.edges.length; i++) {
      if (!this.edges[i].isEqual(prefix.edges[i])) {
        return false;
      }
    }
    return true;
  }

  isEqual(other: SqValuePath) {
    if (this.root !== other.root) {
      return false;
    }
    if (this.edges.length !== other.edges.length) {
      return false;
    }
    for (let i = 0; i < this.edges.length; i++) {
      if (!this.edges[i].isEqual(other.edges[i])) {
        return false;
      }
    }
    return true;
  }

  allPrefixPaths({ includeRoot = false }) {
    const root = new SqValuePath({
      root: this.root,
      edges: [],
    });

    const leafs = [];
    const currentEdges = [];
    for (const edge of this.edges) {
      currentEdges.push(edge);
      leafs.push(
        new SqValuePath({
          root: this.root,
          edges: [...currentEdges],
        })
      );
    }

    return includeRoot ? [root, ...leafs] : leafs;
  }
}
