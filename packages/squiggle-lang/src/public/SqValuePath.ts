import { ASTNode } from "../ast/parse.js";
import { locationContains } from "../ast/utils.js";

export type RootPathItem = "result" | "bindings" | "imports" | "exports";

export type ValuePathEdge =
  | { type: "dictKey"; value: string }
  | { type: "arrayIndex"; value: number }
  | { type: "cellAddress"; value: { row: number; column: number } }
  | {
      type: "calculator";
    };

function isCellAddressPathItem(
  item: ValuePathEdge
): item is { type: "cellAddress"; value: { row: number; column: number } } {
  return item.type === "cellAddress";
}

function pathItemIsEqual(a: ValuePathEdge, b: ValuePathEdge): boolean {
  if (a.type !== b.type) {
    return false;
  }
  switch (a.type) {
    case "dictKey":
      return a.value === (b as { type: "dictKey"; value: string }).value;
    case "arrayIndex":
      return a.value === (b as { type: "arrayIndex"; value: number }).value;
    case "cellAddress":
      return (
        isCellAddressPathItem(b) &&
        a.value.row === b.value.row &&
        a.value.column === b.value.column
      );
    case "calculator":
      return true;
  }
}

export class SqValuePathEdge {
  private constructor(public value: ValuePathEdge) {}
  static fromDictKey(str: string): SqValuePathEdge {
    return new SqValuePathEdge({ type: "dictKey", value: str });
  }
  static fromArrayIndex(num: number): SqValuePathEdge {
    return new SqValuePathEdge({ type: "arrayIndex", value: num });
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
    return pathItemIsEqual(this.value, other.value);
  }

  toDisplayString(): string {
    const item = this.value;
    switch (item.type) {
      case "dictKey":
        return item.value;
      case "arrayIndex":
        return String(item.value);
      case "cellAddress":
        return `Cell(${item.value.row},${item.value.column})`;
      case "calculator":
        return "Calculator";
    }
  }

  uid(): string {
    const item = this.value;
    switch (item.type) {
      case "dictKey":
        return `DictKey:(${item.value})`;
      case "arrayIndex":
        return `ArrayIndex:(${item.value})`;
      case "cellAddress":
        return `CellAddress:(${item.value.row}:${item.value.column})`;
      case "calculator":
        return "Calculator";
    }
  }
}

// There might be a better place for this to go, nearer to the ASTNode type.
function astOffsetToPathItems(ast: ASTNode, offset: number): SqValuePathEdge[] {
  function buildRemainingPathItems(ast: ASTNode): SqValuePathEdge[] {
    switch (ast.type) {
      case "Program": {
        for (const statement of ast.statements) {
          if (locationContains(statement.location, offset)) {
            return buildRemainingPathItems(statement);
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
              SqValuePathEdge.fromDictKey(pair.key.value),
              ...buildRemainingPathItems(pair.value),
            ];
          } else if (pair.type === "Identifier") {
            return [SqValuePathEdge.fromDictKey(pair.value)]; // this is a final node, no need to buildRemainingPathItems recursively
          }
        }
        return [];
      }
      case "Array": {
        for (let i = 0; i < ast.elements.length; i++) {
          const element = ast.elements[i];
          if (locationContains(element.location, offset)) {
            return [
              SqValuePathEdge.fromArrayIndex(i),
              ...buildRemainingPathItems(element),
            ];
          }
        }
        return [];
      }
      case "LetStatement": {
        return [
          SqValuePathEdge.fromDictKey(ast.variable.value),
          ...buildRemainingPathItems(ast.value),
        ];
      }
      case "DefunStatement": {
        return [
          SqValuePathEdge.fromDictKey(ast.variable.value),
          ...buildRemainingPathItems(ast.value),
        ];
      }
      case "Block": {
        if (
          ast.statements.length === 1 &&
          ["Array", "Dict"].includes(ast.statements[0].type)
        ) {
          return buildRemainingPathItems(ast.statements[0]);
        }
      }
    }
    return [];
  }
  return buildRemainingPathItems(ast);
}

export class SqValuePath {
  public root: RootPathItem;
  public items: SqValuePathEdge[];

  constructor(props: { root: RootPathItem; items: SqValuePathEdge[] }) {
    this.root = props.root;
    this.items = props.items;
  }

  static findByAstOffset({
    ast,
    offset,
  }: {
    ast: ASTNode;
    offset: number;
  }): SqValuePath | undefined {
    return new SqValuePath({
      root: "bindings", // not important, will probably be removed soon
      items: astOffsetToPathItems(ast, offset),
    });
  }

  isRoot() {
    return this.items.length === 0;
  }

  lastItem(): SqValuePathEdge | undefined {
    return this.items[this.items.length - 1];
  }

  extend(item: SqValuePathEdge) {
    return new SqValuePath({
      root: this.root,
      items: [...this.items, item],
    });
  }

  uid(): string {
    return `${this.root}--${this.items.map((item) => item.uid()).join("--")}`;
  }

  // Checks if this SqValuePath completely contains all of the nodes in this other one.
  contains(smallerItem: SqValuePath) {
    if (this.root !== smallerItem.root) {
      return false;
    }
    if (this.items.length < smallerItem.items.length) {
      return false;
    }
    for (let i = 0; i < smallerItem.items.length; i++) {
      if (!this.items[i].isEqual(smallerItem.items[i])) {
        return false;
      }
    }
    return true;
  }

  isEqual(other: SqValuePath) {
    if (this.root !== other.root) {
      return false;
    }
    if (this.items.length !== other.items.length) {
      return false;
    }
    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i].isEqual(other.items[i])) {
        return false;
      }
    }
    return true;
  }

  allSqValuePathSubsets({ includeRoot = false }) {
    const root = new SqValuePath({
      root: this.root,
      items: [],
    });
    const leafs = this.items.map(
      (_, index) =>
        new SqValuePath({
          root: this.root,
          items: this.items.slice(0, index + 1),
        })
    );
    return includeRoot ? [root, ...leafs] : leafs;
  }
}
